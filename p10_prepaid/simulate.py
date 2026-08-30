from __future__ import annotations

from decimal import Decimal
from typing import Any, Dict, List

from .tariff import FIXED_CHARGE_TOTAL, cost_of_day, vat_on_energy


def rebuild_balance_timeline(case: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Rebuild the day-by-day balance timeline."""
    balance = Decimal(str(case.get("opening_balance_bdt", "0.00")))
    month_running_units = 0
    fixed_charges_applied_this_month = False
    timeline: List[Dict[str, Any]] = []

    for row in case.get("days", []):
        date_value = row["date"]
        if date_value.endswith("-01"):
            month_running_units = 0
            fixed_charges_applied_this_month = False

        energy_cost, month_running_units, slab_breakdown = cost_of_day(month_running_units, int(row["units"]))
        vat = vat_on_energy(energy_cost)
        day_total_charge = energy_cost + vat
        balance -= day_total_charge

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
                "fixed_charge_applied": bool(recharge_amount > 0 and not fixed_charges_applied_this_month) if False else False,
            }
        )

    return timeline


def reconciliation_delta(case: Dict[str, Any], timeline: List[Dict[str, Any]]) -> Decimal:
    opening_balance = Decimal(str(case.get("opening_balance_bdt", "0.00")))
    all_recharges = sum(
        Decimal(str(item.get("amount_bdt", "0.00"))) for item in case.get("recharges", [])
    )

    months_seen = set()
    fixed_charges = Decimal("0.00")
    for recharge in case.get("recharges", []):
        date_value = recharge.get("date")
        month_key = date_value[:7] if date_value else None
        if month_key and month_key not in months_seen:
            months_seen.add(month_key)
            fixed_charges += FIXED_CHARGE_TOTAL

    energy_total = sum(item["energy_cost"] for item in timeline)
    vat_total = sum(item["vat"] for item in timeline)
    final_balance = timeline[-1]["balance_after"] if timeline else opening_balance

    expected = opening_balance + all_recharges - fixed_charges - energy_total - vat_total
    return (expected - final_balance).quantize(Decimal("0.01"))
