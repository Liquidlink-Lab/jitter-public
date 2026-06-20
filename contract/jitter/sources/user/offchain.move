/// offchain - read-only helpers for frontends, SDKs, and PTB simulation.
///
/// This module exposes pure query helpers for:
///   - swap previews and slippage previews
///   - LP value previews
///   - claimable-interest previews
///
/// These functions never mutate protocol state. The router composes actions,
/// while this module provides the view layer around those actions.
module jitter::offchain {
    use jitter::amm_math;
    use jitter::py_state::{Self, PyState};
    use jitter::jitter_position::{Self, JitterPosition};
    
    use jitter::pool::{Self, Pool};
    use jitter_math::fixed_point64;
    use jitter_math::full_math_u128;
    use sui::coin::{Self, Coin};

    const FP64_ONE: u128 = 1 << 64;
    const BPS_DENOM: u128 = 10_000;
    const E_INVALID_GUARDRAIL_INPUT: u64 = 3100;
    const E_SLIPPAGE_GUARDRAIL_EXCEEDED: u64 = 3101;

    /// Return the current PT price quoted in SY as FP64 raw.
    public fun estimate_pt_price<T: drop>(
        state: &Pool<T>,
        sy_index_raw: u128,
        clock: &sui::clock::Clock,
    ): u128 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_pt == 0 || total_sy == 0) {
            return fixed_point64::get_raw_value(fixed_point64::one())
        };
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) {
            return fixed_point64::get_raw_value(fixed_point64::one())
        };
        amm_math::spot_pt_price_in_sy_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::expiry(state) - now,
        )
    }

    /// Return the current YT price quoted in SY.
    public fun estimate_yt_price<T: drop>(
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u128 {
        let py_index_raw = py_state::current_py_index(
            sy_index_raw,
            py_state::py_index_stored(py_state_in),
        );
        let py_price_raw = full_math_u128::mul_div_floor(
            FP64_ONE,
            FP64_ONE,
            py_index_raw,
        );
        let pt_price_raw = estimate_pt_price(market, sy_index_raw, clock);
        if (py_price_raw > pt_price_raw) {
            py_price_raw - pt_price_raw
        } else {
            0
        }
    }

    // ===========================================
    // Swap Previews
    // ===========================================

    /// Preview exact-in `SY -> PT`.
    public fun estimate_swap_sy_for_pt<T: drop>(
        sy_in: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_sy == 0 || total_pt == 0) return 0;
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) return 0;

        let (pt_out, _, _, _) = amm_math::quote_exact_sy_for_pt_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::ln_fee_rate_root(state),
            sy_in,
            pool::expiry(state) - now,
        );
        pt_out
    }

    public fun estimate_swap_sy_for_pt_slippage_bps<T: drop>(
        sy_in: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_sy == 0 || total_pt == 0) return 0;
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) return 0;

        let spot_price_raw = estimate_pt_price(state, sy_index_raw, clock);
        let (pt_out, sy_used, _, _) = amm_math::quote_exact_sy_for_pt_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::ln_fee_rate_root(state),
            sy_in,
            pool::expiry(state) - now,
        );
        calc_swap_sy_for_pt_slippage_bps(
            spot_price_raw,
            sy_used,
            pt_out,
        )
    }

    /// Preview exact-in `PT -> SY`.
    public fun estimate_swap_pt_for_sy<T: drop>(
        pt_in: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_sy == 0 || total_pt == 0) return 0;
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) return 0;

        let (sy_out, _, _) = amm_math::quote_exact_pt_for_sy_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::ln_fee_rate_root(state),
            pt_in,
            pool::expiry(state) - now,
        );
        sy_out
    }

    public fun estimate_swap_pt_for_sy_slippage_bps<T: drop>(
        pt_in: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_sy == 0 || total_pt == 0) return 0;
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) return 0;

        let spot_price_raw = estimate_pt_price(state, sy_index_raw, clock);
        let (sy_out, _, _) = amm_math::quote_exact_pt_for_sy_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::ln_fee_rate_root(state),
            pt_in,
            pool::expiry(state) - now,
        );
        calc_swap_pt_for_sy_slippage_bps(
            spot_price_raw,
            pt_in,
            sy_out,
        )
    }

    /// Preview exact-out `SY -> PT`.
    public fun estimate_swap_sy_for_exact_pt<T: drop>(
        pt_out: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_sy == 0 || total_pt == 0 || pt_out >= total_pt) return 0;
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) return 0;

        let (sy_in, _, _) = amm_math::quote_sy_for_exact_pt_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::ln_fee_rate_root(state),
            pt_out,
            pool::expiry(state) - now,
        );
        sy_in
    }

    public fun estimate_swap_sy_for_exact_pt_slippage_bps<T: drop>(
        pt_out: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let sy_in = estimate_swap_sy_for_exact_pt(pt_out, sy_index_raw, state, clock);
        let spot_price_raw = estimate_pt_price(state, sy_index_raw, clock);
        calc_swap_sy_for_pt_slippage_bps(
            spot_price_raw,
            sy_in,
            pt_out,
        )
    }

    /// Preview exact-out `PT -> SY`.
    public fun estimate_swap_pt_for_exact_sy<T: drop>(
        sy_out: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let total_sy = pool::total_sy(state);
        let total_pt = pool::total_pt(state);
        if (total_sy == 0 || total_pt == 0 || sy_out >= total_sy) return 0;
        let now = sui::clock::timestamp_ms(clock);
        if (pool::expiry(state) <= now) return 0;

        let (pt_in, _, _) = amm_math::quote_pt_for_exact_sy_indexed(
            total_pt,
            total_sy,
            sy_index_raw,
            pool::last_ln_implied_rate(state),
            pool::scalar_root(state),
            pool::initial_anchor(state),
            pool::ln_fee_rate_root(state),
            sy_out,
            pool::expiry(state) - now,
        );
        pt_in
    }

    public fun estimate_swap_pt_for_exact_sy_slippage_bps<T: drop>(
        sy_out: u64,
        sy_index_raw: u128,
        state: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let pt_in = estimate_swap_pt_for_exact_sy(sy_out, sy_index_raw, state, clock);
        let spot_price_raw = estimate_pt_price(state, sy_index_raw, clock);
        calc_swap_pt_for_sy_slippage_bps(
            spot_price_raw,
            pt_in,
            sy_out,
        )
    }

    /// Preview the composed `SY -> YT` route.
    ///
    /// Flow:
    ///   1. Mint equal amounts of PT and YT from SY.
    ///   2. Sell the minted PT back into the AMM for partial SY refund.
    ///
    /// Returns `(yt_out, sy_out_from_pt_sale)`.
    public fun estimate_swap_sy_for_yt<T: drop>(
        sy_in: u64,
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): (u64, u64) {
        let yt_out = py_state::calc_py_amount_for_sy(
            sy_in,
            sy_index_raw,
            py_state_in,
        );
        let sy_out = estimate_swap_pt_for_sy(yt_out, sy_index_raw, market, clock);
        (yt_out, sy_out)
    }

    public fun estimate_swap_sy_for_yt_slippage_bps<T: drop>(
        sy_in: u64,
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let (yt_out, sy_refund) = estimate_swap_sy_for_yt(
            sy_in,
            sy_index_raw,
            py_state_in,
            market,
            clock,
        );
        let net_sy_in = if (sy_in > sy_refund) { sy_in - sy_refund } else { 0 };
        let yt_spot_price_raw = estimate_yt_price(
            sy_index_raw,
            py_state_in,
            market,
            clock,
        );
        calc_swap_sy_for_yt_slippage_bps(
            yt_spot_price_raw,
            net_sy_in,
            yt_out,
        )
    }

    /// Preview exact-out `SY -> YT` and the PT-sale refund path.
    ///
    /// Returns `(sy_to_mint, sy_refund_from_pt_sale, net_sy_in)`.
    public fun estimate_swap_sy_for_exact_yt<T: drop>(
        yt_out: u64,
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): (u64, u64, u64) {
        let sy_to_mint = py_state::calc_sy_amount_for_py(
            yt_out,
            sy_index_raw,
            py_state_in,
        );
        let sy_refund = estimate_swap_pt_for_sy(yt_out, sy_index_raw, market, clock);
        let net_sy_in = if (sy_to_mint > sy_refund) {
            sy_to_mint - sy_refund
        } else {
            0
        };
        (sy_to_mint, sy_refund, net_sy_in)
    }

    public fun estimate_swap_sy_for_exact_yt_slippage_bps<T: drop>(
        yt_out: u64,
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let (_, _, net_sy_in) = estimate_swap_sy_for_exact_yt(
            yt_out,
            sy_index_raw,
            py_state_in,
            market,
            clock,
        );
        let yt_spot_price_raw = estimate_yt_price(
            sy_index_raw,
            py_state_in,
            market,
            clock,
        );
        calc_swap_sy_for_yt_slippage_bps(
            yt_spot_price_raw,
            net_sy_in,
            yt_out,
        )
    }

    /// Preview the composed `YT -> SY` route.
    ///
    /// Flow:
    ///   1. Use an internal matching PT leg with the caller's YT to redeem SY.
    ///   2. Use part of the redeemed SY to settle the PT leg against the AMM.
    ///
    /// Returns `(net_sy_out, gross_sy_redeemed, sy_repaid_to_pool)`.
    public fun estimate_swap_yt_for_sy<T: drop>(
        yt_in: u64,
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): (u64, u64, u64) {
        let gross_sy_out = calc_sy_amount_for_py_floor(
            yt_in,
            sy_index_raw,
            py_state_in,
        );
        let sy_repaid = estimate_swap_sy_for_exact_pt(
            yt_in,
            sy_index_raw,
            market,
            clock,
        );
        let net_sy_out = if (gross_sy_out > sy_repaid) {
            gross_sy_out - sy_repaid
        } else {
            0
        };
        (net_sy_out, gross_sy_out, sy_repaid)
    }

    public fun estimate_swap_yt_for_sy_slippage_bps<T: drop>(
        yt_in: u64,
        sy_index_raw: u128,
        py_state_in: &PyState<T>,
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): u64 {
        let (net_sy_out, _, _) = estimate_swap_yt_for_sy(
            yt_in,
            sy_index_raw,
            py_state_in,
            market,
            clock,
        );
        let yt_spot_price_raw = estimate_yt_price(
            sy_index_raw,
            py_state_in,
            market,
            clock,
        );
        calc_swap_yt_for_sy_slippage_bps(
            yt_spot_price_raw,
            yt_in,
            net_sy_out,
        )
    }

    // ===========================================
    // PTB Guardrail Helpers
    // ===========================================

    public fun calc_swap_sy_for_pt_slippage_bps(
        pre_trade_spot_price_raw: u128,
        sy_used: u64,
        pt_out: u64,
    ): u64 {
        if (pre_trade_spot_price_raw == 0 || sy_used == 0 || pt_out == 0) {
            return 0
        };

        let execution_price_raw = full_math_u128::mul_div_ceil(
            sy_used as u128,
            FP64_ONE,
            pt_out as u128,
        );
        if (execution_price_raw <= pre_trade_spot_price_raw) {
            return 0
        };

        full_math_u128::mul_div_floor(
            execution_price_raw - pre_trade_spot_price_raw,
            BPS_DENOM,
            pre_trade_spot_price_raw,
        ) as u64
    }

    public fun calc_swap_pt_for_sy_slippage_bps(
        pre_trade_spot_price_raw: u128,
        pt_in: u64,
        sy_out: u64,
    ): u64 {
        if (pre_trade_spot_price_raw == 0 || pt_in == 0 || sy_out == 0) {
            return 0
        };

        let execution_price_raw = full_math_u128::mul_div_floor(
            sy_out as u128,
            FP64_ONE,
            pt_in as u128,
        );
        if (execution_price_raw >= pre_trade_spot_price_raw) {
            return 0
        };

        full_math_u128::mul_div_floor(
            pre_trade_spot_price_raw - execution_price_raw,
            BPS_DENOM,
            pre_trade_spot_price_raw,
        ) as u64
    }

    public fun calc_swap_sy_for_yt_slippage_bps(
        pre_trade_yt_price_raw: u128,
        net_sy_in: u64,
        yt_out: u64,
    ): u64 {
        if (pre_trade_yt_price_raw == 0 || net_sy_in == 0 || yt_out == 0) {
            return 0
        };

        let execution_price_raw = full_math_u128::mul_div_ceil(
            net_sy_in as u128,
            FP64_ONE,
            yt_out as u128,
        );
        if (execution_price_raw <= pre_trade_yt_price_raw) {
            return 0
        };

        full_math_u128::mul_div_floor(
            execution_price_raw - pre_trade_yt_price_raw,
            BPS_DENOM,
            pre_trade_yt_price_raw,
        ) as u64
    }

    public fun calc_swap_yt_for_sy_slippage_bps(
        pre_trade_yt_price_raw: u128,
        yt_in: u64,
        net_sy_out: u64,
    ): u64 {
        calc_swap_pt_for_sy_slippage_bps(
            pre_trade_yt_price_raw,
            yt_in,
            net_sy_out,
        )
    }

    fun calc_sy_amount_for_py_floor<T: drop>(
        py_amount: u64,
        sy_index_raw: u128,
        state: &PyState<T>,
    ): u64 {
        if (py_amount == 0) {
            return 0
        };

        let py_index = py_state::current_py_index(
            sy_index_raw,
            py_state::py_index_stored(state),
        );
        let py_amount_fp = (py_amount as u128) * FP64_ONE;
        let sy_out_fp = py_state::asset_to_sy(py_index, py_amount_fp);
        (sy_out_fp / FP64_ONE) as u64
    }

    public fun used_amount_from_change<T: drop>(
        amount_in: u64,
        change_coin: &Coin<T>,
    ): u64 {
        let change = coin::value(change_coin);
        assert!(amount_in >= change, E_INVALID_GUARDRAIL_INPUT);
        amount_in - change
    }

    public fun assert_max_slippage_bps(
        actual_slippage_bps: u64,
        max_slippage_bps: u64,
    ) {
        assert!(actual_slippage_bps <= max_slippage_bps, E_SLIPPAGE_GUARDRAIL_EXCEEDED);
    }

    public fun assert_swap_sy_for_pt_guardrail<T: drop>(
        pre_trade_spot_price_raw: u128,
        amount_in: u64,
        pt_out: u64,
        change_coin: &Coin<T>,
        max_slippage_bps: u64,
    ) {
        let sy_used = used_amount_from_change(amount_in, change_coin);
        let actual_slippage_bps = calc_swap_sy_for_pt_slippage_bps(
            pre_trade_spot_price_raw,
            sy_used,
            pt_out,
        );
        assert_max_slippage_bps(actual_slippage_bps, max_slippage_bps);
    }

    public fun assert_swap_sy_for_exact_pt_guardrail(
        pre_trade_spot_price_raw: u128,
        sy_used: u64,
        pt_out: u64,
        max_slippage_bps: u64,
    ) {
        let actual_slippage_bps = calc_swap_sy_for_pt_slippage_bps(
            pre_trade_spot_price_raw,
            sy_used,
            pt_out,
        );
        assert_max_slippage_bps(actual_slippage_bps, max_slippage_bps);
    }

    public fun assert_swap_pt_for_sy_guardrail(
        pre_trade_spot_price_raw: u128,
        pt_in: u64,
        sy_out: u64,
        max_slippage_bps: u64,
    ) {
        let actual_slippage_bps = calc_swap_pt_for_sy_slippage_bps(
            pre_trade_spot_price_raw,
            pt_in,
            sy_out,
        );
        assert_max_slippage_bps(actual_slippage_bps, max_slippage_bps);
    }

    public fun assert_swap_sy_for_yt_guardrail<T: drop>(
        pre_trade_yt_price_raw: u128,
        amount_in: u64,
        yt_out: u64,
        change_coin: &Coin<T>,
        max_slippage_bps: u64,
    ) {
        let net_sy_in = used_amount_from_change(amount_in, change_coin);
        let actual_slippage_bps = calc_swap_sy_for_yt_slippage_bps(
            pre_trade_yt_price_raw,
            net_sy_in,
            yt_out,
        );
        assert_max_slippage_bps(actual_slippage_bps, max_slippage_bps);
    }

    // Position Views

    /// Estimate the SY and PT value represented by an LP position.
    public fun estimate_lp_value<T: drop>(
        lp_amount: u64,
        market: &Pool<T>,
    ): (u64, u64) {
        let total_lp = pool::lp_supply(market);
        if (total_lp == 0 || lp_amount == 0) return (0, 0);

        let sy_value = (((lp_amount as u128) * (pool::total_sy(market) as u128)
            / (total_lp as u128)) as u64);
        let pt_value = (((lp_amount as u128) * (pool::total_pt(market) as u128)
            / (total_lp as u128)) as u64);
        (sy_value, pt_value)
    }

    /// Estimate claimable YT interest in SY units.
    public fun estimate_claimable_interest(
        position: &JitterPosition,
    ): u64 {
        let accrued_raw = jitter_position::accrued(position);
        fixed_point64::truncate(fixed_point64::create_from_raw_value(accrued_raw))
    }

    /// Return whether the state has expired.
    public fun is_market_expired<T: drop>(
        market: &Pool<T>,
        clock: &sui::clock::Clock,
    ): bool {
        py_state::is_expired(pool::expiry(market), sui::clock::timestamp_ms(clock))
    }

    // Dashboard-only helpers were removed from this package to keep fresh
    // publishes under Sui's package object-size limit.

        // exp() in signed FP64 space — ln_rate is positive by construction.

}
