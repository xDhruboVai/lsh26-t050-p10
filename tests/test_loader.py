from __future__ import annotations

import json
from decimal import Decimal

import pytest

from p10_prepaid.loader import load_cases, validate_case


def test_load_cases_requires_cases_list(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text(json.dumps({"schema_version": "2.1"}), encoding="utf-8")

    with pytest.raises(ValueError, match="cases"):
        load_cases(path)


def test_validate_case_rejects_non_consecutive_days():
    case = {
        "case_id": "PUB-99",
        "opening_balance_bdt": "100.00",
        "days": [
            {"date": "2026-01-01", "units": 5},
            {"date": "2026-01-03", "units": 6},
        ],
        "recharges": [],
    }

    with pytest.raises(ValueError, match="non-consecutive|gap"):
        validate_case(case)


def test_load_cases_coerces_money_to_decimal_and_builds_lookup_maps(tmp_path):
    path = tmp_path / "cases.json"
    payload = {
        "cases": [
            {
                "case_id": "PUB-01",
                "opening_balance_bdt": "310.00",
                "days": [
                    {"date": "2026-01-01", "units": 3},
                    {"date": "2026-01-02", "units": 4},
                ],
                "recharges": [
                    {"date": "2026-01-02", "amount_bdt": "100.00"},
                ],
                "today": "2026-01-02",
                "usual_daily_units": 5,
                "target_date": "2026-01-10",
                "comparison": {
                    "months": ["2026-01"],
                    "source": "readings",
                    "daily_units": None,
                    "opening_balance_bdt": "0.00",
                    "low_threshold_bdt": "100.00",
                    "low_amount_bdt": "200.00",
                    "monthly_amount_bdt": "200.00",
                },
            }
        ]
    }
    path.write_text(json.dumps(payload), encoding="utf-8")

    cases = load_cases(path)
    assert cases[0]["opening_balance_bdt"] == Decimal("310.00")
    assert cases[0]["recharges"][0]["amount_bdt"] == Decimal("100.00")
    validate_case(cases[0])
    assert cases[0]["_days_by_date"]["2026-01-02"] == 4
    assert cases[0]["_recharges_by_date"]["2026-01-02"] == Decimal("100.00")
