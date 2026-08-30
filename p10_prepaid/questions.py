from __future__ import annotations

from decimal import Decimal
from typing import Any, Dict


def run_out_date(balance_today: Decimal, usual_daily_units: int) -> str | None:
    """Estimate when the household balance would run out without further recharge.

    This is a placeholder implementation to be replaced with the exact day-by-day forward
    simulation described in the workflow.
    """
    return None


def recharge_needed(balance_today: Decimal, target_date: str, usual_daily_units: int) -> Decimal:
    """Compute the required recharge amount to last until the target date."""
    return Decimal("0.00")
