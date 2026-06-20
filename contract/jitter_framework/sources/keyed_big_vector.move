/// keyed_big_vector - sliced vector with O(1) keyed lookup/removal.
///
/// Values are stored densely across dynamic-field slices, while a table maps
/// each key to its current global index. Removal uses swap-remove semantics, so
/// iteration order is not stable.
module jitter_framework::keyed_big_vector;

use std::type_name::{Self, TypeName};
use sui::dynamic_field as df;
use sui::table::{Self, Table};

const E_DUPLICATE_KEY: u64 = 3300;
const E_INDEX_OUT_OF_BOUNDS: u64 = 3301;
const E_INVALID_SLICE_SIZE: u64 = 3302;
const E_KEY_NOT_FOUND: u64 = 3303;
const E_MAX_SLICE_AMOUNT_REACHED: u64 = 3304;
const E_NOT_EMPTY: u64 = 3305;

const MAX_SLICE_AMOUNT: u16 = 1000;
const MAX_SLICE_SIZE: u32 = 262144;

public struct KeyedBigVector has key, store {
    id: UID,
    key_type: TypeName,
    value_type: TypeName,
    slice_idx: u16,
    slice_size: u32,
    length: u64,
}

public struct KeyIndexTableKey() has copy, drop, store;

public struct Slice<K: copy + drop + store, V: store> has store {
    idx: u16,
    vector: vector<Element<K, V>>,
}

public struct Element<K: copy + drop + store, V: store> has store {
    key: K,
    value: V,
}

public fun new<K: copy + drop + store, V: store>(
    slice_size: u32,
    ctx: &mut TxContext,
): KeyedBigVector {
    assert!(slice_size > 0 && slice_size <= MAX_SLICE_SIZE, E_INVALID_SLICE_SIZE);
    let mut id = object::new(ctx);
    df::add(&mut id, KeyIndexTableKey(), table::new<K, u64>(ctx));

    KeyedBigVector {
        id,
        key_type: type_name::with_defining_ids<K>(),
        value_type: type_name::with_defining_ids<V>(),
        slice_idx: 0,
        slice_size,
        length: 0,
    }
}

public fun slice_idx(kbv: &KeyedBigVector): u16 {
    kbv.slice_idx
}

public fun slice_size(kbv: &KeyedBigVector): u32 {
    kbv.slice_size
}

public fun length(kbv: &KeyedBigVector): u64 {
    kbv.length
}

public fun is_empty(kbv: &KeyedBigVector): bool {
    kbv.length == 0
}

public fun contains<K: copy + drop + store>(
    kbv: &KeyedBigVector,
    key: K,
): bool {
    table::contains<K, u64>(key_index_table(kbv), key)
}

public fun push_back<K: copy + drop + store, V: store>(
    kbv: &mut KeyedBigVector,
    key: K,
    value: V,
) {
    assert!(!contains(kbv, key), E_DUPLICATE_KEY);
    let element = Element { key, value };
    if (is_empty(kbv) || length(kbv) % (kbv.slice_size as u64) == 0) {
        kbv.slice_idx = ((length(kbv) / (kbv.slice_size as u64)) as u16);
        assert!(kbv.slice_idx < MAX_SLICE_AMOUNT, E_MAX_SLICE_AMOUNT_REACHED);
        df::add(
            &mut kbv.id,
            kbv.slice_idx,
            Slice {
                idx: kbv.slice_idx,
                vector: vector[element],
            },
        );
    } else {
        let slice_idx = kbv.slice_idx;
        let slice = borrow_slice_mut_(kbv, slice_idx);
        vector::push_back(&mut slice.vector, element);
    };
    let index = kbv.length;
    table::add(key_index_table_mut(kbv), key, index);
    kbv.length = kbv.length + 1;
}

public fun pop_back<K: copy + drop + store, V: store>(
    kbv: &mut KeyedBigVector,
): (K, V) {
    assert!(!is_empty(kbv), E_INDEX_OUT_OF_BOUNDS);

    let slice_idx = kbv.slice_idx;
    let Element { key, value } = {
        let slice = borrow_slice_mut_(kbv, slice_idx);
        vector::pop_back(&mut slice.vector)
    };
    table::remove<K, u64>(key_index_table_mut(kbv), key);
    kbv.length = kbv.length - 1;
    trim_slice<K, V>(kbv);

    (key, value)
}

