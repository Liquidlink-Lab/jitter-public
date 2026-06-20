/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * pool - PT/SY AMM pool state and transitions.
 * 
 * `Pool<T>` is the shared object for a single PT/SY pool. Each pool is bound to
 * one `PyState` with the same SY type and expiry.
 * 
 * The pool tracks:
 * 
 * - SY balance
 * - virtual PT inventory via `total_pt`
 * - total LP supply
 * - curve parameters such as `scalar_root`, `initial_anchor`, and fee rate
 * 
 * Compared with the earlier Nemo-inspired layout, this version keeps farming state
 * separate, books fees directly into SY, and computes transient cache values with
 * pure helpers instead of storing extra structs.
 */

import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as balance from './deps/sui/balance.js';
import * as balance_1 from './deps/sui/balance.js';
import * as fixed_point64 from './deps/jitter_math/fixed_point64.js';
import * as fixed_point64_with_sign from './deps/jitter_math/fixed_point64_with_sign.js';
import * as fixed_point64_with_sign_1 from './deps/jitter_math/fixed_point64_with_sign.js';
import * as fixed_point64_1 from './deps/jitter_math/fixed_point64.js';
import * as fixed_point64_2 from './deps/jitter_math/fixed_point64.js';
import * as fixed_point64_3 from './deps/jitter_math/fixed_point64.js';
const $moduleName = 'jitter/jitter::pool';
export const Pool = new MoveStruct({ name: `${$moduleName}::Pool<phantom T>`, fields: {
        id: bcs.Address,
        /** Bound `PyState` object ID. */
        py_state_id: bcs.Address,
        /** Bound `Market` ID */
        market_id: bcs.Address,
        /** Expiry timestamp in milliseconds. */
        expiry: bcs.u64(),
        /** Virtual PT inventory tracked by the AMM. */
        total_pt: bcs.u64(),
        /** SY balance held by the pool. */
        total_sy: balance.Balance,
        /**
         * Freshness guard for reward-settled pool mutations. It is separate from
         * `total_sy` so same-value pool churn cannot revive stale settlements.
         */
        reward_guard: bcs.u64(),
        /** Protocol/reserve fee vault carved out of swap fees. */
        reserve_fee_vault: balance_1.Balance,
        /** Total LP supply. */
        lp_supply: bcs.u64(),
        /** Last `ln(implied_rate)` snapshot, stored as FP64 raw. */
        last_ln_implied_rate: fixed_point64.FixedPoint64,
        /** `scalar_root` curve parameter, stored as signed FP64. */
        scalar_root: fixed_point64_with_sign.FixedPoint64WithSign,
        /** `initial_anchor` curve parameter, stored as signed FP64. */
        initial_anchor: fixed_point64_with_sign_1.FixedPoint64WithSign,
        /** Fee rate as `ln(1 + fee%)`, stored as unsigned FP64 raw. */
        ln_fee_rate_root: fixed_point64_1.FixedPoint64,
        /** Treasury address that can receive collected reserve fees. */
        treasury: bcs.Address,
        /** Protocol share of AMM swap fees, stored as FP64 raw. */
        protocol_fee_rate: fixed_point64_2.FixedPoint64,
        /** Maximum raw SY allowed in the pool. `0` disables the cap. */
        market_cap: bcs.u64(),
        /** Maximum indexed asset exposure allowed in the pool. `0` disables the cap. */
        asset_market_cap: bcs.u64()
    } });
export const RewardPoolOperation = new MoveStruct({ name: `${$moduleName}::RewardPoolOperation`, fields: {
        pool_id: bcs.Address,
        distributor_id: bcs.Address
    } });
export const BorrowPtReceipt = new MoveStruct({ name: `${$moduleName}::BorrowPtReceipt`, fields: {
        pool_id: bcs.Address,
        pt_amount: bcs.u64()
    } });
export const BorrowSyReceipt = new MoveStruct({ name: `${$moduleName}::BorrowSyReceipt`, fields: {
        pool_id: bcs.Address,
        sy_amount: bcs.u64()
    } });
export const RewardRequiredKey = new MoveTuple({ name: `${$moduleName}::RewardRequiredKey`, fields: [bcs.bool()] });
export const RewardGateKey = new MoveTuple({ name: `${$moduleName}::RewardGateKey`, fields: [bcs.bool()] });
export const RewardRequired = new MoveStruct({ name: `${$moduleName}::RewardRequired`, fields: {
        distributor_id: bcs.Address
    } });
export const PoolCreatedEvent = new MoveStruct({ name: `${$moduleName}::PoolCreatedEvent`, fields: {
        pool_id: bcs.Address,
        py_state_id: bcs.Address,
        expiry: bcs.u64()
    } });
