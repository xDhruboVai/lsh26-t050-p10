from __future__ import annotations

from decimal import Decimal
from typing import Dict, List, Tuple

SLAB_TABLE: List[Tuple[int, int, Decimal]] = [
    (1, 75, Decimal("4.63")),
    (76, 200, Decimal("5.26")),
    (201, 300, Decimal("5.63")),
    (301, 400, Decimal("5.83")),
    (401, 600, Decimal("9.30")),
    (601, 10_000_000, Decimal("10.70")),
]

FIXED_CHARGE_DEMAND = Decimal("42.00")
FIXED_CHARGE_RENT = Decimal("40.00")
FIXED_CHARGE_TOTAL = FIXED_CHARGE_DEMAND + FIXED_CHARGE_RENT
VAT_RATE = Decimal("0.05")


def vat_on_energy(energy_cost: Decimal) -> Decimal:
    """Return 5% VAT on the energy component only."""
    return (energy_cost * VAT_RATE).quantize(Decimal("0.01"))


def slab_rate_for_cumulative(units_used: int) -> Decimal:
    """Return the tariff rate for a given month cumulative unit count."""
    for lower, upper, rate in SLAB_TABLE:
        if lower <= units_used <= upper:
            return rate
    if units_used > 600:
        return Decimal("10.70")
    raise ValueError(f"Unsupported cumulative usage: {units_used}")


def slab_for_cumulative(units_used: int) -> Tuple[int, int, Decimal]:
    """Return the slab definition that contains the cumulative unit count."""
    for lower, upper, rate in SLAB_TABLE:
        if lower <= units_used <= upper:
            return lower, upper, rate
    if units_used > 600:
        return 601, 10_000_000, Decimal("10.70")
    raise ValueError(f"Unsupported cumulative usage: {units_used}")


def cost_of_day(month_running_total_before_today: int, units_today: int):
    """
    Compute the energy cost for a single day's usage while respecting monthly slab boundaries.

    The slab counter is cumulative within a calendar month. A recharge never resets it.
    """
    if units_today < 0:
        raise ValueError("units_today must be non-negative")

    running_total = month_running_total_before_today
    total_cost = Decimal("0.00")
    breakdown: Dict[str, int] = {}
    remaining = units_today

    while remaining > 0:
        lower, upper, rate = slab_for_cumulative(running_total + 1)
        if upper >= 10_000_000:
            units_in_this_slice = remaining
        else:
            units_in_this_slice = min(remaining, upper - running_total)

        if units_in_this_slice <= 0:
            raise ValueError(f"Invalid slice calculation for running_total={running_total}, units_today={units_today}")

        total_cost += Decimal(units_in_this_slice) * rate
        label = f"{lower}-{upper if upper < 10_000_000 else '∞'}"
        breakdown[label] = breakdown.get(label, 0) + units_in_this_slice
        running_total += units_in_this_slice
        remaining -= units_in_this_slice

    return total_cost.quantize(Decimal("0.01")), running_total, breakdown


def fixed_charge_for_month_first_recharge() -> Decimal:
    """Return the fixed charges triggered once on the first recharge in a calendar month."""
    return FIXED_CHARGE_TOTAL
