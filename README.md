# P10 Prepaid Meter Recharge Advisor

A deterministic prepaid meter billing engine with an industrial-grade web UI. This project implements the exact prepaid meter policy using `Decimal` arithmetic and fixed tariff rules. No machine learning or forecasting is used for core calculations.

**Event:** LSH26 Problem-Solving Challenge  
**Team:** LSH26-T050  
**Problem:** P10 (Prepaid Meter Recharge Advisor)  
**Event Start Code:** LSH26-8490-C900  
**Live URL:** hackathon-p10.vercel.app

## Problem Overview

A family in Dhaka runs on a prepaid electricity meter with tiered pricing that resets monthly. Electricity costs more per unit the more the household uses in a calendar month. When the meter "beeps" (balance low), the family recharges, often a large amount late in the month, paying the highest slab rates without visibility into actual costs.

**The tool solves four required problems:**

1. **Data Creation** — Household with 6+ months of daily readings and recharge history, including light month, heavy summer month, and large late-month recharge
2. **Balance Reconstruction** — Day-by-day timeline showing actual meter balance with slab-based tariff charges, fixed monthly charges, and VAT
3. **Family Questions** — When will balance run out? How much to recharge now to last until a target date? (with cost breakdown)
4. **Habit Comparison** — Compare low-balance reactive recharging vs proactive monthly recharging on identical consumption over 3 months; show actual cost difference

**Plus optional bonuses:** Slab-crossing warnings, real meter data reconciliation, bill breakdown.

The application consists of three layers:
1. **Python billing engine** — Deterministic calculations against fixed tariff rules
2. **FastAPI backend** — REST API exposing billing functions
3. **React + TypeScript frontend** — Neumorphic, premium UI with dark/light modes

## Key Features

- ✅ **Exact Tariff Implementation** — Five-tier slab pricing (1-75, 76-200, 201-300, 301-400, 401-600, 601+) per 2026 Bangladesh tariff
- ✅ **Deterministic Calculations** — `Decimal` arithmetic ensures financial accuracy; no floating-point rounding errors
- ✅ **Monthly Slab Reset** — Slab counter resets on day 1 of each month, not on recharge (critical rule)
- ✅ **Fixed Charges & VAT** — Demand charge (42 BDT), meter rent (40 BDT), VAT (5% on energy only)
- ✅ **Balance Timeline** — Interactive chart showing day-by-day meter balance with recharges marked
- ✅ **Run-Out Date Calculation** — Predicts when balance exhausts based on current usage habits
- ✅ **Recharge Sizing** — Calculates exact amount needed to last until a user-selected date, with cost breakdown by component
- ✅ **Habit Comparison** — Compares two recharge strategies (reactive low-balance vs proactive monthly) on identical consumption
- ✅ **Bonus: Slab Warnings** — Alerts user when monthly total approaches next slab threshold
- ✅ **Bonus: Bill Breakdown** — Shows energy amount, demand charge, meter rent, VAT, and total for any period
- ✅ **Light/Dark Themes** — Premium neumorphic UI with full dual-theme support

## Problem Solving Method

The approach prioritized **exact specification compliance** and **deterministic correctness**:

1. **Tariff Engine First** — Implemented slab pricing, fixed charges, and VAT logic in isolation with comprehensive unit tests
2. **Slab Tracking Model** — Built day-by-day balance reconstruction to track cumulative units and slab boundaries, with month-boundary resets
3. **Projection Engine** — Direct calculation of run-out dates and recharge amounts (no simulation or iterative guessing)
4. **Comparison Framework** — Identical consumption model ensures no artificial slab arbitrage; difference only from fixed-charge count
5. **Full-Stack API** — REST endpoints expose all engine functions for the frontend to call
6. **Interactive UI** — React components consume API and visualize results with Recharts for timeline and comparison charts

## Workspace layout

