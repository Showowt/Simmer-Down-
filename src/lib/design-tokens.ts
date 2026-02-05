// SIMMER DOWN DESIGN TOKENS
// Single source of truth for all design values

export const tokens = {
  // ============================================
  // COLORS
  // ============================================
  colors: {
    // Brand
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Primary brand color
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    // Neutrals (Zinc-based)
    zinc: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    // Semantic
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // ============================================
  // SPACING (8px base scale)
  // ============================================
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    14: '3.5rem',  // 56px - minimum touch target
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
      mono: 'var(--font-geist-mono), ui-monospace, monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1.1' }],
      '6xl': ['3.75rem', { lineHeight: '1.1' }],
      '7xl': ['4.5rem', { lineHeight: '1.05' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // ============================================
  // BORDERS
  // ============================================
  borders: {
    radius: {
      none: '0',      // We use square edges
      sm: '0.125rem', // 2px - only for special cases
    },
    width: {
      DEFAULT: '1px',
      2: '2px',
    },
  },

  // ============================================
  // SHADOWS (minimal - flat design)
  // ============================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },

  // ============================================
  // TRANSITIONS
  // ============================================
  transitions: {
    duration: {
      fast: '150ms',
      DEFAULT: '200ms',
      slow: '300ms',
    },
    timing: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    dropdown: 50,
    sticky: 100,
    modal: 200,
    popover: 300,
    tooltip: 400,
    toast: 500,
  },

  // ============================================
  // BREAKPOINTS
  // ============================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ============================================
  // COMPONENT-SPECIFIC TOKENS
  // ============================================
  components: {
    button: {
      minHeight: '56px', // WCAG touch target
      paddingX: '1.5rem',
      paddingY: '0.75rem',
    },
    input: {
      minHeight: '48px',
      paddingX: '1rem',
      paddingY: '0.75rem',
    },
    card: {
      padding: '1.5rem',
      borderColor: 'rgb(39 39 42)', // zinc-800
    },
    header: {
      height: '72px',
      mobileHeight: '64px',
    },
  },
} as const

// Type exports for TypeScript usage
export type ColorScale = typeof tokens.colors.orange
export type SpacingScale = typeof tokens.spacing
export type BreakpointScale = typeof tokens.breakpoints
