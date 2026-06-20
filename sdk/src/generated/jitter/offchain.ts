/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * offchain - read-only helpers for frontends, SDKs, and PTB simulation.
 * 
 * This module exposes pure query helpers for:
 * 
 * - swap previews and slippage previews
 * - LP value previews
 * - claimable-interest previews
 * 
 * These functions never mutate protocol state. The router composes actions, while
 * this module provides the view layer around those actions.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/jitter::offchain';
export const MarketSnapshot = new MoveStruct({ name: `${$moduleName}::MarketSnapshot`, fields: {
        market_id: bcs.Address,
        expiry: bcs.u64(),
        sy_treasury_id: bcs.Address,
        pt_treasury_id: bcs.Address,
        yt_treasury_id: bcs.Address,
        sy_total_supply: bcs.u64(),
        pt_total_supply: bcs.u64(),
        yt_total_supply: bcs.u64()
    } });
export const PoolSnapshot = new MoveStruct({ name: `${$moduleName}::PoolSnapshot`, fields: {
        pool_id: bcs.Address,
        py_state_id: bcs.Address,
        market_id: bcs.Address,
        expiry: bcs.u64(),
        total_pt: bcs.u64(),
        total_sy: bcs.u64(),
        reward_guard: bcs.u64(),
        reserve_fee_amount: bcs.u64(),
        lp_supply: bcs.u64(),
        last_ln_implied_rate_raw: bcs.u128(),
        scalar_root_value: bcs.u128(),
        scalar_root_positive: bcs.bool(),
        initial_anchor_value: bcs.u128(),
        initial_anchor_positive: bcs.bool(),
        treasury: bcs.Address,
        protocol_fee_rate_raw: bcs.u128(),
        market_cap: bcs.u64(),
        asset_market_cap: bcs.u64(),
        asset_exposure: bcs.u64(),
        reward_distributor_required: bcs.bool(),
        reward_distributor_id: bcs.Address,
        reward_gate_open: bcs.bool()
    } });
export const PyStateSnapshot = new MoveStruct({ name: `${$moduleName}::PyStateSnapshot`, fields: {
        state_id: bcs.Address,
        market_id: bcs.Address,
        expiry: bcs.u64(),
        interest_fee_rate: bcs.u128(),
        expiry_divisor: bcs.u64(),
        treasury: bcs.Address,
        pt_supply: bcs.u64(),
        yt_supply: bcs.u64(),
        sy_balance_value: bcs.u64(),
        py_index_stored: bcs.u128(),
        global_interest_index: bcs.u128(),
        total_treasury_interest: bcs.u128(),
        is_settled: bcs.bool(),
        settled_py_index: bcs.u128(),
        py_index_last_updated: bcs.u64(),
        last_interest_timestamp: bcs.u64(),
        last_collect_interest_index: bcs.u128(),
        yt_reward_distributor_required: bcs.bool(),
        yt_reward_distributor_id: bcs.Address,
        yt_reward_gate_open: bcs.bool(),
        expired: bcs.bool()
    } });
export const PositionSnapshot = new MoveStruct({ name: `${$moduleName}::PositionSnapshot`, fields: {
        position_id: bcs.Address,
        py_state_id: bcs.Address,
        market_id: bcs.Address,
        expiry: bcs.u64(),
        created_at: bcs.u64(),
        pt_balance: bcs.u64(),
        yt_balance: bcs.u64(),
        yt_reward_guard: bcs.u64(),
        index: bcs.u128(),
        py_index: bcs.u128(),
        accrued: bcs.u128(),
        is_py_empty: bcs.bool(),
        pool_id: bcs.Address,
        lp_amount: bcs.u64(),
        lp_reward_guard: bcs.u64(),
        is_lp_empty: bcs.bool()
    } });
export const RewardDistributorSnapshot = new MoveStruct({ name: `${$moduleName}::RewardDistributorSnapshot`, fields: {
        distributor_id: bcs.Address,
        enabled: bcs.bool(),
        config_version: bcs.u64(),
        yt_rewarder_count: bcs.u64(),
        lp_rewarder_count: bcs.u64(),
        pool_rewarder_count: bcs.u64()
    } });
