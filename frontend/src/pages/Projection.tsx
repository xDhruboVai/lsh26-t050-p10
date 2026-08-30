import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../App';
import { spacing, borders, typography, skeumorphic } from '../theme';
import { apiClient, RunOutResponse, RechargeResponse, CaseDetails } from '../api';

interface ProjectionProps {
  caseId: string;
}

const Projection: React.FC<ProjectionProps> = ({ caseId }) => {
  const { theme, colors } = useTheme();
  const [runOut, setRunOut] = useState<RunOutResponse | null>(null);
  const [recharge, setRecharge] = useState<RechargeResponse | null>(null);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.getRunOut(caseId),
      apiClient.getRechargeNeeded(caseId),
      apiClient.getCaseDetails(caseId),
    ])
      .then(([runOutData, rechargeData, details]) => {
        setRunOut(runOutData);
        setRecharge(rechargeData);
        setCaseDetails(details);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  const breakdownData = recharge
    ? [
        { name: 'Base Energy', value: parseFloat(recharge.base_energy) },
        { name: 'Slab Penalty', value: parseFloat(recharge.slab_penalty) },
        { name: 'Fixed Charges', value: parseFloat(recharge.fixed_charges) },
        { name: 'VAT', value: parseFloat(recharge.vat) },
      ]
    : [];

  const chartColors = [colors.primary, colors.warning, colors.info, colors.danger];

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
            Projection Analysis
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
            Loading projection data...
          </div>
        ) : (
          <>
            {/* Run-Out Date Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing['2xl'],
            }}>
              <div style={{
                ...skeumorphic.card(theme),
                padding: spacing.lg,
              }}>
                <h2 style={{
                  ...typography.heading_sm,
                  color: colors.text_secondary,
                  margin: 0,
                  marginBottom: spacing.lg,
                }}>
                  Balance Depletion
                </h2>

                {runOut && (
                  <div>
                    <div style={{
                      ...skeumorphic.gauge(theme),
                      padding: spacing.lg,
                      marginBottom: spacing.lg,
                      textAlign: 'center',
                      borderRadius: borders.radius_lg,
                    }}>
                      <p style={{
                        ...typography.label,
                        color: colors.text_secondary,
                        margin: 0,
                        marginBottom: spacing.sm,
                      }}>
                        Depletion Date
                      </p>
                      <p style={{
                        ...typography.heading_lg,
                        color: colors.danger,
                        margin: 0,
                      }}>
                        {new Date(runOut.run_out_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div style={{
                      backgroundColor: colors.bg_tertiary,
                      padding: spacing.md,
                      borderRadius: borders.radius_md,
                      textAlign: 'center',
                    }}>
                      <p style={{
                        ...typography.label,
                        color: colors.text_secondary,
                        margin: 0,
                        marginBottom: spacing.xs,
                      }}>
                        Days Remaining
                      </p>
                      <p style={{
                        ...typography.heading_md,
                        color: runOut.days_remaining < 30 ? colors.danger : colors.success,
                        margin: 0,
                      }}>
                        {runOut.days_remaining} days
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Today Info */}
              {caseDetails && (
                <div style={{
                  ...skeumorphic.card(theme),
                  padding: spacing.lg,
                }}>
                  <h2 style={{
                    ...typography.heading_sm,
                    color: colors.text_secondary,
                    margin: 0,
                    marginBottom: spacing.lg,
                  }}>
                    Current Status
                  </h2>

                  <div style={{
                    backgroundColor: colors.bg_tertiary,
                    padding: spacing.md,
                    borderRadius: borders.radius_md,
                    marginBottom: spacing.md,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Today
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.text_primary,
                      margin: 0,
                    }}>
                      {new Date(caseDetails.today).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
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
                      Target Date
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.text_primary,
                      margin: 0,
                    }}>
                      {new Date(caseDetails.target_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recharge Breakdown */}
            {recharge && (
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
                  Required Recharge Amount
                </h2>

                {/* Total Amount Display */}
                <div style={{
                  backgroundColor: colors.primary,
                  color: colors.text_inverse,
                  padding: spacing.lg,
                  borderRadius: borders.radius_lg,
                  textAlign: 'center',
                  marginBottom: spacing.lg,
                }}>
                  <p style={{
                    ...typography.label,
                    color: colors.text_inverse,
                    margin: 0,
                    marginBottom: spacing.sm,
                    opacity: 0.9,
                  }}>
                    Total Recharge Needed
                  </p>
                  <p style={{
                    ...typography.heading_xl,
                    color: colors.text_inverse,
                    margin: 0,
                  }}>
                    BDT {parseFloat(recharge.required_amount).toFixed(2)}
                  </p>
                </div>

                {/* Breakdown Chart */}
                <div style={{ marginBottom: spacing.lg }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={breakdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border_secondary} />
                      <XAxis
                        dataKey="name"
                        stroke={colors.text_secondary}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke={colors.text_secondary}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.bg_secondary,
                          border: `1px solid ${colors.border_primary}`,
                          borderRadius: borders.radius_md,
                          color: colors.text_primary,
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {breakdownData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.md,
                }}>
                  <div style={{
                    backgroundColor: colors.bg_tertiary,
                    padding: spacing.md,
                    borderRadius: borders.radius_md,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Base Energy
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.primary,
                      margin: 0,
                    }}>
                      BDT {parseFloat(recharge.base_energy).toFixed(2)}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: colors.bg_tertiary,
                    padding: spacing.md,
                    borderRadius: borders.radius_md,
                    borderLeft: `4px solid ${colors.warning}`,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Slab Penalty
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.warning,
                      margin: 0,
                    }}>
                      BDT {parseFloat(recharge.slab_penalty).toFixed(2)}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: colors.bg_tertiary,
                    padding: spacing.md,
                    borderRadius: borders.radius_md,
                    borderLeft: `4px solid ${colors.info}`,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Fixed Charges
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.info,
                      margin: 0,
                    }}>
                      BDT {parseFloat(recharge.fixed_charges).toFixed(2)}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: colors.bg_tertiary,
                    padding: spacing.md,
                    borderRadius: borders.radius_md,
                    borderLeft: `4px solid ${colors.danger}`,
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_secondary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Value Added Tax
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.danger,
                      margin: 0,
                    }}>
                      BDT {parseFloat(recharge.vat).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Projection;
