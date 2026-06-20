/// amm_math - Pendle-style AMM curve math used by Jitter pools.
///
/// This module consolidates the pool math needed for logit-style pricing,
/// exact-in / exact-out quotes, LP math, and binary-search helpers.
///
/// Core pricing relationships:
///   proportion     = p = total_pt / (total_pt + total_sy_asset)
///   log_proportion = ln(p / (1 - p))
///   exchange_rate  = log_proportion / rate_scalar + rate_anchor
///
/// Time-adjusted parameters:
///   rate_scalar = scalar_root * YEAR_MS / time_to_expiry
///   rate_anchor = exchange_rate_from_implied_rate
///                 - log_proportion / rate_scalar
///
/// Signed values are represented with a `(value, sign)` pair; unsigned values
/// are stored as raw FP64 `u128`.
module jitter::amm_math {
    use jitter_math::fixed_point64::{Self, FixedPoint64};
    use jitter_math::fixed_point64_with_sign::{Self, FixedPoint64WithSign};
    use jitter_math::full_math_u128;
    use jitter_math::sqrt;

    // ===========================================
    //  Constants
    // ===========================================

    /// FP64 representation of 1.0.
    const FP64_ONE: u128 = 1 << 64;

    /// Milliseconds in one 365-day year.
    const YEAR_MS: u64 = 31_536_000_000;

    /// Maximum proportion limit (96%) to avoid extreme pool imbalance.
    const MAX_PROPORTION_NUM: u128 = 96;
    const MAX_PROPORTION_DENOM: u128 = 100;
    const MAX_EXACT_IN_SEARCH_ITERATIONS: u64 = 64;

    // ===========================================
    //  Error Codes
    // ===========================================

    const E_EXCHANGE_RATE_BELOW_ONE: u64 = 1401;
    const E_PROPORTION_TOO_HIGH: u64 = 1402;
    const E_PROPORTION_IS_ONE: u64 = 1403;
    const E_RATE_SCALAR_NEGATIVE: u64 = 1404;
    const E_DIVISION_BY_ZERO: u64 = 1405;
    const E_TIME_TO_EXPIRY_ZERO: u64 = 1406;
    const E_INVALID_SY_INDEX: u64 = 1407;

    // ===========================================
    // Signed Fixed-Point Compatibility Layer
    // ===========================================

    /// Signed FP64 wrapper used by Jitter-facing APIs.
    public struct SignedFP64 has copy, drop, store {
        value: u128,
        is_positive: bool,
    }

    public fun signed_new(value: u128, is_positive: bool): SignedFP64 {
        from_math(
            fixed_point64_with_sign::create_from_raw_value(value, is_positive),
        )
    }

    public fun signed_zero(): SignedFP64 {
        from_math(fixed_point64_with_sign::zero())
    }

    public fun signed_one(): SignedFP64 {
        from_math(fixed_point64_with_sign::one())
    }

    public fun signed_from_unsigned(v: u128): SignedFP64 {
        from_math(fixed_point64_with_sign::create_from_raw_value(v, true))
    }

    public fun signed_value(s: &SignedFP64): u128 { s.value }
    public fun signed_is_positive(s: &SignedFP64): bool { s.is_positive }

    public fun signed_add(a: SignedFP64, b: SignedFP64): SignedFP64 {
        from_math(
            fixed_point64_with_sign::add(to_math(a), to_math(b)),
        )
    }

    public fun signed_sub(a: SignedFP64, b: SignedFP64): SignedFP64 {
        from_math(
            fixed_point64_with_sign::sub(to_math(a), to_math(b)),
        )
    }

    public fun signed_mul(a: SignedFP64, b: SignedFP64): SignedFP64 {
        from_math(
            fixed_point64_with_sign::mul(to_math(a), to_math(b)),
        )
    }

    public fun signed_div(a: SignedFP64, b: SignedFP64): SignedFP64 {
        assert!(b.value > 0, E_DIVISION_BY_ZERO);
        from_math(
            fixed_point64_with_sign::div(to_math(a), to_math(b)),
        )
    }

    public fun signed_ge(a: &SignedFP64, b: &SignedFP64): bool {
        fixed_point64_with_sign::greater_or_equal(to_math(*a), to_math(*b))
    }

    public fun signed_lt(a: &SignedFP64, b: &SignedFP64): bool {
        fixed_point64_with_sign::less(to_math(*a), to_math(*b))
    }

    // ===========================================
    // Core AMM Math
    // ===========================================

    /// Convert raw SY units into asset units using the current FP64 SY index.
    public fun sy_to_asset_amount(sy_amount: u64, sy_index_raw: u128): u64 {
        assert!(sy_index_raw > 0, E_INVALID_SY_INDEX);
        full_math_u128::mul_div_floor(
            sy_amount as u128,
            sy_index_raw,
            FP64_ONE,
        ) as u64
    }

