from __future__ import annotations

from decimal import Decimal
from typing import Any, Dict, List

from .tariff import cost_of_day, FIXED_CHARGE_TOTAL


def rebuild_balance_timeline(case: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Rebuild the per-day balance timeline for a case.

    This is a scaffold for the deterministic accounting engine described in the workflow.
    """
    balance = case.get("opening_balance_bdt", Decimal("0.00"))
    month_running_units = 0
    fixed_charges_applied_this_month = False
    timeline: List[Dict[str, Any]] = []

    for row in case.get("days", []):
        date_value = row["date"]
        if date_value.endswith("-01"):
            month_running_units = 0
            fixed_charges_applied_this_month = False

        energy_cost, month_running_units, slab_breakdown = cost_of_day(month_running_units, int(row["units"]))
        vat = (energy_cost * Decimal("0.05")).quantize(Decimal("0.01"))
        balance -= energy_cost + vat

        recharge_amount = Decimal(str(case.get("_recharges_by_date", {}).get(date_value, "0.00")))
        if recharge_amount > 0:
            balance += recharge_amount
            if not fixed_charges_applied_this_month:
                balance -= FIXED_CHARGE_TOTAL
                fixed_charges_applied_this_month = True

        timeline.append(
            {
                "date": date_value,
                "balance_after": balance,
                "energy_cost": energy_cost,
                "vat": vat,
                "recharge_amount_if_any": recharge_amount,
                "slab_breakdown": slab_breakdown,
            }
        )

    return timeline
