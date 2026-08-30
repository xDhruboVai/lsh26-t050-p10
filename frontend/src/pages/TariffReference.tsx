import React, { useState } from 'react';
import { useTheme } from '../App';
import { spacing, borders, typography, skeumorphic } from '../theme';
import { cost_of_day, vat_on_energy } from '../tariffReference';

const slabs = [
  ['1-75', '4.63'], ['76-200', '5.26'], ['201-300', '5.63'],
  ['301-400', '5.83'], ['401-600', '9.30'], ['601+', '10.70'],
];

const TariffReference: React.FC = () => {
  const { theme, colors } = useTheme();
  const [units, setUnits] = useState(21);
  const estimate = cost_of_day(units);
  return <main style={{ flex: 1, padding: spacing['2xl'], backgroundColor: colors.bg_primary, overflowY: 'auto' }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <p style={{ ...typography.label, color: colors.primary, margin: 0 }}>Step 5 of 5 · Reference</p>
      <h1 style={{ ...typography.heading_xl, color: colors.text_primary, margin: `${spacing.sm} 0` }}>Tariff & Pricing Reference</h1>
      <p style={{ ...typography.body, color: colors.text_secondary }}>How your prepaid bill is calculated, slab by slab.</p>
      <section style={{ ...skeumorphic.card(theme), padding: spacing.lg, marginTop: spacing['2xl'] }}>
        <h2 style={{ ...typography.heading_sm, color: colors.text_primary, margin: 0 }}>Energy slabs</h2>
        <p style={{ ...typography.body_sm, color: colors.text_secondary }}>Rate increases as monthly usage grows.</p>
        <div style={{ display: 'flex', alignItems: 'end', gap: 6, height: 150, margin: `${spacing.lg} 0` }}>
          {slabs.map(([label, rate]) => <div key={label} style={{ flex: 1, height: `${35 + parseFloat(rate) * 8}%`, backgroundColor: colors.primary, borderRadius: `${borders.radius_sm} ${borders.radius_sm} 0 0`, minWidth: 28 }} title={`${label}: BDT ${rate}`} />)}
        </div>
        {slabs.map(([range, rate]) => <div key={range} style={{ display: 'flex', justifyContent: 'space-between', padding: `${spacing.sm} 0`, borderBottom: `1px solid ${colors.border_secondary}`, color: colors.text_primary }}><span>{range} kWh</span><strong style={{ color: colors.primary }}>BDT {rate} / unit</strong></div>)}
      </section>
      <section style={{ ...skeumorphic.card(theme), padding: spacing.lg, marginTop: spacing.lg }}>
        <h2 style={{ ...typography.heading_sm, color: colors.text_primary, margin: 0 }}>Try the calculator</h2>
        <p style={{ ...typography.body_sm, color: colors.text_secondary }}>Explore a daily usage scenario.</p>
        <label style={{ ...typography.body_sm, color: colors.text_primary }}>Daily units (kWh)
          <input type="range" min="1" max="50" value={units} onChange={(event) => setUnits(Number(event.target.value))} style={{ display: 'block', width: '100%', accentColor: colors.primary, margin: `${spacing.md} 0` }} />
        </label>
        <p style={{ color: colors.text_secondary }}>{units} kWh / day</p>
        <div style={{ backgroundColor: colors.primary, color: colors.text_inverse, padding: spacing.lg, borderRadius: borders.radius_lg }}><span style={typography.label}>Estimated daily cost</span><strong style={{ ...typography.heading_md, display: 'block' }}>BDT {estimate.total.toFixed(2)}</strong><small>Including 5% VAT: BDT {vat_on_energy(estimate.energy).toFixed(2)}</small></div>
      </section>
    </div>
  </main>;
};

export default TariffReference;
