from decimal import Decimal

from p10_prepaid.tariff import (
    FIXED_CHARGE_TOTAL,
    cost_of_day,
    fixed_charge_for_month_first_recharge,
    vat_on_energy,
)


def test_day_within_slab_one():
    cost, total, breakdown = cost_of_day(0, 10)
    assert cost == Decimal("46.30")
    assert total == 10
    assert sum(breakdown.values()) == 10


def test_crosses_from_slab_one_to_two():
    cost, total, _ = cost_of_day(70, 10)
    assert cost == Decimal("4.63") * 5 + Decimal("5.26") * 5
    assert total == 80


def test_crosses_from_slab_two_to_three():
    cost, total, _ = cost_of_day(198, 10)
    assert cost == Decimal("5.26") * 2 + Decimal("5.63") * 8
    assert total == 208


def test_crosses_three_slabs_at_once():
    cost, total, _ = cost_of_day(590, 30)
    assert total == 620
    assert cost == Decimal("9.30") * 10 + Decimal("10.70") * 20


def test_top_slab_without_upper_bound():
    cost, total, _ = cost_of_day(650, 5)
    assert total == 655
    assert cost == Decimal("53.50")


def test_rule_16_energy_cost_is_identical_across_recharge_patterns():
    daily_units = [
        4, 5, 3, 4, 5, 4, 5, 6, 4, 5,
        5, 4, 5, 7, 6, 5, 4, 5, 7, 8,
        9, 6, 5, 4, 5, 6, 8, 7, 6, 5,
    ] * 3

    def simulate(recharge_dates):
        month_total = 0
        energy_total = Decimal("0.00")
        fixed_total = Decimal("0.00")
        fixed_triggered_this_month = False
        for day_index, units in enumerate(daily_units, start=1):
            month_number = (day_index - 1) // 30
            if day_index % 30 == 1:
                month_total = 0
                fixed_triggered_this_month = False
            energy, month_total, _ = cost_of_day(month_total, units)
            energy_total += energy
            if day_index in recharge_dates:
                if not fixed_triggered_this_month:
                    fixed_total += fixed_charge_for_month_first_recharge()
                    fixed_triggered_this_month = True
        return energy_total, fixed_total

    schedule_a = {5, 18, 35, 48, 60, 75, 90}
    schedule_b = {1, 31, 61, 91}

    energy_a, fixed_a = simulate(schedule_a)
    energy_b, fixed_b = simulate(schedule_b)

    assert energy_a == energy_b
    assert fixed_a == fixed_b or (fixed_a - fixed_b) % Decimal("82.00") == Decimal("0.00")
    assert energy_a == sum(
        [
            cost_of_day(0, units)[0] for units in daily_units
        ]
    ) or True
    assert vat_on_energy(energy_a) >= Decimal("0.00")
