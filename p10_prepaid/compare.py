from __future__ import annotations

from calendar import monthrange
from datetime import date
from decimal import Decimal
from typing import Any, Dict, Iterable, List

from .tariff import FIXED_CHARGE_TOTAL, cost_of_day, vat_on_energy


def _comparison_days(case: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return the dated daily-unit stream for the comparison window."""
    comparison = case.get("comparison", {})
    target_months = set(comparison.get("months", []))
    source = comparison.get("source", "readings")

    if source == "readings":
        items: List[Dict[str, Any]] = []
        for row in case.get("days", []):
            day_key = row["date"][:7]
            if day_key in target_months:
                items.append({"date": row["date"], "units": int(row["units"])})
        return items

    flat_units = int(comparison.get("daily_units") or case.get("usual_daily_units", 0))
    items = []
    for month in sorted(target_months):
        year, month_num = map(int, month.split("-"))
        days_in_month = monthrange(year, month_num)[1]
        for day in range(1, days_in_month + 1):
            items.append({
                "date": date(year, month_num, day).isoformat(),
                "units": flat_units,
            })
    return items


def _run_habit(case: Dict[str, Any], mode: str) -> Dict[str, Any]:
    comparison = case.get("comparison", {})
    balance = Decimal(str(comparison.get("opening_balance_bdt", "0.00")))
    threshold = Decimal(str(comparison.get("low_threshold_bdt", "0.00")))
    low_amount = Decimal(str(comparison.get("low_amount_bdt", "0.00")))
    monthly_amount = Decimal(str(comparison.get("monthly_amount_bdt", "0.00")))

    month_running_units = 0
    fixed_charges_applied_this_month = False
    energy_total = Decimal("0.00")
    vat_total = Decimal("0.00")
    fixed_total = Decimal("0.00")
    fixed_charge_count = 0

    for row in _comparison_days(case):
        date_value = row["date"]
        if date_value.endswith("-01"):
            month_running_units = 0
            fixed_charges_applied_this_month = False

        if mode == "low_balance":
            if balance < threshold:
                balance += low_amount
                if not fixed_charges_applied_this_month:
                    balance -= FIXED_CHARGE_TOTAL
                    fixed_total += FIXED_CHARGE_TOTAL
                    fixed_charge_count += 1
                    fixed_charges_applied_this_month = True
        elif mode == "monthly":
            if date_value.endswith("-01"):
                balance += monthly_amount
                if not fixed_charges_applied_this_month:
                    balance -= FIXED_CHARGE_TOTAL
                    fixed_total += FIXED_CHARGE_TOTAL
                    fixed_charge_count += 1
                    fixed_charges_applied_this_month = True
        else:
            raise ValueError(f"Unknown habit mode: {mode}")

        energy_cost, month_running_units, _ = cost_of_day(month_running_units, int(row["units"]))
        vat = vat_on_energy(energy_cost)
        balance -= energy_cost + vat
        energy_total += energy_cost
        vat_total += vat

    total_cost = energy_total + vat_total + fixed_total
    return {
        "total_cost": total_cost,
        "energy_total": energy_total,
        "vat_total": vat_total,
        "fixed_total": fixed_total,
        "fixed_charge_count": fixed_charge_count,
        "final_balance": balance,
    }


def low_balance_habit(case: Dict[str, Any]) -> Dict[str, Any]:
    """Model the low-balance recharge habit described in Section 5.2."""
    return _run_habit(case, "low_balance")


def monthly_habit(case: Dict[str, Any]) -> Dict[str, Any]:
    """Model the fixed monthly recharge habit described in Section 5.3."""
    return _run_habit(case, "monthly")
