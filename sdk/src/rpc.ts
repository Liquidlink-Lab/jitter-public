import { bcs } from "@mysten/sui/bcs";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { SuiGrpcClient } from "@mysten/sui/grpc";

export type GrpcNetworkKind = "mainnet" | "testnet" | "devnet";

const GRPC_URLS: Record<GrpcNetworkKind, string> = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
  testnet: "https://fullnode.testnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443",
};

const GRAPHQL_URLS: Record<GrpcNetworkKind, string> = {
  mainnet: "https://sui-mainnet.mystenlabs.com/graphql",
  testnet: "https://graphql.testnet.sui.io/graphql",
  devnet: "https://graphql.devnet.sui.io/graphql",
};

export type SuiEventQuery = {
  MoveEventType?: string;
};

export type SuiEventResponse = {
  data: Array<{
    id: { txDigest: string; eventSeq: string };
    parsedJson: unknown;
    sender?: string;
    timestampMs?: string;
    type?: string;
  }>;
};

type DynamicFieldObjectResponse =
  | {
      data?: {
        content?: {
          dataType: "moveObject";
          fields: Record<string, unknown> | null;
        };
      };
      error?: never;
    }
  | {
      data?: never;
      error: Error;
    };

export type JitterSuiClient = {
  getDynamicFieldObject(input: {
    parentId: string;
    name: { type: string; value: string };
  }): Promise<DynamicFieldObjectResponse>;
  queryEvents(input: {
    query: SuiEventQuery;
    limit?: number;
    order?: "ascending" | "descending";
  }): Promise<SuiEventResponse>;
};

const grpcClients = new Map<GrpcNetworkKind, SuiGrpcClient>();
const graphqlClients = new Map<GrpcNetworkKind, SuiGraphQLClient>();
const compatibilityClients = new Map<GrpcNetworkKind, JitterSuiClient>();

export function getSuiGrpcClient(network: GrpcNetworkKind): SuiGrpcClient {
  const cached = grpcClients.get(network);
  if (cached) return cached;

  const client = new SuiGrpcClient({
    network,
    baseUrl: GRPC_URLS[network],
  });
  grpcClients.set(network, client);
  return client;
}

export function getSuiGraphQLClient(
  network: GrpcNetworkKind,
): SuiGraphQLClient {
  const cached = graphqlClients.get(network);
  if (cached) return cached;

  const client = new SuiGraphQLClient({
    network,
    url: GRAPHQL_URLS[network],
  });
  graphqlClients.set(network, client);
  return client;
}

export function getSuiClient(network: GrpcNetworkKind): JitterSuiClient {
  const cached = compatibilityClients.get(network);
  if (cached) return cached;

  const client = createCompatibilityClient(network);
  compatibilityClients.set(network, client);
  return client;
}

function createCompatibilityClient(network: GrpcNetworkKind): JitterSuiClient {
  return {
    getDynamicFieldObject: (input) => getDynamicFieldObject(network, input),
    queryEvents: (input) => queryEvents(network, input),
  };
}

