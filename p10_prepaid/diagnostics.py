from __future__ import annotations

from decimal import Decimal
from typing import Dict, List

SLAB_BOUNDARIES = [75, 200, 300, 400, 600]


def slab_warning(month_running_total: int, buffer: int = 10) -> Dict[str, Decimal | int | str | None]:
    """Warn when the household is close to the next monthly tariff boundary."""
    for boundary in SLAB_BOUNDARIES:
        if month_running_total < boundary and boundary - month_running_total <= buffer:
            remaining = boundary - month_running_total
            next_rate = _rate_for_next_boundary(boundary)
            return {
                "warning": f"Approaching slab boundary {boundary}",
                "remaining_in_current_slab": remaining,
                "next_rate": next_rate,
            }
    return {"warning": None, "remaining_in_current_slab": None, "next_rate": None}


def _rate_for_next_boundary(boundary: int) -> Decimal:
    if boundary < 75:
        return Decimal("4.63")
    if boundary < 200:
        return Decimal("5.26")
    if boundary < 300:
        return Decimal("5.63")
    if boundary < 400:
        return Decimal("5.83")
    if boundary < 600:
        return Decimal("9.30")
    return Decimal("10.70")


def monthly_bill_breakdown(month_rows: List[Dict[str, Decimal]]) -> Dict[str, Decimal]:
    """Aggregate energy, VAT, and fixed charges for a single month."""
    energy = sum(Decimal(str(row.get("energy_cost", "0.00"))) for row in month_rows)
    vat = sum(Decimal(str(row.get("vat", "0.00"))) for row in month_rows)
    fixed = sum(Decimal(str(row.get("fixed_charge", "0.00"))) for row in month_rows)
    return {"energy": energy, "vat": vat, "fixed": fixed}
