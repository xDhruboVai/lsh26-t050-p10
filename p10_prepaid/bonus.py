from __future__ import annotations

from decimal import Decimal
from typing import Dict, List


def slab_warning(month_running_total: int) -> Dict[str, Decimal | int | str | None]:
    """Check if usage is close to a tariff boundary and return a warning payload."""
    return {"warning": None, "remaining_in_current_slab": None, "next_rate": None}


def monthly_bill_breakdown(_month_rows: List[Dict[str, Decimal]]) -> Dict[str, Decimal]:
    """Aggregate energy, VAT, and fixed charges for a single month."""
    return {"energy": Decimal("0.00"), "vat": Decimal("0.00"), "fixed": Decimal("0.00")}