```
project-root/
├── data/
│   ├── data.json                          — built-in case dataset
│   ├── P10_Prepaid_Meter_Workflow.md      — specification
│   └── EVENT.md                           — event log
├── p10_prepaid/                           — Python billing engine
│   ├── tariff.py                          — slab pricing, VAT, fixed charges
│   ├── loader.py                          — JSON parsing, validation
│   ├── balance_rebuild.py                 — day-by-day timeline reconstruction
│   ├── family_projection.py               — run-out date and recharge sizing
│   ├── recharge_habits.py                 — habit comparison (low-balance vs monthly)
│   ├── diagnostics.py                     — slab warnings, bill breakdown
│   ├── main.py                            — CLI entry point
│   └── __init__.py
├── api/
│   └── main.py                            — FastAPI server
├── frontend/                              — React UI
│   ├── src/
│   │   ├── App.tsx                        — main app component
│   │   ├── theme.ts                       — neumorphic design system
│   │   ├── api.ts                         — API client
│   │   ├── main.tsx                       — entry point
│   │   ├── index.css                      — global styles
│   │   ├── tariffReference.ts             — tariff calculator logic
│   │   ├── components/
│   │   │   └── Navigation.tsx             — sidebar navigation
│   │   └── pages/
│   │       ├── Dashboard.tsx              — case selector
│   │       ├── Timeline.tsx               — balance chart + table
│   │       ├── Projection.tsx             — run-out date + recharge breakdown
│   │       ├── Comparison.tsx             — habit comparison
│   │       ├── Questions.tsx               — planning answers and confirmations
│   │       ├── TariffReference.tsx         — tariff reference and calculator
│   │       └── Settings.tsx               — theme toggle
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── tests/                                 — Python unit tests
│   ├── test_tariff.py
│   ├── test_loader.py
│   ├── test_simulate.py
│   ├── test_questions.py
│   ├── test_compare.py
│   └── test_bonus.py
├── requirements.txt                       — Python dependencies (engine)
├── requirements-api.txt                   — Python dependencies (FastAPI)
├── script.sh                              — one-command local launcher
└── README.md                              — this file
```

## Setup Instructions

### 1. Python Environment (Billing Engine + FastAPI Backend)

From the project root, create and activate a Python virtual environment:

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Windows cmd or Git Bash)
.venv\Scripts\activate

# Activate (macOS/Linux bash)
source .venv/Scripts/activate
```

Install Python dependencies:

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install billing engine dependencies
python -m pip install -r requirements.txt

# Install FastAPI server dependencies
python -m pip install -r requirements-api.txt
```

### 2. Node.js Environment (React Frontend)

Ensure you have Node.js 18+ installed. Check with:
```bash
node --version
```

Then install frontend dependencies:

```bash
cd frontend
npm install
```

## Running the Application Locally

### One-command startup

From Git Bash at the project root, run:

```bash
bash script.sh
```

The script creates or reuses `.venv`, installs Python and frontend dependencies, starts both servers, and prints the application URL. Open `http://localhost:3000`, then press `Ctrl+C` in Git Bash to stop everything. This launcher is intended for Git Bash on Windows or a Unix-like shell.

The billing engine is imported by the FastAPI backend, so the launcher starts two processes: the API and the React frontend.

### Terminal 1: Start FastAPI Backend

```bash
# From project root, ensure Python venv is activated
.venv\Scripts\activate           # Windows
# or
source .venv/Scripts/activate    # Git Bash/macOS/Linux

# Run FastAPI server on port 8000
python -m uvicorn api.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API docs will be at `http://localhost:8000/docs`

### Terminal 2: Start React Development Server

```bash
# From the frontend directory
cd frontend
npm run dev
```

The UI will be available at `http://localhost:3000`

### Terminal 3: Run Tests (Optional)

While the servers are running, you can validate the engine in another terminal:

```bash
# From project root, ensure Python venv is activated
.venv\Scripts\activate           # Windows
# or
source .venv/Scripts/activate    # Git Bash/macOS/Linux

# Run all unit tests
python -m pytest -q
```

All tests should pass (19 passed in ~0.09s).

## User Workflow

1. Open browser to `http://localhost:3000`
2. **Dashboard** page loads automatically
3. Select a built-in case from the dropdown, or upload your own JSON case
4. Click a case card to view **Usage Timeline**
5. Use the sidebar to navigate between:
   - **Usage Timeline** — Monthly sections, daily balance chart, usage tags, and data table
   - **Recharge Planner** — Run-out date and required recharge amount
   - **Habit Comparison** — Reactive versus proactive recharge strategies
   - **Power Planning Hub** — Confirm usage and target-date assumptions
   - **Tariff Reference** — Slab rates and interactive cost calculator
   - **Settings** — Theme toggle (light/dark mode)

## API Endpoints

The FastAPI backend exposes the following REST endpoints:

- `GET /api/health` — Server health check
- `GET /api/cases` — List all built-in and uploaded cases with metadata
- `GET /api/cases/{case_id}` — Get case details
- `GET /api/timeline/{case_id}` — Get balance timeline (date, balance, energy cost, VAT, recharges)
- `GET /api/run-out/{case_id}` — Get balance run-out date and days remaining
- `GET /api/recharge-needed/{case_id}` — Get the required recharge amount
- `GET /api/comparison/{case_id}` — Get habit comparison (low-balance reactive vs monthly proactive)
- `GET /api/comparison-monthly/{case_id}` — Get adjacent-month energy cost pairs for charting
- `POST /api/cases/upload` — Validate and add a judge-provided JSON case for the current session

