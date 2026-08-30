# P10 Prepaid Meter Recharge Advisor

A deterministic prepaid meter billing engine with an industrial-grade web UI. This project implements the exact prepaid meter policy using `Decimal` arithmetic and fixed tariff rules. No machine learning or forecasting is used for core calculations.

The application consists of three layers:
1. **Python billing engine** — Deterministic calculations against fixed tariff rules
2. **FastAPI backend** — REST API exposing billing functions
3. **React + TypeScript frontend** — Neumorphic, premium UI with dark/light modes

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
