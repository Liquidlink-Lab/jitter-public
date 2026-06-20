/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * router - user entrypoints that compose Jitter SY/PT/YT flows
 * 
 * The router only orchestrates protocol actions. It starts from SY and stays
 * adapter-agnostic; underlying custody and quoting belong to adapter packages.
 * 
 * Common composed flows:
 * 
 * - mint_py_from_sy
 * - buy_pt / buy_exact_pt / sell_pt / sell_pt_for_exact_sy
 * - buy_yt / buy_exact_yt / sell_yt
 * - add_lp / add_lp_keep_yt / add_lp_from_sy / remove_lp
 * - redeem_before_expiry / redeem_after_expiry / claim_yt_interest
 * 
 * Design principles:
 * 
 * - Router composes, lower modules calculate
 * - Adapter packages handle underlying custody and oracle snapshots
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/jitter::router';
export const RouterMintEvent = new MoveStruct({ name: `${$moduleName}::RouterMintEvent`, fields: {
        user: bcs.Address,
        sy_amount: bcs.u64(),
        py_amount: bcs.u64()
    } });
export const RouterSwapEvent = new MoveStruct({ name: `${$moduleName}::RouterSwapEvent`, fields: {
        user: bcs.Address,
        direction: bcs.u8(),
        amount_in: bcs.u64(),
        amount_out: bcs.u64()
    } });
export const RouterSwapYtEvent = new MoveStruct({ name: `${$moduleName}::RouterSwapYtEvent`, fields: {
        user: bcs.Address,
        sy_amount_in: bcs.u64(),
        yt_amount_out: bcs.u64(),
        sy_amount_out: bcs.u64()
    } });
export const RouterSwapYtForSyEvent = new MoveStruct({ name: `${$moduleName}::RouterSwapYtForSyEvent`, fields: {
        user: bcs.Address,
        yt_amount_in: bcs.u64(),
        sy_amount_out: bcs.u64(),
        sy_amount_repaid: bcs.u64()
    } });
