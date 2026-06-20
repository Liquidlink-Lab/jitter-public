/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * keyed_big_vector - sliced vector with O(1) keyed lookup/removal.
 * 
 * Values are stored densely across dynamic-field slices, while a table maps each
 * key to its current global index. Removal uses swap-remove semantics, so
 * iteration order is not stable.
 */

import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/std/type_name.js';
import * as type_name_1 from './deps/std/type_name.js';
const $moduleName = 'jitter/jitter-framework::keyed_big_vector';
export const KeyedBigVector = new MoveStruct({ name: `${$moduleName}::KeyedBigVector`, fields: {
        id: bcs.Address,
        key_type: type_name.TypeName,
        value_type: type_name_1.TypeName,
        slice_idx: bcs.u16(),
        slice_size: bcs.u32(),
        length: bcs.u64()
    } });
export const KeyIndexTableKey = new MoveTuple({ name: `${$moduleName}::KeyIndexTableKey`, fields: [bcs.bool()] });
export function Element<K extends BcsType<any>, V extends BcsType<any>>(...typeParameters: [
    K,
    V
]) {
    return new MoveStruct({ name: `${$moduleName}::Element<${typeParameters[0].name as K['name']}, ${typeParameters[1].name as V['name']}>`, fields: {
            key: typeParameters[0],
            value: typeParameters[1]
        } });
}
export function Slice<K extends BcsType<any>, V extends BcsType<any>>(...typeParameters: [
    K,
    V
]) {
    return new MoveStruct({ name: `${$moduleName}::Slice<${typeParameters[0].name as K['name']}, ${typeParameters[1].name as V['name']}>`, fields: {
            idx: bcs.u16(),
            vector: bcs.vector(Element(typeParameters[0], typeParameters[1]))
        } });
}
export interface NewArguments {
    sliceSize: RawTransactionArgument<number>;
}
export interface NewOptions {
    package?: string;
    arguments: NewArguments | [
        sliceSize: RawTransactionArgument<number>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function _new(options: NewOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["sliceSize"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'new',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SliceIdxArguments {
    kbv: RawTransactionArgument<string>;
}
export interface SliceIdxOptions {
    package?: string;
    arguments: SliceIdxArguments | [
        kbv: RawTransactionArgument<string>
    ];
}
export function sliceIdx(options: SliceIdxOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["kbv"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'slice_idx',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SliceSizeArguments {
    kbv: RawTransactionArgument<string>;
}
export interface SliceSizeOptions {
    package?: string;
    arguments: SliceSizeArguments | [
        kbv: RawTransactionArgument<string>
    ];
}
export function sliceSize(options: SliceSizeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["kbv"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'slice_size',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LengthArguments {
    kbv: RawTransactionArgument<string>;
}
export interface LengthOptions {
    package?: string;
    arguments: LengthArguments | [
        kbv: RawTransactionArgument<string>
    ];
}
export function length(options: LengthOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["kbv"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'length',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsEmptyArguments {
    kbv: RawTransactionArgument<string>;
}
export interface IsEmptyOptions {
    package?: string;
    arguments: IsEmptyArguments | [
        kbv: RawTransactionArgument<string>
    ];
}
export function isEmpty(options: IsEmptyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["kbv"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'is_empty',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ContainsArguments<K extends BcsType<any>> {
    kbv: RawTransactionArgument<string>;
    key: RawTransactionArgument<K>;
}
export interface ContainsOptions<K extends BcsType<any>> {
    package?: string;
    arguments: ContainsArguments<K> | [
        kbv: RawTransactionArgument<string>,
        key: RawTransactionArgument<K>
    ];
    typeArguments: [
        string
    ];
}
export function contains<K extends BcsType<any>>(options: ContainsOptions<K>) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "key"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'contains',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PushBackArguments<K extends BcsType<any>, V extends BcsType<any>> {
    kbv: RawTransactionArgument<string>;
    key: RawTransactionArgument<K>;
    value: RawTransactionArgument<V>;
}
export interface PushBackOptions<K extends BcsType<any>, V extends BcsType<any>> {
    package?: string;
    arguments: PushBackArguments<K, V> | [
        kbv: RawTransactionArgument<string>,
        key: RawTransactionArgument<K>,
        value: RawTransactionArgument<V>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function pushBack<K extends BcsType<any>, V extends BcsType<any>>(options: PushBackOptions<K, V>) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        `${options.typeArguments[0]}`,
        `${options.typeArguments[1]}`
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "key", "value"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'push_back',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PopBackArguments {
    kbv: RawTransactionArgument<string>;
}
export interface PopBackOptions {
    package?: string;
    arguments: PopBackArguments | [
        kbv: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function popBack(options: PopBackOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["kbv"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'pop_back',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowSliceArguments {
    kbv: RawTransactionArgument<string>;
    sliceIdx: RawTransactionArgument<number>;
}
export interface BorrowSliceOptions {
    package?: string;
    arguments: BorrowSliceArguments | [
        kbv: RawTransactionArgument<string>,
        sliceIdx: RawTransactionArgument<number>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowSlice(options: BorrowSliceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        'u16'
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "sliceIdx"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'borrow_slice',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowSliceMutArguments {
    kbv: RawTransactionArgument<string>;
    sliceIdx: RawTransactionArgument<number>;
}
export interface BorrowSliceMutOptions {
    package?: string;
    arguments: BorrowSliceMutArguments | [
        kbv: RawTransactionArgument<string>,
        sliceIdx: RawTransactionArgument<number>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowSliceMut(options: BorrowSliceMutOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        'u16'
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "sliceIdx"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'borrow_slice_mut',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowArguments {
    kbv: RawTransactionArgument<string>;
    i: RawTransactionArgument<number | bigint>;
}
export interface BorrowOptions {
    package?: string;
    arguments: BorrowArguments | [
        kbv: RawTransactionArgument<string>,
        i: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrow(options: BorrowOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "i"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'borrow',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowByKeyArguments<K extends BcsType<any>> {
    kbv: RawTransactionArgument<string>;
    key: RawTransactionArgument<K>;
}
export interface BorrowByKeyOptions<K extends BcsType<any>> {
    package?: string;
    arguments: BorrowByKeyArguments<K> | [
        kbv: RawTransactionArgument<string>,
        key: RawTransactionArgument<K>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowByKey<K extends BcsType<any>>(options: BorrowByKeyOptions<K>) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "key"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'borrow_by_key',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowFromSliceArguments {
    slice: RawTransactionArgument<string>;
    i: RawTransactionArgument<number | bigint>;
}
export interface BorrowFromSliceOptions {
    package?: string;
    arguments: BorrowFromSliceArguments | [
        slice: RawTransactionArgument<string>,
        i: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowFromSlice(options: BorrowFromSliceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["slice", "i"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'borrow_from_slice',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SwapRemoveArguments {
    kbv: RawTransactionArgument<string>;
    i: RawTransactionArgument<number | bigint>;
}
export interface SwapRemoveOptions {
    package?: string;
    arguments: SwapRemoveArguments | [
        kbv: RawTransactionArgument<string>,
        i: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function swapRemove(options: SwapRemoveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "i"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'swap_remove',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SwapRemoveByKeyArguments<K extends BcsType<any>> {
    kbv: RawTransactionArgument<string>;
    key: RawTransactionArgument<K>;
}
export interface SwapRemoveByKeyOptions<K extends BcsType<any>> {
    package?: string;
    arguments: SwapRemoveByKeyArguments<K> | [
        kbv: RawTransactionArgument<string>,
        key: RawTransactionArgument<K>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function swapRemoveByKey<K extends BcsType<any>>(options: SwapRemoveByKeyOptions<K>) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["kbv", "key"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'swap_remove_by_key',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DestroyEmptyArguments {
    kbv: RawTransactionArgument<string>;
}
export interface DestroyEmptyOptions {
    package?: string;
    arguments: DestroyEmptyArguments | [
        kbv: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function destroyEmpty(options: DestroyEmptyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-framework';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["kbv"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'keyed_big_vector',
        function: 'destroy_empty',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}