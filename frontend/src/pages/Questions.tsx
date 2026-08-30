import React, { useEffect, useState } from 'react';
import { useTheme } from '../App';
import { spacing, borders, typography, skeumorphic } from '../theme';
import { apiClient, CaseDetails, RunOutResponse, RechargeResponse } from '../api';

interface QuestionsProps { caseId: string; }

const Questions: React.FC<QuestionsProps> = ({ caseId }) => {
  const { theme, colors } = useTheme();
  const [details, setDetails] = useState<CaseDetails | null>(null);
  const [runOut, setRunOut] = useState<RunOutResponse | null>(null);
  const [recharge, setRecharge] = useState<RechargeResponse | null>(null);
  const [dailyUnits, setDailyUnits] = useState('');
  const [confirmedDailyUnits, setConfirmedDailyUnits] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState('');
  const [confirmingUsage, setConfirmingUsage] = useState(false);
  const [confirmingDate, setConfirmingDate] = useState(false);
  const [usageOpen, setUsageOpen] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(true);
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiClient.getCaseDetails(caseId), apiClient.getRunOut(caseId), apiClient.getRechargeNeeded(caseId)])
      .then(([caseData, runOutData, rechargeData]) => {
        setDetails(caseData);
        setDailyUnits(String(caseData.usual_daily_units));
        setConfirmedDailyUnits(caseData.usual_daily_units);
        setTargetDate(caseData.target_date);
        setRunOut(runOutData);
        setRecharge(rechargeData);
      })
      .catch(console.error);
  }, [caseId]);

  const confirmUsage = async () => {
    const value = Number(dailyUnits);
    if (!Number.isFinite(value) || value < 0) return;
    setConfirmingUsage(true);
    try {
      const runOutData = await apiClient.getRunOut(caseId, value);
      setRunOut(runOutData);
      setConfirmedDailyUnits(value);
    } finally {
      setConfirmingUsage(false);
    }
  };

  const confirmTargetDate = async () => {
    if (!targetDate) return;
    setConfirmingDate(true);
    setRechargeError(null);
    try {
      const data = await apiClient.getRechargeNeeded(caseId, targetDate, confirmedDailyUnits ?? undefined);
      setRecharge(data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Could not calculate recharge amount.';
      setRechargeError(msg);
    } finally {
      setConfirmingDate(false);
    }
  };

  return (
    <main style={{ flex: 1, padding: spacing['2xl'], backgroundColor: colors.bg_primary, overflowY: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ ...typography.label, color: colors.primary, margin: 0 }}>Step 3 of 5</p>
        <h1 style={{ ...typography.heading_xl, color: colors.text_primary, margin: `${spacing.sm} 0` }}>Power Planning Hub</h1>
        <p style={{ ...typography.body, color: colors.text_secondary, margin: 0 }}>Two practical answers, calculated from the active meter case.</p>

        <section style={{ ...skeumorphic.card(theme), padding: spacing.lg, marginTop: spacing['2xl'] }}>
          <button type="button" onClick={() => setUsageOpen(!usageOpen)} aria-expanded={usageOpen} style={{ border: 0, background: 'transparent', padding: 0, color: colors.text_primary, cursor: 'pointer', ...typography.heading_sm }}><span aria-hidden="true">{usageOpen ? '▾' : '▸'}</span>{' '}When does our balance run out?</button>
          {usageOpen && <>
          <p style={{ ...typography.body_sm, color: colors.text_secondary, marginTop: spacing.sm }}>Based on usual daily usage. Confirming a value also updates the recharge calculation below.</p>
          <label style={{ ...typography.body_sm, color: colors.text_primary }}>
            Usual daily units{' '}
            <input value={dailyUnits} onChange={(event) => setDailyUnits(event.target.value)} style={{ ...skeumorphic.input(theme), width: 90, padding: spacing.sm, color: colors.text_primary }} /> kWh / day
          </label>
          <button type="button" onClick={confirmUsage} disabled={confirmingUsage} style={{ ...skeumorphic.raised(theme), marginLeft: spacing.md, padding: `${spacing.sm} ${spacing.md}`, color: colors.text_primary, cursor: 'pointer' }}>{confirmingUsage ? 'Confirming...' : 'Confirm Usage'}</button>
          {confirmedDailyUnits !== null && <p style={{ ...typography.body_sm, color: colors.success, marginTop: spacing.sm, margin: `${spacing.sm} 0 0 0` }}>✓ Using {confirmedDailyUnits} kWh/day for all projections.</p>}
          {runOut && <div style={{ ...skeumorphic.gauge(theme), marginTop: spacing.lg, padding: spacing.lg }}>
            <p style={{ ...typography.label, color: colors.text_secondary, margin: 0 }}>Balance runs out on</p>
            <strong style={{ ...typography.heading_md, color: colors.text_primary }}>{new Date(runOut.run_out_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
            <p style={{ color: runOut.days_remaining <= 7 ? colors.danger : colors.success, marginBottom: 0, marginTop: spacing.sm }}>{runOut.days_remaining} days remaining</p>
          </div>}
          </>}
        </section>

        <section style={{ ...skeumorphic.card(theme), padding: spacing.lg, marginTop: spacing.lg }}>
          <button type="button" onClick={() => setRechargeOpen(!rechargeOpen)} aria-expanded={rechargeOpen} style={{ border: 0, background: 'transparent', padding: 0, color: colors.text_primary, cursor: 'pointer', ...typography.heading_sm }}><span aria-hidden="true">{rechargeOpen ? '▾' : '▸'}</span>{' '}How much should we recharge today?</button>
          {rechargeOpen && <>
          <p style={{ ...typography.body_sm, color: colors.text_secondary, marginTop: spacing.sm }}>Pick the date you need power to last until. The amount shown is what to deposit today to never hit a zero balance.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
            <label style={{ ...typography.body_sm, color: colors.text_primary }}>I want power to last until{' '}
              <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} style={{ ...skeumorphic.input(theme), padding: spacing.sm, color: colors.text_primary }} />
            </label>
            <button type="button" onClick={confirmTargetDate} disabled={confirmingDate} style={{ ...skeumorphic.raised(theme), padding: `${spacing.sm} ${spacing.md}`, color: colors.text_primary, cursor: 'pointer' }}>{confirmingDate ? 'Calculating...' : 'Confirm Date & Calculate'}</button>
          </div>
          {rechargeError && <p style={{ color: colors.danger, marginTop: spacing.md, margin: `${spacing.md} 0 0 0`, ...typography.body_sm }}>⚠ {rechargeError}</p>}
          {recharge && (
            <>
              <div style={{ backgroundColor: colors.primary, color: colors.text_inverse, padding: spacing.lg, borderRadius: borders.radius_lg, marginTop: spacing.lg, textAlign: 'center' }}>
                <p style={{ ...typography.label, opacity: 0.9, margin: 0 }}>Required recharge</p>
                <strong style={{ ...typography.heading_xl, display: 'block', marginTop: spacing.sm }}>BDT {parseFloat(recharge.required_amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing.md, marginTop: spacing.lg }}>
                <div style={{ backgroundColor: colors.bg_tertiary, padding: spacing.md, borderRadius: borders.radius_md, borderLeft: `4px solid ${colors.primary}` }}>
                  <p style={{ ...typography.label, color: colors.text_secondary, margin: 0, marginBottom: spacing.xs }}>Base Energy (slab 1)</p>
                  <p style={{ ...typography.heading_sm, color: colors.primary, margin: 0 }}>BDT {parseFloat(recharge.base_energy).toFixed(2)}</p>
                </div>
                <div style={{ backgroundColor: colors.bg_tertiary, padding: spacing.md, borderRadius: borders.radius_md, borderLeft: `4px solid ${colors.warning}` }}>
                  <p style={{ ...typography.label, color: colors.text_secondary, margin: 0, marginBottom: spacing.xs }}>Slab Penalty</p>
                  <p style={{ ...typography.heading_sm, color: colors.warning, margin: 0 }}>BDT {parseFloat(recharge.slab_penalty).toFixed(2)}</p>
                </div>
                <div style={{ backgroundColor: colors.bg_tertiary, padding: spacing.md, borderRadius: borders.radius_md, borderLeft: `4px solid ${colors.info}` }}>
                  <p style={{ ...typography.label, color: colors.text_secondary, margin: 0, marginBottom: spacing.xs }}>Fixed Charges</p>
                  <p style={{ ...typography.heading_sm, color: colors.info, margin: 0 }}>BDT {parseFloat(recharge.fixed_charges).toFixed(2)}</p>
                </div>
                <div style={{ backgroundColor: colors.bg_tertiary, padding: spacing.md, borderRadius: borders.radius_md, borderLeft: `4px solid ${colors.danger}` }}>
                  <p style={{ ...typography.label, color: colors.text_secondary, margin: 0, marginBottom: spacing.xs }}>VAT (5%)</p>
                  <p style={{ ...typography.heading_sm, color: colors.danger, margin: 0 }}>BDT {parseFloat(recharge.vat).toFixed(2)}</p>
                </div>
              </div>
              <div style={{ backgroundColor: colors.bg_tertiary, padding: spacing.md, borderRadius: borders.radius_md, marginTop: spacing.lg }}>
                <p style={{ ...typography.body_sm, color: colors.text_secondary, margin: 0 }}>
                  Base Energy + Slab Penalty + Fixed Charges + VAT{' '}
                  <strong style={{ color: colors.text_primary }}>= BDT {(parseFloat(recharge.base_energy) + parseFloat(recharge.slab_penalty) + parseFloat(recharge.fixed_charges) + parseFloat(recharge.vat)).toFixed(2)}</strong>
                  {!recharge.breakdown_valid && <span> (estimate)</span>}
                </p>
              </div>
            </>
          )}
          {details && <p style={{ ...typography.body_sm, color: colors.text_tertiary, margin: `${spacing.lg} 0 0 0` }}>Current case: {details.case_id}{confirmedDailyUnits !== null && ` • Using ${confirmedDailyUnits} kWh/day`}</p>}
          </>}
        </section>
      </div>
    </main>
  );
};

export default Questions;
