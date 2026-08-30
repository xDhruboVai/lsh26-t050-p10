# P10 Prepaid Meter Recharge Advisor

This project implements the deterministic prepaid meter policy described in the workflow document. The core idea is to model the household's balance exactly using `Decimal` arithmetic and fixed tariff rules rather than relying on ML or forecasting.

## Current workspace layout

- `data/` — input data and the workflow specification
  - `data.json` — case dataset used for simulation
  - `P10_Prepaid_Meter_Workflow.md` — full deterministic specification
  - `problem.txt` — problem statement summary
- `p10_prepaid/` — calculation engine and application entry point
  - `tariff.py` — slab pricing, VAT, fixed charges, and cost-of-day logic
  - `loader.py` — JSON parsing and validation
  - `simulate.py` — per-day balance reconstruction
  - `questions.py` — run-out date and recharge sizing logic
  - `compare.py` — recharge-habit comparison engine
  - `bonus.py` — optional warnings and breakdown helpers
  - `main.py` — CLI entry point
- `tests/` — unit tests for the tariff engine and validation rules

## Environment setup

From the project root:

```bash
python -m venv .venv
# Windows (PowerShell / cmd):
.venv\Scripts\activate
# Git Bash / bash:
source .venv/Scripts/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Current implementation status

Sections 1 and 2 of the workflow are now implemented and verified:

- fixed tariff slabs and VAT/fixed-charge calculations
- day-level slab slicing including mid-day slab transitions
- dataset loading and validation for the case schema
- Decimal-based money handling for all monetary operations

## Run the project

```bash
# Git Bash / MinGW
source .venv/Scripts/activate
python -m p10_prepaid.main --case data/data.json

# Windows PowerShell / cmd
.venv\Scripts\activate
python -m p10_prepaid.main --case data/data.json
```

## Validation

```bash
# From the project root
.venv/Scripts/python.exe -m pytest -q
```

## Notes

- Money is tracked with `Decimal`; no floating-point arithmetic is used for currency values.
- The slab counter resets only on the 1st of each month.
- A recharge never resets the slab counter.
- VAT applies only to the energy portion, never to fixed charges.
- Current data source is under `data/data.json`; ensure the file is valid JSON before running the CLI.

## Troubleshooting

If the CLI fails with a JSON decoding error, the input dataset is malformed or truncated. In this workspace, the current `data/data.json` file is not valid JSON at the current revision, so the loader should be fixed or replaced with a valid dataset before the simulation engine can be exercised end-to-end.
