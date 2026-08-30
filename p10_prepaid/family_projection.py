from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

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
) -> Decimal:
    """Compute the smallest recharge needed so the balance stays non-negative through target_date."""
    if usual_daily_units < 0:
        raise ValueError("usual_daily_units must be non-negative")

    target = datetime.strptime(target_date, "%Y-%m-%d").date()
    balance = Decimal(balance_today)
    month_running_units = 0
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    total_cost = Decimal("0.00")

    while current_date.date() <= target:
        if current_date.day == 1:
            month_running_units = 0
        energy_cost, month_running_units, _ = cost_of_day(month_running_units, usual_daily_units)
        total_cost += energy_cost + vat_on_energy(energy_cost)
        current_date += timedelta(days=1)

    required = max(Decimal("0.00"), total_cost - balance)
    return required.quantize(Decimal("0.01"))
