import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useTheme } from '../App';
import { spacing, borders, typography, skeumorphic } from '../theme';
import { apiClient, TimelineEntry, CaseDetails } from '../api';

interface TimelineProps {
  caseId: string;
}

const Timeline: React.FC<TimelineProps> = ({ caseId }) => {
  const { theme, colors } = useTheme();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.getTimeline(caseId),
      apiClient.getCaseDetails(caseId),
    ])
      .then(([timelineData, details]) => {
        setTimeline(timelineData);
        setCaseDetails(details);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  const chartData = timeline.map((entry) => ({
    ...entry,
    monthKey: entry.date.slice(0, 7),
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    balance: parseFloat(entry.balance),
    energy_cost: parseFloat(entry.energy_cost),
    vat: parseFloat(entry.vat),
  }));

  const rechargePoints = chartData.filter((entry) => parseFloat(entry.recharge) > 0);
  const monthlyGroups = Array.from(new Set(chartData.map((entry) => entry.monthKey))).map((monthKey) => {
    const rows = chartData.filter((entry) => entry.monthKey === monthKey);
    const average = rows.reduce((sum, row) => sum + row.units, 0) / rows.length;
    const level = average < 10 ? 'Light Usage' : average < 20 ? 'Medium Usage' : 'High Usage';
    const tagColor = level === 'Light Usage' ? colors.success : level === 'Medium Usage' ? colors.warning : colors.danger;
    return { monthKey, rows, average, level, tagColor };
  });

  return (
    <main style={{
      flex: 1,
      padding: spacing['2xl'],
      backgroundColor: colors.bg_primary,
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: spacing['2xl'] }}>
          <h1 style={{
            ...typography.heading_lg,
            color: colors.text_primary,
            margin: 0,
            marginBottom: spacing.sm,
          }}>
            Balance Timeline
          </h1>
          <p style={{
            ...typography.body_sm,
            color: colors.text_secondary,
            margin: 0,
          }}>
            Case: {caseId}
          </p>
        </div>

        {loading ? (
          <div style={{
            ...skeumorphic.card(theme),
            padding: spacing['2xl'],
            textAlign: 'center',
            color: colors.text_secondary,
          }}>
            Loading timeline...
          </div>
        ) : (
          <>
            {/* Chart Section */}
            <div style={{
              ...skeumorphic.card(theme),
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}>
              <h2 style={{
                ...typography.heading_sm,
                color: colors.text_primary,
                margin: `0 0 ${spacing.lg} 0`,
              }}>
                Daily Balance
              </h2>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border_secondary} />
                  <XAxis
                    dataKey="date"
                    stroke={colors.text_secondary}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke={colors.text_secondary}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'BDT', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.bg_secondary,
                      border: `1px solid ${colors.border_primary}`,
                      borderRadius: borders.radius_md,
                      color: colors.text_primary,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke={colors.primary}
                    dot={false}
                    strokeWidth={2}
                    name="Balance"
                  />
                  {/* Recharge markers */}
                  {rechargePoints.map((point, idx) => (
                    <ReferenceDot
                      key={idx}
                      x={point.date}
                      y={point.balance}
                      r={6}
                      fill={colors.success}
                      stroke={colors.primary}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <div style={{
                marginTop: spacing.lg,
                display: 'flex',
                gap: spacing.lg,
                fontSize: '0.875rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: colors.success,
                    border: `2px solid ${colors.primary}`,
                  }} />
                  <span style={{ color: colors.text_secondary }}>Recharge event</span>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.lg,
            }}>
              {caseDetails && (
                <>
                  <div style={{
                    ...skeumorphic.card(theme),
                    padding: spacing.lg,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}>
                      Opening Balance
                    </p>
                    <p style={{
                      ...typography.heading_md,
                      color: colors.primary,
                      margin: 0,
                    }}>
                      BDT {parseFloat(caseDetails.opening_balance).toFixed(2)}
                    </p>
                  </div>

                  <div style={{
                    ...skeumorphic.card(theme),
                    padding: spacing.lg,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}>
                      Final Balance
                    </p>
                    <p style={{
                      ...typography.heading_md,
                      color: chartData.length > 0 && chartData[chartData.length - 1].balance < 0 
                        ? colors.danger
                        : colors.success,
                      margin: 0,
                    }}>
                      BDT {chartData.length > 0 ? chartData[chartData.length - 1].balance.toFixed(2) : '0.00'}
                    </p>
                  </div>

                  <div style={{
                    ...skeumorphic.card(theme),
                    padding: spacing.lg,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}>
                      Today Date
                    </p>
                    <p style={{
                      ...typography.heading_md,
                      color: colors.text_primary,
                      margin: 0,
                      fontSize: '1rem',
                    }}>
                      {new Date(caseDetails.today).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div style={{
                    ...skeumorphic.card(theme),
                    padding: spacing.lg,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}>
                      Usual Daily Usage
                    </p>
                    <p style={{
                      ...typography.heading_md,
                      color: colors.text_primary,
                      margin: 0,
                    }}>
                      {caseDetails.usual_daily_units} units
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Data Table */}
            <div style={{
              ...skeumorphic.card(theme),
              padding: spacing.lg,
              marginTop: spacing.lg,
              overflowX: 'auto',
            }}>
              <h3 style={{
                ...typography.heading_sm,
                color: colors.text_primary,
                margin: `0 0 ${spacing.lg} 0`,
              }}>
                Detailed Timeline
              </h3>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }}>
                <thead>
                  <tr style={{
                    borderBottom: `2px solid ${colors.border_primary}`,
                  }}>
                    <th style={{
                      padding: spacing.md,
                      textAlign: 'left',
                      color: colors.text_secondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                    }}>Date</th>
                    <th style={{
                      padding: spacing.md,
                      textAlign: 'right',
                      color: colors.text_secondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                    }}>Balance</th>
                    <th style={{
                      padding: spacing.md,
                      textAlign: 'right',
                      color: colors.text_secondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                    }}>Energy Cost</th>
                    <th style={{
                      padding: spacing.md,
                      textAlign: 'right',
                      color: colors.text_secondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                    }}>Recharge</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyGroups.map((group) => <React.Fragment key={group.monthKey}>
                    <tr style={{ backgroundColor: colors.bg_tertiary }} onClick={() => setOpenMonths((current) => ({ ...current, [group.monthKey]: current[group.monthKey] === false }))}>
                      <td colSpan={4} style={{ padding: spacing.md, color: colors.text_primary, fontWeight: 700 }}>
                        <button type="button" style={{ border: 0, background: 'transparent', color: colors.text_primary, cursor: 'pointer', fontWeight: 700 }}>
                          <span aria-hidden="true">{openMonths[group.monthKey] ? '▾' : '▸'}</span>{' '}
                          {new Date(`${group.monthKey}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </button>
                        <span style={{ marginLeft: spacing.md, padding: `${spacing.xs} ${spacing.sm}`, borderRadius: borders.radius_full, color: group.tagColor, border: `1px solid ${group.tagColor}`, fontSize: '0.75rem' }}>
                          {group.level} · {group.average.toFixed(1)} kWh/day
                        </span>
                      </td>
                    </tr>
                    {openMonths[group.monthKey] === true && group.rows.map((entry, idx) => <tr
                      key={`${group.monthKey}-${idx}`}
                      style={{
                        borderBottom: `1px solid ${colors.border_secondary}`,
                        backgroundColor: parseFloat(entry.recharge) > 0 ? colors.bg_tertiary : 'transparent',
                      }}
                    >
                      <td style={{ padding: spacing.md, color: colors.text_primary }}>
                        {entry.date}
                      </td>
                      <td style={{
                        padding: spacing.md,
                        textAlign: 'right',
                        color: entry.balance < 0 ? colors.danger : colors.primary,
                        fontWeight: 600,
                      }}>
                        {entry.balance.toFixed(2)}
                      </td>
                      <td style={{
                        padding: spacing.md,
                        textAlign: 'right',
                        color: colors.text_secondary,
                      }}>
                        {entry.energy_cost}
                      </td>
                      <td style={{
                        padding: spacing.md,
                        textAlign: 'right',
                        color: parseFloat(entry.recharge) > 0 ? colors.success : colors.text_tertiary,
                        fontWeight: parseFloat(entry.recharge) > 0 ? 600 : 400,
                      }}>
                        {parseFloat(entry.recharge) > 0 ? `+${entry.recharge}` : '—'}
                      </td>
                    </tr>)}
                  </React.Fragment>)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Timeline;
