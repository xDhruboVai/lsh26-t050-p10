from __future__ import annotations

from decimal import Decimal

from p10_prepaid.diagnostics import monthly_bill_breakdown, slab_warning


def test_slab_warning_appears_near_a_boundary():
    warning = slab_warning(69, buffer=10)
    assert warning["warning"] is not None
    assert warning["remaining_in_current_slab"] == 6
    assert warning["next_rate"] == Decimal("5.26")


def test_monthly_bill_breakdown_aggregates_components():
    month_rows = [
        {"energy_cost": "100.00", "vat": "5.00", "fixed_charge": "82.00"},
        {"energy_cost": "50.00", "vat": "2.50", "fixed_charge": "0.00"},
    ]
    result = monthly_bill_breakdown(month_rows)
    assert result["energy"] == Decimal("150.00")
    assert result["vat"] == Decimal("7.50")
    assert result["fixed"] == Decimal("82.00")
