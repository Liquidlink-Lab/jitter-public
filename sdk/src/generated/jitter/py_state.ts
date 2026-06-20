/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * py_state - shared PT/YT accounting state for one expiry and one SY type.
 * 
 * Each `PyState<T>` tracks:
 * 
 * - PT and YT total supply
 * - the SY interest pool balance
 * - the stored high-water `py_index`
 * - the global interest accumulator
 * - treasury interest accrued by the protocol
 * 
 * Compared with the earlier Nemo-style layout, this version stores interest
 * indexes directly as raw `u128` FP64 values, uses `PyState` itself as the shared
 * object instead of a nested bag, and records explicit settlement state.
 */

import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as balance from './deps/sui/balance.js';
const $moduleName = 'jitter/jitter::py_state';
export const PyState = new MoveStruct({ name: `${$moduleName}::PyState<phantom T>`, fields: {
        id: bcs.Address,
        market_id: bcs.Address,
        /** Expiry timestamp in milliseconds. */
        expiry: bcs.u64(),
        /** Treasury fee rate taken from accrued YT interest, stored as FP64 raw. */
        interest_fee_rate: bcs.u128(),
        /** Expiry must be divisible by this value at setup. */
        expiry_divisor: bcs.u64(),
        /** Treasury address for protocol interest accounting. */
        treasury: bcs.Address,
        /** Total PT supply. */
        pt_supply: bcs.u64(),
        /** Total YT supply. */
        yt_supply: bcs.u64(),
        /** SY interest pool that holds collected interest. */
        sy_balance: balance.Balance,
        /** Stored high-water `py_index`, stored as FP64 raw. */
        py_index_stored: bcs.u128(),
        /** Timestamp of the most recent `py_index` update. */
        py_index_last_updated: bcs.u64(),
        /** `py_index` snapshot from the previous interest collection. */
        last_collect_interest_index: bcs.u128(),
        /** Accumulated treasury interest, stored as FP64 raw. */
        total_treasury_interest: bcs.u128(),
        /** Timestamp of the last interest operation. */
        last_interest_timestamp: bcs.u64(),
        /** Global interest accumulator, stored as FP64 raw. */
        global_interest_index: bcs.u128(),
        /** Whether the market has been settled after expiry. */
        is_settled: bcs.bool(),
        /** `py_index` captured at settlement time. */
        settled_py_index: bcs.u128()
    } });
export const PyStateCreatedEvent = new MoveStruct({ name: `${$moduleName}::PyStateCreatedEvent`, fields: {
        state_id: bcs.Address,
        market_id: bcs.Address,
        expiry: bcs.u64()
    } });
export const InterestCollectedEvent = new MoveStruct({ name: `${$moduleName}::InterestCollectedEvent`, fields: {
        state_id: bcs.Address,
        user_interest_raw: bcs.u128(),
        treasury_interest_raw: bcs.u128(),
        py_index_raw: bcs.u128()
    } });
export const SettledEvent = new MoveStruct({ name: `${$moduleName}::SettledEvent`, fields: {
        state_id: bcs.Address,
        market_id: bcs.Address,
        settled_py_index: bcs.u128(),
        treasury_interest_collected_raw: bcs.u128(),
        settled_at_ms: bcs.u64()
    } });
export const MintPyEvent = new MoveStruct({ name: `${$moduleName}::MintPyEvent`, fields: {
        py_state_id: bcs.Address,
        position_id: bcs.Address,
        sy_amount_in: bcs.u64(),
        pt_amount: bcs.u64(),
        yt_amount: bcs.u64(),
        expiry: bcs.u64()
    } });
export const RedeemPyEvent = new MoveStruct({ name: `${$moduleName}::RedeemPyEvent`, fields: {
        py_state_id: bcs.Address,
        position_id: bcs.Address,
        pt_amount: bcs.u64(),
        yt_amount: bcs.u64(),
        sy_amount_out: bcs.u64(),
        expiry: bcs.u64(),
        redeemer: bcs.Address
    } });
