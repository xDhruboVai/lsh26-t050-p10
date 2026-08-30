import React from 'react';
import { useTheme } from '../App';
import { spacing, borders, typography, skeumorphic } from '../theme';

const Settings: React.FC = () => {
  const { theme, setTheme, colors } = useTheme();

  return (
    <main style={{
      flex: 1,
      padding: spacing['2xl'],
      backgroundColor: colors.bg_primary,
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: spacing['2xl'] }}>
          <h1 style={{
            ...typography.heading_lg,
            color: colors.text_primary,
            margin: 0,
            marginBottom: spacing.md,
          }}>
            Settings
          </h1>
          <p style={{
            ...typography.body_sm,
            color: colors.text_secondary,
            margin: 0,
          }}>
            Configure application preferences
          </p>
        </div>

        {/* Theme Selector */}
        <div style={{
          ...skeumorphic.card(theme),
          padding: spacing.lg,
          marginBottom: spacing.lg,
        }}>
          <div style={{ marginBottom: spacing.lg }}>
            <h2 style={{
              ...typography.heading_md,
              color: colors.text_primary,
              margin: 0,
              marginBottom: spacing.md,
            }}>
              Appearance
            </h2>
            <p style={{
              ...typography.body_sm,
              color: colors.text_secondary,
              margin: 0,
              marginBottom: spacing.lg,
            }}>
              Choose your preferred theme for the interface
            </p>

            <div style={{
              display: 'flex',
              gap: spacing.md,
            }}>
              {['light', 'dark'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t as 'light' | 'dark')}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borders.radius_lg,
                    border: theme === t
                      ? `2px solid ${colors.primary}`
                      : `1px solid ${colors.border_primary}`,
                    backgroundColor: theme === t ? colors.primary : colors.bg_tertiary,
                    color: theme === t ? colors.text_inverse : colors.text_primary,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize',
                    ...(!theme.includes(t) ? skeumorphic.raised(theme) : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== t) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = colors.bg_tertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== t) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = colors.bg_tertiary;
                    }
                  }}
                >
                  {t === 'light' ? '☀️' : '🌙'} {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div style={{
          ...skeumorphic.card(theme),
          padding: spacing.lg,
        }}>
          <h2 style={{
            ...typography.heading_md,
            color: colors.text_primary,
            margin: 0,
            marginBottom: spacing.md,
          }}>
            About
          </h2>

          <div style={{ marginBottom: spacing.lg }}>
            <p style={{
              ...typography.label,
              color: colors.text_secondary,
              margin: 0,
              marginBottom: spacing.xs,
            }}>
              Application
            </p>
            <p style={{
              ...typography.body,
              color: colors.text_primary,
              margin: 0,
            }}>
              P10 Prepaid Meter Advisor
            </p>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <p style={{
              ...typography.label,
              color: colors.text_secondary,
              margin: 0,
              marginBottom: spacing.xs,
            }}>
              Version
            </p>
            <p style={{
              ...typography.body,
              color: colors.text_primary,
              margin: 0,
            }}>
              1.0.0
            </p>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <p style={{
              ...typography.label,
              color: colors.text_secondary,
              margin: 0,
              marginBottom: spacing.xs,
            }}>
              Engine
            </p>
            <p style={{
              ...typography.body,
              color: colors.text_primary,
              margin: 0,
            }}>
              Deterministic Billing Engine
            </p>
          </div>

          <div style={{
            backgroundColor: colors.bg_tertiary,
            padding: spacing.md,
            borderRadius: borders.radius_md,
            marginTop: spacing.lg,
          }}>
            <p style={{
              ...typography.body_sm,
              color: colors.text_secondary,
              margin: 0,
              fontStyle: 'italic',
            }}>
              This application analyzes prepaid meter billing patterns using deterministic financial simulation against fixed tariff rules. No machine learning or forecasting models are used in core calculations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Settings;
