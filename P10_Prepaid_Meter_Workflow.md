# P10 — Prepaid Meter Recharge Advisor
## Full Build Workflow (Detailed, Zero-Ambiguity Version)

---

## 0. Read this first — what the judges actually check

This is **not** a data science problem. It is a **deterministic financial simulation** problem. Everything the judges score can be computed exactly from:

1. A fixed tariff table (given, do not change it).
2. Daily unit readings (given per household).
3. Recharge events (given per household).
4. A calendar rule: the slab counter resets on the 1st of every month, and *only* on the 1st — never on a recharge.

There is no forecasting, no classification, no clustering task anywhere in the four required deliverables. **Do not use machine learning for the core engine.** ML would make your output *non-reproducible* against the judge's exact expected numbers, which is the opposite of what wins this kind of problem. Section 9 explains the one place a lightweight heuristic (not ML) is legitimately useful, and why real ML is actively discouraged here.

---

## 1. The tariff rules, written as pseudocode (build this first, get it 100% right before anything else)

### 1.1 Slab table (fixed — do not touch)

| Units (cumulative, this month) | Rate (BDT/unit) |
|---|---|
| 1–75 | 4.63 |
| 76–200 | 5.26 |
| 201–300 | 5.63 |
| 301–400 | 5.83 |
| 401–600 | 9.30 |
| 601+ | 10.70 |

### 1.2 Fixed charges (per calendar month, charged once)

- Demand charge: 42.00 BDT
- Meter rent: 40.00 BDT
- **Trigger condition:** charged on the date of the **first recharge that occurs in that calendar month** — not on the 1st of the month, not on every recharge. If a month has zero recharges, these charges are never applied for that month (the household is just running down balance from a prior recharge).

### 1.3 VAT

- 5% of the **energy amount only** (not on demand charge, not on meter rent). Read the tariff paragraph again with your team before coding this — misplacing VAT scope is a common silent bug that produces plausible-looking but wrong numbers.

### 1.4 The single most important rule (R-16, R-33)

> The slab counter resets on the **1st calendar day of the month**. A recharge does **never** reset it. Two households/habits with identical daily consumption **must** have identical energy costs for identical days — the only thing a recharge habit can change is *how many months had at least one recharge* (which changes how many times the 42+40 fixed charge fires).

Write a unit test for this rule alone before writing anything else:
```
Given: same day-by-day units for 3 months, under two different recharge schedules
Assert: sum(energy_cost per day) is IDENTICAL between the two schedules
Assert: only fixed_charges_total may differ, and only in whole multiples of 82.00 BDT (42+40)
```
If this test doesn't hold in your engine, stop and fix the engine before building anything on top of it.

### 1.5 Core function to build

```
function cost_of_day(month_running_total_before_today, units_today) -> (energy_cost, new_running_total, slab_breakdown)
```
Logic:
1. Start at `month_running_total_before_today`.
2. Walk forward unit by unit (or in slab-sized chunks for speed) up to `units_today` more units.
3. For each unit (or chunk), find which slab the *cumulative* count falls into, multiply by that slab's rate.
4. A single day CAN span two or more slabs (e.g., day pushes household from unit 74 to unit 80 → 1 unit at 4.63, 5 units at 5.26). Handle this explicitly — do not just look up the slab for the day's total.
5. Return the day's energy cost, the updated running total, and (optionally) a breakdown of how many units fell in each slab — you'll want this for the bonus "slab warning" feature and for the "why does this cost so much" breakdown in Deliverable 2.

**Test this function by hand** with at least 5 cases before trusting it:
- Day entirely within slab 1
- Day that crosses slab 1→2
- Day that crosses slab 2→3
- Day that crosses 3 slabs at once (possible in the heavy summer months, e.g. 30+ units/day when already at 590 cumulative)
- Day at the very top slab (601+, no upper bound)

---

## 2. Data understanding (do this before writing simulation code)

### 2.1 Dataset confirmed usable

`P10_prepaid_meter_public__1_.json` contains 25 cases (`PUB-01`…`PUB-25`). Each case has:

