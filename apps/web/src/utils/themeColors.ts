// apps/web/src/utils/themeColors.ts
// Utility to generate a full color palette from primary + accent + mode

import type { ThemeColors, SimpleTheme, ThemeRoundness, ThemeFontSize } from '../types/theme';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return url;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 139, g: 92, b: 246 }; // Default purple
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lighten a color by a percentage
 */
function lighten(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));
  return rgbToHex(r + amount, g + amount, b + amount);
}

/**
 * Darken a color by a percentage
 */
function darken(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));
  return rgbToHex(r - amount, g - amount, b - amount);
}

/**
 * Get luminance of a color (0-1, where 0 is black, 1 is white)
 */
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if white or black text should be used on a background
 */
function getContrastText(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

/**
 * Generate a full ThemeColors palette from primary and accent colors
 */
export function generatePalette(
  primaryColor: string,
  accentColor: string,
  mode: 'light' | 'dark'
): ThemeColors {
  if (mode === 'light') {
    return {
      primary: primaryColor,
      primaryForeground: getContrastText(primaryColor),
      secondary: '#f3f4f6',
      secondaryForeground: '#1f2937',
      accent: accentColor,
      accentForeground: getContrastText(accentColor),
      background: '#ffffff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      success: '#22c55e',
      successForeground: '#ffffff',
      warning: '#f59e0b',
      warningForeground: '#1f2937',
    };
  } else {
    // Dark mode
    return {
      primary: lighten(primaryColor, 10),
      primaryForeground: getContrastText(lighten(primaryColor, 10)),
      secondary: '#374151',
      secondaryForeground: '#f9fafb',
      accent: lighten(accentColor, 10),
      accentForeground: getContrastText(lighten(accentColor, 10)),
      background: '#111827',
      foreground: '#f9fafb',
      card: '#1f2937',
      cardForeground: '#f9fafb',
      muted: '#374151',
      mutedForeground: '#9ca3af',
      border: '#374151',
      destructive: '#f87171',
      destructiveForeground: '#1f2937',
      success: '#4ade80',
      successForeground: '#1f2937',
      warning: '#fbbf24',
      warningForeground: '#1f2937',
    };
  }
}

/**
 * Get border radius CSS value from roundness setting
 */
export function getRoundnessValue(roundness: ThemeRoundness): string {
  switch (roundness) {
    case 'sharp':
      return '0';
    case 'rounded':
      return '0.5rem';
    case 'pill':
      return '9999px';
    default:
      return '0.5rem';
  }
}

/**
 * Get base font size from fontSize setting
 */
export function getFontSizeValue(fontSize: ThemeFontSize): number {
  switch (fontSize) {
    case 'small':
      return 14;
    case 'medium':
      return 16;
    case 'large':
      return 18;
    default:
      return 16;
  }
}

/**
 * Build CSS variables object from a SimpleTheme
 */
export function simpleThemeToCssVariables(theme: SimpleTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  const colors = generatePalette(theme.primaryColor, theme.accentColor, theme.mode);

  // Legacy accent color support
  vars['--accent-color'] = theme.primaryColor;
  const rgb = hexToRgb(theme.primaryColor);
  vars['--accent-color-rgb'] = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Color variables
  vars['--color-primary'] = colors.primary;
  vars['--color-primary-foreground'] = colors.primaryForeground;
  vars['--color-secondary'] = colors.secondary;
  vars['--color-secondary-foreground'] = colors.secondaryForeground;
  vars['--color-accent'] = colors.accent;
  vars['--color-accent-foreground'] = colors.accentForeground;
  vars['--color-background'] = colors.background;
  vars['--color-foreground'] = colors.foreground;
  vars['--color-card'] = colors.card;
  vars['--color-card-foreground'] = colors.cardForeground;
  vars['--color-muted'] = colors.muted;
  vars['--color-muted-foreground'] = colors.mutedForeground;
  vars['--color-border'] = colors.border;
  vars['--color-destructive'] = colors.destructive;
  vars['--color-destructive-foreground'] = colors.destructiveForeground;
  vars['--color-success'] = colors.success;
  vars['--color-success-foreground'] = colors.successForeground;
  vars['--color-warning'] = colors.warning;
  vars['--color-warning-foreground'] = colors.warningForeground;

  // Typography
  vars['--font-size-base'] = `${getFontSizeValue(theme.fontSize)}px`;

  // Border radius
  const baseRadius = getRoundnessValue(theme.roundness);
  vars['--radius-base'] = baseRadius;
  if (theme.roundness === 'sharp') {
    vars['--radius-sm'] = '0';
    vars['--radius-md'] = '0';
    vars['--radius-lg'] = '0';
    vars['--radius-xl'] = '0';
  } else if (theme.roundness === 'pill') {
    vars['--radius-sm'] = '9999px';
    vars['--radius-md'] = '9999px';
    vars['--radius-lg'] = '9999px';
    vars['--radius-xl'] = '9999px';
  } else {
    vars['--radius-sm'] = '0.25rem';
    vars['--radius-md'] = '0.5rem';
    vars['--radius-lg'] = '0.75rem';
    vars['--radius-xl'] = '1rem';
  }

  // Sidebar background
  if (theme.sidebar.style === 'solid') {
    vars['--sidebar-bg'] = theme.sidebar.color || (theme.mode === 'dark' ? '#1f2937' : '#ffffff');
  } else if (theme.sidebar.style === 'gradient') {
    vars['--sidebar-bg'] = `linear-gradient(180deg, ${theme.sidebar.gradientFrom || theme.primaryColor}, ${theme.sidebar.gradientTo || theme.accentColor})`;
  }

  // Sidebar text color (auto-contrast)
  const sidebarBg = theme.sidebar.style === 'solid'
    ? (theme.sidebar.color || (theme.mode === 'dark' ? '#1f2937' : '#ffffff'))
    : (theme.sidebar.gradientFrom || theme.primaryColor);
  vars['--sidebar-text'] = getContrastText(sidebarBg);

  // Sidebar image
  if (theme.sidebar.style === 'image' && theme.sidebar.imageUrl) {
    const resolvedUrl = resolveImageUrl(theme.sidebar.imageUrl);
    if (resolvedUrl) {
      vars['--sidebar-image'] = `url(${resolvedUrl})`;
    }
    vars['--sidebar-image-opacity'] = '30';
  }

  // Page background
  vars['--page-bg'] = colors.background;

  return vars;
}

/**
 * Apply CSS variables to the document
 */
export function applyCssVariables(vars: Record<string, string>): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/**
 * Apply a SimpleTheme to the document
 */
export function applySimpleTheme(theme: SimpleTheme): void {
  const vars = simpleThemeToCssVariables(theme);
  applyCssVariables(vars);

  // Apply dark/light class
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme.mode);
}