export const RewardDistributorRequiredEvent = new MoveStruct({ name: `${$moduleName}::RewardDistributorRequiredEvent`, fields: {
        pool_id: bcs.Address,
        distributor_id: bcs.Address
    } });
export const SwapEvent = new MoveStruct({ name: `${$moduleName}::SwapEvent`, fields: {
        pool_id: bcs.Address,
        is_pt_to_sy: bcs.bool(),
        amount_in: bcs.u64(),
        amount_out: bcs.u64(),
        fee: bcs.u64(),
        reserve_fee: bcs.u64(),
        trader: bcs.Address
    } });
export const AddLiquidityEvent = new MoveStruct({ name: `${$moduleName}::AddLiquidityEvent`, fields: {
        pool_id: bcs.Address,
        position_id: bcs.Address,
        sy_amount: bcs.u64(),
        pt_amount: bcs.u64(),
        lp_amount: bcs.u64(),
        locked_lp_amount: bcs.u64(),
        sy_refund: bcs.u64(),
        pt_refund: bcs.u64()
    } });
export const RemoveLiquidityEvent = new MoveStruct({ name: `${$moduleName}::RemoveLiquidityEvent`, fields: {
        pool_id: bcs.Address,
        position_id: bcs.Address,
        sy_amount: bcs.u64(),
        pt_amount: bcs.u64(),
        lp_amount: bcs.u64(),
        provider: bcs.Address
    } });
export const ImpliedRateUpdatedEvent = new MoveStruct({ name: `${$moduleName}::ImpliedRateUpdatedEvent`, fields: {
        pool_id: bcs.Address,
        ln_implied_rate_raw: bcs.u128(),
        pt_price_raw: bcs.u128(),
        total_pt: bcs.u64(),
        total_sy: bcs.u64(),
        lp_supply: bcs.u64()
    } });
export const ReserveFeeCollectedEvent = new MoveStruct({ name: `${$moduleName}::ReserveFeeCollectedEvent`, fields: {
        pool_id: bcs.Address,
        treasury: bcs.Address,
        amount: bcs.u64(),
        collector: bcs.Address
    } });
export const MarketCapUpdatedEvent = new MoveStruct({ name: `${$moduleName}::MarketCapUpdatedEvent`, fields: {
        pool_id: bcs.Address,
        market_cap: bcs.u64(),
        actor: bcs.Address
    } });
export const AssetMarketCapUpdatedEvent = new MoveStruct({ name: `${$moduleName}::AssetMarketCapUpdatedEvent`, fields: {
        pool_id: bcs.Address,
        asset_market_cap: bcs.u64(),
        sy_index_raw: bcs.u128(),
        actor: bcs.Address
    } });
export const TradeResult = new MoveStruct({ name: `${$moduleName}::TradeResult`, fields: {
        is_pt_to_sy: bcs.bool(),
        amount_in: bcs.u64(),
        amount_out: bcs.u64(),
        sy_amount: bcs.u64(),
        pt_amount: bcs.u64(),
        fee: bcs.u64(),
        reserve_fee: bcs.u64(),
        new_ln_implied_rate: fixed_point64_3.FixedPoint64,
        time_to_expiry_ms: bcs.u64()
    } });