```
case_id              string, e.g. "PUB-01"
opening_balance_bdt  string decimal — balance BEFORE the first day in `days[]`
days[]               list of {date, units} — consecutive daily readings, always starting on 1st of a month
recharges[]          list of {date, amount_bdt} — recharge events, dates are a subset of days[] dates
today                last reading date (defines "now" for the two questions)
usual_daily_units    integer — the household's typical daily use going forward
target_date           date the family wants power to last until
comparison            {months: [3 x "YYYY-MM"], source, daily_units, opening_balance_bdt,
                        low_threshold_bdt, low_amount_bdt, monthly_amount_bdt}
```

Verified: 181–243 days per case (6–8 months), 11–23 recharges per case, every case includes a visible ramp from light months (Dec–Feb, ~3–7 units/day) into heavy summer months (Apr–Jun, up to 30+ units/day) with large late-month recharges — this matches the brief's requirement for "light month / heavy summer month / big-recharge-in-last-week month" exactly. **You do not need to fabricate your own dataset.** Build against this schema.

### 2.2 Important: this is a PUBLIC sample

The filename says "public." Assume the judges will run your code against a **hidden set with the identical schema** but different numbers. This means:
- Never hard-code any case's numbers, dates, or expected outputs into your logic.
- Your code must work for ANY valid JSON matching this schema — arbitrary date ranges, arbitrary opening balances, any number of cases.
- Test with at least 2–3 of the 25 given cases, not just PUB-01.

### 2.3 Data loading step

Write a loader that:
1. Parses the JSON.
2. Converts `opening_balance_bdt` and `amount_bdt` strings to `Decimal` (NOT float — floating point rounding errors will cause your VAT/slab totals to drift by fractions of a taka over 200+ days, which WILL fail exact-match judge checks). Use Python's `decimal.Decimal` throughout, rounded to 2 places only at final display, never mid-calculation unless the spec implies per-transaction rounding (clarify with organizers if unsure, but the safest default is: keep full precision internally, round only for display).
3. Builds a `date -> units` dict and a `date -> recharge_amount` dict per case for O(1) lookup during simulation.
4. Validates: `days[]` is contiguous with no gaps (assert consecutive dates), first day of `days[]` is always the 1st of a month (per format_note).

---

## 3. Deliverable 1 — Day-by-day balance rebuild

### 3.1 Algorithm

```
balance = opening_balance_bdt
month_running_units = 0
fixed_charges_applied_this_month = False
current_month = None
timeline = []   # list of {date, balance_after, energy_cost, recharge_amount_if_any, event_flags}

for each date, units in days (in order):
    if date.day == 1:
        month_running_units = 0
        fixed_charges_applied_this_month = False
        current_month = date's YYYY-MM

    energy_cost, month_running_units, slab_breakdown = cost_of_day(month_running_units, units)
    vat = energy_cost * 0.05
    day_total_charge = energy_cost + vat
    balance -= day_total_charge

    recharge_today = recharges.get(date, 0)
    if recharge_today > 0:
        balance += recharge_today
        if not fixed_charges_applied_this_month:
            balance -= (42.00 + 40.00)
            fixed_charges_applied_this_month = True

    timeline.append({date, balance, energy_cost, vat, recharge_today, slab_breakdown, ...})
```

### 3.2 Design decision you must make explicitly (and document it)

**Order of operations within a day**: does the day's energy deduction happen before or after that day's recharge is applied? The spec doesn't say explicitly which happens "first" in wall-clock terms, but it doesn't matter for the running balance as long as you are consistent — energy cost for the day and any recharge on the same day both apply on that date; the balance line for that date reflects both. What DOES matter is that `month_running_units` (the slab counter) only ever increases from *usage*, never from recharges — recharges only add money and possibly the once-a-month fixed charge.

### 3.3 Output required

A per-case chart/table: x-axis = date, y-axis = balance (BDT), with a marked point at every recharge date (different marker/color), so it visually shows the "sawtooth" pattern of balance draining and jumping back up. Provide the full numeric timeline as backing data (for the judges to verify), and a visualization on top of it (for the family/demo).