public fun borrow_slice<K: copy + drop + store, V: store>(
    kbv: &KeyedBigVector,
    slice_idx: u16,
): &Slice<K, V> {
    assert!(!is_empty(kbv) && slice_idx <= kbv.slice_idx, E_INDEX_OUT_OF_BOUNDS);
    borrow_slice_(kbv, slice_idx)
}

public fun borrow_slice_mut<K: copy + drop + store, V: store>(
    kbv: &mut KeyedBigVector,
    slice_idx: u16,
): &mut Slice<K, V> {
    assert!(!is_empty(kbv) && slice_idx <= kbv.slice_idx, E_INDEX_OUT_OF_BOUNDS);
    borrow_slice_mut_(kbv, slice_idx)
}

public fun borrow<K: copy + drop + store, V: store>(
    kbv: &KeyedBigVector,
    i: u64,
): (K, &V) {
    assert!(i < kbv.length, E_INDEX_OUT_OF_BOUNDS);
    borrow_(kbv, i)
}

#[syntax(index)]
public fun borrow_by_key<K: copy + drop + store, V: store>(
    kbv: &KeyedBigVector,
    key: K,
): &V {
    assert!(contains(kbv, key), E_KEY_NOT_FOUND);
    let i = *table::borrow<K, u64>(key_index_table(kbv), key);
    let (_, value) = borrow_<K, V>(kbv, i);
    value
}

public fun borrow_from_slice<K: copy + drop + store, V: store>(
    slice: &Slice<K, V>,
    i: u64,
): (K, &V) {
    assert!(i < vector::length(&slice.vector), E_INDEX_OUT_OF_BOUNDS);
    let element = vector::borrow(&slice.vector, i);
    (element.key, &element.value)
}

public fun swap_remove<K: copy + drop + store, V: store>(
    kbv: &mut KeyedBigVector,
    i: u64,
): (K, V) {
    assert!(i < kbv.length, E_INDEX_OUT_OF_BOUNDS);
    let last_index = kbv.length - 1;
    if (i == last_index) {
        return pop_back(kbv)
    };

    let target_slice_idx = ((i / (kbv.slice_size as u64)) as u16);
    let target_local_idx = i % (kbv.slice_size as u64);
    let last_slice_idx = ((last_index / (kbv.slice_size as u64)) as u16);

    let (removed_key, removed_value, moved_key) =
        if (target_slice_idx == last_slice_idx) {
            let (removed_key, removed_value, moved_key) = {
                let slice = borrow_slice_mut_(kbv, target_slice_idx);
                let Element { key: removed_key, value: removed_value } =
                    vector::swap_remove(&mut slice.vector, target_local_idx);
                let moved_key =
                    if (target_local_idx < vector::length(&slice.vector)) {
                        vector::borrow(&slice.vector, target_local_idx).key
                    } else {
                        removed_key
                    };
                (removed_key, removed_value, moved_key)
            };
            (removed_key, removed_value, moved_key)
        } else {
            let Element { key: moved_key, value: moved_value } = {
                let last_slice = borrow_slice_mut_(kbv, last_slice_idx);
                vector::pop_back(&mut last_slice.vector)
            };
            let (removed_key, removed_value) = {
                let target_slice = borrow_slice_mut_(kbv, target_slice_idx);
                vector::push_back(
                    &mut target_slice.vector,
                    Element { key: moved_key, value: moved_value },
                );
                let Element { key: removed_key, value: removed_value } =
                    vector::swap_remove(&mut target_slice.vector, target_local_idx);
                (removed_key, removed_value)
            };
            (removed_key, removed_value, moved_key)
        };

    *table::borrow_mut<K, u64>(key_index_table_mut(kbv), moved_key) = i;
    table::remove<K, u64>(key_index_table_mut(kbv), removed_key);
    kbv.length = kbv.length - 1;
    trim_slice<K, V>(kbv);

    (removed_key, removed_value)
}

public fun swap_remove_by_key<K: copy + drop + store, V: store>(
    kbv: &mut KeyedBigVector,
    key: K,
): V {
    assert!(contains(kbv, key), E_KEY_NOT_FOUND);
    let i = *table::borrow<K, u64>(key_index_table(kbv), key);
    let (_, value) = swap_remove<K, V>(kbv, i);
    value
}

