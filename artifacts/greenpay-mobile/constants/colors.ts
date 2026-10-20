/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#0f172a',
    tint: '#0f766e',
    background: '#f8fafc',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    primary: '#0f766e',
    primaryForeground: '#ffffff',
    secondary: '#14b8a6',
    secondaryForeground: '#ffffff',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ea580c',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#e2e8f0',
  },
  dark: {
    text: '#f1f5f9',
    tint: '#14b8a6',
    background: '#0b1220',
    foreground: '#f1f5f9',
    card: '#111827',
    cardForeground: '#f1f5f9',
    primary: '#0f766e',
    primaryForeground: '#ffffff',
    secondary: '#14b8a6',
    secondaryForeground: '#ffffff',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e293b',
    accentForeground: '#f1f5f9',
    destructive: '#ea580c',
    destructiveForeground: '#ffffff',
    border: '#263244',
    input: '#263244',
  },
  radius: 12,
};

export default colors;
