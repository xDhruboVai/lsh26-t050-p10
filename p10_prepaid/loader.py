from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List


def _parse_decimal(value: Any) -> Decimal:
    """Convert an amount-like input to Decimal without using float."""
    if value is None:
        return Decimal("0.00")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def load_cases(path: str | Path) -> List[Dict[str, Any]]:
    """Load the JSON file"""
    json_path = Path(path)
    document = json.loads(json_path.read_text(encoding="utf-8"))
    cases = document.get("cases")
    if not isinstance(cases, list):
        raise ValueError("Input JSON must contain a top-level 'cases' list.")

    for case in cases:
        case["opening_balance_bdt"] = _parse_decimal(case.get("opening_balance_bdt", "0.00"))
        for recharge in case.get("recharges", []):
            recharge["amount_bdt"] = _parse_decimal(recharge.get("amount_bdt", "0.00"))

    return cases


def validate_case(case: Dict[str, Any]) -> None:
    days = case.get("days")
    if not isinstance(days, list) or not days:
        raise ValueError(f"Case {case.get('case_id')} has no day readings.")

    for index in range(1, len(days)):
        prev_date = datetime.strptime(days[index - 1]["date"], "%Y-%m-%d").date()
        curr_date = datetime.strptime(days[index]["date"], "%Y-%m-%d").date()
        if (curr_date - prev_date).days != 1:
            raise ValueError(f"Case {case.get('case_id')} has a gap or non-consecutive day sequence.")

    case["_days_by_date"] = {row["date"]: int(row["units"]) for row in days}
    case["_recharges_by_date"] = {
        row["date"]: _parse_decimal(row.get("amount_bdt", "0.00"))
        for row in case.get("recharges", [])
    }

    # Ensure the case has the key fields the later stages rely on.
    for required in ["today", "usual_daily_units", "target_date", "comparison"]:
        if required not in case:
            raise ValueError(f"Case {case.get('case_id')} is missing required field: {required}")
