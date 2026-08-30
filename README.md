# P10 Prepaid Meter Recharge Advisor

This project implements the deterministic prepaid meter policy described in the workflow document. The core idea is to model the household's balance exactly using `Decimal` arithmetic and fixed tariff rules, rather than relying on ML or forecasting.

## Project layout

- `p10_prepaid/` — core calculation engine
  - `tariff.py` — slab pricing, VAT, fixed charges, cost-of-day rules
  - `loader.py` — JSON ingestion and validation
  - `simulate.py` — daily balance rebuild and timeline generation
  - `questions.py` — run-out date and recharge sizing
  - `compare.py` — recharge habit comparison
  - `bonus.py` — slab warnings, monthly breakdowns, and related extras
  - `main.py` — CLI entry point and orchestration
- `tests/` — unit tests for tariff math and reconciliation checks

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # Linux / macOS
# or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Run

```bash
python -m p10_prepaid.main --case data.json
```

## Design principles

- Use `Decimal` for all money calculations.
- Never use float for tariff math.
- The slab counter resets on the 1st of each calendar month only.
- Recharges do not reset the slab counter.
- VAT is applied only to the energy portion.
