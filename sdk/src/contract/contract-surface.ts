export type JitterAdapterKind =
  | "demo"
  | "scallop"
  | "ember"
  | "suilend"
  | "navi";

export type JitterContractAdapterSurface = {
  kind: JitterAdapterKind;
  packageName: string;
  source: string;
};

export type JitterContractObjectSurface = {
  source: string;
  fields: readonly string[];
};

export type JitterContractSurface = {
  adapters: readonly JitterContractAdapterSurface[];
  objects: {
    Pool: JitterContractObjectSurface;
    PyState: JitterContractObjectSurface;
    JitterPosition: JitterContractObjectSurface;
  };
};

export const JITTER_CONTRACT_SURFACE = {
  adapters: [
    {
      kind: "demo",
      packageName: "demo_adapter",
      source: "contract/jitter_adapter/demo_adapter/Move.toml",
    },
    {
      kind: "scallop",
      packageName: "scallop_adapter",
      source: "contract/jitter_adapter/scallop_adapter/Move.toml",
    },
    {
      kind: "ember",
      packageName: "ember_adapter",
      source: "contract/jitter_adapter/ember_adapter/Move.toml",
    },
    {
      kind: "suilend",
      packageName: "suilend_adapter",
      source: "contract/jitter_adapter/suilend_adapter/Move.toml",
    },
    {
      kind: "navi",
      packageName: "navi_adapter",
      source: "contract/jitter_adapter/navi_adapter/Move.toml",
    },
  ],
  objects: {
    Pool: {
      source: "contract/jitter/sources/protocol/pool.move",
      fields: [
        "id",
        "py_state_id",
        "market_id",
        "expiry",
        "total_pt",
        "total_sy",
        "reserve_fee_vault",
        "lp_supply",
        "last_ln_implied_rate",
        "scalar_root",
        "initial_anchor",
        "ln_fee_rate_root",
        "treasury",
        "protocol_fee_rate",
        "paused",
        "emergency_paused",
      ],
    },
    PyState: {
      source: "contract/jitter/sources/protocol/py_state.move",
      fields: [
        "id",
        "market_id",
        "expiry",
        "interest_fee_rate",
        "expiry_divisor",
        "treasury",
        "pt_supply",
        "yt_supply",
        "sy_balance",
        "py_index_stored",
        "py_index_last_updated",
        "last_collect_interest_index",
        "total_treasury_interest",
        "last_interest_timestamp",
        "global_interest_index",
        "is_settled",
        "settled_py_index",
        "paused",
        "emergency_paused",
      ],
    },
    JitterPosition: {
      source: "contract/jitter/sources/user/jitter_position.move",
      fields: [
        "id",
        "py_state_id",
        "market_id",
        "expiry",
        "created_at",
        "py",
        "lp",
      ],
    },
  },
} as const satisfies JitterContractSurface;
