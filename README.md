# Jitter Public

Jitter Public is an informational public code repository for the Jitter protocol. It collects the Sui Move contracts, TypeScript SDK, and reusable React UI components.

This repo is primarily a reference for understanding the project structure, public interfaces, and integration boundaries. It is not intended to be a one-command runnable or deployable project.

## Project Contents

- `contract/`: Sui Move contract source code.
  - `contract/jitter/`: Jitter core market, router, SY/PY state.
  - `contract/jitter_framework/`: shared contract utilities, currently including `keyed_big_vector`.
- `sdk/`: `@jitter/sdk`, a contract-first TypeScript SDK for market data, account reads, quotes, orderbook queries, and transaction construction.
- `ui/`: `@jitter/ui`, React/Tailwind UI primitives such as button, card, input, tabs, badge, and related components.

## SDK Overview

The SDK public entrypoint is `sdk/src/index.ts`. It mainly exposes a frontend-friendly service facade through `createJitterSdk`.

## Contract Overview

Move contracts live under `contract/`. This public repo currently includes the `jitter` and `jitter_framework` packages. Published package information is available in each package's `Published.toml`.

The `contract/jitter` code is roughly organized as:

- `sources/protocol/`: market registry, SY, and core protocol modules.
- `sources/config/`: configuration and calculation helpers such as AMM math.

## UI Overview

`ui/` provides shared UI primitives exported from `ui/src/index.ts`. These components sit at the basic component layer, including button, card, input, tabs, separator, progress, and badge, and can be composed by frontend applications.

## Related Documents

- `sdk/README.md`: SDK architecture and basic usage.
- `sdk/FRONTEND_INTEGRATION.md`: frontend integration guide.
- `sdk/AGENTS.md`: working rules for AI agents maintaining the SDK.
