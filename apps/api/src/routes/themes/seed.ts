// apps/api/src/routes/themes/seed.ts
// Default theme seeding for fresh installations
// Only two themes: HabiTrack Classic (non-editable) and Household Brand (editable)

import { q } from '../../db';

interface DefaultTheme {
  id: string;
  name: string;
  description: string;
  layout: object;
  colorsLight: object;
  colorsDark: object;
  typography: object;
  sidebar: object;
  pageBackground: object;
  ui: object;
  icons: object;
  isDefault: boolean;
  isSystemTheme: boolean; // If true, cannot be edited or deleted
}

const DEFAULT_THEMES: DefaultTheme[] = [
  {
    id: 'habitrack-classic',
    name: 'HabiTrack Classic',
    description: 'The official HabiTrack theme - cannot be modified',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#3cb371',          // HabiTrack Green
      primaryForeground: '#ffffff',
      secondary: '#f3f4f6',
      secondaryForeground: '#3d4f5f', // HabiTrack Navy
      accent: '#3cb371',           // HabiTrack Green
      accentForeground: '#ffffff',
      background: '#ffffff',
      foreground: '#3d4f5f',       // HabiTrack Navy
      card: '#ffffff',
      cardForeground: '#3d4f5f',   // HabiTrack Navy
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      success: '#22c55e',
      successForeground: '#ffffff',
      warning: '#f59e0b',
      warningForeground: '#ffffff',
    },
    colorsDark: {
      primary: '#4fd693',          // Lighter green for dark mode
      primaryForeground: '#1a2e26',
      secondary: '#374151',
      secondaryForeground: '#f9fafb',
      accent: '#4fd693',           // Lighter green for dark mode
      accentForeground: '#1a2e26',
      background: '#1a2530',       // Navy-tinted dark background
      foreground: '#f9fafb',
      card: '#243340',             // Navy-tinted card
      cardForeground: '#f9fafb',
      muted: '#2d3e4e',            // Navy-tinted muted
      mutedForeground: '#9ca3af',
      border: '#3d4f5f',           // HabiTrack Navy as border
      destructive: '#f87171',
      destructiveForeground: '#1f2937',
      success: '#4ade80',
      successForeground: '#1f2937',
      warning: '#fbbf24',
      warningForeground: '#1f2937',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'large', shadowIntensity: 'subtle' },
    icons: { style: 'outline' },
    isDefault: true,
    isSystemTheme: true, // Cannot be edited
  },
  {
    id: 'household-brand',
    name: 'Household Brand',
    description: 'Your household\'s custom default theme - customize to match your family style',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#3cb371',          // HabiTrack Green (default, can be changed)
      primaryForeground: '#ffffff',
      secondary: '#f3f4f6',
      secondaryForeground: '#3d4f5f',
      accent: '#3cb371',
      accentForeground: '#ffffff',
      background: '#ffffff',
      foreground: '#3d4f5f',
      card: '#ffffff',
      cardForeground: '#3d4f5f',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      success: '#22c55e',
      successForeground: '#ffffff',
      warning: '#f59e0b',
      warningForeground: '#ffffff',
    },
    colorsDark: {
      primary: '#4fd693',
      primaryForeground: '#1a2e26',
      secondary: '#374151',
      secondaryForeground: '#f9fafb',
      accent: '#4fd693',
      accentForeground: '#1a2e26',
      background: '#1a2530',
      foreground: '#f9fafb',
      card: '#243340',
      cardForeground: '#f9fafb',
      muted: '#2d3e4e',
      mutedForeground: '#9ca3af',
      border: '#3d4f5f',
      destructive: '#f87171',
      destructiveForeground: '#1f2937',
      success: '#4ade80',
      successForeground: '#1f2937',
      warning: '#fbbf24',
      warningForeground: '#1f2937',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'large', shadowIntensity: 'subtle' },
    icons: { style: 'outline' },
    isDefault: true,
    isSystemTheme: false, // Can be edited by admin (but name cannot be changed)
  },
];

/**
 * Seeds default themes into the database
 * Called during bootstrap when first admin is created
 */
export async function seedDefaultThemes(createdBy: number): Promise<void> {
  for (const theme of DEFAULT_THEMES) {
    try {
      await q(
        `INSERT INTO themes (
          id, name, description,
          layout, colorsLight, colorsDark, typography,
          sidebar, pageBackground, ui, icons,
          createdBy, isPublic, isApprovedForKids, isDefault, isSystemTheme
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
        ON DUPLICATE KEY UPDATE name = name`,
        [
          theme.id,
          theme.name,
          theme.description,
          JSON.stringify(theme.layout),
          JSON.stringify(theme.colorsLight),
          JSON.stringify(theme.colorsDark),
          JSON.stringify(theme.typography),
          JSON.stringify(theme.sidebar),
          JSON.stringify(theme.pageBackground),
          JSON.stringify(theme.ui),
          JSON.stringify(theme.icons),
          createdBy,
          theme.isDefault ? 1 : 0,
          theme.isSystemTheme ? 1 : 0,
        ],
      );
    } catch (err) {
      console.error(`Failed to seed theme ${theme.id}:`, err);
    }
  }

  // Set the default theme in settings (Household Brand is the default for new users)
  await q(`UPDATE settings SET defaultThemeId = 'household-brand' WHERE id = 1 AND defaultThemeId IS NULL`);
}

/**
 * Removes old default themes that are no longer needed
 * Call this during migration to clean up
 */
export async function removeOldDefaultThemes(): Promise<void> {
  const oldThemeIds = ['ocean-blue', 'forest-green', 'sunset-orange', 'rose-pink'];

  for (const themeId of oldThemeIds) {
    try {
      // Only delete if no users are using it
      const [usage] = await q<{ count: number }[]>(
        `SELECT COUNT(*) as count FROM user_theme_preferences WHERE themeId = ?`,
        [themeId]
      );

      if (!usage || usage.count === 0) {
        await q(`DELETE FROM themes WHERE id = ? AND isDefault = 1`, [themeId]);
        console.log(`Removed unused default theme: ${themeId}`);
      } else {
        console.log(`Keeping theme ${themeId} - still in use by ${usage.count} user(s)`);
      }
    } catch (err) {
      console.error(`Failed to remove theme ${themeId}:`, err);
    }
  }
}
