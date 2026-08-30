from __future__ import annotations

from decimal import Decimal

from p10_prepaid.family_projection import recharge_needed, run_out_date


def test_run_out_date_basic_case():
    # A simple two-day-run scenario.
    # Balance 30.00, daily usage 5 units/day, unit cost < 1st slab (4.63) => energy per day ~23.15 + VAT 1.16.
    today_balance = Decimal("30.00")
    result = run_out_date(today_balance, 5)
    assert result is not None


def test_recharge_needed_zero_when_balance_is_already_sufficient():
    balance_today = Decimal("1000.00")
    result = recharge_needed(balance_today, "2026-01-10", 5)
    assert result == Decimal("0.00")


def test_recharge_needed_must_cover_future_energy_cost():
    balance_today = Decimal("20.00")
    result = recharge_needed(balance_today, "2026-01-10", 10)
    assert result > Decimal("0.00")