public fun destroy_empty<K: copy + drop + store>(kbv: KeyedBigVector) {
    let KeyedBigVector {
        id,
        key_type: _,
        value_type: _,
        slice_idx: _,
        slice_size: _,
        length,
    } = kbv;
    assert!(length == 0, E_NOT_EMPTY);

    let mut id = id;
    let key_table = df::remove<KeyIndexTableKey, Table<K, u64>>(
        &mut id,
        KeyIndexTableKey(),
    );
    table::destroy_empty(key_table);
    object::delete(id);
}

fun key_index_table<K: copy + drop + store>(kbv: &KeyedBigVector): &Table<K, u64> {
    df::borrow<KeyIndexTableKey, Table<K, u64>>(&kbv.id, KeyIndexTableKey())
}

fun key_index_table_mut<K: copy + drop + store>(
    kbv: &mut KeyedBigVector,
): &mut Table<K, u64> {
    df::borrow_mut<KeyIndexTableKey, Table<K, u64>>(&mut kbv.id, KeyIndexTableKey())
}

fun borrow_<K: copy + drop + store, V: store>(
    kbv: &KeyedBigVector,
    i: u64,
): (K, &V) {
    let slice = borrow_slice_(kbv, ((i / (kbv.slice_size as u64)) as u16));
    let element = vector::borrow(&slice.vector, i % (kbv.slice_size as u64));
    (element.key, &element.value)
}

fun borrow_slice_<K: copy + drop + store, V: store>(
    kbv: &KeyedBigVector,
    slice_idx: u16,
): &Slice<K, V> {
    df::borrow<u16, Slice<K, V>>(&kbv.id, slice_idx)
}

fun borrow_slice_mut_<K: copy + drop + store, V: store>(
    kbv: &mut KeyedBigVector,
    slice_idx: u16,
): &mut Slice<K, V> {
    df::borrow_mut<u16, Slice<K, V>>(&mut kbv.id, slice_idx)
}

fun trim_slice<K: copy + drop + store, V: store>(kbv: &mut KeyedBigVector) {
    if (kbv.length == 0) {
        remove_empty_slice<K, V>(kbv);
    } else {
        let slice = borrow_slice_<K, V>(kbv, kbv.slice_idx);
        if (vector::is_empty(&slice.vector)) {
            remove_empty_slice<K, V>(kbv);
            kbv.slice_idx = kbv.slice_idx - 1;
        };
    };
}

fun remove_empty_slice<K: copy + drop + store, V: store>(kbv: &mut KeyedBigVector) {
    let Slice { idx: _, vector: elements } = df::remove<u16, Slice<K, V>>(
        &mut kbv.id,
        kbv.slice_idx,
    );
    vector::destroy_empty(elements);
}

#[test]
fun push_borrow_and_swap_remove_across_slices() {
    let ctx = &mut tx_context::dummy();
    let mut kbv = new<u64, u64>(2, ctx);
    push_back(&mut kbv, 10u64, 100u64);
    push_back(&mut kbv, 20u64, 200u64);
    push_back(&mut kbv, 30u64, 300u64);

    assert!(length(&kbv) == 3, 0);
    assert!(contains(&kbv, 20u64), 1);
    let (_, value_0) = borrow<u64, u64>(&kbv, 0);
    assert!(*value_0 == 100, 2);
    assert!(*borrow_by_key<u64, u64>(&kbv, 30) == 300, 3);

    let removed = swap_remove_by_key<u64, u64>(&mut kbv, 10);
    assert!(removed == 100, 4);
    assert!(length(&kbv) == 2, 5);
    assert!(!contains(&kbv, 10u64), 6);
    assert!(contains(&kbv, 30u64), 7);
    assert!(*borrow_by_key<u64, u64>(&kbv, 30) == 300, 8);

    let (_, last) = pop_back<u64, u64>(&mut kbv);
    assert!(last == 200 || last == 300, 9);
    let (_, final_value) = pop_back<u64, u64>(&mut kbv);
    assert!(final_value == 200 || final_value == 300, 10);
    destroy_empty<u64>(kbv);
}
