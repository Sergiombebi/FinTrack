// Couleurs principales de l'application
export const COLORS = {
  // Palette de base
  background: '#080808',
  foreground: '#ffffff',
  sidebar: '#0f0f0f',
  
  // Couleurs primaires (vert émeraude)
  primary: '#10b981',
  primaryHover: '#34d399',
  primaryLight: '#d1fae5',
  
  // Couleurs secondaires
  rose: {
    DEFAULT: '#f43f5e',
    light: '#fecdd3',
    bg: 'rgba(244, 63, 94, 0.1)',
  },
  emerald: {
    DEFAULT: '#10b981',
    light: '#d1fae5',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  blue: {
    DEFAULT: '#3b82f6',
    light: '#dbeafe',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  violet: {
    DEFAULT: '#8b5cf6',
    light: '#e9d5ff',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
  teal: {
    DEFAULT: '#14b8a6',
    light: '#ccfbf1',
    bg: 'rgba(20, 184, 166, 0.1)',
  },
  
  // Neutres
  border: 'rgba(255, 255, 255, 0.05)',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textMuted: '#71717a',
  textSecondary: '#a1a1aa',
  
  // Gradients
  gradients: {
    primary: 'from-emerald-400 to-teal-400',
    rose: 'from-rose-500/20 to-rose-600/5',
    emerald: 'from-emerald-500/20 to-emerald-600/5',
    blue: 'from-blue-500/20 to-blue-600/5',
    violet: 'from-violet-500/20 to-violet-600/5',
  }
};

// Espacements et tailles
export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// Bordures et arrondis
export const BORDERS = {
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  width: {
    thin: '1px',
    normal: '2px',
    thick: '4px',
  }
};

// Typographie
export const TYPOGRAPHY = {
  sizes: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
};

// Animations et transitions
export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
  }
};

// Breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
