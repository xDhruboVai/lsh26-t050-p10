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
  const [targetDate, setTargetDate] = useState('');
  const [confirmingUsage, setConfirmingUsage] = useState(false);
  const [confirmingDate, setConfirmingDate] = useState(false);
  const [usageOpen, setUsageOpen] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.getCaseDetails(caseId), apiClient.getRunOut(caseId), apiClient.getRechargeNeeded(caseId)])
      .then(([caseData, runOutData, rechargeData]) => {
        setDetails(caseData);
        setDailyUnits(String(caseData.usual_daily_units));
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
    try { setRunOut(await apiClient.getRunOut(caseId, value)); } finally { setConfirmingUsage(false); }
  };

  const confirmTargetDate = async () => {
    if (!targetDate) return;
    setConfirmingDate(true);
    try { setRecharge(await apiClient.getRechargeNeeded(caseId, targetDate)); } finally { setConfirmingDate(false); }
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
          <p style={{ ...typography.body_sm, color: colors.text_secondary }}>Based on usual daily usage</p>
          <label style={{ ...typography.body_sm, color: colors.text_primary }}>
            Usual daily units{' '}
            <input value={dailyUnits} onChange={(event) => setDailyUnits(event.target.value)} style={{ ...skeumorphic.input(theme), width: 90, padding: spacing.sm, color: colors.text_primary }} /> kWh / day
          </label>
          <button type="button" onClick={confirmUsage} disabled={confirmingUsage} style={{ ...skeumorphic.raised(theme), marginLeft: spacing.md, padding: `${spacing.sm} ${spacing.md}`, color: colors.text_primary, cursor: 'pointer' }}>{confirmingUsage ? 'Confirming...' : 'Confirm Usage'}</button>
          {runOut && <div style={{ ...skeumorphic.gauge(theme), marginTop: spacing.lg, padding: spacing.lg }}>
            <p style={{ ...typography.label, color: colors.text_secondary, margin: 0 }}>Balance runs out on</p>
            <strong style={{ ...typography.heading_md, color: colors.text_primary }}>{new Date(runOut.run_out_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
            <p style={{ color: runOut.days_remaining <= 7 ? colors.danger : colors.success, marginBottom: 0 }}>{runOut.days_remaining} days remaining</p>
          </div>}
          </>}
        </section>

        <section style={{ ...skeumorphic.card(theme), padding: spacing.lg, marginTop: spacing.lg }}>
          <button type="button" onClick={() => setRechargeOpen(!rechargeOpen)} aria-expanded={rechargeOpen} style={{ border: 0, background: 'transparent', padding: 0, color: colors.text_primary, cursor: 'pointer', ...typography.heading_sm }}><span aria-hidden="true">{rechargeOpen ? '▾' : '▸'}</span>{' '}How much should we recharge today?</button>
          {rechargeOpen && <>
          <p style={{ ...typography.body_sm, color: colors.text_secondary }}>Get an exact recharge amount for your target date.</p>
          <label style={{ ...typography.body_sm, color: colors.text_primary }}>I want power to last until{' '}
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} style={{ ...skeumorphic.input(theme), padding: spacing.sm, color: colors.text_primary }} />
          </label>
          <button type="button" onClick={confirmTargetDate} disabled={confirmingDate} style={{ ...skeumorphic.raised(theme), marginLeft: spacing.md, padding: `${spacing.sm} ${spacing.md}`, color: colors.text_primary, cursor: 'pointer' }}>{confirmingDate ? 'Confirming...' : 'Confirm Date'}</button>
          {recharge && <div style={{ backgroundColor: colors.primary, color: colors.text_inverse, padding: spacing.lg, borderRadius: borders.radius_lg, marginTop: spacing.lg }}>
            <span style={typography.label}>Required recharge</span>
            <strong style={{ ...typography.heading_lg, display: 'block', marginTop: spacing.sm }}>BDT {parseFloat(recharge.required_amount).toFixed(2)}</strong>
          </div>}
          {details && <p style={{ ...typography.body_sm, color: colors.text_tertiary }}>Current case: {details.case_id}</p>}
          </>}
        </section>
      </div>
    </main>
  );
};

export default Questions;