export const InterestClaimedEvent = new MoveStruct({ name: `${$moduleName}::InterestClaimedEvent`, fields: {
        py_state_id: bcs.Address,
        position_id: bcs.Address,
        sy_amount: bcs.u64(),
        receiver: bcs.Address
    } });
export const SettlementEvent = new MoveStruct({ name: `${$moduleName}::SettlementEvent`, fields: {
        py_state_id: bcs.Address,
        settled_py_index: bcs.u128()
    } });
export const ExternalPtRedeemReceipt = new MoveStruct({ name: `${$moduleName}::ExternalPtRedeemReceipt`, fields: {
        state_id: bcs.Address,
        pt_amount: bcs.u64()
    } });
export const YtRewardRequiredKey = new MoveTuple({ name: `${$moduleName}::YtRewardRequiredKey`, fields: [bcs.bool()] });
export const YtRewardGateKey = new MoveTuple({ name: `${$moduleName}::YtRewardGateKey`, fields: [bcs.bool()] });
export const YtRewardRequired = new MoveStruct({ name: `${$moduleName}::YtRewardRequired`, fields: {
        distributor_id: bcs.Address
    } });
export const YtRewardMutation = new MoveStruct({ name: `${$moduleName}::YtRewardMutation`, fields: {
        state_id: bcs.Address,
        distributor_id: bcs.Address
    } });
export const TreasuryInterestCollectedEvent = new MoveStruct({ name: `${$moduleName}::TreasuryInterestCollectedEvent`, fields: {
        py_state_id: bcs.Address,
        market_id: bcs.Address,
        amount: bcs.u64(),
        /** Remaining FP64-raw treasury dust after collection. */
        dust_remainder_raw: bcs.u128(),
        collected_by: bcs.Address
    } });
export const YtRewardDistributorRequiredEvent = new MoveStruct({ name: `${$moduleName}::YtRewardDistributorRequiredEvent`, fields: {
        py_state_id: bcs.Address,
        distributor_id: bcs.Address
    } });
