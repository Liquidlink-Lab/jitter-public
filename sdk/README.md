# @jitter/sdk

Contract-first TypeScript SDK for Jitter market data, account reads, quotes, and transaction construction.

## Layers

- `src/domain/*`: pure amount, market lifecycle, and frontend display mappers. No network clients and no `Transaction`.
- `src/ports/*`: small interfaces for config, chain reads, and event reads.
- `src/infrastructure/*`: Sui implementations for the ports. Chain access uses `@mysten/sui/grpc`; event reads use GraphQL through the SDK transport wrapper. JSON RPC is intentionally blocked by tests.
- `src/services/*`: frontend-friendly services for markets, accounts, orderbooks, quotes, and transactions.
- `src/facade/jitter-sdk.ts`: `createJitterSdk`, a small composition facade.
- `src/client.ts`: compatibility facade retained for existing frontend imports.

## Basic Usage

```ts
import { createJitterSdk } from "@jitter/sdk";

const sdk = createJitterSdk({ network: "testnet" });

const explorer = await sdk.markets.getExplorerData();
const market = explorer.markets[0]?.jitterConfig;

if (market) {
  const marketSdk = sdk.forMarket(market);
  const portfolio = await marketSdk.accounts.getPortfolio(owner);
  const quote = await marketSdk.quotes.quoteSwapSyForPt(1_000_000n);
  const tx = await marketSdk.transactions.buildSwapSyForPtTx({
    syCoinId,
    syAmount: 1_000_000n,
    minPtOut: quote.ptOut,
    pyPositionId,
    senderAddress: owner,
  });
}
```

## Frontend Integration

Frontend developers should use `FRONTEND_INTEGRATION.md` for server/client
boundaries, market data wiring, quote usage, transaction signing flow, and build
commands.

AI agents working in this package should read `AGENTS.md`.

## Compatibility

Existing code can keep using:

```ts
import { createJitterClient } from "@jitter/sdk";
```

Do not remove compatibility exports until frontend imports have been migrated.

## Sui Transport Rule

Do not import `@mysten/sui/jsonRpc`, `SuiJsonRpcClient`, or JSON-RPC-only methods. The SDK has a transport guard test at `src/test/rpc-transport.test.ts`.

Use:

- `SuiGrpcClient` for object reads, owned objects, dynamic fields, transaction reads, and simulation.
- `SuiGraphQLClient` for indexed event queries.
