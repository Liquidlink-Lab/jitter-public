/** Primitive PTB builders and adapter/reward helpers. */

// ---------------------------------------------------------------------------
// Re-exports (primitive layer)
// ---------------------------------------------------------------------------
export {
  detectAdapterKind,
  getJitterAdapterManifest,
} from "../adapters/registry.js";
export type {
  AdapterDepositArgs,
  AdapterDepositResult,
  AdapterPriceInfoArgs,
  AdapterRedeemArgs,
  AdapterRedeemResult,
  JitterAdapterKind,
  JitterAdapterManifest,
} from "../adapters/types.js";
export {
  addDemoPriceInfo,
  addScallopPriceInfo,
  addEmberPriceInfo,
  addSuilendPriceInfo,
  addNaviPriceInfo,
} from "../oracle.js";
export {
  addMintSyExactIn,
  addBurnSyExactIn,
  addDemoDeposit,
  addDemoRedeem,
  addScallopMintMarketCoin,
  addScallopDeposit,
  addScallopDepositFromUnderlying,
  addScallopRedeem,
  addScallopRedeemMarketCoinToUnderlying,
  addScallopRedeemToUnderlying,
  addEmberDeposit,
  addEmberRedeem,
  addSuilendDeposit,
  addSuilendRedeem,
  addNaviDeposit,
  addNaviRedeem,
  addNaviRedeemV2,
} from "../sy.js";
export {
  addCreatePyPosition,
  addCreateLpPosition,
  addMintPyFromSy,
  addRedeemBeforeExpiry,
  addRedeemAfterExpiry,
  addClaimYtInterest,
} from "../py.js";
export {
  addSwapSyForPt,
  addSwapSyForExactPt,
  addSwapSyForYt,
  addSwapSyForExactYt,
  addSwapYtForSy,
  addSwapPtForSy,
  addSwapPtForExactSy,
  addLiquidityFromPosition,
  addLiquidityKeepYtFromPosition,
  addRemoveLiquidityToPosition,
} from "../pool.js";
export {
  addPlaceBidOrder,
  addPlaceAskOrderFromPosition,
  addClaimOrder,
  addCancelOrder,
  addHybridSwapSyForPt,
  addHybridSwapPtForSy,
} from "../orderbook.js";
export type { OrderbookAsset } from "../orderbook.js";
export {
  addClaimLpPointsWithLiquidlinkPoints,
  addClaimYtInterestWithLiquidlinkPoints,
  addHybridSwapPtForSyWithLiquidlinkPoints,
  addHybridSwapSyForPtWithLiquidlinkPoints,
  addLiquidityFromPositionWithLiquidlinkPoints,
  addLiquidityKeepYtFromPositionWithLiquidlinkPoints,
  addMintPyFromSyWithLiquidlinkPoints,
  addRedeemAfterExpiryWithLiquidlinkPoints,
  addRedeemBeforeExpiryWithLiquidlinkPoints,
  addRemoveLiquidityToPositionWithLiquidlinkPoints,
  addSettleLpRewardOperationWithLiquidlinkPoints,
  addSettleLpPositionWithLiquidlinkPoints,
  addSettlePoolRewardOperationWithLiquidlinkPoints,
  addSettleYtRewardOperationWithLiquidlinkPoints,
  addSwapPtForExactSyWithLiquidlinkPoints,
  addSwapPtForSyWithLiquidlinkPoints,
  addSwapSyForExactPtWithLiquidlinkPoints,
  addSwapSyForExactYtWithLiquidlinkPoints,
  addSwapSyForPtWithLiquidlinkPoints,
  addSwapSyForYtWithLiquidlinkPoints,
  addSwapYtForSyWithLiquidlinkPoints,
  addSyncLpPositionWithLiquidlinkPoints,
  addSyncPyPositionWithLiquidlinkPoints,
  hasLiquidlinkLpPointsConfig,
  hasLiquidlinkPointsConfig,
} from "../liquidlink-points.js";
export {
  addSettleCoinReward,
  addSettleAndClaimCoinReward,
  buildClaimCoinRewardTx,
  hasCoinRewardConfig,
} from "../coin-reward.js";
export type { CoinRewardScope } from "../coin-reward.js";
