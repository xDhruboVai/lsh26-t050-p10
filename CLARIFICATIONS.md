# P10 Problem Clarifications

Published rulings that settle questions in the P10 problem statement. These are part of the specification—judges mark by them.

## Problem Statement Reference

**P10 Prepaid Meter Recharge Advisor**

A family in Dhaka runs on a prepaid electricity meter. Electricity is priced in slabs that get more expensive the more units the household uses in a calendar month, and that slab counter goes back to the bottom on the first of every month. The family does not see this. They recharge whenever the meter starts beeping, often a big amount late in the month, and the money disappears faster than they expected because every unit is being billed at the top slab.

---

## Official Clarifications (From LSH26)

### R-16: Recharge Timing and Slab Arbitrage

**Ruling:** Both recharge habits use identical daily consumption and the same calendar month slab counter. Recharge timing cannot create an energy rate saving.

**Implication for P10:**
- Habit 1 (low-balance reactive) and Habit 2 (monthly proactive) must use the exact same daily consumption pattern over the same three calendar months
- The slab counter resets on day 1 of each month for both habits
- Any cost difference must come only from the timing of fixed charges (demand charge + meter rent), not from rate arbitrage
- A solution that shows energy cost savings from different recharge timing is a failure

### R-33: Definition of "Cost" and Recharge Timing Rules

**Ruling:** "Cost" means the money the meter consumes: energy, VAT and the applicable monthly fixed charges. It is not the amount deposited.

**Implication for P10:**
- Comparison must show actual meter consumption cost, not the rupee amounts recharges
- The two habits: 
  - **"low balance"** recharges the case's amount at the start of any day whose balance is below the case's threshold
  - **"monthly"** recharges the case's amount on the 1st of each month
  - Both start from the case's opening balance and run the three named months

**Additional Rule:** The two results may legitimately be equal. Any difference can come only from how many monthly first recharge fixed charges occur. A fabricated slab saving is a failure.

---

## Tariff Specification (Exact)

As stated in the problem, the following rates **must be used exactly as written**:

| Usage Range (units/month) | Rate (BDT/unit) |
|---|---|
| 1–75 | 4.63 |
| 76–200 | 5.26 |
| 201–300 | 5.63 |
| 301–400 | 5.83 |
| 401–600 | 9.30 |
| 601 and above | 10.70 |

**Fixed Charges (per month, on first recharge only):**
- Demand charge: 42 BDT
- Meter rent: 40 BDT
- **Total: 82 BDT** (applied once per calendar month on the date of the first recharge)

**Value-Added Tax (VAT):**
- 5% of energy cost only (not applied to fixed charges)

---

## Slab Counter Reset Rule (Critical)

**Rule:** The slab counter resets on the first day of each calendar month, not on a recharge. Getting this backwards will produce the wrong number everywhere.

**Implementation details:**
- On 2026-01-01, the slab counter is 0
- Each day's units are charged at the slab the month's running total has reached
- On 2026-02-01, the slab counter resets to 0, regardless of whether a recharge occurred on 2026-01-31
- Recharge events do not reset the slab counter

**Example:**
- 2026-01-31: Month total = 250 units (slab 3, rate 5.63 per unit)
- 2026-01-31: Customer recharges 5000 BDT
- 2026-02-01: Month total = 0 units (slab 1 resets, rate 4.63 per unit for new units)

---

## Required Deliverables Clarification

### 1. Household Test Data (6+ months)

Must include:
- **Light month** — Low average daily consumption (e.g., <5 units/day)
- **Heavy summer month** — High average daily consumption (e.g., 12+ units/day)
- **Large late-month recharge** — A recharge of significant amount in the final week of a month

Example structure:
- January (light): ~4.5 units/day → ~140 units total
- June (heavy): ~15 units/day → ~450 units total
- June-25 to June-30: Large recharge (e.g., 3000+ BDT) in final week

### 2. Balance Rebuild (Day-by-Day Timeline)

Must show:
- Starting balance (opening_balance_bdt)
- Each day's units consumed
- Running total within the month (for slab determination)
- Daily cost: units × slab_rate + (energy_cost × 0.05 VAT)
- First-recharge fixed charges (82 BDT) applied on first recharge date of each month
- Ending balance after each transaction (recharge or consumption)
- Recharges marked on the timeline

