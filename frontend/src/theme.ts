/**
 * Design System: Neumorphic, Premium Utility Interface
 * Dark and Light Mode Support
 */

export type Theme = 'light' | 'dark';

// Amethyst utility palette
export const colors = {
  light: {
    // Surfaces
    bg_primary: '#EDE8F2',
    bg_secondary: '#F8F6FA',
    bg_tertiary: '#D8D0E2',

    // Accents - Energy/Utility themed
    primary: '#73648A',
    primary_light: '#9882AC',
    success: '#4D8061',
    warning: '#A8753A',
    danger: '#9A5368',
    info: '#607D9A',

    // Text
    text_primary: '#453750',
    text_secondary: '#73648A',
    text_tertiary: '#9882AC',
    text_inverse: '#FFFFFF',

    // Borders
    border_primary: '#A393BF',
    border_secondary: '#C8BDD5',

    // Shadows (skeumorphic depth)
    shadow_sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    shadow_md: '0 4px 6px 0 rgba(0, 0, 0, 0.12)',
    shadow_lg: '0 10px 15px 0 rgba(0, 0, 0, 0.15)',
    shadow_xl: '0 20px 25px 0 rgba(0, 0, 0, 0.2)',
    shadow_inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    shadow_inset_subtle: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },

  dark: {
    // Surfaces
    bg_primary: '#0C0910',
    bg_secondary: '#241C2A',
    bg_tertiary: '#453750',

    // Accents - Energy/Utility themed
    primary: '#A393BF',
    primary_light: '#B8A8D0',
    success: '#72C697',
    warning: '#D6A565',
    danger: '#D98AA0',
    info: '#91ABC8',

    // Text
    text_primary: '#F8F6FA',
    text_secondary: '#D8D0E2',
    text_tertiary: '#A393BF',
    text_inverse: '#0C0910',

    // Borders
    border_primary: '#73648A',
    border_secondary: '#453750',

    // Shadows (skeumorphic depth)
    shadow_sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
    shadow_md: '0 4px 6px 0 rgba(0, 0, 0, 0.4)',
    shadow_lg: '0 10px 15px 0 rgba(0, 0, 0, 0.5)',
    shadow_xl: '0 20px 25px 0 rgba(0, 0, 0, 0.6)',
    shadow_inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
    shadow_inset_subtle: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
  },
};

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
};

export const typography = {
  heading_xs: {
    fontSize: '0.875rem',
    fontWeight: 700,
    lineHeight: '1.25rem',
    letterSpacing: '0',
  },
  heading_sm: {
    fontSize: '1rem',
    fontWeight: 700,
    lineHeight: '1.5rem',
    letterSpacing: '0',
  },
  heading_md: {
    fontSize: '1.25rem',
    fontWeight: 700,
    lineHeight: '1.75rem',
  },
  heading_lg: {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: '2rem',
  },
  heading_xl: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: '2.5rem',
  },
  body_sm: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
  },
  body: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
  },
  body_lg: {
    fontSize: '1.125rem',
    fontWeight: 400,
    lineHeight: '1.75rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: '1rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
};

export const borders = {
  radius_sm: '4px',
  radius_md: '8px',
  radius_lg: '12px',
  radius_xl: '16px',
  radius_2xl: '24px',
  radius_full: '9999px',
};

// Skeumorphic component helper styles
export const skeumorphic = {
  // Raised button effect (convex)
  raised: (theme: Theme) => ({
    background: theme === 'light' 
      ? 'linear-gradient(145deg, #ffffff 0%, #e7e0ee 100%)'
      : 'linear-gradient(145deg, #32263a 0%, #17121c 100%)',
    boxShadow: theme === 'light'
      ? '8px 8px 16px rgba(115, 100, 138, 0.20), -6px -6px 14px rgba(255, 255, 255, 0.85)'
      : '8px 8px 16px rgba(0, 0, 0, 0.45), -5px -5px 12px rgba(163, 147, 191, 0.06)',
    border: `1px solid ${theme === 'light' ? '#e7e0ee' : '#453750'}`,
  }),

  // Pressed/inset effect (concave)
  pressed: (theme: Theme) => ({
    background: theme === 'light'
      ? 'linear-gradient(145deg, #e5deec 0%, #f4f1f7 100%)'
      : 'linear-gradient(145deg, #17121c 0%, #32263a 100%)',
    boxShadow: theme === 'light'
      ? 'inset 5px 5px 10px rgba(115, 100, 138, 0.20), inset -4px -4px 8px rgba(255, 255, 255, 0.7)'
      : 'inset 5px 5px 10px rgba(0, 0, 0, 0.40), inset -3px -3px 8px rgba(163, 147, 191, 0.05)',
    border: `1px solid ${theme === 'light' ? '#D0D0D0' : '#2A3A4A'}`,
  }),

  // Card style (subtle depth)
  card: (theme: Theme) => ({
    background: theme === 'light' ? '#F8F6FA' : '#241C2A',
    boxShadow: theme === 'light'
      ? '10px 10px 22px rgba(115, 100, 138, 0.18), -8px -8px 18px rgba(255, 255, 255, 0.9)'
      : '10px 10px 22px rgba(0, 0, 0, 0.45), -6px -6px 16px rgba(163, 147, 191, 0.05)',
    border: `1px solid ${theme === 'light' ? '#eee8f3' : '#453750'}`,
    borderRadius: borders.radius_lg,
  }),

  // Input field (recessed)
  input: (theme: Theme) => ({
    background: theme === 'light'
      ? 'linear-gradient(to bottom, #FAFAFA, #FFFFFF)'
      : 'linear-gradient(to bottom, #0A0E15, #151D2A)',
    boxShadow: theme === 'light'
      ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06), inset 0 1px 1px 0 rgba(0, 0, 0, 0.03)'
      : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3), inset 0 1px 1px 0 rgba(0, 0, 0, 0.2)',
    border: `1px solid ${theme === 'light' ? '#D5D5D5' : '#2A3F4F'}`,
    borderRadius: borders.radius_md,
  }),

  // Gauge / metric display
  gauge: (theme: Theme) => ({
    background: theme === 'light'
      ? 'radial-gradient(circle, #F5F5F5, #E0E0E0)'
      : 'radial-gradient(circle, #2A3F4F, #1A2E3F)',
    boxShadow: theme === 'light'
      ? '0 4px 12px 0 rgba(0, 0, 0, 0.1), inset 0 2px 4px 0 rgba(255, 255, 255, 0.5)'
      : '0 4px 12px 0 rgba(0, 0, 0, 0.4), inset 0 2px 4px 0 rgba(255, 255, 255, 0.05)',
    border: `2px solid ${theme === 'light' ? '#D0D0D0' : '#3A5A7A'}`,
  }),
};

export const getThemeColors = (theme: Theme) => colors[theme];
export const getSkeumorphicStyle = (variant: keyof typeof skeumorphic, theme: Theme) => {
  return skeumorphic[variant](theme);
};
