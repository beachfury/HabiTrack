// apps/web/src/context/css/colorVariables.ts
// Generates CSS variables from ThemeColors objects.
// Handles mapping color properties to --color-* CSS custom properties.

import type { ThemeColors } from '../../types/theme';

/**
 * Convert theme colors to CSS variables
 */
export function colorsToCssVariables(colors: ThemeColors, prefix = ''): Record<string, string> {
  const vars: Record<string, string> = {};
  const p = prefix ? `${prefix}-` : '';

  vars[`--${p}color-primary`] = colors.primary;
  vars[`--${p}color-primary-foreground`] = colors.primaryForeground;
  vars[`--${p}color-secondary`] = colors.secondary;
  vars[`--${p}color-secondary-foreground`] = colors.secondaryForeground;
  vars[`--${p}color-accent`] = colors.accent;
  vars[`--${p}color-accent-foreground`] = colors.accentForeground;
  vars[`--${p}color-background`] = colors.background;
  vars[`--${p}color-foreground`] = colors.foreground;
  vars[`--${p}color-card`] = colors.card;
  vars[`--${p}color-card-foreground`] = colors.cardForeground;
  vars[`--${p}color-muted`] = colors.muted;
  vars[`--${p}color-muted-foreground`] = colors.mutedForeground;
  vars[`--${p}color-border`] = colors.border;
  vars[`--${p}color-destructive`] = colors.destructive;
  vars[`--${p}color-destructive-foreground`] = colors.destructiveForeground;
  vars[`--${p}color-success`] = colors.success;
  vars[`--${p}color-success-foreground`] = colors.successForeground;
  vars[`--${p}color-warning`] = colors.warning;
  vars[`--${p}color-warning-foreground`] = colors.warningForeground;

  return vars;
}