    /// Convert asset units into raw SY units, rounding down.
    public fun asset_to_sy_amount_floor(asset_amount: u64, sy_index_raw: u128): u64 {
        assert!(sy_index_raw > 0, E_INVALID_SY_INDEX);
        full_math_u128::mul_div_floor(
            asset_amount as u128,
            FP64_ONE,
            sy_index_raw,
        ) as u64
    }

    /// Convert asset units into raw SY units, rounding up.
    public fun asset_to_sy_amount_ceil(asset_amount: u64, sy_index_raw: u128): u64 {
        assert!(sy_index_raw > 0, E_INVALID_SY_INDEX);
        full_math_u128::mul_div_ceil(
            asset_amount as u128,
            FP64_ONE,
            sy_index_raw,
        ) as u64
    }

    /// Compute the time-adjusted `rate_scalar`.
    public fun get_rate_scalar(scalar_root: SignedFP64, time_to_expiry_ms: u64): SignedFP64 {
        assert!(time_to_expiry_ms > 0, E_TIME_TO_EXPIRY_ZERO);
        let year_fp = signed_new((YEAR_MS as u128) * FP64_ONE, true);
        let time_fp = signed_new((time_to_expiry_ms as u128) * FP64_ONE, true);
        let result = signed_mul(
            scalar_root,
            signed_div(year_fp, time_fp),
        );
        assert!(result.is_positive, E_RATE_SCALAR_NEGATIVE);
        result
    }

    /// Compute the Pendle-style pool proportion.
    public fun calc_proportion(
        total_pt: SignedFP64,
        total_sy_asset: SignedFP64,
    ): SignedFP64 {
        calc_trade_proportion(total_pt, total_sy_asset, signed_zero())
    }

    /// Compute `ln(p / (1 - p))`.
    public fun log_proportion(proportion: SignedFP64): SignedFP64 {
        let one = signed_one();
        assert!(proportion.value != one.value || !proportion.is_positive, E_PROPORTION_IS_ONE);
        let numerator = proportion;
        let denominator = signed_sub(one, proportion);
        let ratio = signed_div(numerator, denominator);
        from_math(
            fixed_point64_with_sign::ln(to_math(ratio)),
        )
    }

    fun try_get_exchange_rate(
        total_pt: u64,
        total_sy_asset: u64,
        rate_scalar: SignedFP64,
        rate_anchor: SignedFP64,
        net_pt_to_account: SignedFP64,
    ): (bool, SignedFP64) {
        let pt_fp = amount_to_fp(total_pt, true);
        let sy_fp = amount_to_fp(total_sy_asset, true);
        let proportion = calc_trade_proportion(pt_fp, sy_fp, net_pt_to_account);
        let log_prop = log_proportion(proportion);
        let rate = signed_add(
            signed_div(log_prop, rate_scalar),
            rate_anchor,
        );
        if (!signed_ge(&rate, &signed_one())) {
            return (false, signed_zero())
        };
        (true, rate)
    }