export interface CreatePyStateByAdminCapArguments {
    AdminCap: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    interestFeeRate: RawTransactionArgument<number | bigint>;
    expiryDivisor: RawTransactionArgument<number | bigint>;
    treasury: RawTransactionArgument<string>;
}
export interface CreatePyStateByAdminCapOptions {
    package?: string;
    arguments: CreatePyStateByAdminCapArguments | [
        AdminCap: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        interestFeeRate: RawTransactionArgument<number | bigint>,
        expiryDivisor: RawTransactionArgument<number | bigint>,
        treasury: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function createPyStateByAdminCap(options: CreatePyStateByAdminCapOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u128',
        'u64',
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["AdminCap", "globalConfig", "market", "interestFeeRate", "expiryDivisor", "treasury"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'create_py_state_by_admin_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequireYtRewardDistributorByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    distributorId: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface RequireYtRewardDistributorByAdminOptions {
    package?: string;
    arguments: RequireYtRewardDistributorByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        distributorId: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function requireYtRewardDistributorByAdmin(options: RequireYtRewardDistributorByAdminOptions) {
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
        module: 'py_state',
        function: 'require_yt_reward_distributor_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MintPyArguments {
    syCoin: RawTransactionArgument<string>;
    priceInfoIn: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface MintPyOptions {
    package?: string;
    arguments: MintPyArguments | [
        syCoin: RawTransactionArgument<string>,
        priceInfoIn: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function mintPy(options: MintPyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["syCoin", "priceInfoIn", "position", "state", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'mint_py',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemPyBeforeExpiryArguments {
    outAmount: RawTransactionArgument<number | bigint>;
    priceInfoIn: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface RedeemPyBeforeExpiryOptions {
    package?: string;
    arguments: RedeemPyBeforeExpiryArguments | [
        outAmount: RawTransactionArgument<number | bigint>,
        priceInfoIn: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function redeemPyBeforeExpiry(options: RedeemPyBeforeExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'u64',
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["outAmount", "priceInfoIn", "position", "state", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'redeem_py_before_expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemPyAfterExpiryArguments {
    ptAmount: RawTransactionArgument<number | bigint>;
    position: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface RedeemPyAfterExpiryOptions {
    package?: string;
    arguments: RedeemPyAfterExpiryArguments | [
        ptAmount: RawTransactionArgument<number | bigint>,
        position: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function redeemPyAfterExpiry(options: RedeemPyAfterExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'u64',
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["ptAmount", "position", "state", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'redeem_py_after_expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ClaimInterestArguments {
    priceInfoOpt: RawTransactionArgument<string | null>;
    position: RawTransactionArgument<string>;
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface ClaimInterestOptions {
    package?: string;
    arguments: ClaimInterestArguments | [
        priceInfoOpt: RawTransactionArgument<string | null>,
        position: RawTransactionArgument<string>,
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function claimInterest(options: ClaimInterestOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        '0x1::option::Option<null>',
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["priceInfoOpt", "position", "state", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'claim_interest',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CollectTreasuryInterestByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface CollectTreasuryInterestByAdminOptions {
    package?: string;
    arguments: CollectTreasuryInterestByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Collect accumulated treasury interest fees. Requires AdminCap. The accrued
 * amount is stored as FP64 raw; we truncate to integer SY units.
 */
export function collectTreasuryInterestByAdmin(options: CollectTreasuryInterestByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'collect_treasury_interest_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CollectTreasuryInterestByAclArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    acl: RawTransactionArgument<string>;
}
export interface CollectTreasuryInterestByAclOptions {
    package?: string;
    arguments: CollectTreasuryInterestByAclArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        acl: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Collect accumulated treasury interest fees. Requires the `treasury.collect` ACL
 * role.
 */
export function collectTreasuryInterestByAcl(options: CollectTreasuryInterestByAclOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "acl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'collect_treasury_interest_by_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettleExpiredMarketByAclArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfoIn: RawTransactionArgument<string>;
    acl: RawTransactionArgument<string>;
}
export interface SettleExpiredMarketByAclOptions {
    package?: string;
    arguments: SettleExpiredMarketByAclArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfoIn: RawTransactionArgument<string>,
        acl: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Settle an expired market using the `py_state.settle` ACL role. */
export function settleExpiredMarketByAcl(options: SettleExpiredMarketByAclOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "priceInfoIn", "acl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'settle_expired_market_by_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettleExpiredMarketByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfoIn: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface SettleExpiredMarketByAdminOptions {
    package?: string;
    arguments: SettleExpiredMarketByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfoIn: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Settle an expired market using the `AdminCap`. Mirror of the ACL path for
 * deployments that have not yet handed out the `py_state.settle` role.
 */
export function settleExpiredMarketByAdmin(options: SettleExpiredMarketByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "priceInfoIn", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'settle_expired_market_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface IdArguments {
    state: RawTransactionArgument<string>;
}
export interface IdOptions {
    package?: string;
    arguments: IdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function id(options: IdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'id',
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
        module: 'py_state',
        function: 'expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface InterestFeeRateArguments {
    state: RawTransactionArgument<string>;
}
export interface InterestFeeRateOptions {
    package?: string;
    arguments: InterestFeeRateArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function interestFeeRate(options: InterestFeeRateOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'interest_fee_rate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ExpiryDivisorArguments {
    state: RawTransactionArgument<string>;
}
export interface ExpiryDivisorOptions {
    package?: string;
    arguments: ExpiryDivisorArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function expiryDivisor(options: ExpiryDivisorOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'expiry_divisor',
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
        module: 'py_state',
        function: 'treasury',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PtSupplyArguments {
    state: RawTransactionArgument<string>;
}
export interface PtSupplyOptions {
    package?: string;
    arguments: PtSupplyArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function ptSupply(options: PtSupplyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'pt_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtSupplyArguments {
    state: RawTransactionArgument<string>;
}
export interface YtSupplyOptions {
    package?: string;
    arguments: YtSupplyArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function ytSupply(options: YtSupplyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'yt_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyBalanceValueArguments {
    state: RawTransactionArgument<string>;
}
export interface SyBalanceValueOptions {
    package?: string;
    arguments: SyBalanceValueArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function syBalanceValue(options: SyBalanceValueOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'sy_balance_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PyIndexStoredArguments {
    state: RawTransactionArgument<string>;
}
export interface PyIndexStoredOptions {
    package?: string;
    arguments: PyIndexStoredArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function pyIndexStored(options: PyIndexStoredOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'py_index_stored',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GlobalInterestIndexArguments {
    state: RawTransactionArgument<string>;
}
export interface GlobalInterestIndexOptions {
    package?: string;
    arguments: GlobalInterestIndexArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function globalInterestIndex(options: GlobalInterestIndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'global_interest_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TotalTreasuryInterestArguments {
    state: RawTransactionArgument<string>;
}
export interface TotalTreasuryInterestOptions {
    package?: string;
    arguments: TotalTreasuryInterestArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function totalTreasuryInterest(options: TotalTreasuryInterestOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'total_treasury_interest',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface IsSettledArguments {
    state: RawTransactionArgument<string>;
}
export interface IsSettledOptions {
    package?: string;
    arguments: IsSettledArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function isSettled(options: IsSettledOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'is_settled',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettledPyIndexArguments {
    state: RawTransactionArgument<string>;
}
export interface SettledPyIndexOptions {
    package?: string;
    arguments: SettledPyIndexArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function settledPyIndex(options: SettledPyIndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'settled_py_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PyIndexLastUpdatedArguments {
    state: RawTransactionArgument<string>;
}
export interface PyIndexLastUpdatedOptions {
    package?: string;
    arguments: PyIndexLastUpdatedArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function pyIndexLastUpdated(options: PyIndexLastUpdatedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'py_index_last_updated',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LastInterestTimestampArguments {
    state: RawTransactionArgument<string>;
}
export interface LastInterestTimestampOptions {
    package?: string;
    arguments: LastInterestTimestampArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lastInterestTimestamp(options: LastInterestTimestampOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'last_interest_timestamp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LastCollectInterestIndexArguments {
    state: RawTransactionArgument<string>;
}
export interface LastCollectInterestIndexOptions {
    package?: string;
    arguments: LastCollectInterestIndexArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lastCollectInterestIndex(options: LastCollectInterestIndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'last_collect_interest_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface StateIdArguments {
    state: RawTransactionArgument<string>;
}
export interface StateIdOptions {
    package?: string;
    arguments: StateIdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function stateId(options: StateIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'state_id',
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
        module: 'py_state',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtRewardDistributorRequiredArguments {
    state: RawTransactionArgument<string>;
}
export interface YtRewardDistributorRequiredOptions {
    package?: string;
    arguments: YtRewardDistributorRequiredArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function ytRewardDistributorRequired(options: YtRewardDistributorRequiredOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'yt_reward_distributor_required',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtRewardDistributorIdArguments {
    state: RawTransactionArgument<string>;
}
export interface YtRewardDistributorIdOptions {
    package?: string;
    arguments: YtRewardDistributorIdArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function ytRewardDistributorId(options: YtRewardDistributorIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'yt_reward_distributor_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtRewardGateOpenArguments {
    state: RawTransactionArgument<string>;
}
export interface YtRewardGateOpenOptions {
    package?: string;
    arguments: YtRewardGateOpenArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function ytRewardGateOpen(options: YtRewardGateOpenOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'yt_reward_gate_open',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface IsExpiredStateArguments {
    state: RawTransactionArgument<string>;
}
export interface IsExpiredStateOptions {
    package?: string;
    arguments: IsExpiredStateArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Return whether the market expiry has passed. */
export function isExpiredState(options: IsExpiredStateOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'py_state',
        function: 'is_expired_state',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}