**Verification:** Rebuilt balance must match the case's recharge history if present.

### 3. Family Questions (Q1 & Q2)

**Q1: Run-out Date**
- Given: Today's balance, usual daily units
- Return: Date when balance will reach 0 (if it does within 365 days)
- If balance lasts indefinitely, return "does not run out" or similar

**Q2: Recharge for Target Date**
- Given: Today's balance, usual daily units, target date
- Return: Amount to recharge today so balance lasts until target date (inclusive)
- Breakdown must show:
  - Energy cost (by slab contribution)
  - Next-slab effect (if target date crosses a slab boundary, show cost difference)
  - Fixed charges (if any are due before target date)
  - VAT (5% on energy)
  - **Total amount to recharge**

### 4. Habit Comparison (3 Identical Months)

**Setup:**
- Select 3 calendar months from the case data
- Use the case's daily consumption for those months (or fixed daily_units if source='fixed')
- Start both habits from the case's opening_balance_bdt
- Run for exactly those 3 months

**Habit 1: Low-Balance Reactive**
- At the start of each day, if balance < threshold, recharge the case's amount
- Track total cost consumed for the 3-month period

**Habit 2: Monthly Proactive**
- On the 1st of each month, recharge the case's amount
- Track total cost consumed for the same 3-month period

**Output:**
- Total cost for Habit 1
- Total cost for Habit 2
- Difference and which is cheaper
- **Critical:** Must clearly state that difference (if any) comes only from fixed-charge count, not energy rate arbitrage

---

## Bonus Features

### Bonus 1: Slab Warning
- When the month's running total approaches the next slab boundary, warn the user
- Show what the next unit will cost (e.g., "Next unit costs 5.26 BDT instead of 4.63")

### Bonus 2: Real Meter Data Reconciliation
- Accept user-uploaded recharge history in JSON format matching the published schema
- Rebuild the balance using the uploaded history
- Compare rebuilt balance against what the user claims the meter showed
- Highlight discrepancies (if any)

### Bonus 3: Bill Breakdown
- Show one month's bill broken into:
  - Total energy units
  - Energy cost (sum of slabs)
  - Demand charge
  - Meter rent
  - VAT (5% of energy)
  - **Total bill**

---

## Common Pitfalls (Do Not Make These Mistakes)

1. **Applying fixed charges on every recharge** — Fixed charges (82 BDT) apply only on the *first* recharge of each calendar month
2. **Resetting slab counter on recharge** — Slab counter resets on day 1 of the month, NOT on recharge
3. **Using floating-point arithmetic** — Currency calculations must use exact decimal precision (Python `Decimal` or equivalent)
4. **Fabricating slab savings** — If both habits use identical consumption and slab counter, cost difference can only come from fixed-charge count
5. **Misinterpreting "cost"** — Cost = energy + VAT + fixed charges, NOT the recharge deposit amount
6. **Wrong VAT calculation** — VAT is 5% of *energy cost only*, not of fixed charges
7. **Assuming recharge resets slab counter** — It does not; only day 1 of month resets the counter

---

## Verification Checklist

- [ ] Test data has at least 6 months of daily readings
- [ ] Test data includes a light month, heavy month, and large late-month recharge
- [ ] Tariff rates match the 5 tiers exactly
- [ ] Fixed charges (82 BDT) apply only on first recharge per month
- [ ] VAT (5%) applied only to energy, not fixed charges
- [ ] Slab counter resets on month boundaries, not recharges
- [ ] Decimal arithmetic used (no floating-point errors)
- [ ] Balance timeline shows all components: energy cost, VAT, fixed charges, recharges
- [ ] Run-out date is calculated correctly based on usual daily units
- [ ] Recharge amount for target date includes energy, fixed charges, and VAT
- [ ] Habit comparison uses identical consumption for both habits
- [ ] Comparison result clearly attributes difference to fixed-charge count (if any)
- [ ] No fabricated energy rate savings in comparison

---

## References

- Problem statement: `data/P10_Prepaid_Meter_Workflow.md`
- Test cases: `data/data.json`, `data/edge.json`, `data/aman_edge.json`
- Billing engine: `p10_prepaid/tariff.py`, `p10_prepaid/balance_rebuild.py`
- API endpoints: `api/main.py`
- Frontend workflow: `frontend/src/pages/`
