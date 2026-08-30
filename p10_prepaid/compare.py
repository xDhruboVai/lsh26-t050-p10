from __future__ import annotations

from decimal import Decimal
from typing import Any, Dict


def low_balance_habit(case: Dict[str, Any]) -> Dict[str, Any]:
    """Model the low-balance recharge habit described in the workflow."""
    return {"total_cost": Decimal("0.00"), "fixed_charge_count": 0}


def monthly_habit(case: Dict[str, Any]) -> Dict[str, Any]:
    """Model the fixed monthly recharge habit described in the workflow."""
    return {"total_cost": Decimal("0.00"), "fixed_charge_count": 0}
