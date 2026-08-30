from __future__ import annotations

from decimal import Decimal

from p10_prepaid.recharge_habits import low_balance_habit, monthly_habit


def test_habits_have_identical_energy_costs_under_same_usage():
    case = {
        "case_id": "COMPARE-01",
        "opening_balance_bdt": "0.00",
        "days": [
            {"date": "2026-04-01", "units": 4},
            {"date": "2026-04-02", "units": 5},
            {"date": "2026-04-03", "units": 6},
            {"date": "2026-05-01", "units": 7},
            {"date": "2026-05-02", "units": 8},
            {"date": "2026-05-03", "units": 9},
            {"date": "2026-06-01", "units": 10},
            {"date": "2026-06-02", "units": 11},
            {"date": "2026-06-03", "units": 12},
        ],
        "recharges": [],
        "today": "2026-06-03",
        "usual_daily_units": 8,
        "target_date": "2026-06-30",
        "comparison": {
            "months": ["2026-04", "2026-05", "2026-06"],
            "source": "readings",
            "daily_units": None,
            "opening_balance_bdt": "0.00",
            "low_threshold_bdt": "100.00",
            "low_amount_bdt": "200.00",
            "monthly_amount_bdt": "200.00",
        },
    }

    a = low_balance_habit(case)
    b = monthly_habit(case)

    assert a["energy_total"] == b["energy_total"]
    assert a["vat_total"] == b["vat_total"]
    assert a["fixed_charge_count"] >= 0
    assert b["fixed_charge_count"] >= 0


def test_monthly_habit_counts_fixed_charges_once_per_month():
    case = {
        "case_id": "COMPARE-02",
        "opening_balance_bdt": "0.00",
        "days": [
            {"date": "2026-04-01", "units": 4},
            {"date": "2026-04-02", "units": 5},
            {"date": "2026-05-01", "units": 4},
            {"date": "2026-05-02", "units": 5},
            {"date": "2026-06-01", "units": 4},
            {"date": "2026-06-02", "units": 5},
        ],
        "recharges": [],
        "today": "2026-06-02",
        "usual_daily_units": 5,
        "target_date": "2026-06-30",
        "comparison": {
            "months": ["2026-04", "2026-05", "2026-06"],
            "source": "readings",
            "daily_units": None,
            "opening_balance_bdt": "0.00",
            "low_threshold_bdt": "100.00",
            "low_amount_bdt": "150.00",
            "monthly_amount_bdt": "150.00",
        },
    }

    result = monthly_habit(case)
    assert result["fixed_charge_count"] == 3
    assert result["fixed_total"] == Decimal("246.00")