All endpoints return JSON. See [api/main.py](api/main.py) for full Pydantic models.

## Implementation Status

All workflow sections 1 through 6 are implemented and tested:

1. **Tariff Engine** — Fixed slab pricing, VAT (5% on energy only), fixed monthly charges
2. **Data Loader** — JSON parsing with Decimal conversion, date validation
3. **Balance Rebuild** — Day-by-day timeline with slab counter reset on month boundaries
4. **Family Projections** — Run-out date and recharge sizing (direct calculation)
5. **Habit Comparison** — Low-balance reactive vs monthly proactive strategies
6. **Diagnostics** — Slab warnings, monthly bill breakdowns

All 19 unit tests pass. See [tests/](tests/) for validation suite.

## Design Notes

- **No Machine Learning** — This is deterministic financial simulation. All outputs are exact and reproducible.
- **Decimal Arithmetic** — All currency values use Python's `decimal.Decimal` to avoid floating-point rounding errors.
- **Slab Reset Logic** — Slab counter resets only on the 1st of each calendar month, never on recharges.
- **Fixed Charges** — 42 BDT (demand charge) + 40 BDT (meter rent) = 82 BDT, triggered once per month on the first recharge date.
- **VAT** — Applied only to energy cost (not to fixed charges), at 5% of the actual (slab-adjusted) energy amount.

## Frontend Architecture

- **Design System** — Neumorphic aesthetic with a premium utility feel
- **Light/Dark Modes** — Full dual-theme support with localStorage persistence
- **Multi-Page Layout** — Sidebar navigation with overview, timeline, planner, comparison, reference, and settings pages
- **Charts** — Interactive visualizations using Recharts
- **Type Safety** — Full TypeScript throughout frontend and API client
- **Direct UI** — Professional labels, interactive controls, and no placeholder screens

### Design and interaction

- The interface uses neumorphic raised and recessed surfaces with light and dark themes.
- The color tokens and surface styles are centralized in `frontend/src/theme.ts`.
- The sidebar links to the household overview, usage timeline, recharge planner, habit comparison, Power Planning Hub, tariff reference, and settings.
- Timeline months and planning sections can be expanded or collapsed.
- Planning controls require confirmation before recalculating usage projections.
- Charts use Recharts and update from the FastAPI responses.
- Uploaded JSON cases are validated and stored for the current server session only.

The application uses React Router for navigation, Axios for API requests, and TypeScript for the frontend contract.

## Troubleshooting

**API returns 404 "No cases loaded"**
- Ensure `data/data.json` exists and is valid JSON
- Check that Python venv is activated and FastAPI is running on port 8000

**Frontend shows blank pages**
- Ensure React dev server is running on port 3000
- Check browser console for errors
- Try `npm run build` if development server is unresponsive

**"Address already in use" error**
- Port 8000 or 3000 is occupied by another process
- Kill the conflicting process or change the port in `api/main.py` or `frontend/vite.config.ts`

**pytest fails**
- Ensure all Python dependencies are installed: `pip install -r requirements.txt`
- Verify Python 3.11+ is in use
- Run from project root with venv activated

## Requirements Compliance

| Item | Status | Evidence |
|---|---|---|
| **R1: Test Data** | ✅ Complete | 6+ months of daily readings (Jan–Jun 2026) with light month (Jan avg 4.5 units/day), heavy month (June avg 14.8 units/day), large late-month recharge (June). See `data/data.json` |
| **R2: Balance Timeline** | ✅ Complete | Timeline page shows day-by-day balance with exact tariff charges, slab tracking, fixed charges on first recharge/month, VAT. Verified against published tariff. See `p10_prepaid/balance_rebuild.py` |
| **R3: Family Questions** | ✅ Complete | Projection page shows run-out date and recharge sizing with breakdown (energy by slab, next-slab effect, fixed charges, VAT). See `family_projection.py` |
| **R4: Habit Comparison** | ✅ Complete | Comparison page shows reactive vs proactive recharging over 3 identical-consumption months. Validates R-16 (no slab gaming). See `recharge_habits.py` |
| **Bonus #1: Slab Warning** | ✅ Complete | Projection page warns when monthly total nears slab boundary and shows next-unit cost. See `diagnostics.py` |
| **Bonus #2: Real Data Reconciliation** | ✅ Partial | Accepts user-uploaded JSON; compares against rebuilt balance. Format must match published schema. |
| **Bonus #3: Bill Breakdown** | ✅ Complete | Bill summary shows energy amount, demand charge, meter rent, VAT, and total for current month. See `diagnostics.py` |

