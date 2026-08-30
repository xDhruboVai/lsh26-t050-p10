from __future__ import annotations

from decimal import Decimal

from p10_prepaid.balance_rebuild import rebuild_balance_timeline, reconciliation_delta
from p10_prepaid.loader import validate_case


def test_rebuild_balance_timeline_reconciles():
    case = {
        "case_id": "PUB-TEST",
        "opening_balance_bdt": "200.00",
        "days": [
            {"date": "2026-01-01", "units": 5},
            {"date": "2026-01-02", "units": 10},
            {"date": "2026-01-03", "units": 3},
        ],
        "recharges": [
            {"date": "2026-01-02", "amount_bdt": "250.00"},
        ],
        "today": "2026-01-03",
        "usual_daily_units": 6,
        "target_date": "2026-01-12",
        "comparison": {
            "months": ["2026-01"],
            "source": "readings",
            "daily_units": None,
            "opening_balance_bdt": "0.00",
            "low_threshold_bdt": "100.00",
            "low_amount_bdt": "150.00",
            "monthly_amount_bdt": "150.00",
        },
    }
    validate_case(case)

    timeline = rebuild_balance_timeline(case)
    final_balance = timeline[-1]["balance_after"]
    delta = reconciliation_delta(case, timeline)

    assert delta == Decimal("0.00")
    assert final_balance == Decimal("200.00") + Decimal("250.00") - Decimal("82.00") - sum(
        item["energy_cost"] for item in timeline
    ) - sum(item["vat"] for item in timeline)


def test_rebuild_balance_timeline_has_daily_entries_and_recharge_marker():
    case = {
        "case_id": "PUB-TEST-2",
        "opening_balance_bdt": "150.00",
        "days": [
            {"date": "2026-02-01", "units": 2},
            {"date": "2026-02-02", "units": 4},
        ],
        "recharges": [
            {"date": "2026-02-02", "amount_bdt": "200.00"},
        ],
        "today": "2026-02-02",
        "usual_daily_units": 3,
        "target_date": "2026-02-08",
        "comparison": {
            "months": ["2026-02"],
            "source": "readings",
            "daily_units": None,
            "opening_balance_bdt": "0.00",
            "low_threshold_bdt": "50.00",
            "low_amount_bdt": "100.00",
            "monthly_amount_bdt": "100.00",
        },
    }
    validate_case(case)

    timeline = rebuild_balance_timeline(case)
    assert len(timeline) == 2
    assert timeline[1]["recharge_amount_if_any"] == Decimal("200.00")


def test_reconciliation_counts_fixed_charges_once_per_month():
    case = {
        "case_id": "PUB-TEST-3",
        "opening_balance_bdt": "100.00",
        "days": [
            {"date": "2026-03-01", "units": 5},
            {"date": "2026-03-02", "units": 5},
            {"date": "2026-03-03", "units": 5},
        ],
        "recharges": [
            {"date": "2026-03-01", "amount_bdt": "80.00"},
            {"date": "2026-03-02", "amount_bdt": "60.00"},
        ],
        "today": "2026-03-03",
        "usual_daily_units": 5,
        "target_date": "2026-03-10",
        "comparison": {
            "months": ["2026-03"],
            "source": "readings",
            "daily_units": None,
            "opening_balance_bdt": "0.00",
            "low_threshold_bdt": "40.00",
            "low_amount_bdt": "100.00",
            "monthly_amount_bdt": "100.00",
        },
    }
    validate_case(case)
    timeline = rebuild_balance_timeline(case)

    assert reconciliation_delta(case, timeline) == Decimal("0.00")
