from __future__ import annotations

from decimal import Decimal

from p10_prepaid.family_projection import recharge_needed, run_out_date


def test_run_out_date_basic_case():
    today_balance = Decimal("30.00")
    result = run_out_date(today_balance, 5)
    assert result is not None


def test_recharge_needed_zero_when_balance_is_already_sufficient():
    balance_today = Decimal("1000.00")
    result = recharge_needed(balance_today, "2026-01-10", 5)
    assert result["required_amount"] == Decimal("0.00")
    assert result["base_energy"] > 0
    assert result["vat"] >= 0
    assert result["slab_penalty"] >= 0
    assert result["fixed_charges"] > 0


def test_recharge_needed_must_cover_future_energy_cost():
    balance_today = Decimal("20.00")
    result = recharge_needed(balance_today, "2026-01-10", 10)
    assert result["required_amount"] > Decimal("0.00")
    total = (
        result["base_energy"]
        + result["slab_penalty"]
        + result["fixed_charges"]
        + result["vat"]
    )
    assert total >= result["required_amount"]