export interface MarketSnapshotArguments {
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface MarketSnapshotOptions {
    package?: string;
    arguments: MarketSnapshotArguments | [
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function marketSnapshot(options: MarketSnapshotOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'market_snapshot',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PoolSnapshotArguments {
    globalConfig: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
}
export interface PoolSnapshotOptions {
    package?: string;
    arguments: PoolSnapshotArguments | [
        globalConfig: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>,
        syIndexRaw: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function poolSnapshot(options: PoolSnapshotOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u128'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "state", "syIndexRaw"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'pool_snapshot',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PyStateSnapshotArguments {
    globalConfig: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
}
export interface PyStateSnapshotOptions {
    package?: string;
    arguments: PyStateSnapshotArguments | [
        globalConfig: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function pyStateSnapshot(options: PyStateSnapshotOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'py_state_snapshot',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PositionSnapshotArguments {
    globalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
}
export interface PositionSnapshotOptions {
    package?: string;
    arguments: PositionSnapshotArguments | [
        globalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>
    ];
}
export function positionSnapshot(options: PositionSnapshotOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'position_snapshot',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RewardDistributorSnapshotArguments {
    globalConfig: RawTransactionArgument<string>;
    distributor: RawTransactionArgument<string>;
}
export interface RewardDistributorSnapshotOptions {
    package?: string;
    arguments: RewardDistributorSnapshotArguments | [
        globalConfig: RawTransactionArgument<string>,
        distributor: RawTransactionArgument<string>
    ];
}
export function rewardDistributorSnapshot(options: RewardDistributorSnapshotOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "distributor"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'reward_distributor_snapshot',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EstimatePtPriceArguments {
    globalConfig: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
}
export interface EstimatePtPriceOptions {
    package?: string;
    arguments: EstimatePtPriceArguments | [
        globalConfig: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>,
        syIndexRaw: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Return the current PT price quoted in SY as FP64 raw. */
export function estimatePtPrice(options: EstimatePtPriceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u128',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "state", "syIndexRaw"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_pt_price',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateYtPriceArguments {
    globalConfig: RawTransactionArgument<string>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateYtPriceOptions {
    package?: string;
    arguments: EstimateYtPriceArguments | [
        globalConfig: RawTransactionArgument<string>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Return the current YT price quoted in SY. */
export function estimateYtPrice(options: EstimateYtPriceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_yt_price',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForPtArguments {
    globalConfig: RawTransactionArgument<string>;
    syIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForPtOptions {
    package?: string;
    arguments: EstimateSwapSyForPtArguments | [
        globalConfig: RawTransactionArgument<string>,
        syIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Preview exact-in `SY -> PT`. */
export function estimateSwapSyForPt(options: EstimateSwapSyForPtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syIn", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_pt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForPtSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    syIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForPtSlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapSyForPtSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        syIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapSyForPtSlippageBps(options: EstimateSwapSyForPtSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syIn", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_pt_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapPtForSyArguments {
    globalConfig: RawTransactionArgument<string>;
    ptIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapPtForSyOptions {
    package?: string;
    arguments: EstimateSwapPtForSyArguments | [
        globalConfig: RawTransactionArgument<string>,
        ptIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Preview exact-in `PT -> SY`. */
export function estimateSwapPtForSy(options: EstimateSwapPtForSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ptIn", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_pt_for_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapPtForSySlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    ptIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapPtForSySlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapPtForSySlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        ptIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapPtForSySlippageBps(options: EstimateSwapPtForSySlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ptIn", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_pt_for_sy_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForExactPtArguments {
    globalConfig: RawTransactionArgument<string>;
    ptOut: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForExactPtOptions {
    package?: string;
    arguments: EstimateSwapSyForExactPtArguments | [
        globalConfig: RawTransactionArgument<string>,
        ptOut: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Preview exact-out `SY -> PT`. */
export function estimateSwapSyForExactPt(options: EstimateSwapSyForExactPtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ptOut", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_exact_pt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForExactPtSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    ptOut: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForExactPtSlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapSyForExactPtSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        ptOut: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapSyForExactPtSlippageBps(options: EstimateSwapSyForExactPtSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ptOut", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_exact_pt_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapPtForExactSyArguments {
    globalConfig: RawTransactionArgument<string>;
    syOut: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapPtForExactSyOptions {
    package?: string;
    arguments: EstimateSwapPtForExactSyArguments | [
        globalConfig: RawTransactionArgument<string>,
        syOut: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Preview exact-out `PT -> SY`. */
export function estimateSwapPtForExactSy(options: EstimateSwapPtForExactSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syOut", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_pt_for_exact_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapPtForExactSySlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    syOut: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    state: RawTransactionArgument<string>;
}
export interface EstimateSwapPtForExactSySlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapPtForExactSySlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        syOut: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapPtForExactSySlippageBps(options: EstimateSwapPtForExactSySlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syOut", "syIndexRaw", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_pt_for_exact_sy_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForYtArguments {
    globalConfig: RawTransactionArgument<string>;
    syIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForYtOptions {
    package?: string;
    arguments: EstimateSwapSyForYtArguments | [
        globalConfig: RawTransactionArgument<string>,
        syIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Preview the composed `SY -> YT` route.
 *
 * Flow:
 *
 * 1.  Solve the largest YT amount whose net cost fits `sy_in`.
 * 2.  The execution route may borrow SY from the pool, mint PY, sell PT, repay the
 *     borrowed SY, and return residual SY change.
 *
 * Returns `(yt_out, sy_change)`.
 */
export function estimateSwapSyForYt(options: EstimateSwapSyForYtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syIn", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_yt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForYtSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    syIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForYtSlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapSyForYtSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        syIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapSyForYtSlippageBps(options: EstimateSwapSyForYtSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "syIn", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_yt_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForExactYtArguments {
    globalConfig: RawTransactionArgument<string>;
    ytOut: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForExactYtOptions {
    package?: string;
    arguments: EstimateSwapSyForExactYtArguments | [
        globalConfig: RawTransactionArgument<string>,
        ytOut: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Preview exact-out `SY -> YT` and the PT-sale repayment path.
 *
 * Returns `(sy_to_mint, sy_from_pt_sale, net_sy_in)`.
 */
export function estimateSwapSyForExactYt(options: EstimateSwapSyForExactYtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ytOut", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_exact_yt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapSyForExactYtSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    ytOut: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateSwapSyForExactYtSlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapSyForExactYtSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        ytOut: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapSyForExactYtSlippageBps(options: EstimateSwapSyForExactYtSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ytOut", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_sy_for_exact_yt_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapYtForSyArguments {
    globalConfig: RawTransactionArgument<string>;
    ytIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateSwapYtForSyOptions {
    package?: string;
    arguments: EstimateSwapYtForSyArguments | [
        globalConfig: RawTransactionArgument<string>,
        ytIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Preview the composed `YT -> SY` route.
 *
 * Flow:
 *
 * 1.  Use an internal matching PT leg with the caller's YT to redeem SY.
 * 2.  Use part of the redeemed SY to settle the PT leg against the AMM.
 *
 * Returns `(net_sy_out, gross_sy_redeemed, sy_repaid_to_pool)`.
 */
export function estimateSwapYtForSy(options: EstimateSwapYtForSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ytIn", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_yt_for_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateSwapYtForSySlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    ytIn: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    pyStateIn: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface EstimateSwapYtForSySlippageBpsOptions {
    package?: string;
    arguments: EstimateSwapYtForSySlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        ytIn: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        pyStateIn: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function estimateSwapYtForSySlippageBps(options: EstimateSwapYtForSySlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u128',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "ytIn", "syIndexRaw", "pyStateIn", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_swap_yt_for_sy_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CalcSwapSyForPtSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>;
    syUsed: RawTransactionArgument<number | bigint>;
    ptOut: RawTransactionArgument<number | bigint>;
}
export interface CalcSwapSyForPtSlippageBpsOptions {
    package?: string;
    arguments: CalcSwapSyForPtSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>,
        syUsed: RawTransactionArgument<number | bigint>,
        ptOut: RawTransactionArgument<number | bigint>
    ];
}
export function calcSwapSyForPtSlippageBps(options: CalcSwapSyForPtSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeSpotPriceRaw", "syUsed", "ptOut"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'calc_swap_sy_for_pt_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CalcSwapPtForSySlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>;
    ptIn: RawTransactionArgument<number | bigint>;
    syOut: RawTransactionArgument<number | bigint>;
}
export interface CalcSwapPtForSySlippageBpsOptions {
    package?: string;
    arguments: CalcSwapPtForSySlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>,
        ptIn: RawTransactionArgument<number | bigint>,
        syOut: RawTransactionArgument<number | bigint>
    ];
}
export function calcSwapPtForSySlippageBps(options: CalcSwapPtForSySlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeSpotPriceRaw", "ptIn", "syOut"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'calc_swap_pt_for_sy_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CalcSwapSyForYtSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeYtPriceRaw: RawTransactionArgument<number | bigint>;
    netSyIn: RawTransactionArgument<number | bigint>;
    ytOut: RawTransactionArgument<number | bigint>;
}
export interface CalcSwapSyForYtSlippageBpsOptions {
    package?: string;
    arguments: CalcSwapSyForYtSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeYtPriceRaw: RawTransactionArgument<number | bigint>,
        netSyIn: RawTransactionArgument<number | bigint>,
        ytOut: RawTransactionArgument<number | bigint>
    ];
}
export function calcSwapSyForYtSlippageBps(options: CalcSwapSyForYtSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeYtPriceRaw", "netSyIn", "ytOut"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'calc_swap_sy_for_yt_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CalcSwapYtForSySlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeYtPriceRaw: RawTransactionArgument<number | bigint>;
    ytIn: RawTransactionArgument<number | bigint>;
    netSyOut: RawTransactionArgument<number | bigint>;
}
export interface CalcSwapYtForSySlippageBpsOptions {
    package?: string;
    arguments: CalcSwapYtForSySlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeYtPriceRaw: RawTransactionArgument<number | bigint>,
        ytIn: RawTransactionArgument<number | bigint>,
        netSyOut: RawTransactionArgument<number | bigint>
    ];
}
export function calcSwapYtForSySlippageBps(options: CalcSwapYtForSySlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeYtPriceRaw", "ytIn", "netSyOut"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'calc_swap_yt_for_sy_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UsedAmountFromChangeArguments {
    globalConfig: RawTransactionArgument<string>;
    amountIn: RawTransactionArgument<number | bigint>;
    changeCoin: RawTransactionArgument<string>;
}
export interface UsedAmountFromChangeOptions {
    package?: string;
    arguments: UsedAmountFromChangeArguments | [
        globalConfig: RawTransactionArgument<string>,
        amountIn: RawTransactionArgument<number | bigint>,
        changeCoin: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function usedAmountFromChange(options: UsedAmountFromChangeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "amountIn", "changeCoin"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'used_amount_from_change',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssertMaxSlippageBpsArguments {
    globalConfig: RawTransactionArgument<string>;
    actualSlippageBps: RawTransactionArgument<number | bigint>;
    maxSlippageBps: RawTransactionArgument<number | bigint>;
}
export interface AssertMaxSlippageBpsOptions {
    package?: string;
    arguments: AssertMaxSlippageBpsArguments | [
        globalConfig: RawTransactionArgument<string>,
        actualSlippageBps: RawTransactionArgument<number | bigint>,
        maxSlippageBps: RawTransactionArgument<number | bigint>
    ];
}
export function assertMaxSlippageBps(options: AssertMaxSlippageBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "actualSlippageBps", "maxSlippageBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'assert_max_slippage_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSwapSyForPtGuardrailArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>;
    amountIn: RawTransactionArgument<number | bigint>;
    ptOut: RawTransactionArgument<number | bigint>;
    changeCoin: RawTransactionArgument<string>;
    maxSlippageBps: RawTransactionArgument<number | bigint>;
}
export interface AssertSwapSyForPtGuardrailOptions {
    package?: string;
    arguments: AssertSwapSyForPtGuardrailArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>,
        amountIn: RawTransactionArgument<number | bigint>,
        ptOut: RawTransactionArgument<number | bigint>,
        changeCoin: RawTransactionArgument<string>,
        maxSlippageBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function assertSwapSyForPtGuardrail(options: AssertSwapSyForPtGuardrailOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64',
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeSpotPriceRaw", "amountIn", "ptOut", "changeCoin", "maxSlippageBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'assert_swap_sy_for_pt_guardrail',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssertSwapSyForExactPtGuardrailArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>;
    syUsed: RawTransactionArgument<number | bigint>;
    ptOut: RawTransactionArgument<number | bigint>;
    maxSlippageBps: RawTransactionArgument<number | bigint>;
}
export interface AssertSwapSyForExactPtGuardrailOptions {
    package?: string;
    arguments: AssertSwapSyForExactPtGuardrailArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>,
        syUsed: RawTransactionArgument<number | bigint>,
        ptOut: RawTransactionArgument<number | bigint>,
        maxSlippageBps: RawTransactionArgument<number | bigint>
    ];
}
export function assertSwapSyForExactPtGuardrail(options: AssertSwapSyForExactPtGuardrailOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeSpotPriceRaw", "syUsed", "ptOut", "maxSlippageBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'assert_swap_sy_for_exact_pt_guardrail',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSwapPtForSyGuardrailArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>;
    ptIn: RawTransactionArgument<number | bigint>;
    syOut: RawTransactionArgument<number | bigint>;
    maxSlippageBps: RawTransactionArgument<number | bigint>;
}
export interface AssertSwapPtForSyGuardrailOptions {
    package?: string;
    arguments: AssertSwapPtForSyGuardrailArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeSpotPriceRaw: RawTransactionArgument<number | bigint>,
        ptIn: RawTransactionArgument<number | bigint>,
        syOut: RawTransactionArgument<number | bigint>,
        maxSlippageBps: RawTransactionArgument<number | bigint>
    ];
}
export function assertSwapPtForSyGuardrail(options: AssertSwapPtForSyGuardrailOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeSpotPriceRaw", "ptIn", "syOut", "maxSlippageBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'assert_swap_pt_for_sy_guardrail',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSwapSyForYtGuardrailArguments {
    globalConfig: RawTransactionArgument<string>;
    preTradeYtPriceRaw: RawTransactionArgument<number | bigint>;
    amountIn: RawTransactionArgument<number | bigint>;
    ytOut: RawTransactionArgument<number | bigint>;
    changeCoin: RawTransactionArgument<string>;
    maxSlippageBps: RawTransactionArgument<number | bigint>;
}
export interface AssertSwapSyForYtGuardrailOptions {
    package?: string;
    arguments: AssertSwapSyForYtGuardrailArguments | [
        globalConfig: RawTransactionArgument<string>,
        preTradeYtPriceRaw: RawTransactionArgument<number | bigint>,
        amountIn: RawTransactionArgument<number | bigint>,
        ytOut: RawTransactionArgument<number | bigint>,
        changeCoin: RawTransactionArgument<string>,
        maxSlippageBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function assertSwapSyForYtGuardrail(options: AssertSwapSyForYtGuardrailOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128',
        'u64',
        'u64',
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "preTradeYtPriceRaw", "amountIn", "ytOut", "changeCoin", "maxSlippageBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'assert_swap_sy_for_yt_guardrail',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateLpValueArguments {
    globalConfig: RawTransactionArgument<string>;
    lpAmount: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
}
export interface EstimateLpValueOptions {
    package?: string;
    arguments: EstimateLpValueArguments | [
        globalConfig: RawTransactionArgument<string>,
        lpAmount: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Estimate the SY and PT value represented by an LP position. */
export function estimateLpValue(options: EstimateLpValueOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "lpAmount", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_lp_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EstimateClaimableInterestArguments {
    globalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
}
export interface EstimateClaimableInterestOptions {
    package?: string;
    arguments: EstimateClaimableInterestArguments | [
        globalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Estimate claimable YT interest in SY units. */
export function estimateClaimableInterest(options: EstimateClaimableInterestOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "position", "state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'estimate_claimable_interest',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface IsMarketExpiredArguments {
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface IsMarketExpiredOptions {
    package?: string;
    arguments: IsMarketExpiredArguments | [
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Return whether the state has expired. */
export function isMarketExpired(options: IsMarketExpiredOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'offchain',
        function: 'is_market_expired',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}