export interface CreatePyPositionArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface CreatePyPositionOptions {
    package?: string;
    arguments: CreatePyPositionArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function createPyPosition(options: CreatePyPositionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'create_py_position',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreateLpPositionArguments {
    market: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface CreateLpPositionOptions {
    package?: string;
    arguments: CreateLpPositionArguments | [
        market: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function createLpPosition(options: CreateLpPositionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["market", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'create_lp_position',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreatePositionArguments {
    state: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface CreatePositionOptions {
    package?: string;
    arguments: CreatePositionArguments | [
        state: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function createPosition(options: CreatePositionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "market", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'create_position',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TransferPositionArguments {
    position: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    recipient: RawTransactionArgument<string>;
}
export interface TransferPositionOptions {
    package?: string;
    arguments: TransferPositionArguments | [
        position: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        recipient: RawTransactionArgument<string>
    ];
}
export function transferPosition(options: TransferPositionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["position", "globalConfig", "recipient"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'transfer_position',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TransferPositionAfterRewardSettlementArguments {
    ytSettlements: RawTransactionArgument<Array<string>>;
    lpSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    recipient: RawTransactionArgument<string>;
}
export interface TransferPositionAfterRewardSettlementOptions {
    package?: string;
    arguments: TransferPositionAfterRewardSettlementArguments | [
        ytSettlements: RawTransactionArgument<Array<string>>,
        lpSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        recipient: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Transfer a non-empty position after its reward-bearing YT and LP legs have been
 * settled for the current owner.
 */
export function transferPositionAfterRewardSettlement(options: TransferPositionAfterRewardSettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        null,
        null,
        null,
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["ytSettlements", "lpSettlements", "distributor", "position", "pyState", "globalConfig", "market", "recipient"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'transfer_position_after_reward_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TransferPyPositionAfterRewardSettlementArguments {
    ytSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    recipient: RawTransactionArgument<string>;
}
export interface TransferPyPositionAfterRewardSettlementOptions {
    package?: string;
    arguments: TransferPyPositionAfterRewardSettlementArguments | [
        ytSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        recipient: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Transfer a PY-only position after its YT reward leg has been settled. */
export function transferPyPositionAfterRewardSettlement(options: TransferPyPositionAfterRewardSettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        null,
        null,
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["ytSettlements", "distributor", "position", "pyState", "globalConfig", "recipient"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'transfer_py_position_after_reward_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TransferLpPositionAfterRewardSettlementArguments {
    lpSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    recipient: RawTransactionArgument<string>;
}
export interface TransferLpPositionAfterRewardSettlementOptions {
    package?: string;
    arguments: TransferLpPositionAfterRewardSettlementArguments | [
        lpSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        recipient: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Transfer an LP-only position after its LP reward leg has been settled. */
export function transferLpPositionAfterRewardSettlement(options: TransferLpPositionAfterRewardSettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        null,
        null,
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["lpSettlements", "distributor", "position", "market", "globalConfig", "recipient"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'transfer_lp_position_after_reward_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssertBeforeArguments {
    globalConfig: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface AssertBeforeOptions {
    package?: string;
    arguments: AssertBeforeArguments | [
        globalConfig: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Guard a frontend-routed PTB by checking the user-supplied deadline.
 * `deadline_ms = 0` means no deadline.
 */
export function assertBefore(options: AssertBeforeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'assert_before',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertCoinMinValueArguments {
    globalConfig: RawTransactionArgument<string>;
    coin: RawTransactionArgument<string>;
    minValue: RawTransactionArgument<number | bigint>;
}
export interface AssertCoinMinValueOptions {
    package?: string;
    arguments: AssertCoinMinValueArguments | [
        globalConfig: RawTransactionArgument<string>,
        coin: RawTransactionArgument<string>,
        minValue: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Guard a frontend-routed PTB by checking an output coin after composed route legs
 * have executed.
 */
export function assertCoinMinValue(options: AssertCoinMinValueOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "coin", "minValue"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'assert_coin_min_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssertCoinMaxValueArguments {
    globalConfig: RawTransactionArgument<string>;
    coin: RawTransactionArgument<string>;
    maxValue: RawTransactionArgument<number | bigint>;
}
export interface AssertCoinMaxValueOptions {
    package?: string;
    arguments: AssertCoinMaxValueArguments | [
        globalConfig: RawTransactionArgument<string>,
        coin: RawTransactionArgument<string>,
        maxValue: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Guard a frontend-routed PTB by checking leftover input does not exceed the
 * caller's expected refund. Useful for exact-out routes.
 */
export function assertCoinMaxValue(options: AssertCoinMaxValueOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "coin", "maxValue"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'assert_coin_max_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AssertPtDeltaAtLeastArguments {
    globalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    initialPtBalance: RawTransactionArgument<number | bigint>;
    minPtDelta: RawTransactionArgument<number | bigint>;
}
export interface AssertPtDeltaAtLeastOptions {
    package?: string;
    arguments: AssertPtDeltaAtLeastArguments | [
        globalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        initialPtBalance: RawTransactionArgument<number | bigint>,
        minPtDelta: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Guard total PT acquired across explicit order fills and AMM legs by comparing
 * the final JitterPosition balance against an off-chain snapshot.
 */
export function assertPtDeltaAtLeast(options: AssertPtDeltaAtLeastOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "position", "initialPtBalance", "minPtDelta"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'assert_pt_delta_at_least',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertYtDeltaAtLeastArguments {
    globalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    initialYtBalance: RawTransactionArgument<number | bigint>;
    minYtDelta: RawTransactionArgument<number | bigint>;
}
export interface AssertYtDeltaAtLeastOptions {
    package?: string;
    arguments: AssertYtDeltaAtLeastArguments | [
        globalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        initialYtBalance: RawTransactionArgument<number | bigint>,
        minYtDelta: RawTransactionArgument<number | bigint>
    ];
}
/** Guard total YT acquired across composed PTB legs. */
export function assertYtDeltaAtLeast(options: AssertYtDeltaAtLeastOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "position", "initialYtBalance", "minYtDelta"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'assert_yt_delta_at_least',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertLpDeltaAtLeastArguments {
    globalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    initialLpAmount: RawTransactionArgument<number | bigint>;
    minLpDelta: RawTransactionArgument<number | bigint>;
}
export interface AssertLpDeltaAtLeastOptions {
    package?: string;
    arguments: AssertLpDeltaAtLeastArguments | [
        globalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        initialLpAmount: RawTransactionArgument<number | bigint>,
        minLpDelta: RawTransactionArgument<number | bigint>
    ];
}
/** Guard total LP acquired across composed deposit legs. */
export function assertLpDeltaAtLeast(options: AssertLpDeltaAtLeastOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "position", "initialLpAmount", "minLpDelta"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'assert_lp_delta_at_least',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MintPyFromSyArguments {
    syCoin: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface MintPyFromSyOptions {
    package?: string;
    arguments: MintPyFromSyArguments | [
        syCoin: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function mintPyFromSy(options: MintPyFromSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["syCoin", "priceInfo", "position", "pyState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'mint_py_from_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MintPyFromSyAfterYtRewardSettlementArguments {
    ytSettlement: RawTransactionArgument<string>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface MintPyFromSyAfterYtRewardSettlementOptions {
    package?: string;
    arguments: MintPyFromSyAfterYtRewardSettlementArguments | [
        ytSettlement: RawTransactionArgument<string>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function mintPyFromSyAfterYtRewardSettlement(options: MintPyFromSyAfterYtRewardSettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["ytSettlement", "distributor", "syCoin", "priceInfo", "position", "pyState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'mint_py_from_sy_after_yt_reward_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BuyPtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    minPtOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface BuyPtOptions {
    package?: string;
    arguments: BuyPtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        minPtOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Unified short entrypoint for `SY -> PT`. Pass an empty `pool_settlements` vector
 * for non-reward pools, or exactly one pool settlement for reward-enabled pools.
 */
export function buyPt(options: BuyPtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        null,
        null,
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "distributor", "syCoin", "minPtOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'buy_pt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BuyExactPtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    ptOut: RawTransactionArgument<number | bigint>;
    maxSyIn: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface BuyExactPtOptions {
    package?: string;
    arguments: BuyExactPtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        ptOut: RawTransactionArgument<number | bigint>,
        maxSyIn: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for exact `PT` out. */
export function buyExactPt(options: BuyExactPtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        null,
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "distributor", "syCoin", "ptOut", "maxSyIn", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'buy_exact_pt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SellPtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    ptAmount: RawTransactionArgument<number | bigint>;
    minSyOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface SellPtOptions {
    package?: string;
    arguments: SellPtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        ptAmount: RawTransactionArgument<number | bigint>,
        minSyOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for `PT -> SY`. */
export function sellPt(options: SellPtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "distributor", "ptAmount", "minSyOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'sell_pt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SellPtForExactSyArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syOut: RawTransactionArgument<number | bigint>;
    maxPtIn: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface SellPtForExactSyOptions {
    package?: string;
    arguments: SellPtForExactSyArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syOut: RawTransactionArgument<number | bigint>,
        maxPtIn: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for exact `SY` out. */
export function sellPtForExactSy(options: SellPtForExactSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "distributor", "syOut", "maxPtIn", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'sell_pt_for_exact_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BuyYtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    ytSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    minYtOut: RawTransactionArgument<number | bigint>;
    minSyOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface BuyYtOptions {
    package?: string;
    arguments: BuyYtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        ytSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        minYtOut: RawTransactionArgument<number | bigint>,
        minSyOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Unified short entrypoint for buying YT. Project-based reward mode requires Pool
 * and YT gates to be enabled together; mixed mode aborts.
 */
export function buyYt(options: BuyYtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        null,
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "ytSettlements", "distributor", "syCoin", "minYtOut", "minSyOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'buy_yt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BuyExactYtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    ytSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    ytOut: RawTransactionArgument<number | bigint>;
    maxSyIn: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface BuyExactYtOptions {
    package?: string;
    arguments: BuyExactYtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        ytSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        ytOut: RawTransactionArgument<number | bigint>,
        maxSyIn: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for exact `YT` out. */
export function buyExactYt(options: BuyExactYtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        null,
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "ytSettlements", "distributor", "syCoin", "ytOut", "maxSyIn", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'buy_exact_yt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SellYtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    ytSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    ytAmount: RawTransactionArgument<number | bigint>;
    minSyOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface SellYtOptions {
    package?: string;
    arguments: SellYtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        ytSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        ytAmount: RawTransactionArgument<number | bigint>,
        minSyOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for selling YT. */
export function sellYt(options: SellYtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "ytSettlements", "distributor", "ytAmount", "minSyOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'sell_yt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AddLpArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    lpSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    ptAmount: RawTransactionArgument<number | bigint>;
    minLpOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface AddLpOptions {
    package?: string;
    arguments: AddLpArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        lpSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        ptAmount: RawTransactionArgument<number | bigint>,
        minLpOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for dual-sided LP add. */
export function addLp(options: AddLpOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        null,
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "lpSettlements", "distributor", "syCoin", "ptAmount", "minLpOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'add_lp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AddLpKeepYtArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    ytSettlements: RawTransactionArgument<Array<string>>;
    lpSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    syToMintHint: RawTransactionArgument<number | bigint>;
    minLpOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface AddLpKeepYtOptions {
    package?: string;
    arguments: AddLpKeepYtArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        ytSettlements: RawTransactionArgument<Array<string>>,
        lpSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        syToMintHint: RawTransactionArgument<number | bigint>,
        minLpOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for single-SY LP add while keeping YT. */
export function addLpKeepYt(options: AddLpKeepYtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        'vector<null>',
        null,
        null,
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "ytSettlements", "lpSettlements", "distributor", "syCoin", "syToMintHint", "minLpOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'add_lp_keep_yt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AddLpFromSyArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    ytSettlements: RawTransactionArgument<Array<string>>;
    lpSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    syCoin: RawTransactionArgument<string>;
    syToMintHint: RawTransactionArgument<number | bigint>;
    minLpOut: RawTransactionArgument<number | bigint>;
    minSyOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface AddLpFromSyOptions {
    package?: string;
    arguments: AddLpFromSyArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        ytSettlements: RawTransactionArgument<Array<string>>,
        lpSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        syCoin: RawTransactionArgument<string>,
        syToMintHint: RawTransactionArgument<number | bigint>,
        minLpOut: RawTransactionArgument<number | bigint>,
        minSyOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for single-SY LP add without keeping YT. */
export function addLpFromSy(options: AddLpFromSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        'vector<null>',
        null,
        null,
        'u64',
        'u64',
        'u64',
        null,
        null,
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "ytSettlements", "lpSettlements", "distributor", "syCoin", "syToMintHint", "minLpOut", "minSyOut", "market", "position", "pyState", "globalConfig", "priceInfo", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'add_lp_from_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RemoveLpArguments {
    poolSettlements: RawTransactionArgument<Array<string>>;
    lpSettlements: RawTransactionArgument<Array<string>>;
    distributor: RawTransactionArgument<string>;
    lpAmount: RawTransactionArgument<number | bigint>;
    minSyOut: RawTransactionArgument<number | bigint>;
    minPtOut: RawTransactionArgument<number | bigint>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    deadlineMs: RawTransactionArgument<number | bigint>;
}
export interface RemoveLpOptions {
    package?: string;
    arguments: RemoveLpArguments | [
        poolSettlements: RawTransactionArgument<Array<string>>,
        lpSettlements: RawTransactionArgument<Array<string>>,
        distributor: RawTransactionArgument<string>,
        lpAmount: RawTransactionArgument<number | bigint>,
        minSyOut: RawTransactionArgument<number | bigint>,
        minPtOut: RawTransactionArgument<number | bigint>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        deadlineMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Unified short entrypoint for LP removal. */
export function removeLp(options: RemoveLpOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'vector<null>',
        'vector<null>',
        null,
        'u64',
        'u64',
        'u64',
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["poolSettlements", "lpSettlements", "distributor", "lpAmount", "minSyOut", "minPtOut", "market", "position", "globalConfig", "deadlineMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'remove_lp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemBeforeExpiryArguments {
    ptAmount: RawTransactionArgument<number | bigint>;
    priceInfo: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface RedeemBeforeExpiryOptions {
    package?: string;
    arguments: RedeemBeforeExpiryArguments | [
        ptAmount: RawTransactionArgument<number | bigint>,
        priceInfo: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Redeem PT and YT for SY before expiry. */
export function redeemBeforeExpiry(options: RedeemBeforeExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'u64',
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["ptAmount", "priceInfo", "position", "pyState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'redeem_before_expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemBeforeExpiryAfterYtRewardSettlementArguments {
    ytSettlement: RawTransactionArgument<string>;
    distributor: RawTransactionArgument<string>;
    ptAmount: RawTransactionArgument<number | bigint>;
    priceInfo: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface RedeemBeforeExpiryAfterYtRewardSettlementOptions {
    package?: string;
    arguments: RedeemBeforeExpiryAfterYtRewardSettlementArguments | [
        ytSettlement: RawTransactionArgument<string>,
        distributor: RawTransactionArgument<string>,
        ptAmount: RawTransactionArgument<number | bigint>,
        priceInfo: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function redeemBeforeExpiryAfterYtRewardSettlement(options: RedeemBeforeExpiryAfterYtRewardSettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["ytSettlement", "distributor", "ptAmount", "priceInfo", "position", "pyState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'redeem_before_expiry_after_yt_reward_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemAfterExpiryArguments {
    ptAmount: RawTransactionArgument<number | bigint>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface RedeemAfterExpiryOptions {
    package?: string;
    arguments: RedeemAfterExpiryArguments | [
        ptAmount: RawTransactionArgument<number | bigint>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Redeem PT for SY after expiry. */
export function redeemAfterExpiry(options: RedeemAfterExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        'u64',
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["ptAmount", "position", "pyState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'redeem_after_expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ClaimYtInterestArguments {
    priceInfoOpt: RawTransactionArgument<string | null>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface ClaimYtInterestOptions {
    package?: string;
    arguments: ClaimYtInterestArguments | [
        priceInfoOpt: RawTransactionArgument<string | null>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Claim accrued YT interest in SY. */
export function claimYtInterest(options: ClaimYtInterestOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        '0x1::option::Option<null>',
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["priceInfoOpt", "position", "pyState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'router',
        function: 'claim_yt_interest',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}