### 3.4 Self-check before moving to Deliverable 2

For each case, compute: `opening_balance + sum(all recharges) - sum(all fixed charges triggered) - sum(all energy costs) - sum(all VAT) == final balance`. This should tie out exactly (to the cent). If it doesn't, you have a bug in the day-by-day loop — do not proceed until this reconciles for all 25 public cases.

---

## 4. Deliverable 2 — Answer the two family questions

### 4.1 Question A: "On which date does the balance run out?"

Inputs: `today`'s balance (last value from your Deliverable 1 timeline), `usual_daily_units`.

Algorithm:
```
balance = balance_as_of(today)          # from Deliverable 1 simulation
month_running_units = units accumulated so far in the calendar month containing `today`
date = today + 1 day
while balance > 0:
    if date.day == 1:
        month_running_units = 0
    energy_cost, month_running_units, _ = cost_of_day(month_running_units, usual_daily_units)
    vat = energy_cost * 0.05
    balance -= (energy_cost + vat)
    if balance <= 0:
        return date          # this is the run-out date
    date += 1 day
```
Note: no recharge and no fixed-charge event happens in this forward projection (we're asking "if they do nothing more, when do they run dry"), so fixed charges do NOT reappear in this projection unless you're also modeling a recharge — which you're not, for this specific question.

### 4.2 Question B: "To last until `target_date`, how much must be recharged today?"

This is a **root-finding problem**: find the smallest recharge amount `R` such that if added to today's balance, the household never goes negative through `target_date`, simulated day-by-day exactly as in Deliverable 1/4.1 but starting from `balance_today + R` and continuing to accumulate the slab counter (starting from wherever the real slab counter is on `today`, since `today` is mid-month in most cases).

Two ways to compute this — use the **direct** method, it's exact and avoids search entirely:

**Direct (recommended):**
1. Simulate the sequence of daily units from `today+1` to `target_date` at `usual_daily_units`/day, continuing the slab counter correctly across month boundaries (resetting on each 1st).
2. Sum total energy + VAT cost over that whole window = `total_cost_to_survive`.
3. `R = max(0, total_cost_to_survive - balance_today)`. (If balance_today already covers it, R = 0 — say so.)
4. Note: if `today` is not itself the first recharge of its month, and the recharge happens today, you must ALSO check whether this recharge would be the month's *first* recharge (if no recharge has occurred yet in `today`'s month) — if so, add the 42+40 fixed charge into `total_cost_to_survive` for that month. Apply this check per calendar month spanned by the projection window, not just the first.

**Binary search (fallback / cross-check)**: if direct summation feels error-prone to your team, binary-search `R` between 0 and some upper bound (e.g., `total_cost_to_survive * 1.5`), simulating forward with `balance_today + R` and checking `min(balance over window) >= 0`. Use this only to *validate* the direct method's answer, not as your primary path — direct summation is exact and cheaper.

### 4.3 Breaking the answer into 4 parts (required by the brief)

For the amount `R` computed above, break it into:
- **Energy (base)**: what the units *would* have cost if the household had stayed entirely within the lowest slab they'd be in without the higher-usage push — i.e., recompute the same units at slab-1 rate (4.63/unit) as a baseline.
- **Slab penalty**: `actual energy cost - base energy cost` computed above. This isolates exactly how much extra the family is paying purely because their usage pushed them into higher tiers.
- **Fixed charges**: sum of 42+40 charges triggered within the projection window.
- **VAT**: 5% of the actual energy amount (not the base).
- Sanity check: `energy(base) + slab_penalty + fixed + VAT == R` (VAT should be computed on `base + slab_penalty` = actual energy, so this reconciles exactly).

---

## 5. Deliverable 3 — Recharge habit comparison

### 5.1 What "identical consumption" means precisely