export interface CreatePoolByAdminArguments {
    pyState: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    scalarRoot: RawTransactionArgument<string>;
    initialAnchor: RawTransactionArgument<string>;
    lnFeeRateRoot: RawTransactionArgument<string>;
    treasury: RawTransactionArgument<string>;
    protocolFeeRate: RawTransactionArgument<string>;
    marketCap: RawTransactionArgument<number | bigint>;
    assetMarketCap: RawTransactionArgument<number | bigint>;
    expiry: RawTransactionArgument<number | bigint>;
}
export interface CreatePoolByAdminOptions {
    package?: string;
    arguments: CreatePoolByAdminArguments | [
        pyState: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        scalarRoot: RawTransactionArgument<string>,
        initialAnchor: RawTransactionArgument<string>,
        lnFeeRateRoot: RawTransactionArgument<string>,
        treasury: RawTransactionArgument<string>,
        protocolFeeRate: RawTransactionArgument<string>,
        marketCap: RawTransactionArgument<number | bigint>,
        assetMarketCap: RawTransactionArgument<number | bigint>,
        expiry: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
/**
 * Create and share a new pool with raw-SY and indexed-asset caps. A cap of `0`
 * disables that guard.
 */
export function createPoolByAdmin(options: CreatePoolByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'address',
        null,
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pyState", "market", "globalConfig", "AdminCap", "scalarRoot", "initialAnchor", "lnFeeRateRoot", "treasury", "protocolFeeRate", "marketCap", "assetMarketCap", "expiry"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'create_pool_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PoolIdArguments {
    state: RawTransactionArgument<string>;
}
export interface PoolIdOptions {
    package?: string;
    arguments: PoolIdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function poolId(options: PoolIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'pool_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PyStateIdArguments {
    state: RawTransactionArgument<string>;
}
export interface PyStateIdOptions {
    package?: string;
    arguments: PyStateIdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function pyStateId(options: PyStateIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'py_state_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketIdArguments {
    state: RawTransactionArgument<string>;
}
export interface MarketIdOptions {
    package?: string;
    arguments: MarketIdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function marketId(options: MarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ExpiryArguments {
    state: RawTransactionArgument<string>;
}
export interface ExpiryOptions {
    package?: string;
    arguments: ExpiryArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function expiry(options: ExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TotalPtArguments {
    state: RawTransactionArgument<string>;
}
export interface TotalPtOptions {
    package?: string;
    arguments: TotalPtArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function totalPt(options: TotalPtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'total_pt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TotalSyArguments {
    state: RawTransactionArgument<string>;
}
export interface TotalSyOptions {
    package?: string;
    arguments: TotalSyArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function totalSy(options: TotalSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'total_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RewardGuardArguments {
    state: RawTransactionArgument<string>;
}
export interface RewardGuardOptions {
    package?: string;
    arguments: RewardGuardArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function rewardGuard(options: RewardGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'reward_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ReserveFeeAmountArguments {
    state: RawTransactionArgument<string>;
}
export interface ReserveFeeAmountOptions {
    package?: string;
    arguments: ReserveFeeAmountArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function reserveFeeAmount(options: ReserveFeeAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'reserve_fee_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LpSupplyArguments {
    state: RawTransactionArgument<string>;
}
export interface LpSupplyOptions {
    package?: string;
    arguments: LpSupplyArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lpSupply(options: LpSupplyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'lp_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LastLnImpliedRateArguments {
    state: RawTransactionArgument<string>;
}
export interface LastLnImpliedRateOptions {
    package?: string;
    arguments: LastLnImpliedRateArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lastLnImpliedRate(options: LastLnImpliedRateOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'last_ln_implied_rate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LastLnImpliedRateRawArguments {
    state: RawTransactionArgument<string>;
}
export interface LastLnImpliedRateRawOptions {
    package?: string;
    arguments: LastLnImpliedRateRawArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lastLnImpliedRateRaw(options: LastLnImpliedRateRawOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'last_ln_implied_rate_raw',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ScalarRootArguments {
    state: RawTransactionArgument<string>;
}
export interface ScalarRootOptions {
    package?: string;
    arguments: ScalarRootArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function scalarRoot(options: ScalarRootOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'scalar_root',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ScalarRootValueArguments {
    state: RawTransactionArgument<string>;
}
export interface ScalarRootValueOptions {
    package?: string;
    arguments: ScalarRootValueArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function scalarRootValue(options: ScalarRootValueOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'scalar_root_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ScalarRootPositiveArguments {
    state: RawTransactionArgument<string>;
}
export interface ScalarRootPositiveOptions {
    package?: string;
    arguments: ScalarRootPositiveArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function scalarRootPositive(options: ScalarRootPositiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'scalar_root_positive',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface InitialAnchorArguments {
    state: RawTransactionArgument<string>;
}
export interface InitialAnchorOptions {
    package?: string;
    arguments: InitialAnchorArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function initialAnchor(options: InitialAnchorOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'initial_anchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface InitialAnchorValueArguments {
    state: RawTransactionArgument<string>;
}
export interface InitialAnchorValueOptions {
    package?: string;
    arguments: InitialAnchorValueArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function initialAnchorValue(options: InitialAnchorValueOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'initial_anchor_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface InitialAnchorPositiveArguments {
    state: RawTransactionArgument<string>;
}
export interface InitialAnchorPositiveOptions {
    package?: string;
    arguments: InitialAnchorPositiveArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function initialAnchorPositive(options: InitialAnchorPositiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'initial_anchor_positive',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LnFeeRateRootArguments {
    state: RawTransactionArgument<string>;
}
export interface LnFeeRateRootOptions {
    package?: string;
    arguments: LnFeeRateRootArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lnFeeRateRoot(options: LnFeeRateRootOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'ln_fee_rate_root',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TreasuryArguments {
    state: RawTransactionArgument<string>;
}
export interface TreasuryOptions {
    package?: string;
    arguments: TreasuryArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function treasury(options: TreasuryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'treasury',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ProtocolFeeRateArguments {
    state: RawTransactionArgument<string>;
}
export interface ProtocolFeeRateOptions {
    package?: string;
    arguments: ProtocolFeeRateArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function protocolFeeRate(options: ProtocolFeeRateOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'protocol_fee_rate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ProtocolFeeRateRawArguments {
    state: RawTransactionArgument<string>;
}
export interface ProtocolFeeRateRawOptions {
    package?: string;
    arguments: ProtocolFeeRateRawArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function protocolFeeRateRaw(options: ProtocolFeeRateRawOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'protocol_fee_rate_raw',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketCapArguments {
    state: RawTransactionArgument<string>;
}
export interface MarketCapOptions {
    package?: string;
    arguments: MarketCapArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function marketCap(options: MarketCapOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'market_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssetMarketCapArguments {
    state: RawTransactionArgument<string>;
}
export interface AssetMarketCapOptions {
    package?: string;
    arguments: AssetMarketCapArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function assetMarketCap(options: AssetMarketCapOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'asset_market_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssetExposureArguments {
    state: RawTransactionArgument<string>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
}
export interface AssetExposureOptions {
    package?: string;
    arguments: AssetExposureArguments | [
        state: RawTransactionArgument<string>,
        syIndexRaw: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function assetExposure(options: AssetExposureOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u128'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "syIndexRaw"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'asset_exposure',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RewardDistributorRequiredArguments {
    state: RawTransactionArgument<string>;
}
export interface RewardDistributorRequiredOptions {
    package?: string;
    arguments: RewardDistributorRequiredArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function rewardDistributorRequired(options: RewardDistributorRequiredOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'reward_distributor_required',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RewardDistributorIdArguments {
    state: RawTransactionArgument<string>;
}
export interface RewardDistributorIdOptions {
    package?: string;
    arguments: RewardDistributorIdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function rewardDistributorId(options: RewardDistributorIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'reward_distributor_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RewardGateOpenArguments {
    state: RawTransactionArgument<string>;
}
export interface RewardGateOpenOptions {
    package?: string;
    arguments: RewardGateOpenArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function rewardGateOpen(options: RewardGateOpenOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'reward_gate_open',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CollectReserveFeesByAclArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    acl: RawTransactionArgument<string>;
}
export interface CollectReserveFeesByAclOptions {
    package?: string;
    arguments: CollectReserveFeesByAclArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        acl: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function collectReserveFeesByAcl(options: CollectReserveFeesByAclOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "acl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'collect_reserve_fees_by_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetMarketCapByAclArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    acl: RawTransactionArgument<string>;
    marketCap: RawTransactionArgument<number | bigint>;
}
export interface SetMarketCapByAclOptions {
    package?: string;
    arguments: SetMarketCapByAclArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        acl: RawTransactionArgument<string>,
        marketCap: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function setMarketCapByAcl(options: SetMarketCapByAclOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "acl", "marketCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'set_market_cap_by_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetAssetMarketCapByAclArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    acl: RawTransactionArgument<string>;
    assetMarketCap: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
}
export interface SetAssetMarketCapByAclOptions {
    package?: string;
    arguments: SetAssetMarketCapByAclArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        acl: RawTransactionArgument<string>,
        assetMarketCap: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function setAssetMarketCapByAcl(options: SetAssetMarketCapByAclOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u128'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "acl", "assetMarketCap", "syIndexRaw"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'set_asset_market_cap_by_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequireRewardDistributorByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    distributorId: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface RequireRewardDistributorByAdminOptions {
    package?: string;
    arguments: RequireRewardDistributorByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        distributorId: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function requireRewardDistributorByAdmin(options: RequireRewardDistributorByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::object::ID',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "distributorId", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'require_reward_distributor_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CollectReserveFeesByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface CollectReserveFeesByAdminOptions {
    package?: string;
    arguments: CollectReserveFeesByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function collectReserveFeesByAdmin(options: CollectReserveFeesByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'collect_reserve_fees_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetMarketCapByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    marketCap: RawTransactionArgument<number | bigint>;
    AdminCap: RawTransactionArgument<string>;
}
export interface SetMarketCapByAdminOptions {
    package?: string;
    arguments: SetMarketCapByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        marketCap: RawTransactionArgument<number | bigint>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function setMarketCapByAdmin(options: SetMarketCapByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "marketCap", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'set_market_cap_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetAssetMarketCapByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    assetMarketCap: RawTransactionArgument<number | bigint>;
    syIndexRaw: RawTransactionArgument<number | bigint>;
    AdminCap: RawTransactionArgument<string>;
}
export interface SetAssetMarketCapByAdminOptions {
    package?: string;
    arguments: SetAssetMarketCapByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        assetMarketCap: RawTransactionArgument<number | bigint>,
        syIndexRaw: RawTransactionArgument<number | bigint>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function setAssetMarketCapByAdmin(options: SetAssetMarketCapByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u128',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "assetMarketCap", "syIndexRaw", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pool',
        function: 'set_asset_market_cap_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}