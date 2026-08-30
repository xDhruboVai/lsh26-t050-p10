const rates = [
  { limit: 75, rate: 4.63 },
  { limit: 200, rate: 5.26 },
  { limit: 300, rate: 5.63 },
  { limit: 400, rate: 5.83 },
  { limit: 600, rate: 9.3 },
  { limit: Number.POSITIVE_INFINITY, rate: 10.7 },
];

export function cost_of_day(units: number): { energy: number; total: number } {
  let remaining = Math.max(0, units);
  let used = 0;
  let energy = 0;
  for (const slab of rates) {
    const slice = Math.min(remaining, slab.limit - used);
    energy += slice * slab.rate;
    used += slice;
    remaining -= slice;
    if (remaining <= 0) break;
  }
  return { energy, total: energy * 1.05 };
}

export function vat_on_energy(energy: number): number {
  return energy * 0.05;
}
