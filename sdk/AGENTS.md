# SDK Agent Guide

This file is for AI agents working inside `app/packages/sdk`.

## Mission

Keep the SDK contract-first, frontend-friendly, and resilient to future Move
contract changes. Prefer small service APIs and isolated adapters over adding
more logic to the legacy compatibility client.

## Architecture

- `src/config.ts`: registry source of truth for deployed markets.
- `src/domain/*`: pure mappers and helpers. No network, no `Transaction`.
- `src/ports/*`: interfaces for config, chain reads, and event reads.
- `src/infrastructure/*`: concrete SDK/Sui implementations of ports.
- `src/services/*`: frontend-facing application services.
- `src/facade/jitter-sdk.ts`: `createJitterSdk` service composition.
- `src/client.ts`: compatibility facade. Do not remove existing public methods
  until frontend imports have been migrated.
- `src/generated/*`: generated Move bindings. Do not edit manually.
- `dist/*`: build output. Do not edit manually.

## Sui SDK Rule

Do not use JSON RPC.

Forbidden in production SDK source:

- `@mysten/sui/jsonRpc`
- `SuiJsonRpcClient`
- `devInspectTransactionBlock`

Use:

- `@mysten/sui/grpc` for object reads, owned objects, dynamic fields,
  transaction reads, and transaction simulation.
- `@mysten/sui/graphql` for indexed event queries.

The guard is `src/test/rpc-transport.test.ts`.

## Development Workflow

Follow TDD for production changes:

1. Add or update a focused test.
2. Run the test and observe the failure.
3. Implement the smallest production change.
4. Run the focused test, then the relevant wider checks.

Common commands:

```bash
cd app/packages/sdk
bun test src/test
bun run typecheck
bun run build
```

When SDK exports change and frontend imports `@jitter/sdk`, rebuild SDK first:

```bash
cd app && bun run build:sdk
cd app/apps/web && bun run typecheck
```

For the current root `frontend/` package that consumes
`frontend/jitter-sdk-0.1.0.tgz`, rebuild and repack the SDK, then force-refresh
the frontend install. A plain `bun install` can keep stale local tarball
integrity/hash metadata in `frontend/bun.lock`. If `node_modules/@jitter/sdk`
still exposes old exports or registry entries after `bun install --force`, clear
Bun's install cache and reinstall without cache.

```bash
cd app/packages/sdk
bun test src/test
bun run build
npm pack --pack-destination ../../../frontend

cd ../../../frontend
bun install --force
bun pm cache rm
bun install --force --no-cache --backend=copyfile
bun run build
```

Full frontend validation:

```bash
cd app && bun run build
```

## Public API Guidance

For new frontend code, prefer:

```ts
import { createJitterSdk } from "@jitter/sdk";
```

Use `createJitterClient` only for compatibility paths that still depend on the
legacy facade.

Do not import from internal SDK paths. Export public types/functions through
`src/index.ts`.

## Service Boundaries

- Market display data belongs in `market-data-service` and domain mappers.
- Account and position reads belong in `account-service`.
- Orderbook display reads belong in `orderbook-service`.
- Read-only quote orchestration belongs in `quote-service`.
- PTB construction belongs in `transaction-service` or primitive builders.
- Contract-specific read/write details belong behind ports, infrastructure
  readers, generated bindings, or primitive builders.

## Frontend Integration Rules

Read `FRONTEND_INTEGRATION.md` before changing frontend code.

Important constraints:

- Keep chain reads in server code or controlled query functions.
- Keep wallet signing in client code.
- Do not pass `Transaction` objects through Server Component props.
- Convert `bigint` to strings before crossing JSON boundaries.
- Preserve `MarketInfo` compatibility unless the frontend is migrated in the
  same change.

## Contract Change Strategy

When contracts change:

1. Update generated bindings if needed.
2. Update config entries in `src/config.ts`.
3. Update infrastructure readers or primitive builders.
4. Keep service and domain APIs stable when possible.
5. Add tests around the changed contract surface.

Do not push contract-version conditionals into frontend code when the SDK can
hide them behind adapters.

## Documentation Checklist

When adding a new public service or method:

- Export it from `src/index.ts`.
- Add focused tests.
- Update `README.md` or `FRONTEND_INTEGRATION.md` if frontend developers need it.
- Keep compatibility notes clear if `JitterClient` also exposes the behavior.
