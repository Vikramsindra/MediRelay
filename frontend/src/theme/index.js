// MediRelay Design System — "Geometric Vitality / Precision Guardian"
// Based on Design.md

export const colors = {
  // Core
  primary: '#0058be',
  primaryContainer: '#2170e4',
  onPrimary: '#ffffff',

  // Surfaces (tonal layering — no borders!)
  background: '#f9f9ff',
  surfaceContainerLow: '#eef1f8',
  surfaceContainer: '#e4e8f2',
  surfaceContainerHighest: '#d5daea',
  surfaceContainerLowest: '#ffffff',

  // Text
  onSurface: '#191b23',
  onSurfaceVariant: '#44475a',
  outline: '#727785',
  outlineVariant: 'rgba(114,119,133,0.15)',

  // Status
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  critical: '#ba1a1a',
  criticalBg: '#ffdad6',
  serious: '#924700',
  seriousBg: '#ffdcc2',
  stable: '#405682',
  stableBg: '#d6e3ff',

  secondary: '#405682',
  secondaryContainer: '#d6e3ff',
  onSecondaryContainer: '#405682',

  // Misc
  surfaceHover: '#e0e4ef',
  offlineBanner: '#924700',
  offlineBannerBg: '#ffdcc2',
  white: '#ffffff',
  transparent: 'transparent',
};

export const typography = {
  // Plus Jakarta Sans weights
  displayLg: { fontSize: 36, fontWeight: '700', letterSpacing: -0.72, lineHeight: 44 },
  displayMd: { fontSize: 28, fontWeight: '700', letterSpacing: -0.56, lineHeight: 36 },
  headlineMd: { fontSize: 22, fontWeight: '600', letterSpacing: -0.22, lineHeight: 30 },
  headlineSm: { fontSize: 18, fontWeight: '600', letterSpacing: -0.18, lineHeight: 26 },
  titleMd: { fontSize: 16, fontWeight: '600', letterSpacing: 0, lineHeight: 24 },
  titleSm: { fontSize: 14, fontWeight: '600', letterSpacing: 0, lineHeight: 22 },
  bodyMd: { fontSize: 16, fontWeight: '400', letterSpacing: 0, lineHeight: 24 },
  bodySm: { fontSize: 14, fontWeight: '400', letterSpacing: 0, lineHeight: 21 },
  labelSm: { fontSize: 11, fontWeight: '600', letterSpacing: 1.1, lineHeight: 16, textTransform: 'uppercase' },
  labelMd: { fontSize: 13, fontWeight: '500', letterSpacing: 0.5, lineHeight: 18 },
};

export const spacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Ambient "Light Air" shadow — never hard drop shadows
export const shadow = {
  sm: {
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  md: {
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
};

// Touch targets — minimum 48px (glove-friendly)
export const touchTarget = {
  min: 48,
  primary: 56,
};
