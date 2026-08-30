import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import { spacing, borders, skeumorphic } from '../theme';
import { apiClient, CaseListItem } from '../api';

interface NavigationProps {
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ selectedCaseId, onSelectCase }) => {
  const { theme, colors } = useTheme();
  const location = useLocation();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.listCases().then(setCases).catch(console.error).finally(() => setLoading(false));
  }, []);

  const navItems = [
    { path: '/', label: 'Household Overview', icon: '⊟' },
    ...(selectedCaseId ? [
      { path: '/timeline', label: 'Usage Timeline', icon: '◲' },
      { path: '/projection', label: 'Recharge Planner', icon: '▹' },
      { path: '/comparison', label: 'Habit Comparison', icon: '⊞' },
      { path: '/questions', label: 'Power Planning Hub', icon: '?' },
    ] : []),
    { path: '/tariff', label: 'Tariff Reference', icon: '▥' },
    { path: '/settings', label: 'Settings', icon: '⚙' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="app-sidebar" style={{
      width: '280px',
      backgroundColor: colors.bg_secondary,
      borderRight: `1px solid ${colors.border_primary}`,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme === 'light' 
        ? '2px 0 8px rgba(0, 0, 0, 0.05)' 
        : '2px 0 8px rgba(0, 0, 0, 0.3)',
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.border_secondary}`,
        ...skeumorphic.card(theme),
        background: colors.bg_secondary,
        marginBottom: spacing.md,
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: colors.primary,
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          P10 Meter
        </h1>
        <p style={{
          fontSize: '0.75rem',
          color: colors.text_tertiary,
          margin: `${spacing.xs} 0 0 0`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Prepaid Advisor
        </p>
      </div>

      {/* Case Selector */}
      <div style={{ padding: spacing.lg, borderBottom: `1px solid ${colors.border_secondary}` }}>
        <label style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: colors.text_secondary,
          marginBottom: spacing.sm,
        }}>
          Select Case
        </label>
        <select
          className="case-select"
          value={selectedCaseId || ''}
          onChange={(e) => {
            const caseId = e.target.value;
            if (caseId) onSelectCase(caseId);
          }}
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: colors.bg_primary,
            color: colors.text_primary,
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            ...skeumorphic.input(theme),
          }}
          disabled={loading}
        >
          <option value="">Choose a case...</option>
          {cases.map((c) => (
            <option key={c.case_id} value={c.case_id}>
              {c.case_id} | {new Date(c.today).toLocaleDateString('en-US', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: spacing.lg }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: `${spacing.md} ${spacing.lg}`,
              marginBottom: spacing.sm,
              borderRadius: borders.radius_md,
              textDecoration: 'none',
              color: isActive(item.path) ? colors.text_inverse : colors.text_primary,
              backgroundColor: isActive(item.path) ? colors.primary : 'transparent',
              fontSize: '0.95rem',
              fontWeight: isActive(item.path) ? 600 : 500,
              transition: 'all 0.2s ease',
              border: isActive(item.path) ? `1px solid ${colors.primary}` : `1px solid transparent`,
              ...(!isActive(item.path) && skeumorphic.raised(theme)),
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                (e.currentTarget as HTMLElement).style.backgroundColor = colors.bg_tertiary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ marginRight: spacing.md, fontSize: '1.2rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: spacing.lg,
        borderTop: `1px solid ${colors.border_secondary}`,
        fontSize: '0.75rem',
        color: colors.text_tertiary,
        textAlign: 'center',
      }}>
        <p style={{ margin: 0 }}>Prepaid Meter Billing Engine</p>
        <p style={{ margin: `${spacing.xs} 0 0 0`, fontStyle: 'italic' }}>v1.0</p>
      </div>
    </aside>
  );
};

export default Navigation;
