import { getSuiClient, type GrpcNetworkKind } from "../rpc.js";
import type {
  EventReaderQuery,
  JitterEventReader,
} from "../ports/event-reader.js";

export type SuiJitterEventReaderDelegates = {
  queryEvents?: <TEvent>(query: EventReaderQuery) => Promise<TEvent[]>;
};

export class SuiJitterEventReader implements JitterEventReader {
  constructor(
    private readonly delegates: SuiJitterEventReaderDelegates = {},
  ) {}

  queryEvents<TEvent>(query: EventReaderQuery): Promise<TEvent[]> {
    const queryEvents = this.delegates.queryEvents ?? defaultQueryEvents;
    return queryEvents<TEvent>(query);
  }
}

async function defaultQueryEvents<TEvent>(
  query: EventReaderQuery,
): Promise<TEvent[]> {
  const result = await getSuiClient(query.network as GrpcNetworkKind).queryEvents({
    query: { MoveEventType: query.eventType },
    limit: query.limit,
    order: query.order,
  });

  return result.data.map((event) => event.parsedJson as TEvent);
}
