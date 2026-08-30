from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict

from .tariff import FIXED_CHARGE_TOTAL, cost_of_day, vat_on_energy


def run_out_date(
    balance_today: Decimal,
    usual_daily_units: int,
    start_date: str = "2026-01-01",
) -> str | None:
    """Return the date when the balance would first go non-positive without further recharge."""
    if usual_daily_units < 0:
        raise ValueError("usual_daily_units must be non-negative")

    balance = Decimal(balance_today)
    month_running_units = 0
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    while balance > 0:
        if current_date.day == 1:
            month_running_units = 0
        energy_cost, month_running_units, _ = cost_of_day(month_running_units, usual_daily_units)
        vat = vat_on_energy(energy_cost)
        balance -= energy_cost + vat
        if balance <= 0:
            return current_date.isoformat()
        current_date += timedelta(days=1)
    return None


def recharge_needed(
    balance_today: Decimal,
    target_date: str,
    usual_daily_units: int,
    start_date: str = "2026-01-01",
) -> Dict[str, Decimal]:
    """Compute the smallest recharge needed so the balance stays non-negative through target_date.

    Returns a breakdown dict:
      {required_amount, base_energy, fixed_charges, vat}
    base_energy here equals the actual total energy cost (no separate slab penalty line).
    All values are Decimal quantized to 2 decimal places.
    """
    if usual_daily_units < 0:
        raise ValueError("usual_daily_units must be non-negative")

    target = datetime.strptime(target_date, "%Y-%m-%d").date()
    month_running_units = 0
    current_date = datetime.strptime(start_date, "%Y-%m-%d")

    actual_energy = Decimal("0.00")
    months_spanned: set[str] = set()

    while current_date.date() <= target:
        months_spanned.add(current_date.strftime("%Y-%m"))
        if current_date.day == 1:
            month_running_units = 0
        energy_cost, month_running_units, _ = cost_of_day(month_running_units, usual_daily_units)
        actual_energy += energy_cost
        current_date += timedelta(days=1)

    vat_total = vat_on_energy(actual_energy)
    fixed = (FIXED_CHARGE_TOTAL * Decimal(len(months_spanned))).quantize(Decimal("0.01"))

    total_needed = (actual_energy + vat_total + fixed).quantize(Decimal("0.01"))
    required = (total_needed - Decimal(balance_today)).quantize(Decimal("0.01"))
    if required < 0:
        required = Decimal("0.00")

    return {
        "required_amount": required,
        "base_energy": actual_energy.quantize(Decimal("0.01")),
        "fixed_charges": fixed,
        "vat": vat_total.quantize(Decimal("0.01")),
    }
