import { describe, expect, test } from "bun:test";
import { Transaction } from "@mysten/sui/transactions";

import { getJitterAdapterManifest } from "../adapters/registry.js";
import { DEFAULT_DEMO_SY_INDEX, SUI_TYPE_TAG } from "../constants.js";
import { getJitterMarketConfig } from "../config.js";
import {
  createJitterTransactionService,
  type BuildAddLpFromSyTxParams,
  type BuildAddLpKeepYtTxParams,
  type BuildAddLpTxParams,
  type BuildBuyPtRouteTxParams,
  type BuildBuyPtTxParams,
  type BuildBuyYtTxParams,
  type BuildRemoveLpTxParams,
  type RedeemSyToUnderlyingTxParams,
  type BuildSellPtRouteTxParams,
  type BuildSellPtTxParams,
  type BuildSellYtTxParams,
  type EmptyRewardSettlementStrategy,
  type ProductTxRewardSettlementParams,
} from "../services/transaction-service.js";

const senderAddress =
  "0x00000000000000000000000000000000000000000000000000000000000000aa";

describe("JitterTransactionService", () => {
  test("exposes product transaction parameter model without breaking legacy builders", () => {
    const buyPtParams = {
      senderAddress,
      inputCoinId: "0xsy",
      inputAmount: 100n,
      minPtOut: 90n,
      positionId: "0xpy-position",
      deadlineMs: 4_102_444_800_000n,
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildBuyPtTxParams;

    const sellPtParams = {
      senderAddress,
      ptAmount: 90n,
      minSyOut: 80n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildSellPtTxParams;

    const buyYtParams = {
      senderAddress,
      inputCoinId: "0xsy",
      inputAmount: 100n,
      minYtOut: 20n,
      minSyOut: 1n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildBuyYtTxParams;

    const sellYtParams = {
      senderAddress,
      ytAmount: 20n,
      minSyOut: 80n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildSellYtTxParams;

    const addLpParams = {
      senderAddress,
      inputCoinId: "0xsy",
      inputAmount: 100n,
      ptAmount: 50n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildAddLpTxParams;

    const addLpKeepYtParams = {
      senderAddress,
      inputCoinId: "0xsy",
      inputAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildAddLpKeepYtTxParams;

    const addLpFromSyParams = {
      senderAddress,
      inputCoinId: "0xsy",
      inputAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      minSyOut: 1n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildAddLpFromSyTxParams;

    const removeLpParams = {
      senderAddress,
      lpAmount: 20n,
      minSyOut: 10n,
      minPtOut: 8n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildRemoveLpTxParams;

    const redeemSyParams = {
      senderAddress,
      syCoinId: "0xsy",
      syAmount: 100n,
    } satisfies RedeemSyToUnderlyingTxParams;

    const buyPtRouteParams = {
      senderAddress,
      inputCoinId: "0xsy",
      inputAmount: 100n,
      orderIds: [1n, 2n],
      maxBookPriceRaw: 200n,
      minTotalPtOut: 90n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildBuyPtRouteTxParams;

    const sellPtRouteParams = {
      senderAddress,
      ptAmount: 90n,
      orderIds: [3n, 4n],
      minBookPriceRaw: 180n,
      minTotalSyOut: 80n,
      positionId: "0xpy-position",
      rewardSettlement: { strategy: "empty-vector" },
    } satisfies BuildSellPtRouteTxParams;

    const settlement = {
      strategy: "empty-vector",
    } satisfies EmptyRewardSettlementStrategy;

    const rewardParams = {
      rewardSettlement: settlement,
    } satisfies ProductTxRewardSettlementParams;

    const service = createJitterTransactionService({ config: getTestConfig() });

    expect(buyPtParams.inputCoinId).toBe("0xsy");
    expect(sellPtParams.ptAmount).toBe(90n);
    expect(buyYtParams.minYtOut).toBe(20n);
    expect(sellYtParams.ytAmount).toBe(20n);
    expect(addLpParams.ptAmount).toBe(50n);
    expect(addLpKeepYtParams.syToMintHint).toBe(60n);
    expect(addLpFromSyParams.minSyOut).toBe(1n);
    expect(removeLpParams.lpAmount).toBe(20n);
    expect(redeemSyParams.syAmount).toBe(100n);
    expect(buyPtRouteParams.maxBookPriceRaw).toBe(200n);
    expect(sellPtRouteParams.minBookPriceRaw).toBe(180n);
    expect(rewardParams.rewardSettlement.strategy).toBe("empty-vector");
    expect(typeof service.buildBuyPtTx).toBe("function");
    expect(typeof service.buildSellPtTx).toBe("function");
    expect(typeof service.buildBuyPtRouteTx).toBe("function");
    expect(typeof service.buildSellPtRouteTx).toBe("function");
    expect(typeof service.buildBuyYtTx).toBe("function");
    expect(typeof service.buildSellYtTx).toBe("function");
    expect(typeof service.buildAddLpTx).toBe("function");
    expect(typeof service.buildAddLpKeepYtTx).toBe("function");
    expect(typeof service.buildAddLpFromSyTx).toBe("function");
    expect(typeof service.buildRemoveLpTx).toBe("function");
    expect(typeof service.buildRedeemSyToUnderlyingTx).toBe("function");
    expect(typeof (service as Record<string, unknown>).buildRemoveLpKeepYtTx).toBe("undefined");
    expect(typeof service.buildSwapSyForPtTx).toBe("function");
  });

  test("builds PT product transactions against unified router entrypoints", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const buyTx = await service.buildBuyPtTx({
      senderAddress,
      inputCoinId: objectId("40"),
      inputAmount: 100n,
      minPtOut: 90n,
      positionId: objectId("41"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const sellTx = await service.buildSellPtTx({
      senderAddress,
      ptAmount: 90n,
      minSyOut: 80n,
      positionId: objectId("41"),
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(buyTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "buy_pt" }),
    );
    expect(collectMoveCalls(sellTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "sell_pt" }),
    );
  });

  test("merges multiple input coin objects before splitting trade amount", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const tx = await service.buildBuyPtTx({
      senderAddress,
      inputCoinId: objectId("40"),
      inputCoinIds: [objectId("40"), objectId("41")],
      inputAmount: 100n,
      minPtOut: 90n,
      positionId: objectId("42"),
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectCommandKinds(tx)).toContain("MergeCoins");
    expect(collectMoveCalls(tx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "buy_pt" }),
    );
  });

  test("auto-creates a PY position for first-time PT and YT buys", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const buyPtTx = await service.buildBuyPtTx({
      senderAddress,
      inputCoinId: objectId("40"),
      inputAmount: 100n,
      minPtOut: 90n,
      rewardSettlement: { strategy: "empty-vector" },
    });
    const buyYtTx = await service.buildBuyYtTx({
      senderAddress,
      inputCoinId: objectId("42"),
      inputAmount: 100n,
      minYtOut: 20n,
      minSyOut: 1n,
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(buyPtTx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "router", function: "create_py_position" }),
        expect.objectContaining({ module: "router", function: "buy_pt" }),
        expect.objectContaining({
          module: "router",
          function: "transfer_py_position_after_reward_settlement",
        }),
      ]),
    );
    expect(
      findMoveCall(buyPtTx, "router", "transfer_py_position_after_reward_settlement")
        ?.arguments,
    ).toHaveLength(6);
    expect(collectMoveCalls(buyYtTx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "router", function: "create_py_position" }),
        expect.objectContaining({ module: "router", function: "buy_yt" }),
        expect.objectContaining({
          module: "router",
          function: "transfer_py_position_after_reward_settlement",
        }),
      ]),
    );
    expect(
      findMoveCall(buyYtTx, "router", "transfer_py_position_after_reward_settlement")
        ?.arguments,
    ).toHaveLength(6);
  });

  test("auto-creates and transfers a full position for first-time keep-YT LP deposits", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const keepYtTx = await service.buildAddLpKeepYtFromUnderlyingTx({
      senderAddress,
      underlyingCoinId: objectId("44"),
      underlyingAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(keepYtTx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "router", function: "create_position" }),
        expect.objectContaining({ module: "router", function: "add_lp_keep_yt" }),
        expect.objectContaining({
          module: "router",
          function: "transfer_position_after_reward_settlement",
        }),
      ]),
    );
    expect(
      findMoveCall(keepYtTx, "router", "transfer_position_after_reward_settlement")
        ?.arguments,
    ).toHaveLength(8);
  });

  test("builds direct-underlying product transactions by minting SY before routing", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const buyPtTx = await service.buildBuyPtFromUnderlyingTx({
      senderAddress,
      underlyingCoinId: objectId("40"),
      underlyingAmount: 100n,
      minPtOut: 90n,
      positionId: objectId("41"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const buyYtTx = await service.buildBuyYtFromUnderlyingTx({
      senderAddress,
      underlyingCoinId: objectId("42"),
      underlyingAmount: 100n,
      minYtOut: 20n,
      minSyOut: 1n,
      positionId: objectId("43"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const keepYtTx = await service.buildAddLpKeepYtFromUnderlyingTx({
      senderAddress,
      underlyingCoinId: objectId("44"),
      underlyingAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      positionId: objectId("45"),
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(buyPtTx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "sy", function: "mint_sy_exact_in" }),
        expect.objectContaining({ module: "demo_market_vault", function: "deposit" }),
        expect.objectContaining({ module: "router", function: "buy_pt" }),
      ]),
    );
    expect(collectMoveCalls(buyYtTx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "sy", function: "mint_sy_exact_in" }),
        expect.objectContaining({ module: "demo_market_vault", function: "deposit" }),
        expect.objectContaining({ module: "router", function: "buy_yt" }),
      ]),
    );
    expect(collectMoveCalls(keepYtTx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "sy", function: "mint_sy_exact_in" }),
        expect.objectContaining({ module: "demo_market_vault", function: "deposit" }),
        expect.objectContaining({ module: "router", function: "add_lp_keep_yt" }),
      ]),
    );
  });

  test("sources SUI direct-underlying inputs with coinWithBalance so wallets can still select gas", async () => {
    const service = createJitterTransactionService({
      config: getScallopTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });
    const suiCoinId = objectId("40");

    const tx = await service.buildAddLpFromSyFromUnderlyingTx({
      senderAddress,
      underlyingCoinId: suiCoinId,
      underlyingAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      minSyOut: 1n,
      positionId: objectId("45"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const txData = stringifyTransactionData(tx);

    expect(collectCommandKinds(tx)).toContain("$Intent");
    expect(txData).toContain("CoinWithBalance");
    expect(txData).not.toContain(suiCoinId);
  });

  test("builds PT orderbook route transactions against unified router route entrypoints", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const buyTx = await service.buildBuyPtRouteTx({
      senderAddress,
      inputCoinId: objectId("45"),
      inputAmount: 100n,
      orderIds: [1n, 2n],
      maxBookPriceRaw: 200n,
      minTotalPtOut: 90n,
      positionId: objectId("46"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const sellTx = await service.buildSellPtRouteTx({
      senderAddress,
      ptAmount: 90n,
      orderIds: [3n, 4n],
      minBookPriceRaw: 180n,
      minTotalSyOut: 80n,
      positionId: objectId("46"),
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(buyTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "buy_pt_route" }),
    );
    expect(collectMoveCalls(sellTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "sell_pt_route" }),
    );
    expect(collectMoveCalls(buyTx)).not.toContainEqual(
      expect.objectContaining({ module: "router", function: "swap_sy_for_pt_orderbook_then_amm" }),
    );
  });

  test("builds YT product transactions against AMM router entrypoints", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const buyTx = await service.buildBuyYtTx({
      senderAddress,
      inputCoinId: objectId("50"),
      inputAmount: 100n,
      minYtOut: 20n,
      minSyOut: 1n,
      positionId: objectId("51"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const sellTx = await service.buildSellYtTx({
      senderAddress,
      ytAmount: 20n,
      minSyOut: 80n,
      positionId: objectId("51"),
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(buyTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "buy_yt" }),
    );
    expect(collectMoveCalls(sellTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "sell_yt" }),
    );
  });

  test("builds LP product transactions and does not expose remove LP keep-YT semantics", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const addTx = await service.buildAddLpTx({
      senderAddress,
      inputCoinId: objectId("60"),
      inputAmount: 100n,
      ptAmount: 50n,
      positionId: objectId("61"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const keepYtTx = await service.buildAddLpKeepYtTx({
      senderAddress,
      inputCoinId: objectId("62"),
      inputAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      positionId: objectId("61"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const fromSyTx = await service.buildAddLpFromSyTx({
      senderAddress,
      inputCoinId: objectId("63"),
      inputAmount: 100n,
      syToMintHint: 60n,
      minLpOut: 20n,
      minSyOut: 1n,
      positionId: objectId("61"),
      rewardSettlement: { strategy: "empty-vector" },
    });
    const removeTx = await service.buildRemoveLpTx({
      senderAddress,
      lpAmount: 20n,
      minSyOut: 10n,
      minPtOut: 8n,
      positionId: objectId("61"),
      rewardSettlement: { strategy: "empty-vector" },
    });

    expect(collectMoveCalls(addTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "add_lp" }),
    );
    expect(collectMoveCalls(keepYtTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "add_lp_keep_yt" }),
    );
    expect(collectMoveCalls(fromSyTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "add_lp_from_sy" }),
    );
    expect(collectMoveCalls(removeTx)).toContainEqual(
      expect.objectContaining({ module: "router", function: "remove_lp" }),
    );
    expect(collectMoveCalls(removeTx)).not.toContainEqual(
      expect.objectContaining({ module: "router", function: "remove_lp_keep_yt" }),
    );
    expect(findMoveCall(addTx, "router", "add_lp")?.arguments).toHaveLength(13);
    expect(findMoveCall(keepYtTx, "router", "add_lp_keep_yt")?.arguments).toHaveLength(14);
    expect(findMoveCall(fromSyTx, "router", "add_lp_from_sy")?.arguments).toHaveLength(15);
  });

  test("builds core router and SY transactions as Transaction blocks", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    await expect(
      service.buildDepositToSyTx({
        underlyingCoinId: "0xunderlying",
        underlyingAmount: 100n,
        senderAddress,
      }),
    ).resolves.toBeInstanceOf(Transaction);
    await expect(
      service.buildRedeemSyToUnderlyingTx({
        syCoinId: "0xsy",
        syAmount: 100n,
        senderAddress,
      }),
    ).resolves.toBeInstanceOf(Transaction);
    await expect(
      service.buildSwapSyForPtTx({
        syCoinId: "0xsy",
        syAmount: 100n,
        minPtOut: 90n,
        pyPositionId: "0xpy-position",
        senderAddress,
      }),
    ).resolves.toBeInstanceOf(Transaction);
    await expect(
      service.buildClaimYtInterestTx({
        pyPositionId: "0xpy-position",
        senderAddress,
      }),
    ).resolves.toBeInstanceOf(Transaction);
  });

  test("uses adapter manifest for scallop price info and routes underlying through Scallop mint", async () => {
    const config = getScallopTestConfig();
    const service = createJitterTransactionService({
      config,
      adapter: getJitterAdapterManifest(config),
      resolveSyIndex: async () => DEFAULT_DEMO_SY_INDEX,
    });

    const depositTx = await service.buildDepositToSyTx({
      underlyingCoinId: objectId("30"),
      underlyingAmount: 100n,
      senderAddress,
    });
    const depositCalls = collectMoveCalls(depositTx);

    expect(depositCalls).toContainEqual(
      expect.objectContaining({ module: "mint", function: "mint" }),
    );
    expect(depositCalls).toContainEqual(
      expect.objectContaining({ module: "scallop_market_vault", function: "deposit" }),
    );

    const redeemTx = await service.buildRedeemSyToUnderlyingTx({
      syCoinId: objectId("33"),
      syAmount: 100n,
      senderAddress,
    });
    const redeemCalls = collectMoveCalls(redeemTx);

    expect(redeemCalls).toContainEqual(
      expect.objectContaining({ module: "scallop_market_vault", function: "redeem" }),
    );
    expect(redeemCalls).toContainEqual(
      expect.objectContaining({ module: "redeem", function: "redeem" }),
    );

    const tx = await service.buildSwapSyForPtTx({
      syCoinId: objectId("31"),
      syAmount: 100n,
      minPtOut: 90n,
      pyPositionId: objectId("32"),
      senderAddress,
    });
    const calls = collectMoveCalls(tx);

    expect(calls).toContainEqual(
      expect.objectContaining({ module: "scallop_price_ticket", function: "quote" }),
    );
    expect(calls).not.toContainEqual(
      expect.objectContaining({ module: "demo_price_ticket", function: "quote" }),
    );
  });

  test("builds orderbook action transactions as Transaction blocks", async () => {
    const service = createJitterTransactionService({
      config: getTestConfig(),
    });

    expect(
      service.buildPlaceBidOrderTx({
        syCoinId: "0xsy",
        syAmount: 100n,
        priceRaw: 2n,
        minPtAmount: 50n,
        senderAddress,
      }),
    ).toBeInstanceOf(Transaction);
    expect(
      service.buildClaimOrderTx({
        orderId: 1n,
        senderAddress,
        asset: "pt",
      }),
    ).toBeInstanceOf(Transaction);
    expect(
      service.buildCancelOrderTx({
        orderId: 2n,
        senderAddress,
        asset: "yt",
      }),
    ).toBeInstanceOf(Transaction);
  });
});

function getTestConfig() {
  const config = getJitterMarketConfig("testnet", "demo");
  if (!config) throw new Error("missing SDK demo market config");
  return {
    ...config,
    orderbookObjectId: config.orderbookObjectId ?? objectId("ab"),
    ytOrderbookObjectId: config.ytOrderbookObjectId ?? objectId("ac"),
  };
}

function getScallopTestConfig() {
  return {
    ...getTestConfig(),
    underlyingTypeTag: SUI_TYPE_TAG,
    demoMarketVaultObjectId: "",
    scallopAdapterPackageId: objectId("20"),
    scallopProtocolPackageId: objectId("24"),
    scallopMarketVaultObjectId: objectId("21"),
    scallopMarketObjectId: objectId("22"),
    scallopVersionObjectId: objectId("23"),
    scallopMarketCoinTypeTag: `${objectId("24")}::reserve::MarketCoin<0x2::sui::SUI>`,
  };
}

function objectId(suffix: string): string {
  return `0x${suffix.padStart(64, "0")}`;
}

function collectMoveCalls(tx: Transaction) {
  return tx.getData().commands.flatMap((command) => {
    if (command.$kind !== "MoveCall") return [];
    return [command.MoveCall];
  });
}

function collectCommandKinds(tx: Transaction) {
  return tx.getData().commands.map((command) => command.$kind);
}

function stringifyTransactionData(tx: Transaction): string {
  return JSON.stringify(tx.getData(), (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

function findMoveCall(tx: Transaction, module: string, fn: string) {
  return collectMoveCalls(tx).find(
    (call) => call.module === module && call.function === fn,
  );
}