async function getDynamicFieldObject(
  network: GrpcNetworkKind,
  input: {
    parentId: string;
    name: { type: string; value: string };
  },
): Promise<DynamicFieldObjectResponse> {
  const client = getSuiGrpcClient(network);
  try {
    const nameBcs = serializeDynamicFieldName(input.name);
    const { dynamicField } = await client.getDynamicField({
      parentId: input.parentId,
      name: {
        type: input.name.type,
        bcs: nameBcs,
      },
    });
    const object = await client.getObject({
      objectId: dynamicField.fieldId,
      include: { json: true },
    });

    return {
      data: {
        content: {
          dataType: "moveObject",
          fields: object.object.json ?? null,
        },
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function serializeDynamicFieldName(name: {
  type: string;
  value: string;
}): Uint8Array {
  if (name.type === "address" || name.type === "0x2::object::ID") {
    return bcs.Address.serialize(name.value).toBytes();
  }

  throw new Error(`Unsupported dynamic field name type: ${name.type}.`);
}

async function queryEvents(
  network: GrpcNetworkKind,
  input: {
    query: SuiEventQuery;
    limit?: number;
    order?: "ascending" | "descending";
  },
): Promise<SuiEventResponse> {
  const eventType = input.query.MoveEventType;
  if (!eventType) {
    throw new Error("Only MoveEventType event queries are supported.");
  }

  const limit = Math.min(input.limit ?? 50, 50);
  const descending = input.order !== "ascending";
  const result = await getSuiGraphQLClient(network).query<{
    events?: {
      nodes: Array<{
        contents?: {
          json?: unknown;
          type?: { repr?: string | null } | null;
        } | null;
        sender?: { address?: string | null } | null;
        sequenceNumber: number;
        timestamp?: string | null;
        transaction?: { digest?: string | null } | null;
      }>;
    } | null;
  }>({
    query: `
      query QueryEvents($type: String!, $first: Int, $last: Int) {
        events(
          first: $first
          last: $last
          filter: { type: $type }
        ) {
          nodes {
            sequenceNumber
            timestamp
            sender { address }
            transaction { digest }
            contents {
              json
              type { repr }
            }
          }
        }
      }
    `,
    variables: {
      type: eventType,
      first: descending ? null : limit,
      last: descending ? limit : null,
    },
  });

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }

  const nodes = result.data?.events?.nodes ?? [];
  const ordered = descending ? [...nodes].reverse() : nodes;

  return {
    data: ordered.map((event) => {
      const timestampMs = event.timestamp
        ? Date.parse(event.timestamp).toString()
        : undefined;
      return {
        id: {
          txDigest: event.transaction?.digest ?? "",
          eventSeq: event.sequenceNumber.toString(),
        },
        parsedJson: event.contents?.json ?? {},
        sender: event.sender?.address ?? undefined,
        timestampMs,
        type: event.contents?.type?.repr ?? eventType,
      };
    }),
  };
}

export async function grpcRequest<T>(
  network: GrpcNetworkKind,
  method: string,
  params: unknown[],
): Promise<T> {
  const client = getSuiGrpcClient(network);

  switch (method) {
    case "suix_getOwnedObjects": {
      const [owner, query, cursor, limit] = params as [
        string,
        { filter?: unknown; options?: unknown } | undefined,
        string | null | undefined,
        number | undefined,
      ];

      const filter = (query?.filter ?? {}) as Record<string, unknown>;
      const options = (query?.options ?? {}) as Record<string, unknown>;
      const typeFilter =
        typeof filter.StructType === "string"
          ? filter.StructType
          : typeof filter.Package === "string"
            ? filter.Package
            : null;

      const response = await client.listOwnedObjects({
        owner,
        type: typeFilter ?? undefined,
        cursor,
        limit,
        include: {
          json: Boolean(options.showContent),
          previousTransaction: Boolean(options.showPreviousTransaction),
        },
      });

      return {
        data: response.objects.map((obj) => ({
          data: {
            objectId: obj.objectId,
            type: obj.type,
            previousTransaction: obj.previousTransaction,
            content: { fields: obj.json ?? {} },
          },
        })),
        hasNextPage: response.hasNextPage,
        nextCursor: response.cursor,
      } as T;
    }

    case "sui_getObject": {
      const [id, options] = params as [string, unknown | undefined];
      const opts = (options ?? {}) as Record<string, unknown>;
      const include = {
        json: Boolean(opts.showContent),
        previousTransaction: Boolean(opts.showPreviousTransaction),
      };
      const response = await client.getObject({ objectId: id, include });
      const object = response.object;

      return {
        data: {
          objectId: object.objectId,
          type: object.type,
          previousTransaction: object.previousTransaction,
          content: {
            fields: object.json ?? {},
          },
        },
      } as T;
    }

    case "suix_getDynamicFields": {
      const [parentId, cursor, limit] = params as [
        string,
        string | null | undefined,
        number | undefined,
      ];

      const response = await client.listDynamicFields({
        parentId,
        cursor,
        limit,
      });

      return {
        data: response.dynamicFields.map((field) => ({
          objectId: field.fieldId,
          name: field.name,
        })),
        hasNextPage: response.hasNextPage,
        nextCursor: response.cursor,
      } as T;
    }

    case "sui_getTransactionBlock": {
      const [digest, options] = params as [string, unknown | undefined];
      const opts = (options ?? {}) as Record<string, unknown>;
      const include = {
        effects: true,
        objectTypes: Boolean(opts.showObjectChanges),
      } as const;
      const tx = await client.getTransaction({ digest, include });
      const transaction = tx.$kind === "Transaction" ? tx.Transaction : tx.FailedTransaction;
      const changedObjects = transaction.effects?.changedObjects ?? [];
      const objectTypes = (transaction.objectTypes ?? {}) as Record<string, string | undefined>;

      const objectChanges: Array<Record<string, unknown>> = [];
      for (const change of changedObjects) {
        if (change.idOperation !== "Created") continue;

        if (change.outputState === "PackageWrite") {
          objectChanges.push({
            type: "published",
            packageId: change.objectId,
          });
          continue;
        }

        objectChanges.push({
          type: "created",
          objectId: change.objectId,
          objectType: objectTypes[change.objectId],
          owner: change.outputOwner,
        });
      }

      return {
        objectChanges,
      } as T;
    }

    default:
      throw new Error(`Unsupported gRPC compatibility method: ${method}`);
  }
}
