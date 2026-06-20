/**
 * @mysten/codegen configuration for the Jitter monorepo.
 *
 * Run `bun run codegen` from this package or `bun run codegen` from `/app`
 * to regenerate `./src/generated` from the local Move packages under `/contract`.
 *
 * Docs: https://sdk.mystenlabs.com/codegen
 */
export default {
  output: "src/generated",
  generateSummaries: true,
  prune: true,

  packages: [
    {
      package: "jitter/jitter-framework",
      packageName: "jitter_framework",
      path: "../../../contract/jitter_framework",
    },
    {
      package: "jitter/jitter",
      packageName: "jitter",
      path: "../../../contract/jitter",
    },
    {
      package: "jitter/jitter-extensions",
      packageName: "jitter_extensions",
      path: "../../../contract/jitter_extensions",
    },
    {
      package: "jitter/demo-adapter",
      packageName: "demo_adapter",
      path: "../../../contract/jitter_adapter/demo_adapter",
    },
    {
      package: "jitter/scallop-adapter",
      packageName: "scallop_adapter",
      path: "../../../contract/jitter_adapter/scallop_adapter",
    },
    {
      package: "jitter/ember-adapter",
      packageName: "ember_adapter",
      path: "../../../contract/jitter_adapter/ember_adapter",
    },
    {
      package: "jitter/suilend-adapter",
      packageName: "suilend_adapter",
      path: "../../../contract/jitter_adapter/suilend_adapter",
    },
    {
      package: "jitter/navi-adapter",
      packageName: "navi_adapter",
      path: "../../../contract/jitter_adapter/navi_adapter",
    },
    {
      package: "jitter/jitter-oracle",
      packageName: "jitter_oracle",
      path: "../../../contract/jitter_oracle",
    },
    {
      package: "jitter/jitter-admin",
      packageName: "jitter_admin",
      path: "../../../contract/jitter_admin",
    },
  ],
};
