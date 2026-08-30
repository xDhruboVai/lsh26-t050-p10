from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List


def _parse_decimal(value: Any) -> Decimal:
    if value is None:
        return Decimal("0.00")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def load_cases(path: str | Path) -> List[Dict[str, Any]]:
    """Load a JSON file containing the P10 case list and coerce monetary strings to Decimal."""
    document = json.loads(Path(path).read_text(encoding="utf-8"))
    cases = document.get("cases", [])

    for case in cases:
        case["opening_balance_bdt"] = _parse_decimal(case.get("opening_balance_bdt", "0.00"))
        for item in case.get("recharges", []):
            item["amount_bdt"] = _parse_decimal(item.get("amount_bdt", "0.00"))

    return cases


def validate_case(case: Dict[str, Any]) -> None:
    """Basic validation to guard against malformed dataset inputs."""
    days = case.get("days", [])
    if not days:
        raise ValueError(f"Case {case.get('case_id')} has no days.")

    first_day = datetime.strptime(days[0]["date"], "%Y-%m-%d").date()
    if first_day.day != 1:
        raise ValueError(f"First day in case {case.get('case_id')} is not the 1st of a month.")

    for index in range(1, len(days)):
        prev_date = datetime.strptime(days[index - 1]["date"], "%Y-%m-%d").date()
        curr_date = datetime.strptime(days[index]["date"], "%Y-%m-%d").date()
        if (curr_date - prev_date).days != 1:
            raise ValueError(f"Case {case.get('case_id')} has a gap or non-consecutive date sequence.")

    case["_days_by_date"] = {row["date"]: int(row["units"]) for row in days}
    case["_recharges_by_date"] = {
        row["date"]: _parse_decimal(row.get("amount_bdt", "0.00"))
        for row in case.get("recharges", [])
    }
