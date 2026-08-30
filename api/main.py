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


@app.post("/api/cases/upload", response_model=list[CaseListItem])
def upload_case(document: dict):
    try:
        cases = document.get("cases") if isinstance(document.get("cases"), list) else [document]
        prepared_cases = []
        for case in cases:
            prepared = _prepare_case(case)
            if not prepared.get("case_id"):
                raise ValueError("Every uploaded case must include case_id.")
            validate_case(prepared)
            prepared_cases.append(prepared)

        CASES_CACHE.update({case["case_id"]: case for case in prepared_cases})
        return [CaseListItem(
            case_id=case["case_id"],
            opening_balance=str(case.get("opening_balance_bdt", "0.00")),
            days_count=len(case.get("days", [])),
            recharges_count=len(case.get("recharges", [])),
            today=case["today"],
        ) for case in prepared_cases]
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.post("/api/analyze")
def analyze_uploaded_case(document: dict):
    """Analyze a supplied case without relying on server process memory.

    Vercel may send consecutive requests to different serverless instances, so
    an uploaded case cannot safely live only in CASES_CACHE. The browser keeps
    the original JSON and supplies it with each analysis request instead.
    """
    try:
        raw_case = document.get("case")
        if not isinstance(raw_case, dict):
            raise ValueError("A case object is required.")

        # Work on a JSON copy because validation adds lookup maps to the case.
        case = _prepare_case(json.loads(json.dumps(raw_case)))
        case_id = case.get("case_id")
        if not case_id:
            raise ValueError("The uploaded case must include case_id.")
        validate_case(case)

        timeline = rebuild_balance_timeline(case)
        entries = [TimelineEntry(
            date=entry["date"],
            units=int(case["_days_by_date"][entry["date"]]),
            balance=str(entry["balance_after"]),
            energy_cost=str(entry["energy_cost"]),
            vat=str(entry["vat"]),
            recharge=str(entry.get("recharge_amount_if_any", "0")),
            slab_warning=None,
        ) for entry in timeline]

        requested_units = document.get("daily_units")
        usage = int(case["usual_daily_units"] if requested_units is None else requested_units)
        balance_today = timeline[-1]["balance_after"]
        rod = run_out_date(balance_today, usage, case["today"]) or case["today"]
        today = datetime.fromisoformat(case["today"])
        days_remaining = (datetime.fromisoformat(rod) - today).days

        requested_target = document.get("target_date")
        target_date = case["target_date"] if requested_target is None else str(requested_target)
        recharge = recharge_needed(balance_today, target_date, usage, case["today"])

        habit_a = low_balance_habit(case)
        habit_b = monthly_habit(case)
        habits = [
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

        monthly_costs = {}
        for entry in timeline:
            month = entry["date"][:7]
            monthly_costs[month] = monthly_costs.get(month, Decimal("0.00")) + entry["energy_cost"] + entry["vat"]
        months = sorted(monthly_costs)
        monthly = [MonthlyComparisonEntry(
            period=f"{first} / {second}",
            first_month=first,
            second_month=second,
            first_cost=str(monthly_costs[first].quantize(Decimal("0.01"))),
            second_cost=str(monthly_costs[second].quantize(Decimal("0.01"))),
        ) for first, second in zip(months, months[1:])]

        return {
            "details": CaseDetailsResponse(
                case_id=str(case_id),
                opening_balance=str(case.get("opening_balance_bdt", "0")),
                today=case["today"],
                usual_daily_units=int(case["usual_daily_units"]),
                target_date=case["target_date"],
            ),
            "timeline": entries,
            "run_out": RunOutResponse(run_out_date=rod, days_remaining=days_remaining),
            "recharge": RechargeResponse(
                required_amount=str(recharge["required_amount"]),
                base_energy=str(recharge["base_energy"]),
                slab_penalty=str(recharge["slab_penalty"]),
                fixed_charges=str(recharge["fixed_charges"]),
                vat=str(recharge["vat"]),
                breakdown_valid=True,
            ),
            "comparison": habits,
            "monthly_comparison": monthly,
        }
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
def get_recharge_needed(case_id: str, target_date: Optional[str] = None, daily_units: Optional[int] = None):
    """Get required recharge amount and 4-part breakdown."""
    if case_id not in CASES_CACHE:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    case = CASES_CACHE[case_id]
    try:
        validate_case(case)
        timeline = rebuild_balance_timeline(case)
        balance_today = timeline[-1]["balance_after"]
        usage = int(case["usual_daily_units"] if daily_units is None else daily_units)
        breakdown = recharge_needed(
            balance_today,
            case["target_date"] if target_date is None else target_date,
            usage,
            case["today"],
        )

        return RechargeResponse(
            required_amount=str(breakdown["required_amount"]),
            base_energy=str(breakdown["base_energy"]),
            slab_penalty=str(breakdown["slab_penalty"]),
            fixed_charges=str(breakdown["fixed_charges"]),
            vat=str(breakdown["vat"]),
            breakdown_valid=True,
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
