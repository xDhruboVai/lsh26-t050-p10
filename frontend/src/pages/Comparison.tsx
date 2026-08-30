import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../App';
import { spacing, borders, typography, skeumorphic } from '../theme';
import { apiClient, ComparisonEntry, MonthlyComparisonEntry } from '../api';

interface ComparisonProps {
  caseId: string;
}

const Comparison: React.FC<ComparisonProps> = ({ caseId }) => {
  const { theme, colors } = useTheme();
  const [comparison, setComparison] = useState<ComparisonEntry[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparisonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.getHabitComparison(caseId), apiClient.getMonthlyComparison(caseId)])
      .then(([habitData, monthlyData]) => { setComparison(habitData); setMonthlyComparison(monthlyData); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  const chartData = comparison.map((habit) => ({
    habit: habit.habit === 'Low Balance Reactive' ? 'Reactive' : 'Proactive',
    'Total Cost': parseFloat(habit.total_cost),
    'Energy': parseFloat(habit.energy_cost),
    'VAT': parseFloat(habit.vat),
    'Fixed': parseFloat(habit.fixed_charges),
    'Recharge Funded': parseFloat(habit.recharge_total),
  }));

  const cheaperHabit = comparison.length === 2
    ? parseFloat(comparison[0].total_cost) < parseFloat(comparison[1].total_cost)
      ? comparison[0]
      : parseFloat(comparison[1].total_cost) < parseFloat(comparison[0].total_cost)
        ? comparison[1]
        : null
    : null;

  const savingsAmount = comparison.length === 2
    ? Math.abs(
        parseFloat(comparison[0].total_cost) - parseFloat(comparison[1].total_cost)
      )
    : 0;

  const monthlyChartData = monthlyComparison.map((item) => ({
    period: `${new Date(`${item.first_month}-01`).toLocaleDateString('en-US', { month: 'long' })} / ${new Date(`${item.second_month}-01`).toLocaleDateString('en-US', { month: 'long' })}`,
    firstMonth: parseFloat(item.first_cost),
    secondMonth: parseFloat(item.second_cost),
    firstLabel: item.first_month,
    secondLabel: item.second_month,
  }));

  return (
    <main style={{
      flex: 1,
      padding: spacing['2xl'],
      backgroundColor: colors.bg_primary,
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: spacing['2xl'] }}>
          <h1 style={{
            ...typography.heading_lg,
            color: colors.text_primary,
            margin: 0,
            marginBottom: spacing.sm,
          }}>
            Recharge Strategy Comparison
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
            Loading comparison data...
          </div>
        ) : comparison.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing['2xl'],
            }}>
              {comparison.map((habit, idx) => (
                <div
                  key={idx}
                  style={{
                    ...skeumorphic.card(theme),
                    padding: spacing.lg,
                    border: habit === cheaperHabit ? `2px solid ${colors.success}` : `1px solid ${colors.border_primary}`,
                    position: 'relative',
                  }}
                >
                  {habit === cheaperHabit && (
                    <div style={{
                      position: 'absolute',
                      top: spacing.md,
                      right: spacing.md,
                      backgroundColor: colors.success,
                      color: colors.text_inverse,
                      padding: `${spacing.xs} ${spacing.md}`,
                      borderRadius: borders.radius_full,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      More Economical
                    </div>
                  )}

                  <h3 style={{
                    ...typography.heading_md,
                    color: colors.text_primary,
                    margin: 0,
                    marginBottom: spacing.lg,
                  }}>
                    {habit.habit === 'Low Balance Reactive' ? 'Reactive Strategy' : 'Proactive Strategy'}
                  </h3>

                  <div style={{
                    backgroundColor: colors.primary,
                    color: colors.text_inverse,
                    padding: spacing.lg,
                    borderRadius: borders.radius_lg,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_inverse,
                      margin: 0,
                      marginBottom: spacing.sm,
                      opacity: 0.9,
                    }}>
                      Total Cost
                    </p>
                    <p style={{
                      ...typography.heading_lg,
                      color: colors.text_inverse,
                      margin: 0,
                    }}>
                      BDT {parseFloat(habit.total_cost).toFixed(2)}
                    </p>
                  </div>

                  <div style={{
                    display: 'space-y-sm',
                  }}>
                    <div style={{
                      backgroundColor: colors.bg_tertiary,
                      padding: spacing.md,
                      borderRadius: borders.radius_md,
                      marginBottom: spacing.sm,
                    }}>
                      <p style={{
                        ...typography.label,
                        color: colors.text_secondary,
                        margin: 0,
                        marginBottom: spacing.xs,
                      }}>
                        Energy Cost
                      </p>
                      <p style={{
                        ...typography.heading_sm,
                        color: colors.text_primary,
                        margin: 0,
                      }}>
                        BDT {parseFloat(habit.energy_cost).toFixed(2)}
                      </p>
                    </div>

                    <div style={{
                      backgroundColor: colors.bg_tertiary,
                      padding: spacing.md,
                      borderRadius: borders.radius_md,
                      marginBottom: spacing.sm,
                    }}>
                      <p style={{
                        ...typography.label,
                        color: colors.text_secondary,
                        margin: 0,
                        marginBottom: spacing.xs,
                      }}>
                        VAT (5%)
                      </p>
                      <p style={{
                        ...typography.heading_sm,
                        color: colors.text_primary,
                        margin: 0,
                      }}>
                        BDT {parseFloat(habit.vat).toFixed(2)}
                      </p>
                    </div>

                    <div style={{
                      backgroundColor: colors.bg_tertiary,
                      padding: spacing.md,
                      borderRadius: borders.radius_md,
                    }}>
                      <p style={{
                        ...typography.label,
                        color: colors.text_secondary,
                        margin: 0,
                        marginBottom: spacing.xs,
                      }}>
                        Fixed Charges (Monthly)
                      </p>
                      <p style={{
                        ...typography.body,
                        color: colors.text_primary,
                        margin: 0,
                      }}>
                        {habit.fixed_charge_count} months triggered
                      </p>
                      <p style={{
                        ...typography.heading_sm,
                        color: colors.text_primary,
                        margin: 0,
                      }}>
                        BDT {parseFloat(habit.fixed_charges).toFixed(2)}
                      </p>
                    </div>

                    <div style={{
                      backgroundColor: colors.bg_tertiary,
                      padding: spacing.md,
                      borderRadius: borders.radius_md,
                    }}>
                      <p style={{
                        ...typography.label,
                        color: colors.text_secondary,
                        margin: 0,
                        marginBottom: spacing.xs,
                      }}>
                        Recharge Funded
                      </p>
                      <p style={{
                        ...typography.heading_sm,
                        color: colors.text_primary,
                        margin: 0,
                      }}>
                        BDT {parseFloat(habit.recharge_total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {monthlyChartData.length > 0 && <div style={{ ...skeumorphic.card(theme), padding: spacing.lg, marginTop: spacing.lg }}>
              <h3 style={{ ...typography.heading_sm, color: colors.text_primary, margin: `0 0 ${spacing.lg} 0` }}>Month-to-Month Usage Cost</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border_secondary} />
                  <XAxis dataKey="period" stroke={colors.text_secondary} />
                  <YAxis stroke={colors.text_secondary} />
                  <Tooltip contentStyle={{ backgroundColor: colors.bg_secondary, border: `1px solid ${colors.border_primary}`, color: colors.text_primary }} />
                  <Legend />
                  <Bar dataKey="firstMonth" name="First month" fill={colors.primary} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="secondMonth" name="Second month" fill={colors.warning} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>}

            {/* Difference Summary */}
            {comparison.length === 2 && (
              <div style={{
                ...skeumorphic.card(theme),
                padding: spacing.lg,
                backgroundColor: theme === 'light'
                  ? 'rgba(45, 122, 74, 0.05)'
                  : 'rgba(74, 222, 128, 0.1)',
                borderLeft: `4px solid ${colors.success}`,
                marginBottom: spacing.lg,
              }}>
                <h3 style={{
                  ...typography.heading_sm,
                  color: colors.success,
                  margin: 0,
                  marginBottom: spacing.md,
                }}>
                  Analysis
                </h3>
                <p style={{
                  ...typography.body,
                  color: colors.text_primary,
                  margin: 0,
                }}>
                  {cheaperHabit ? <><strong>{cheaperHabit.habit === 'Low Balance Reactive' ? 'Reactive Strategy' : 'Proactive Strategy'}</strong> is more economical by <strong>BDT {savingsAmount.toFixed(2)}</strong>.</> : <>Both habits have the same calculated billing cost.</>}
                </p>
                <p style={{
                  ...typography.body_sm,
                  color: colors.text_secondary,
                  margin: `${spacing.md} 0 0 0`,
                }}>
                  Energy and VAT match because both habits use the same readings. The cash-planning bars show how much each habit funds through recharge events, while fixed charges depend on the first recharge in each calendar month.
                </p>
              </div>
            )}

            {/* Comparison Chart */}
            <div style={{
              ...skeumorphic.card(theme),
              padding: spacing.lg,
            }}>
              <h3 style={{
                ...typography.heading_sm,
                color: colors.text_primary,
                margin: `0 0 ${spacing.lg} 0`,
              }}>
                  Billing Components and Cash Planning
              </h3>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border_secondary} />
                  <XAxis
                    dataKey="habit"
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
                  <Bar
                    dataKey="Energy"
                    stackId="a"
                    fill={colors.primary}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar dataKey="VAT" stackId="a" fill={colors.warning} />
                  <Bar dataKey="Fixed" stackId="a" fill={colors.info} />
                  <Bar dataKey="Recharge Funded" fill={colors.success} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={{
            ...skeumorphic.card(theme),
            padding: spacing['2xl'],
            textAlign: 'center',
            color: colors.text_secondary,
          }}>
            No comparison data available
          </div>
        )}
      </div>
    </main>
  );
};

export default Comparison;