    /// Compute the exchange rate for the post-trade pool state.
    public fun get_exchange_rate(
        total_pt: u64,
        total_sy_asset: u64,
        rate_scalar: SignedFP64,
        rate_anchor: SignedFP64,
        net_pt_to_account: SignedFP64,
    ): SignedFP64 {
        let (is_valid, rate) = try_get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            net_pt_to_account,
        );
        // Exchange rate must stay above or equal to 1.0.
        assert!(is_valid, E_EXCHANGE_RATE_BELOW_ONE);
        rate
    }

    /// Convert implied rate into exchange rate using `exp()`.
    public fun get_exchange_rate_from_implied_rate(
        implied_rate_raw: u128,
        time_to_expiry_ms: u64,
    ): SignedFP64 {
        let x_raw = full_math_u128::mul_div_floor(
            implied_rate_raw,
            time_to_expiry_ms as u128,
            YEAR_MS as u128,
        );
        from_math(
            fixed_point64_with_sign::exp(
                fixed_point64_with_sign::create_from_raw_value(x_raw, true),
            ),
        )
    }

    /// Compute `rate_anchor`.
    public fun get_rate_anchor(
        total_pt: u64,
        total_sy_asset: u64,
        rate_scalar: SignedFP64,
        last_implied_rate_raw: u128,
        time_to_expiry_ms: u64,
    ): SignedFP64 {
        let proportion = calc_proportion(
            amount_to_fp(total_pt, true),
            amount_to_fp(total_sy_asset, true),
        );
        let log_prop = log_proportion(proportion);
        let er = get_exchange_rate_from_implied_rate(
            last_implied_rate_raw,
            time_to_expiry_ms,
        );
        signed_sub(er, signed_div(log_prop, rate_scalar))
    }

    /// Compute the current market `ln(implied_rate)`.
    public fun get_ln_implied_rate(
        total_pt: u64,
        total_sy_asset: u64,
        rate_scalar: SignedFP64,
        rate_anchor: SignedFP64,
        time_to_expiry_ms: u64,
    ): FixedPoint64 {
        let exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            signed_zero(),
        );
        let ln_rate = fixed_point64_with_sign::ln(to_math(exchange_rate));
        fixed_point64::create_from_raw_value(
            full_math_u128::mul_div_floor(
                fixed_point64_with_sign::get_raw_value(ln_rate),
                YEAR_MS as u128,
                time_to_expiry_ms as u128,
            ),
        )
    }

    /// Seed the first `ln(implied_rate)` from `initial_anchor` at pool bootstrap.
    public fun get_initial_ln_implied_rate(
        total_pt: u64,
        total_sy_asset: u64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        time_to_expiry_ms: u64,
    ): FixedPoint64 {
        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        get_ln_implied_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            from_math(initial_anchor),
            time_to_expiry_ms,
        )
    }

    public fun quote_exact_pt_for_sy(
        total_pt: u64,
        total_sy_asset: u64,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        pt_in: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, FixedPoint64) {
        if (pt_in == 0 || total_pt == 0 || total_sy_asset == 0) {
            return (0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);
        let pre_fee_exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_in, false),
        );
        let pre_fee_sy_out = full_math_u128::mul_div_floor(
            pt_in as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let sy_out = full_math_u128::mul_div_floor(
            pre_fee_sy_out as u128,
            FP64_ONE,
            signed_value(&fee_factor),
        ) as u64;
        let fee = pre_fee_sy_out - sy_out;
        let new_ln_implied_rate = get_ln_implied_rate(
            total_pt + pt_in,
            total_sy_asset - sy_out,
            rate_scalar,
            rate_anchor,
            time_to_expiry_ms,
        );
        (sy_out, fee, new_ln_implied_rate)
    }

    public fun quote_pt_for_exact_sy(
        total_pt: u64,
        total_sy_asset: u64,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        sy_out: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, FixedPoint64) {
        if (sy_out == 0 || total_pt == 0 || total_sy_asset == 0 || sy_out >= total_sy_asset) {
            return (0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);

        let mut low: u64 = sy_out;
        let mut high: u64 = sy_out;
        let mut quoted_sy_out: u64 = 0;
        let mut i: u64 = 0;
        while (i < 64) {
            let (candidate_sy_out, _, _) = quote_exact_pt_for_sy(
                total_pt,
                total_sy_asset,
                last_ln_implied_rate,
                scalar_root,
                initial_anchor,
                ln_fee_rate_root,
                high,
                time_to_expiry_ms,
            );
            quoted_sy_out = candidate_sy_out;
            if (candidate_sy_out >= sy_out) {
                break
            };
            if (high > (std::u64::max_value!() / 2)) {
                break
            };
            high = high * 2;
            i = i + 1;
        };

        if (quoted_sy_out < sy_out) {
            return (0, 0, last_ln_implied_rate)
        };

        i = 0;
        while (i < 64 && low < high) {
            let mid = low + ((high - low) / 2);
            let (candidate_sy_out, _, _) = quote_exact_pt_for_sy(
                total_pt,
                total_sy_asset,
                last_ln_implied_rate,
                scalar_root,
                initial_anchor,
                ln_fee_rate_root,
                mid,
                time_to_expiry_ms,
            );
            if (candidate_sy_out >= sy_out) {
                high = mid;
            } else {
                low = mid + 1;
            };
            i = i + 1;
        };

        let pt_in = low;
        let (final_sy_out, final_fee, final_ln) = quote_exact_pt_for_sy(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            ln_fee_rate_root,
            pt_in,
            time_to_expiry_ms,
        );
        assert!(final_sy_out >= sy_out, E_PROPORTION_TOO_HIGH);

        let pre_fee_exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_in, false),
        );
        let pre_fee_sy_out = full_math_u128::mul_div_floor(
            pt_in as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let _fee_factor_value = signed_value(&fee_factor);
        let fee = if (final_fee > 0) { final_fee } else { pre_fee_sy_out - final_sy_out };
        (pt_in, fee, final_ln)
    }

    public fun quote_exact_sy_for_pt(
        total_pt: u64,
        total_sy_asset: u64,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        sy_in: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, u64, FixedPoint64) {
        if (sy_in == 0 || total_pt <= 1 || total_sy_asset == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);
        let (has_spot_rate, spot_exchange_rate) = try_get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            signed_zero(),
        );
        if (!has_spot_rate) {
            return (0, 0, 0, last_ln_implied_rate)
        };

        let mut low: u64 = 0;
        let spot_bound = full_math_u128::mul_div_ceil(
            sy_in as u128,
            signed_value(&spot_exchange_rate),
            FP64_ONE,
        ) as u64;
        let mut high: u64 = if (spot_bound < total_pt) { spot_bound } else { total_pt - 1 };
        if (high == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };
        let mut i: u64 = 0;
        while (i < MAX_EXACT_IN_SEARCH_ITERATIONS && low < high) {
            let mid = low + ((high - low + 1) / 2);
            let sy_needed = sy_in_for_pt_out(
                total_pt,
                total_sy_asset,
                rate_scalar,
                rate_anchor,
                fee_factor,
                mid,
            );
            if (sy_needed <= sy_in) {
                low = mid;
            } else {
                high = mid - 1;
            };
            i = i + 1;
        };

        let pt_out = low;
        if (pt_out == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };

        let pre_fee_exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_out, true),
        );
        let pre_fee_sy_in = full_math_u128::mul_div_ceil(
            pt_out as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let sy_used = sy_in_for_pt_out(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            fee_factor,
            pt_out,
        );
        let fee = sy_used - pre_fee_sy_in;
        let new_ln_implied_rate = get_ln_implied_rate(
            total_pt - pt_out,
            total_sy_asset + sy_used,
            rate_scalar,
            rate_anchor,
            time_to_expiry_ms,
        );
        (pt_out, sy_used, fee, new_ln_implied_rate)
    }

    public fun quote_sy_for_exact_pt(
        total_pt: u64,
        total_sy_asset: u64,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        pt_out: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, FixedPoint64) {
        if (pt_out == 0 || total_pt <= pt_out || total_sy_asset == 0) {
            return (0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);

        let pre_fee_exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_out, true),
        );
        let pre_fee_sy_in = full_math_u128::mul_div_ceil(
            pt_out as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let sy_in = sy_in_for_pt_out(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            fee_factor,
            pt_out,
        );
        let fee = sy_in - pre_fee_sy_in;
        let new_ln_implied_rate = get_ln_implied_rate(
            total_pt - pt_out,
            total_sy_asset + sy_in,
            rate_scalar,
            rate_anchor,
            time_to_expiry_ms,
        );
        (sy_in, fee, new_ln_implied_rate)
    }

    /// Index-aware exact-in `PT -> SY` quote.
    ///
    /// The curve is evaluated in asset units while the returned SY amounts are
    /// raw SY coin amounts. This matches yield-bearing SY markets where
    /// `raw SY * sy_index / FP64_ONE = asset value`.
    public fun quote_exact_pt_for_sy_indexed(
        total_pt: u64,
        total_sy_raw: u64,
        sy_index_raw: u128,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        pt_in: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, FixedPoint64) {
        let total_sy_asset = sy_to_asset_amount(total_sy_raw, sy_index_raw);
        if (pt_in == 0 || total_pt == 0 || total_sy_asset == 0) {
            return (0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);
        let pre_fee_exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_in, false),
        );
        let pre_fee_asset_out = full_math_u128::mul_div_floor(
            pt_in as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let asset_out = full_math_u128::mul_div_floor(
            pre_fee_asset_out as u128,
            FP64_ONE,
            signed_value(&fee_factor),
        ) as u64;
        let sy_out = asset_to_sy_amount_floor(asset_out, sy_index_raw);
        if (sy_out == 0 || sy_out >= total_sy_raw) {
            return (0, 0, last_ln_implied_rate)
        };

        let pre_fee_sy_out = asset_to_sy_amount_floor(pre_fee_asset_out, sy_index_raw);
        let fee = if (pre_fee_sy_out > sy_out) { pre_fee_sy_out - sy_out } else { 0 };
        let post_sy_asset = sy_to_asset_amount(total_sy_raw - sy_out, sy_index_raw);
        let new_ln_implied_rate = get_ln_implied_rate(
            total_pt + pt_in,
            post_sy_asset,
            rate_scalar,
            rate_anchor,
            time_to_expiry_ms,
        );
        (sy_out, fee, new_ln_implied_rate)
    }

    /// Index-aware exact-out `PT -> SY` quote.
    public fun quote_pt_for_exact_sy_indexed(
        total_pt: u64,
        total_sy_raw: u64,
        sy_index_raw: u128,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        sy_out: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, FixedPoint64) {
        if (sy_out == 0 || total_pt == 0 || total_sy_raw == 0 || sy_out >= total_sy_raw) {
            return (0, 0, last_ln_implied_rate)
        };

        let mut low: u64 = 1;
        let mut high: u64 = 1;
        let mut quoted_sy_out: u64 = 0;
        let mut i: u64 = 0;
        while (i < 64) {
            let (candidate_sy_out, _, _) = quote_exact_pt_for_sy_indexed(
                total_pt,
                total_sy_raw,
                sy_index_raw,
                last_ln_implied_rate,
                scalar_root,
                initial_anchor,
                ln_fee_rate_root,
                high,
                time_to_expiry_ms,
            );
            quoted_sy_out = candidate_sy_out;
            if (candidate_sy_out >= sy_out) {
                break
            };
            if (high > (std::u64::max_value!() / 2)) {
                break
            };
            high = high * 2;
            i = i + 1;
        };

        if (quoted_sy_out < sy_out) {
            return (0, 0, last_ln_implied_rate)
        };

        i = 0;
        while (i < 64 && low < high) {
            let mid = low + ((high - low) / 2);
            let (candidate_sy_out, _, _) = quote_exact_pt_for_sy_indexed(
                total_pt,
                total_sy_raw,
                sy_index_raw,
                last_ln_implied_rate,
                scalar_root,
                initial_anchor,
                ln_fee_rate_root,
                mid,
                time_to_expiry_ms,
            );
            if (candidate_sy_out >= sy_out) {
                high = mid;
            } else {
                low = mid + 1;
            };
            i = i + 1;
        };

        let pt_in = low;
        let (final_sy_out, final_fee, final_ln) = quote_exact_pt_for_sy_indexed(
            total_pt,
            total_sy_raw,
            sy_index_raw,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            ln_fee_rate_root,
            pt_in,
            time_to_expiry_ms,
        );
        assert!(final_sy_out >= sy_out, E_PROPORTION_TOO_HIGH);
        (pt_in, final_fee, final_ln)
    }

    /// Index-aware exact-out `SY -> PT` quote.
    public fun quote_sy_for_exact_pt_indexed(
        total_pt: u64,
        total_sy_raw: u64,
        sy_index_raw: u128,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        pt_out: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, FixedPoint64) {
        let total_sy_asset = sy_to_asset_amount(total_sy_raw, sy_index_raw);
        if (pt_out == 0 || total_pt <= pt_out || total_sy_asset == 0) {
            return (0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);

        let (is_valid_rate, pre_fee_exchange_rate) = try_get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_out, true),
        );
        if (!is_valid_rate) {
            return (0, 0, last_ln_implied_rate)
        };
        let pre_fee_asset_in = full_math_u128::mul_div_ceil(
            pt_out as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let asset_in = sy_in_for_pt_out(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            fee_factor,
            pt_out,
        );
        if (asset_in == std::u64::max_value!()) {
            return (0, 0, last_ln_implied_rate)
        };
        let sy_in = asset_to_sy_amount_ceil(asset_in, sy_index_raw);
        let pre_fee_sy_in = asset_to_sy_amount_ceil(pre_fee_asset_in, sy_index_raw);
        let fee = if (sy_in > pre_fee_sy_in) { sy_in - pre_fee_sy_in } else { 0 };
        let post_sy_asset = sy_to_asset_amount(total_sy_raw + sy_in, sy_index_raw);
        let new_ln_implied_rate = get_ln_implied_rate(
            total_pt - pt_out,
            post_sy_asset,
            rate_scalar,
            rate_anchor,
            time_to_expiry_ms,
        );
        (sy_in, fee, new_ln_implied_rate)
    }

    /// Index-aware exact-in `SY -> PT` quote.
    public fun quote_exact_sy_for_pt_indexed(
        total_pt: u64,
        total_sy_raw: u64,
        sy_index_raw: u128,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        ln_fee_rate_root: FixedPoint64,
        sy_in: u64,
        time_to_expiry_ms: u64,
    ): (u64, u64, u64, FixedPoint64) {
        let total_sy_asset = sy_to_asset_amount(total_sy_raw, sy_index_raw);
        if (sy_in == 0 || total_pt <= 1 || total_sy_asset == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };

        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let fee_factor = fee_rate_factor(ln_fee_rate_root, time_to_expiry_ms);
        let sy_in_asset = sy_to_asset_amount(sy_in, sy_index_raw);
        if (sy_in_asset == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };
        let (has_spot_rate, spot_exchange_rate) = try_get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            signed_zero(),
        );
        if (!has_spot_rate) {
            return (0, 0, 0, last_ln_implied_rate)
        };

        let mut low: u64 = 0;
        let spot_bound = full_math_u128::mul_div_ceil(
            sy_in_asset as u128,
            signed_value(&spot_exchange_rate),
            FP64_ONE,
        ) as u64;
        let mut high: u64 = if (spot_bound < total_pt) { spot_bound } else { total_pt - 1 };
        if (high == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };
        let mut i: u64 = 0;
        while (i < MAX_EXACT_IN_SEARCH_ITERATIONS && low < high) {
            let mid = low + ((high - low + 1) / 2);
            let asset_needed = sy_in_for_pt_out(
                total_pt,
                total_sy_asset,
                rate_scalar,
                rate_anchor,
                fee_factor,
                mid,
            );
            let sy_needed = if (asset_needed == std::u64::max_value!()) {
                std::u64::max_value!()
            } else {
                asset_to_sy_amount_ceil(asset_needed, sy_index_raw)
            };
            if (sy_needed > 0 && sy_needed <= sy_in) {
                low = mid;
            } else {
                high = mid - 1;
            };
            i = i + 1;
        };

        let pt_out = low;
        if (pt_out == 0) {
            return (0, 0, 0, last_ln_implied_rate)
        };

        let (is_valid_rate, pre_fee_exchange_rate) = try_get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_out, true),
        );
        if (!is_valid_rate) {
            return (0, 0, 0, last_ln_implied_rate)
        };
        let pre_fee_asset_in = full_math_u128::mul_div_ceil(
            pt_out as u128,
            FP64_ONE,
            signed_value(&pre_fee_exchange_rate),
        ) as u64;
        let asset_used = sy_in_for_pt_out(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            fee_factor,
            pt_out,
        );
        if (asset_used == std::u64::max_value!()) {
            return (0, 0, 0, last_ln_implied_rate)
        };
        let sy_used = asset_to_sy_amount_ceil(asset_used, sy_index_raw);
        let pre_fee_sy_in = asset_to_sy_amount_ceil(pre_fee_asset_in, sy_index_raw);
        let fee = if (sy_used > pre_fee_sy_in) { sy_used - pre_fee_sy_in } else { 0 };
        let post_sy_asset = sy_to_asset_amount(total_sy_raw + sy_used, sy_index_raw);
        let new_ln_implied_rate = get_ln_implied_rate(
            total_pt - pt_out,
            post_sy_asset,
            rate_scalar,
            rate_anchor,
            time_to_expiry_ms,
        );
        (pt_out, sy_used, fee, new_ln_implied_rate)
    }

    public fun spot_pt_price_in_sy(
        total_pt: u64,
        total_sy_asset: u64,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        time_to_expiry_ms: u64,
    ): u128 {
        let rate_scalar = get_rate_scalar(from_math(scalar_root), time_to_expiry_ms);
        let rate_anchor = current_rate_anchor(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            rate_scalar,
            initial_anchor,
            time_to_expiry_ms,
        );
        let exchange_rate = get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            signed_zero(),
        );
        full_math_u128::mul_div_floor(FP64_ONE, FP64_ONE, signed_value(&exchange_rate))
    }

    /// Index-aware PT spot price quoted in raw SY units.
    public fun spot_pt_price_in_sy_indexed(
        total_pt: u64,
        total_sy_raw: u64,
        sy_index_raw: u128,
        last_ln_implied_rate: FixedPoint64,
        scalar_root: FixedPoint64WithSign,
        initial_anchor: FixedPoint64WithSign,
        time_to_expiry_ms: u64,
    ): u128 {
        let total_sy_asset = sy_to_asset_amount(total_sy_raw, sy_index_raw);
        let asset_price_raw = spot_pt_price_in_sy(
            total_pt,
            total_sy_asset,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            time_to_expiry_ms,
        );
        full_math_u128::mul_div_floor(asset_price_raw, FP64_ONE, sy_index_raw)
    }

    // ===========================================
    // Binary Search Helpers
    // ===========================================

    /// Binary search helper for exact-in `SY -> PT`.
    public fun binary_search_max_pt_out(
        total_pt: u64,
        _total_sy: u64,
        sy_in: u64,
        max_iterations: u64,
    ): u64 {
        let mut low: u64 = 0;
        let mut high: u64 = if (total_pt < sy_in) { total_pt } else { sy_in };
        let mut i: u64 = 0;
        while (i < max_iterations && low < high) {
            let mid = low + ((high - low + 1) / 2);
        // Fast feasibility check: PT out cannot exceed pool PT inventory.
            if (mid <= total_pt && mid <= sy_in) {
                low = mid;
            } else {
                high = mid - 1;
            };
            i = i + 1;
        };
        low
    }

    /// Binary search helper for exact-in `PT -> SY`.
    public fun binary_search_max_pt_in(
        _total_pt: u64,
        total_sy: u64,
        max_pt: u64,
        max_iterations: u64,
    ): u64 {
        let mut low: u64 = 0;
        let mut high: u64 = max_pt;
        let mut i: u64 = 0;
        while (i < max_iterations && low < high) {
            let mid = low + ((high - low + 1) / 2);
            if (mid <= total_sy) {
                low = mid;
            } else {
                high = mid - 1;
            };
            i = i + 1;
        };
        low
    }

    // ===========================================
    // Utility Helpers
    // ===========================================

    /// Compute LP shares for proportional liquidity additions.
    public fun calc_lp_amount(
        total_lp: u64,
        total_sy: u64,
        total_pt: u64,
        sy_in: u64,
        pt_in: u64,
    ): u64 {
        if (total_lp == 0) {
            // First liquidity addition uses the geometric mean.
            let product = (sy_in as u128) * (pt_in as u128);
            (sqrt::sqrt_u128(product) as u64)
        } else {
            let sy_ratio = full_math_u128::mul_div_floor(
                sy_in as u128,
                total_lp as u128,
                total_sy as u128,
            );
            let pt_ratio = full_math_u128::mul_div_floor(
                pt_in as u128,
                total_lp as u128,
                total_pt as u128,
            );
            let min_ratio = if (sy_ratio < pt_ratio) { sy_ratio } else { pt_ratio };
            (min_ratio as u64)
        }
    }

    public fun apply_fee(amount: u64, fee_rate: FixedPoint64): (u64, u64) {
        let amount_fp = fixed_point64::from_uint64(amount);
        let fee_fp = fixed_point64::mul(amount_fp, fee_rate);
        let fee = fixed_point64::truncate(fee_fp);
        (amount - fee, fee)
    }

    fun to_math(value: SignedFP64): FixedPoint64WithSign {
        fixed_point64_with_sign::create_from_raw_value(value.value, value.is_positive)
    }

    fun from_math(value: FixedPoint64WithSign): SignedFP64 {
        SignedFP64 {
            value: fixed_point64_with_sign::get_raw_value(value),
            is_positive: fixed_point64_with_sign::is_positive(value),
        }
    }

    fun amount_to_fp(amount: u64, is_positive: bool): SignedFP64 {
        signed_new((amount as u128) * FP64_ONE, is_positive)
    }

    fun calc_trade_proportion(
        total_pt: SignedFP64,
        total_sy_asset: SignedFP64,
        net_pt_to_account: SignedFP64,
    ): SignedFP64 {
        let denominator = signed_add(total_pt, total_sy_asset);
        assert!(denominator.value > 0, E_DIVISION_BY_ZERO);

        let numerator = signed_sub(total_pt, net_pt_to_account);
        let zero = signed_zero();
        assert!(signed_lt(&zero, &numerator), E_DIVISION_BY_ZERO);

        let proportion = signed_div(numerator, denominator);
        let max_prop = signed_new(
            FP64_ONE * MAX_PROPORTION_NUM / MAX_PROPORTION_DENOM,
            true,
        );
        assert!(signed_lt(&proportion, &max_prop), E_PROPORTION_TOO_HIGH);
        proportion
    }

    fun current_rate_anchor(
        total_pt: u64,
        total_sy_asset: u64,
        last_ln_implied_rate: FixedPoint64,
        rate_scalar: SignedFP64,
        initial_anchor: FixedPoint64WithSign,
        time_to_expiry_ms: u64,
    ): SignedFP64 {
        if (fixed_point64::is_zero(last_ln_implied_rate)) {
            from_math(initial_anchor)
        } else {
            get_rate_anchor(
                total_pt,
                total_sy_asset,
                rate_scalar,
                fixed_point64::get_raw_value(last_ln_implied_rate),
                time_to_expiry_ms,
            )
        }
    }

    fun fee_rate_factor(
        ln_fee_rate_root: FixedPoint64,
        time_to_expiry_ms: u64,
    ): SignedFP64 {
        get_exchange_rate_from_implied_rate(
            fixed_point64::get_raw_value(ln_fee_rate_root),
            time_to_expiry_ms,
        )
    }

    fun sy_in_for_pt_out(
        total_pt: u64,
        total_sy_asset: u64,
        rate_scalar: SignedFP64,
        rate_anchor: SignedFP64,
        fee_factor: SignedFP64,
        pt_out: u64,
    ): u64 {
        let (is_valid, pre_fee_exchange_rate) = try_get_exchange_rate(
            total_pt,
            total_sy_asset,
            rate_scalar,
            rate_anchor,
            amount_to_fp(pt_out, true),
        );
        if (!is_valid) {
            return std::u64::max_value!()
        };
        let post_fee_exchange_rate = signed_div(pre_fee_exchange_rate, fee_factor);
        if (!signed_ge(&post_fee_exchange_rate, &signed_one())) {
            return std::u64::max_value!()
        };
        full_math_u128::mul_div_ceil(
            pt_out as u128,
            FP64_ONE,
            signed_value(&post_fee_exchange_rate),
        ) as u64
    }

    // ===========================================
    // Test Helpers
    // ===========================================

    #[test]
    fun test_signed_arithmetic() {
        let a = signed_new(100 * FP64_ONE, true);
        let b = signed_new(50 * FP64_ONE, true);
        let sum = signed_add(a, b);
        assert!(sum.value == 150 * FP64_ONE && sum.is_positive, 0);

        let diff = signed_sub(a, b);
        assert!(diff.value == 50 * FP64_ONE && diff.is_positive, 1);

        let neg_diff = signed_sub(b, a);
        assert!(neg_diff.value == 50 * FP64_ONE && !neg_diff.is_positive, 2);
    }

    #[test]
    fun test_calc_lp_initial() {
            // First mint example: sqrt(100 * 100) = 100.
        let lp = calc_lp_amount(0, 0, 0, 100, 100);
        assert!(lp == 100, 0);
    }

    #[test]
    fun test_sqrt() {
        assert!(sqrt::sqrt_u128(0) == 0, 0);
        assert!(sqrt::sqrt_u128(1) == 1, 1);
        assert!(sqrt::sqrt_u128(4) == 2, 2);
        assert!(sqrt::sqrt_u128(9) == 3, 3);
        assert!(sqrt::sqrt_u128(10000) == 100, 4);
    }

    #[test]
    fun test_try_get_exchange_rate_reports_invalid_pt_out() {
        let (is_valid, _) = try_get_exchange_rate(
            100,
            100,
            signed_new(FP64_ONE / 100, true),
            signed_one(),
            amount_to_fp(1, true),
        );
        assert!(!is_valid, 5);
    }

    #[test]
    fun test_sy_in_for_pt_out_returns_max_when_output_is_invalid() {
        let sy_in = sy_in_for_pt_out(
            100,
            100,
            signed_new(FP64_ONE / 100, true),
            signed_one(),
            signed_one(),
            1,
        );
        assert!(sy_in == std::u64::max_value!(), 6);
    }

    #[test]
    fun test_indexed_exact_pt_out_returns_zero_when_output_is_invalid() {
        let scalar_root = fixed_point64_with_sign::create_from_raw_value(
            FP64_ONE / 100,
            true,
        );
        let initial_anchor = fixed_point64_with_sign::one();
        let last_ln_implied_rate = fixed_point64::zero();

        let (sy_in, fee, new_ln) = quote_sy_for_exact_pt_indexed(
            100,
            100,
            FP64_ONE,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            fixed_point64::zero(),
            1,
            YEAR_MS,
        );

        assert!(sy_in == 0, 7);
        assert!(fee == 0, 8);
        assert!(fixed_point64::is_zero(new_ln), 9);
    }

    #[test]
    fun test_indexed_exact_sy_in_skips_invalid_binary_search_candidates() {
        let scalar_root = fixed_point64_with_sign::create_from_raw_value(
            FP64_ONE * 10,
            true,
        );
        let initial_anchor = fixed_point64_with_sign::one();
        let last_ln_implied_rate = fixed_point64::create_from_raw_value(FP64_ONE / 10);
        let ln_fee_rate_root = fixed_point64::create_from_raw_value(FP64_ONE / 1000);
        let sy_index_raw = FP64_ONE + (FP64_ONE / 1_000_000);

        let (pt_out, sy_used, fee, _) = quote_exact_sy_for_pt_indexed(
            200_000_000,
            100_000_000,
            sy_index_raw,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            ln_fee_rate_root,
            100_000_000,
            YEAR_MS / 2,
        );

        assert!(pt_out > 0, 10);
        assert!(sy_used <= 100_000_000, 11);
        assert!(fee <= sy_used, 12);
    }

    #[test]
    fun test_indexed_spot_price_scales_raw_sy_price() {
        let scalar_root = fixed_point64_with_sign::create_from_raw_value(
            FP64_ONE * 100,
            true,
        );
        let initial_anchor = fixed_point64_with_sign::create_from_raw_value(
            FP64_ONE * 2,
            true,
        );
        let last_ln_implied_rate = fixed_point64::zero();
        let raw_sy_index = FP64_ONE * 2;

        let asset_price = spot_pt_price_in_sy(
            1_000,
            2_000,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            YEAR_MS,
        );
        let indexed_price = spot_pt_price_in_sy_indexed(
            1_000,
            1_000,
            raw_sy_index,
            last_ln_implied_rate,
            scalar_root,
            initial_anchor,
            YEAR_MS,
        );

        assert!(indexed_price == asset_price / 2, 7);
    }

    #[test]
    fun test_demo_scalar_root_supports_input_sensitive_sy_for_pt_quotes() {
        let total_pt = 500_000_000;
        let total_sy = 500_000_000;
        let rate_scalar = signed_new(FP64_ONE * 10, true);
        let rate_anchor = get_exchange_rate_from_implied_rate(FP64_ONE / 10, YEAR_MS);
        let fee_factor = get_exchange_rate_from_implied_rate(FP64_ONE / 1000, YEAR_MS);

        let small_sy_in = sy_in_for_pt_out(
            total_pt,
            total_sy,
            rate_scalar,
            rate_anchor,
            fee_factor,
            1_000_000,
        );
        let large_sy_in = sy_in_for_pt_out(
            total_pt,
            total_sy,
            rate_scalar,
            rate_anchor,
            fee_factor,
            20_000_000,
        );

        assert!(small_sy_in > 0, 7);
        assert!(large_sy_in > small_sy_in, 8);
        assert!(large_sy_in != std::u64::max_value!(), 9);
    }
}
