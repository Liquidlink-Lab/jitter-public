# Frontend Integration Guide

This guide is for frontend code that consumes `@jitter/sdk`.

## Entry Points

Use the service facade for new code:

```ts
import { createJitterSdk } from "@jitter/sdk";

const sdk = createJitterSdk({ network: "testnet" });
```

Keep using the compatibility client only for existing trade flows that have not
been migrated yet:

```ts
import { createJitterClient } from "@jitter/sdk";
```

Do not import from SDK internal paths such as `@jitter/sdk/src/...`. Import only
from `@jitter/sdk`.

## Market Explorer Data

For server-side market pages, use `sdk.markets.getExplorerData()`.

```ts
import "server-only";

import {
  createJitterMarketDataService,
  SuiJitterChainReader,
  type JitterMarketConfigProvider,
} from "@jitter/sdk";

const network = process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet"
  ? "mainnet"
  : "testnet";

const marketData = createJitterMarketDataService({
  network,
  configProvider,
  chainReader: new SuiJitterChainReader(network),
  getUnderlyingApy: async (config) => {
    // Optional app-level fallback/cache wrapper.
    return 0;
  },
});

const data = await marketData.getExplorerData();
```

Returned shape:

- `markets`: frontend-ready market cards sorted by liquidity.
- `groups`: grouped market summaries.
- `categoryFilters`: protocol, underlying, and maturity filters.

Each trade-ready market includes `market.jitterConfig`. Use that config to open
per-market services or the legacy `JitterClient`.

## Per-Market Services

```ts
const marketConfig = market.jitterConfig;
if (!marketConfig) return;

const marketSdk = sdk.forMarket(marketConfig);
```

Available services:

- `marketSdk.accounts`
  - `getPortfolio(owner)`
  - `getUserPyPositions(owner)`
  - `getUserLpPositions(owner)`
  - `getUserUnderlyingCoins(owner)`
  - `getUserSyCoins(owner)`
- `marketSdk.orderbooks`
  - `getOrderbookOrders(owner?, "pt" | "yt")`
  - `getAllOrderbookOrders(owner?)`
- `marketSdk.quotes`
  - `quoteSwapSyForPt(syIn, syIndex?)`
  - `quoteUnderlyingToSy(underlyingIn, syIndex?)`
  - `quoteSwapUnderlyingForPt(underlyingIn, syIndex?)`
  - `quoteLpValue(lpAmount)`
  - `quoteIsMarketExpired(nowMs?)`
- `marketSdk.transactions`
  - `buildDepositToSyTx(params)`
  - `buildSwapSyForPtTx(params)`
  - `buildClaimYtInterestTx(params)`
  - `buildPlaceBidOrderTx(params)`
  - `buildClaimOrderTx(params)`
  - `buildCancelOrderTx(params)`

## Transaction Flow

Transaction service methods return `Transaction` from `@mysten/sui/transactions`.
Pass the transaction to the wallet adapter or dapp-kit signer.

```ts
const tx = await marketSdk.transactions.buildSwapSyForPtTx({
  syCoinId,
  syAmount,
  minPtOut,
  pyPositionId,
  senderAddress: account.address,
});

await signAndExecuteTransaction({ transaction: tx });
```

Most transaction amounts are raw `bigint` token units. Keep display formatting
separate from transaction inputs.

## Amounts And Formatting

Use SDK helpers for display:

```ts
import {
  formatTokenAmount,
  getMarketAccountingDecimals,
  getMarketUnderlyingDecimals,
} from "@jitter/sdk";

const marketDecimals = getMarketAccountingDecimals(config);
const underlyingDecimals = getMarketUnderlyingDecimals(config);

formatTokenAmount(rawBalance, marketDecimals);
```

When passing data through JSON or client component props, convert `bigint` to
string first. Keep raw `bigint` for quote and transaction methods.

## Server And Client Boundaries

- Market data and chain reads belong in server code or query functions.
- Wallet signing belongs in client code.
- Do not pass `Transaction` objects through Server Component props.
- Do not expose Sui RPC clients to client components.

## Network And Config

`config.ts` is the registry source of truth. Frontend code should prefer:

- `listJitterMarketConfigs(network)` for app-level market lists.
- `market.jitterConfig` from SDK market data for trade entry points.
- `getDemoMarketConfig(network)` only for legacy demo fallback paths.

## Transport Rule

The SDK must not use JSON RPC. Do not add frontend code that depends on
`@mysten/sui/jsonRpc`, `SuiJsonRpcClient`, or JSON-RPC-only methods.

The SDK uses:

- Sui gRPC for objects, owned objects, dynamic fields, transaction reads, and simulation.
- Sui GraphQL for indexed event queries.

## Compatibility Notes

`createJitterClient(network, config)` is still exported and compatible with the
current frontend trade hooks. New frontend reads should prefer the service
facade so future contract changes stay isolated behind SDK ports and adapters.

## Build Notes

The frontend package reads `@jitter/sdk` declarations from SDK build output.
After changing SDK exports, run:

```bash
cd app && bun run build:sdk
cd app/apps/web && bun run typecheck
```

For full validation:

```bash
cd app/packages/sdk && bun test src/test && bun run typecheck
cd app && bun run build:sdk
cd app/apps/web && bun run typecheck
cd app && bun run build
```
