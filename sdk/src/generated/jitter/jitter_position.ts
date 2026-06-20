/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * jitter_position - unified user position object.
 * 
 * A `JitterPosition` owns both the PT/YT leg and the LP leg for one market. The
 * legs stay separated inside the object so PY accounting and LP accounting can
 * mutate independently without forcing unrelated reward settlement.
 */

import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/jitter::jitter_position';
export const PyLeg = new MoveStruct({ name: `${$moduleName}::PyLeg`, fields: {
        pt_balance: bcs.u64(),
        yt_balance: bcs.u64(),
        yt_reward_guard: bcs.u64(),
        index: bcs.u128(),
        py_index: bcs.u128(),
        accrued: bcs.u128()
    } });
export const LpLeg = new MoveStruct({ name: `${$moduleName}::LpLeg`, fields: {
        pool_id: bcs.Address,
        lp_amount: bcs.u64(),
        lp_reward_guard: bcs.u64()
    } });
export const JitterPosition = new MoveStruct({ name: `${$moduleName}::JitterPosition`, fields: {
        id: bcs.Address,
        py_state_id: bcs.Address,
        market_id: bcs.Address,
        expiry: bcs.u64(),
        created_at: bcs.u64(),
        py: PyLeg,
        lp: LpLeg
    } });
export const PositionCreatedEvent = new MoveStruct({ name: `${$moduleName}::PositionCreatedEvent`, fields: {
        position_id: bcs.Address,
        py_state_id: bcs.Address,
        market_id: bcs.Address,
        pool_id: bcs.Address,
        expiry: bcs.u64(),
        owner: bcs.Address
    } });
export const BurnPtEvent = new MoveStruct({ name: `${$moduleName}::BurnPtEvent`, fields: {
        position_id: bcs.Address,
        amount: bcs.u64()
    } });
export const BurnYtEvent = new MoveStruct({ name: `${$moduleName}::BurnYtEvent`, fields: {
        position_id: bcs.Address,
        amount: bcs.u64()
    } });
export const RedeemPtEvent = new MoveStruct({ name: `${$moduleName}::RedeemPtEvent`, fields: {
        position_id: bcs.Address,
        amount: bcs.u64()
    } });
export const RedeemYtEvent = new MoveStruct({ name: `${$moduleName}::RedeemYtEvent`, fields: {
        position_id: bcs.Address,
        amount: bcs.u64()
    } });
export const LpRewardGateKey = new MoveTuple({ name: `${$moduleName}::LpRewardGateKey`, fields: [bcs.bool()] });
export const LpRewardMutation = new MoveStruct({ name: `${$moduleName}::LpRewardMutation`, fields: {
        position_id: bcs.Address,
        distributor_id: bcs.Address
    } });
