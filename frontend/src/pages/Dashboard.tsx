import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { spacing, borders, skeumorphic, typography } from '../theme';
import { apiClient, CaseListItem } from '../api';

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
  cases: CaseListItem[];
  casesLoading: boolean;
  refreshCases: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectCase, cases, casesLoading, refreshCases }) => {
  const { theme, colors } = useTheme();
  const navigate = useNavigate();
  const uploadInput = useRef<HTMLInputElement>(null);

  return (
    <main style={{
      flex: 1,
      padding: spacing['2xl'],
      backgroundColor: colors.bg_primary,
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="dashboard-hero" style={{ marginBottom: spacing['3xl'] }}>
          <p style={{ ...typography.label, color: colors.primary, margin: 0, marginBottom: spacing.sm }}>Meter control center</p>
          <h1 style={{
            ...typography.heading_xl,
            color: colors.text_primary,
            margin: 0,
            marginBottom: spacing.md,
          }}>
            Prepaid Meter Analyzer
          </h1>
          <p style={{
            ...typography.body,
            color: colors.text_secondary,
            margin: 0,
          }}>
            Select a case to analyze balance timelines, projections, and recharge strategies.
          </p>
          <div className="hero-rule" />
        </div>

        {casesLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            ...skeumorphic.card(theme),
            padding: spacing['2xl'],
          }}>
            <p style={{ color: colors.text_secondary }}>Loading cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            ...skeumorphic.card(theme),
            padding: spacing['2xl'],
          }}>
            <p style={{ color: colors.text_secondary }}>No cases available</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: spacing.lg,
          }}>
            {cases.map((caseItem) => (
              <div
                key={caseItem.case_id}
                onClick={() => {
                  onSelectCase(caseItem.case_id);
                  navigate('/timeline');
                }}
                className="case-card"
                style={{
                  ...skeumorphic.card(theme),
                  padding: spacing.lg,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = theme === 'light'
                    ? '0 12px 24px 0 rgba(0, 0, 0, 0.12)'
                    : '0 12px 24px 0 rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = theme === 'light'
                    ? '0 2px 8px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)'
                    : '0 2px 8px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)';
                }}
              >
                {/* Case ID Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: borders.radius_lg,
                    backgroundColor: colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.text_inverse,
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    marginRight: spacing.md,
                    ...skeumorphic.gauge(theme),
                  }}>
                    {caseItem.case_id.split('-')[1]}
                  </div>
                  <div>
                    <h3 style={{
                      ...typography.heading_sm,
                      color: colors.text_primary,
                      margin: 0,
                    }}>
                      {caseItem.case_id}
                    </h3>
                    <p style={{
                      ...typography.body_sm,
                      color: colors.text_tertiary,
                      margin: 0,
                    }}>
                      Meter Profile
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: spacing.md,
                  marginBottom: spacing.lg,
                }}>
                  <div style={{
                    backgroundColor: colors.bg_tertiary,
                    padding: spacing.md,
                    borderRadius: borders.radius_md,
                    textAlign: 'center',
                  }}>
                    <p style={{
                      ...typography.label,
                      color: colors.text_tertiary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Days
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.text_primary,
                      margin: 0,
                    }}>
                      {caseItem.days_count}
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
                      color: colors.text_tertiary,
                      margin: 0,
                      marginBottom: spacing.xs,
                    }}>
                      Recharges
                    </p>
                    <p style={{
                      ...typography.heading_sm,
                      color: colors.text_primary,
                      margin: 0,
                    }}>
                      {caseItem.recharges_count}
                    </p>
                  </div>
                </div>

                {/* Opening Balance */}
                <div style={{
                  backgroundColor: colors.bg_tertiary,
                  padding: spacing.md,
                  borderRadius: borders.radius_md,
                  textAlign: 'center',
                }}>
                  <p style={{
                    ...typography.label,
                    color: colors.text_tertiary,
                    margin: 0,
                    marginBottom: spacing.xs,
                  }}>
                    Opening Balance
                  </p>
                  <p style={{
                    ...typography.heading_md,
                    color: colors.primary,
                    margin: 0,
                  }}>
                    BDT {parseFloat(caseItem.opening_balance).toFixed(2)}
                  </p>
                </div>

                {/* Action indicator */}
                <div style={{
                  marginTop: spacing.lg,
                  padding: spacing.md,
                  backgroundColor: colors.bg_tertiary,
                  borderRadius: borders.radius_md,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: colors.primary,
                  fontWeight: 600,
                }}>
                  Analyze Case
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          ref={uploadInput}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const uploaded = await apiClient.uploadCase(await file.text());
              if (uploaded.length === 0) throw new Error('No cases found in the uploaded file.');
              await refreshCases();
              onSelectCase(uploaded[0].case_id);
              navigate('/timeline');
            } catch (error) {
              console.error(error);
              window.alert('Could not upload this case. Check that it matches the documented JSON format.');
            }
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => uploadInput.current?.click()}
          style={{ ...skeumorphic.raised(theme), marginTop: spacing.lg, padding: spacing.md, color: colors.text_primary, cursor: 'pointer' }}
        >
          Upload Your Own Case
        </button>
      </div>
    </main>
  );
};

export default Dashboard;