You must run the exact same `days[]` units (or the case's `comparison.daily_units` if it's not null — check `comparison.source`: `"readings"` means use the case's own daily readings for those 3 months; if `source` were something else / `daily_units` is a number, use that flat number for every day instead) through **two independent simulations** that differ ONLY in *when recharges happen and how much*.

### 5.2 Habit A — "Low balance" (react late, recharge big)

```
balance = comparison.opening_balance_bdt   (usually "0.00" — start each comparison fresh)
for each day in the 3 comparison months (in order):
    apply energy_cost + vat for that day (same slab logic, same monthly reset)
    if balance (checked at START of day, i.e. before today's cost is applied) < low_threshold_bdt:
        recharge low_amount_bdt
        if this is the month's first recharge: apply fixed charges (42+40)
    balance -= (energy_cost + vat)
```
Re-read Deliverable's clarification (R-33): *"low balance" recharges the case's amount at the start of any day whose balance is below the case's threshold.* So the check happens at the **start of the day**, before that day's energy is deducted — implement it in that exact order.

### 5.3 Habit B — "Monthly" (recharge fixed amount on the 1st, no matter what)

```
balance = comparison.opening_balance_bdt
for each day in the 3 comparison months:
    if date.day == 1:
        recharge monthly_amount_bdt
        apply fixed charges (42+40)   # 1st-of-month recharge is always that month's first recharge, by construction
    apply energy_cost + vat for that day
    balance -= (energy_cost + vat)
```

### 5.4 What to report

- Total cost for Habit A = sum(all energy) + sum(all VAT) + sum(all fixed charges triggered). **Do not** count the recharge amounts themselves as "cost" — per R-33, cost = what the meter consumed, not what was deposited. (A family could over-recharge and have leftover balance at the end of the window; that leftover is NOT a cost and must not be subtracted or added incorrectly — just don't include raw recharge totals in the "cost" figure at all.)
- Total cost for Habit B = same computation, independently.
- Report: which is cheaper, by how much, and **explicitly show the fixed-charge count** for each habit (how many of the 3 months triggered a first-recharge fee) as the only permissible source of any difference. If energy+VAT sums differ between A and B, you have a bug — per R-16 they must be identical since consumption is identical and the slab clock is calendar-based.
- It is fine and expected for the two totals to come out equal in many cases — say so plainly if it happens; don't manufacture a difference.

### 5.5 Edge case to watch

If Habit A's balance never actually drops below `low_threshold_bdt` during the whole window (i.e., `opening_balance_bdt` + normal draw-down never triggers it, unlikely with "0.00" opening balance but possible with a different comparison), the household would never recharge and balance would go deeply negative in your simulation. Decide as a team whether to allow negative balances in this comparison-only simulation (realistic — real meters do cut off power, but for a *cost* comparison you may want to let the sum keep accruing to show what *would* have been owed) or to force a recharge trigger at balance ≤ 0 regardless of threshold. Document whichever choice you make.

---

## 6. Bonus features (only attempt after Sections 3–5 are fully working and reconciled)

### 6.1 Slab-warning

While simulating any given day, after computing the new `month_running_total`, check: is `month_running_total` within some buffer (e.g., 10 units, or make it configurable) of the next slab boundary (75, 200, 300, 400, 600)? If so, emit a warning with (a) units remaining in current slab, (b) the rate that will apply once crossed. This is a **pure lookup against the fixed table**, not a prediction — no ML needed.

### 6.2 Real-recharge comparison

Accept a user-pasted list of `{date, amount}` recharges (same shape as the case's `recharges[]`). Re-run Deliverable 1's exact simulation using the pasted recharges instead of the case's own, and diff the resulting balance timeline against what the meter "actually showed" (if the user also supplies actual meter-reported balances — otherwise just show your rebuilt version as a sanity companion to their real recharge history).

### 6.3 One-month bill breakdown

Pick any single calendar month within a case, sum: total energy cost, the one-time demand charge (if triggered that month), the one-time meter rent (if triggered), total VAT. Render as a simple breakdown (bar or donut chart, or even just a table — a chart is nicer for a demo).

---

## 7. Do we need Machine Learning? — Detailed answer

**No, for the four required deliverables.** Here's why, deliverable by deliverable:

| Deliverable | Needs ML? | Why / why not |
|---|---|---|
| 1. Balance rebuild | No | Pure deterministic arithmetic against a fixed tariff table and given historical data. |
| 2. Run-out date / recharge sizing | No | `usual_daily_units` is given as an INPUT by the case data — you are not asked to forecast it. The rest is arithmetic + optional root-finding (not ML). |
| 3. Habit comparison | No | Both habits run on the SAME given historical daily units. No forecasting involved. |
| Bonus: slab warning | No | Lookup against a fixed table. |
| Bonus: real-recharge diff | No | Direct comparison of two known sequences. |
| Bonus: monthly bill | No | Aggregation of already-computed daily costs. |

**Where a team might be tempted to use ML, and why you shouldn't:**
- *"Let's predict `usual_daily_units` from history instead of trusting the given value."* — Don't. The case data explicitly provides `usual_daily_units` as a given input for a reason: the judges want to check your arithmetic against a known value, not your forecasting skill. If you replace it with a model's prediction, your Question A/B answers will not match the judge's expected numbers, and you'll fail Deliverable 2 even if your tariff engine is perfect.
- *"Let's use anomaly detection for the slab warning instead of a threshold."* — Unnecessary complexity for a feature that's fundamentally "are we close to a known, fixed number." A simple `if remaining_units_in_slab <= buffer` check is correct, instant, and — critically — exactly reproducible, which a trained model is not.
- *"Let's cluster households by usage pattern."* — Not asked for anywhere in the brief. Would consume hackathon time without adding judged value.

**If you have spare time after all four deliverables + bonuses are done and rock-solid**, and want to add something forward-looking as a stretch/"wow" feature (clearly labeled as *exploratory*, not part of the core scored logic), a legitimate lightweight option is:
- **Simple seasonal average / moving average** for `usual_daily_units` estimation from the historical `days[]` (e.g., average of the last 14 days, or same-month-last-year average) — this is basic statistics, not ML, and could be offered as an *alternative* input to Question A/B ("or let us estimate your usual daily units from your history instead of typing them in"). If you want to call it "smart," a very simple linear regression on day-of-year vs. units (to capture the winter→summer ramp) is defensible and fast to build/explain, but again: keep it strictly separate from the core scored calculations, and never substitute it silently for the given `usual_daily_units` value.

**Bottom line: spend zero hackathon hours on ML infrastructure (no model training, no scikit-learn pipelines, no notebooks for this). Spend all your time getting the tariff engine and the four core deliverables exactly correct — that is 100% of what's graded.**

---

## 8. Recommended tech stack

Given this is a 7.5-hour-tier ("Tier 02") hackathon problem with 4 required deliverables + bonuses, prioritize **speed of correct implementation** and **easy demoing** over architectural sophistication.

### 8.1 Core calculation engine — Python

- **Why Python**: `decimal.Decimal` for exact currency math, fast to write and unit-test, huge ecosystem, and every judge/organizer can read it.
- **Language/runtime**: Python 3.11+
- **Key libraries**:
  - `decimal` (standard library) — for all money math, never use `float` for BDT amounts.
  - `datetime` (standard library) — for date iteration and month-boundary detection.
  - `pytest` — for the unit tests described in Sections 1.5, 3.4, and 5.4 (these self-checks are your best defense against silent bugs).
  - `pandas` (optional) — convenient for turning the day-by-day timeline into a DataFrame for quick charting/inspection during development, not required for correctness.
  - `json` (standard library) — for loading the case file.

### 8.2 Structure

```
p10_prepaid/
├── tariff.py          # cost_of_day(), monthly fixed-charge logic, VAT — Section 1
├── loader.py           # JSON parsing, Decimal conversion, validation — Section 2
├── simulate.py         # rebuild_balance_timeline() — Section 3
├── questions.py         # run_out_date(), recharge_needed() — Section 4
├── compare.py           # low_balance_habit(), monthly_habit() — Section 5
├── bonus.py             # slab_warning(), real_vs_simulated(), monthly_bill() — Section 6
├── tests/
│   ├── test_tariff.py       # the 5 hand-checked slab cases from Section 1.5
│   ├── test_reconciliation.py  # the balance self-check from Section 3.4
│   └── test_comparison.py   # the "energy costs must be identical" test from R-16
└── main.py               # CLI or entry point that ties it all together per case
```

Build and test bottom-up in exactly this order: `tariff.py` → `loader.py` → `simulate.py` (+ reconciliation test) → `questions.py` → `compare.py` (+ R-16 identical-energy test) → `bonus.py`.

### 8.3 Presentation / UI layer — pick based on your team's frontend comfort and time budget

**Option A (fastest, recommended if time-constrained): Streamlit**
- Pure Python, no separate frontend build. Turns your `main.py` functions directly into an interactive web app: file upload / case selector, matplotlib or Plotly chart of the balance timeline with recharge markers, input boxes for "what if I recharge X today," and a side-by-side bar chart for the habit comparison.
- `pip install streamlit plotly`
- You can have a working, demoable UI in under an hour once the engine is done.

**Option B (if you want a more "product" feel and have a frontend person): React + a small Python API**
- Backend: FastAPI (thin wrapper exposing your Section 3–6 functions as endpoints: `/simulate`, `/run-out-date`, `/recharge-needed`, `/compare-habits`).
- Frontend: React (or plain HTML/JS) with a charting library (Chart.js or Recharts) for the balance-over-time line chart with recharge markers, and a bar/table view for the comparison.
- Only choose this path if you have a team member confident in both halves and comfortable finishing within the time budget — Option A gets you the same judged content faster.

**Do not build**: a database, user auth, deployment infrastructure, or a mobile app. None of that is asked for or scored. Keep the whole stack to "load JSON → compute → display," and put your remaining time into correctness and the bonus features.

### 8.4 Charting specifics

- Balance-over-time: line chart, x = date, y = balance (BDT), with distinct markers (different color/shape) at every date a recharge occurred. Optionally shade months with a light background alternating color so slab-resets are visually obvious.
- Habit comparison: a simple grouped bar chart — Habit A total cost vs Habit B total cost, broken down by stacked segments (energy / VAT / fixed charges) so the "only fixed charges differ" claim is visually provable, not just asserted in text.
- Recharge-needed breakdown (Deliverable 2): a small stacked bar or donut showing the 4 components (base energy / slab penalty / fixed / VAT) for the single recommended recharge amount.

---

## 9. Suggested timeline (adapt to your actual hours remaining)

| Time block | Task |
|---|---|
| Hour 1 | Section 1 (tariff engine) + its 5 unit tests, fully working and verified by hand |
| Hour 2 | Section 2 (loader) + Section 3 (balance rebuild) + reconciliation self-check passing on all 25 cases |
| Hour 3 | Section 4 (both family questions), verified against 2–3 cases by manual spot-check |
| Hour 4 | Section 5 (habit comparison) + the R-16 identical-energy test passing |
| Hour 5 | Streamlit (or chosen) UI wired to all of the above; get a rough end-to-end demo working |
| Hour 6 | Polish UI, add charts described in 8.4, fix any bugs found while demoing to teammates |
| Remaining time | Attempt bonus features in order (6.1 → 6.2 → 6.3), only if 1–5 above are fully solid |

---

## 10. Final pre-submission checklist

- [ ] `cost_of_day()` passes all 5 hand-verified slab-boundary test cases
- [ ] Balance reconciliation (Section 3.4) ties out exactly for all 25 public cases
- [ ] R-16 identical-energy test passes for the habit comparison
- [ ] No `float` used anywhere for money — `Decimal` throughout
- [ ] Fixed charges (42+40) fire exactly once per month, only on the month's first recharge, never on the 1st by default
- [ ] VAT computed only on energy amount, 5%
- [ ] Slab counter resets only on the 1st of each month, verified it does NOT reset on any recharge date
- [ ] Both family questions tested against at least 2 different cases with manually sanity-checked expected ranges
- [ ] Habit comparison cost figures exclude raw recharge amounts (cost ≠ deposits, per R-33)
- [ ] Code works against the general JSON schema, not hard-coded to PUB-01 or any specific case
- [ ] UI clearly shows: balance timeline with recharge markers, answers to both family questions with the 4-part breakdown, and the habit comparison with its cost breakdown