export interface NoneIdOptions {
    package?: string;
    arguments?: [
    ];
}
export function noneId(options: NoneIdOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'none_id',
    });
}
export interface DestroyEmptyArguments {
    position: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface DestroyEmptyOptions {
    package?: string;
    arguments: DestroyEmptyArguments | [
        position: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
}
export function destroyEmpty(options: DestroyEmptyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'destroy_empty',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IdArguments {
    position: RawTransactionArgument<string>;
}
export interface IdOptions {
    package?: string;
    arguments: IdArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function id(options: IdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PyStateIdArguments {
    position: RawTransactionArgument<string>;
}
export interface PyStateIdOptions {
    package?: string;
    arguments: PyStateIdArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function pyStateId(options: PyStateIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'py_state_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MarketIdArguments {
    position: RawTransactionArgument<string>;
}
export interface MarketIdOptions {
    package?: string;
    arguments: MarketIdArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function marketId(options: MarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ExpiryArguments {
    position: RawTransactionArgument<string>;
}
export interface ExpiryOptions {
    package?: string;
    arguments: ExpiryArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function expiry(options: ExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreatedAtArguments {
    position: RawTransactionArgument<string>;
}
export interface CreatedAtOptions {
    package?: string;
    arguments: CreatedAtArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function createdAt(options: CreatedAtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'created_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PtBalanceArguments {
    position: RawTransactionArgument<string>;
}
export interface PtBalanceOptions {
    package?: string;
    arguments: PtBalanceArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function ptBalance(options: PtBalanceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'pt_balance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtBalanceArguments {
    position: RawTransactionArgument<string>;
}
export interface YtBalanceOptions {
    package?: string;
    arguments: YtBalanceArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function ytBalance(options: YtBalanceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'yt_balance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtRewardGuardArguments {
    position: RawTransactionArgument<string>;
}
export interface YtRewardGuardOptions {
    package?: string;
    arguments: YtRewardGuardArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function ytRewardGuard(options: YtRewardGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'yt_reward_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IndexArguments {
    position: RawTransactionArgument<string>;
}
export interface IndexOptions {
    package?: string;
    arguments: IndexArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function index(options: IndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PyIndexArguments {
    position: RawTransactionArgument<string>;
}
export interface PyIndexOptions {
    package?: string;
    arguments: PyIndexArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function pyIndex(options: PyIndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'py_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AccruedArguments {
    position: RawTransactionArgument<string>;
}
export interface AccruedOptions {
    package?: string;
    arguments: AccruedArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function accrued(options: AccruedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'accrued',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsPyEmptyArguments {
    position: RawTransactionArgument<string>;
}
export interface IsPyEmptyOptions {
    package?: string;
    arguments: IsPyEmptyArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function isPyEmpty(options: IsPyEmptyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'is_py_empty',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PoolIdArguments {
    position: RawTransactionArgument<string>;
}
export interface PoolIdOptions {
    package?: string;
    arguments: PoolIdArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function poolId(options: PoolIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'pool_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LpAmountArguments {
    position: RawTransactionArgument<string>;
}
export interface LpAmountOptions {
    package?: string;
    arguments: LpAmountArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function lpAmount(options: LpAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'lp_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LpRewardGuardArguments {
    position: RawTransactionArgument<string>;
}
export interface LpRewardGuardOptions {
    package?: string;
    arguments: LpRewardGuardArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function lpRewardGuard(options: LpRewardGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'lp_reward_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsLpEmptyArguments {
    position: RawTransactionArgument<string>;
}
export interface IsLpEmptyOptions {
    package?: string;
    arguments: IsLpEmptyArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function isLpEmpty(options: IsLpEmptyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'is_lp_empty',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BurnPtInArguments {
    ptCoin: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    expectedStateId: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface BurnPtInOptions {
    package?: string;
    arguments: BurnPtInArguments | [
        ptCoin: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        expectedStateId: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function burnPtIn(options: BurnPtInOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::object::ID',
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["ptCoin", "position", "expectedStateId", "globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'burn_pt_in',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemPtOutArguments {
    amount: RawTransactionArgument<number | bigint>;
    position: RawTransactionArgument<string>;
    expectedStateId: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface RedeemPtOutOptions {
    package?: string;
    arguments: RedeemPtOutArguments | [
        amount: RawTransactionArgument<number | bigint>,
        position: RawTransactionArgument<string>,
        expectedStateId: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function redeemPtOut(options: RedeemPtOutOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'u64',
        null,
        '0x2::object::ID',
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["amount", "position", "expectedStateId", "globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'redeem_pt_out',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RewardGateOpenArguments {
    position: RawTransactionArgument<string>;
}
export interface RewardGateOpenOptions {
    package?: string;
    arguments: RewardGateOpenArguments | [
        position: RawTransactionArgument<string>
    ];
}
export function rewardGateOpen(options: RewardGateOpenOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'reward_gate_open',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertStateMatchArguments {
    position: RawTransactionArgument<string>;
    expectedStateId: RawTransactionArgument<string>;
}
export interface AssertStateMatchOptions {
    package?: string;
    arguments: AssertStateMatchArguments | [
        position: RawTransactionArgument<string>,
        expectedStateId: RawTransactionArgument<string>
    ];
}
export function assertStateMatch(options: AssertStateMatchOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["position", "expectedStateId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'assert_state_match',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertPoolMatchArguments {
    position: RawTransactionArgument<string>;
    expectedPoolId: RawTransactionArgument<string>;
}
export interface AssertPoolMatchOptions {
    package?: string;
    arguments: AssertPoolMatchArguments | [
        position: RawTransactionArgument<string>,
        expectedPoolId: RawTransactionArgument<string>
    ];
}
export function assertPoolMatch(options: AssertPoolMatchOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["position", "expectedPoolId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'jitter_position',
        function: 'assert_pool_match',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}