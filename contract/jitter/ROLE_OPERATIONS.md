# Jitter Role Operations

Last updated: 2026-05-10.

Jitter now uses `AdminCap` for setup/configuration and keeps ACL for delegated runtime operations only. The current ACL operation strings are:

| Operation | Module |
| --- | --- |
| `pool.pause` | `jitter::pool` |
| `pool.unpause` | `jitter::pool` |
| `pool.emergency_pause` | `jitter::pool` |
| `pool.emergency_unpause` | `jitter::pool` |
| `orderbook.pause` | `jitter::orderbook` |
| `orderbook.unpause` | `jitter::orderbook` |
| `orderbook.emergency_pause` | `jitter::orderbook` |
| `orderbook.emergency_unpause` | `jitter::orderbook` |
| `points.pause` | `jitter_extensions::liquidlink_points` |
| `py_state.pause` | `jitter::py_state` |
| `py_state.unpause` | `jitter::py_state` |
| `py_state.emergency_pause` | `jitter::py_state` |
| `py_state.emergency_unpause` | `jitter::py_state` |
| `py_state.settle` | `jitter::py_state` |
| `treasury.collect` | `jitter::pool`, `jitter::py_state` |
| `oracle.create_aggregator` | `jitter_oracle::aggregator` |
| `oracle.configure_aggregator` | `jitter_oracle::aggregator` |
| `demo_adapter.create_market` | `demo_adapter::demo_market_vault` |
| `scallop_adapter.create_market` | `scallop_adapter::scallop_market_vault` |
| `reward.configure` | `jitter_extensions::coin_rewarder` |

Setup-only functions such as market creation, pool/orderbook creation, reward distributor setup, LiquidLink point setup, SY registration, and market registry mutation are AdminCap-only.
