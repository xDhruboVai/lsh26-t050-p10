"""FastAPI backend for P10 Prepaid Meter Advisor."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
from decimal import Decimal
from datetime import datetime, timedelta
import json

from p10_prepaid.loader import load_cases, validate_case
from p10_prepaid.balance_rebuild import rebuild_balance_timeline, reconciliation_delta
from p10_prepaid.family_projection import run_out_date, recharge_needed
from p10_prepaid.recharge_habits import low_balance_habit, monthly_habit
from p10_prepaid.diagnostics import slab_warning, monthly_bill_breakdown

app = FastAPI(title="P10 Prepaid Meter Advisor", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load cases once at startup
DATA_PATH = Path(__file__).parent.parent / "data" / "data.json"
CASES_CACHE = {}


def _prepare_case(case):
    if case.get("days"):
        case.setdefault("today", case["days"][-1]["date"])
        case.setdefault(
            "usual_daily_units",
            max(1, round(sum(int(row["units"]) for row in case["days"]) / len(case["days"])))
        )
        case.setdefault(
            "target_date",
            (datetime.fromisoformat(case["today"]) + timedelta(days=30)).date().isoformat(),
        )
        case.setdefault("comparison", {
            "months": sorted({row["date"][:7] for row in case["days"]})[-3:],
            "source": "readings",
            "daily_units": None,
            "opening_balance_bdt": "0.00",
            "low_threshold_bdt": "100.00",
            "low_amount_bdt": "200.00",
            "monthly_amount_bdt": "200.00",
        })
    return case

try:
    CASES_CACHE = {case["case_id"]: _prepare_case(case) for case in load_cases(str(DATA_PATH))}
except Exception as e:
    print(f"Warning: could not load cases: {e}")


# Models
class CaseListItem(BaseModel):
    case_id: str
    opening_balance: str
    days_count: int
    recharges_count: int
    today: str


class TimelineEntry(BaseModel):
    date: str
    units: int
    balance: str
    energy_cost: str
    vat: str
    recharge: str
    slab_warning: Optional[str] = None


class RunOutResponse(BaseModel):
    run_out_date: str
    days_remaining: int


class RechargeResponse(BaseModel):
    required_amount: str
    base_energy: str
    slab_penalty: str
    fixed_charges: str
    vat: str
    breakdown_valid: bool


class ComparisonEntry(BaseModel):
    habit: str
    total_cost: str
    energy_cost: str
    vat: str
    fixed_charges: str
    fixed_charge_count: int
    recharge_total: str


class MonthlyComparisonEntry(BaseModel):
    period: str
    first_month: str
    second_month: str
    first_cost: str
    second_cost: str


class CaseDetailsResponse(BaseModel):
    case_id: str
    opening_balance: str
    today: str
    usual_daily_units: int
    target_date: str


# Endpoints
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/cases", response_model=list[CaseListItem])
def list_cases():
    """List all available cases."""
    if not CASES_CACHE:
        raise HTTPException(status_code=404, detail="No cases loaded")
    
    items = []
    for case_id, case in CASES_CACHE.items():
        items.append(CaseListItem(
            case_id=case_id,
            opening_balance=str(case.get("opening_balance_bdt", "0")),
            days_count=len(case.get("days", [])),
            recharges_count=len(case.get("recharges", [])),
            today=case.get("today", ""),
        ))
    return sorted(items, key=lambda x: x.case_id)


@app.post("/api/cases/upload", response_model=CaseListItem)
def upload_case(case: dict):
    try:
        prepared = _prepare_case(case)
        if not prepared.get("case_id"):
            raise ValueError("Uploaded case must include case_id.")
        validate_case(prepared)
        CASES_CACHE[prepared["case_id"]] = prepared
        return CaseListItem(
            case_id=prepared["case_id"],
            opening_balance=str(prepared.get("opening_balance_bdt", "0.00")),
            days_count=len(prepared.get("days", [])),
            recharges_count=len(prepared.get("recharges", [])),
            today=prepared["today"],
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/api/cases/{case_id}", response_model=CaseDetailsResponse)
def get_case_details(case_id: str):
    """Get case metadata."""
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    
    case = CASES_CACHE[case_id]
    return CaseDetailsResponse(
        case_id=case_id,
        opening_balance=str(case.get("opening_balance_bdt", "0")),
        today=case.get("today", ""),
        usual_daily_units=int(case.get("usual_daily_units", 0)),
        target_date=case.get("target_date", ""),
    )


@app.get("/api/timeline/{case_id}", response_model=list[TimelineEntry])
def get_timeline(case_id: str):
    """Get balance timeline for a case."""
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    
    case = CASES_CACHE[case_id]
    try:
        validate_case(case)
        timeline = rebuild_balance_timeline(case)
        
        entries = []
        for entry in timeline:
            entries.append(TimelineEntry(
                date=entry["date"],
                units=int(case["_days_by_date"][entry["date"]]),
                balance=str(entry["balance_after"]),
                energy_cost=str(entry["energy_cost"]),
                vat=str(entry["vat"]),
                recharge=str(entry.get("recharge_amount_if_any", "0")),
                slab_warning=None,
            ))
        return entries
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/run-out/{case_id}", response_model=RunOutResponse)
def get_run_out(case_id: str, daily_units: Optional[int] = None):
    """Get run-out date for a case."""
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    
    case = CASES_CACHE[case_id]
    try:
        validate_case(case)
        timeline = rebuild_balance_timeline(case)
        balance_today = timeline[-1]["balance_after"]
        usage = int(case["usual_daily_units"] if daily_units is None else daily_units)
        rod = run_out_date(
            balance_today,
            usage,
            case["today"],
        )
        if rod is None:
            rod = case["today"]
        
        from datetime import datetime
        today = datetime.fromisoformat(case["today"])
        delta_days = (datetime.fromisoformat(rod) - today).days
        
        return RunOutResponse(
            run_out_date=rod,
            days_remaining=delta_days,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/recharge-needed/{case_id}", response_model=RechargeResponse)
def get_recharge_needed(case_id: str, target_date: Optional[str] = None):
    """Get required recharge amount and breakdown."""
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    
    case = CASES_CACHE[case_id]
    try:
        validate_case(case)
        timeline = rebuild_balance_timeline(case)
        balance_today = timeline[-1]["balance_after"]
        result = recharge_needed(
            balance_today,
            case["target_date"] if target_date is None else target_date,
            int(case["usual_daily_units"]),
            case["today"],
        )
        
        return RechargeResponse(
            required_amount=str(result),
            base_energy=str(result),
            slab_penalty="0.00",
            fixed_charges="0.00",
            vat="0.00",
            breakdown_valid=False,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/comparison/{case_id}", response_model=list[ComparisonEntry])
def get_habit_comparison(case_id: str):
    """Get habit comparison (low balance vs monthly)."""
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    
    case = CASES_CACHE[case_id]
    try:
        validate_case(case)
        
        habit_a = low_balance_habit(case)
        habit_b = monthly_habit(case)
        
        return [
            ComparisonEntry(
                habit="Low Balance Reactive",
                total_cost=str(habit_a["total_cost"]),
                energy_cost=str(habit_a["energy_total"]),
                vat=str(habit_a["vat_total"]),
                fixed_charges=str(habit_a["fixed_total"]),
                fixed_charge_count=habit_a["fixed_charge_count"],
                recharge_total=str(habit_a["recharge_total"]),
            ),
            ComparisonEntry(
                habit="Monthly Proactive",
                total_cost=str(habit_b["total_cost"]),
                energy_cost=str(habit_b["energy_total"]),
                vat=str(habit_b["vat_total"]),
                fixed_charges=str(habit_b["fixed_total"]),
                fixed_charge_count=habit_b["fixed_charge_count"],
                recharge_total=str(habit_b["recharge_total"]),
            ),
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/comparison-monthly/{case_id}", response_model=list[MonthlyComparisonEntry])
def get_monthly_comparison(case_id: str):
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    try:
        case = CASES_CACHE[case_id]
        validate_case(case)
        timeline = rebuild_balance_timeline(case)
        monthly_costs = {}
        for entry in timeline:
            month = entry["date"][:7]
            monthly_costs[month] = monthly_costs.get(month, Decimal("0.00")) + entry["energy_cost"] + entry["vat"]
        months = sorted(monthly_costs)
        return [MonthlyComparisonEntry(
            period=f"{first} / {second}",
            first_month=first,
            second_month=second,
            first_cost=str(monthly_costs[first].quantize(Decimal("0.01"))),
            second_cost=str(monthly_costs[second].quantize(Decimal("0.01"))),
        ) for first, second in zip(months, months[1:])]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