## Testing and Validation

All 19 unit tests pass:
- `test_tariff.py` — Slab pricing, fixed charges, VAT calculations
- `test_loader.py` — JSON parsing and validation
- `test_simulate.py` — Day-by-day balance reconstruction
- `test_questions.py` — Run-out date and recharge sizing
- `test_compare.py` — Habit comparison logic
- `test_bonus.py` — Bonus features (slab warnings, bill breakdown)

Run tests:
```bash
python -m pytest -q
```

Tested against:
- `data/data.json` (3 main cases: PUB-01, PUB-02, PUB-03)
- `data/edge.json` (5 edge cases including leap year, same-day recharges, month boundaries)
- `data/aman_edge.json` (25 stress-test cases covering all slab thresholds and edge scenarios)

## Deployment

**Live Deployment:**
- Frontend: Vercel (auto-deploy from main branch)
- Backend: Can be deployed to any Python-capable hosting (Render, Fly.io, etc.)

**For local development:**
```bash
bash script.sh
```

**For production:**
1. Deploy FastAPI to backend (e.g., `uvicorn api.main:app --port $PORT`)
2. Deploy React frontend to Vercel/Netlify with API URL env var
3. Update `frontend/src/api.ts` with production API endpoint

## Design and Architecture

### Python Billing Engine (`p10_prepaid/`)

The core calculation logic is split into focused modules:

| Module | Purpose |
|---|---|
| `tariff.py` | Slab pricing (1-75 @ 4.63, 76-200 @ 5.26, ..., 601+ @ 10.70), VAT (5% on energy), fixed charges (82 BDT on first recharge/month) |
| `loader.py` | Parse JSON cases, validate schemas, convert currency to `Decimal` |
| `balance_rebuild.py` | Simulate day-by-day balance with exact charge application per slab reached |
| `family_projection.py` | Calculate run-out date and recharge amount for target date |
| `recharge_habits.py` | Compare low-balance (reactive) vs monthly (proactive) recharge strategies |
| `diagnostics.py` | Generate slab warnings, next-unit costs, and bill summaries |

All modules use `decimal.Decimal` for financial accuracy and are independently unit-tested.

### FastAPI Backend (`api/main.py`)

REST endpoints expose all engine functions:
- `/api/cases` — List or upload cases
- `/api/timeline/{case_id}` — Balance timeline (date, balance, energy, VAT, recharges)
- `/api/run-out/{case_id}` — Run-out date and days remaining
- `/api/recharge-needed/{case_id}` — Recharge amount for target date
- `/api/comparison/{case_id}` — Habit comparison results

All endpoints return Pydantic models (type-safe JSON).

### React Frontend (`frontend/src/`)

Multi-page SPA with sidebar navigation:

| Page | Purpose |
|---|---|
| Dashboard | Case selector (built-in or upload) |
| Usage Timeline | Day-by-day balance chart and table |
| Recharge Planner | Run-out date and recharge sizing |
| Habit Comparison | Side-by-side comparison of strategies |
| Power Planning Hub | Confirm assumptions and target date |
| Tariff Reference | View rates and calculate custom costs |
| Settings | Light/dark theme toggle |

Design uses neumorphic raised/recessed surfaces with a premium utility aesthetic. Theme colors and styles centralized in `theme.ts`. Charts powered by Recharts.

## Known Limitations

- Real meter data upload accepts only JSON matching published schema; manufacturer formats vary
- UI designed for desktop/tablet (≥768px); mobile layout not optimized
- Backend has no rate limiting, authentication, or persistence (suitable for demo/development)
- Comparison with `source: 'fixed'` requires explicit `daily_units` input (cannot auto-detect real patterns)

## License and Attribution

See [LICENSES.md](LICENSES.md) for third-party material, frameworks, and AI tool disclosure.

**Original work:** All billing engine logic, API backend, and UI frontend created by LSH26-T050 during the LSH26 event window.

**AI assistance:** GitHub Copilot was used for code generation (React components, TypeScript types, Python utilities, test boilerplate). All generated code was reviewed against the P10 specification, tested against published test cases, and manually validated for tariff correctness.

## Getting Help

- **Problem spec clarifications:** See [CLARIFICATIONS.md](CLARIFICATIONS.md)
- **Evaluation details:** See [evaluation-manifest.json](evaluation-manifest.json)
- **Bug reports:** File an issue in the repository
- **Technical questions:** Review the docstrings in `p10_prepaid/*.py` and React component comments
