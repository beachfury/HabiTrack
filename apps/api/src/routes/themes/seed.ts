// apps/api/src/routes/themes/seed.ts
// Default theme seeding for fresh installations

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
  isDefault?: boolean;
}

const DEFAULT_THEMES: DefaultTheme[] = [
  {
    id: 'habitrack-classic',
    name: 'HabiTrack Classic',
    description: 'The default HabiTrack theme with purple accents and clean design',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#8b5cf6',
      primaryForeground: '#ffffff',
      secondary: '#f3f4f6',
      secondaryForeground: '#1f2937',
      accent: '#8b5cf6',
      accentForeground: '#ffffff',
      background: '#f9fafb',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
    },
    colorsDark: {
      primary: '#a78bfa',
      primaryForeground: '#ffffff',
      secondary: '#374151',
      secondaryForeground: '#f9fafb',
      accent: '#a78bfa',
      accentForeground: '#ffffff',
      background: '#111827',
      foreground: '#f9fafb',
      card: '#1f2937',
      cardForeground: '#f9fafb',
      muted: '#374151',
      mutedForeground: '#9ca3af',
      border: '#374151',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'large', shadowIntensity: 'subtle' },
    icons: { style: 'outline' },
    isDefault: true,
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'A calming blue theme inspired by the ocean',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#f0f9ff',
      secondaryForeground: '#0c4a6e',
      accent: '#0ea5e9',
      accentForeground: '#ffffff',
      background: '#f8fafc',
      foreground: '#0f172a',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
    },
    colorsDark: {
      primary: '#38bdf8',
      primaryForeground: '#0c4a6e',
      secondary: '#1e3a5f',
      secondaryForeground: '#e0f2fe',
      accent: '#38bdf8',
      accentForeground: '#0c4a6e',
      background: '#0f172a',
      foreground: '#f1f5f9',
      card: '#1e293b',
      cardForeground: '#f1f5f9',
      muted: '#334155',
      mutedForeground: '#94a3b8',
      border: '#334155',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'large', shadowIntensity: 'subtle' },
    icons: { style: 'outline' },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'A natural green theme inspired by forests',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#22c55e',
      primaryForeground: '#ffffff',
      secondary: '#f0fdf4',
      secondaryForeground: '#14532d',
      accent: '#22c55e',
      accentForeground: '#ffffff',
      background: '#fafaf9',
      foreground: '#1c1917',
      card: '#ffffff',
      cardForeground: '#1c1917',
      muted: '#f5f5f4',
      mutedForeground: '#78716c',
      border: '#e7e5e4',
    },
    colorsDark: {
      primary: '#4ade80',
      primaryForeground: '#14532d',
      secondary: '#14532d',
      secondaryForeground: '#dcfce7',
      accent: '#4ade80',
      accentForeground: '#14532d',
      background: '#0a0a0a',
      foreground: '#fafafa',
      card: '#171717',
      cardForeground: '#fafafa',
      muted: '#262626',
      mutedForeground: '#a3a3a3',
      border: '#262626',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'medium', shadowIntensity: 'subtle' },
    icons: { style: 'outline' },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'A warm orange theme inspired by sunsets',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#f97316',
      primaryForeground: '#ffffff',
      secondary: '#fff7ed',
      secondaryForeground: '#7c2d12',
      accent: '#f97316',
      accentForeground: '#ffffff',
      background: '#fffbeb',
      foreground: '#1c1917',
      card: '#ffffff',
      cardForeground: '#1c1917',
      muted: '#fef3c7',
      mutedForeground: '#78716c',
      border: '#fed7aa',
    },
    colorsDark: {
      primary: '#fb923c',
      primaryForeground: '#7c2d12',
      secondary: '#431407',
      secondaryForeground: '#ffedd5',
      accent: '#fb923c',
      accentForeground: '#7c2d12',
      background: '#0c0a09',
      foreground: '#fafaf9',
      card: '#1c1917',
      cardForeground: '#fafaf9',
      muted: '#292524',
      mutedForeground: '#a8a29e',
      border: '#292524',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'large', shadowIntensity: 'medium' },
    icons: { style: 'outline' },
  },
  {
    id: 'rose-pink',
    name: 'Rose Pink',
    description: 'A soft pink theme with rosy accents',
    layout: { type: 'sidebar-left', sidebarWidth: 256, navStyle: 'icons-text' },
    colorsLight: {
      primary: '#ec4899',
      primaryForeground: '#ffffff',
      secondary: '#fdf2f8',
      secondaryForeground: '#831843',
      accent: '#ec4899',
      accentForeground: '#ffffff',
      background: '#fefce8',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#fce7f3',
      mutedForeground: '#6b7280',
      border: '#fbcfe8',
    },
    colorsDark: {
      primary: '#f472b6',
      primaryForeground: '#831843',
      secondary: '#500724',
      secondaryForeground: '#fce7f3',
      accent: '#f472b6',
      accentForeground: '#831843',
      background: '#0f0f0f',
      foreground: '#f9fafb',
      card: '#1a1a1a',
      cardForeground: '#f9fafb',
      muted: '#2a2a2a',
      mutedForeground: '#9ca3af',
      border: '#2a2a2a',
    },
    typography: { fontFamily: 'system-ui, -apple-system, sans-serif', baseFontSize: 16, lineHeight: 'normal' },
    sidebar: { backgroundType: 'solid', backgroundColor: null, textColor: null },
    pageBackground: { type: 'solid', color: null },
    ui: { borderRadius: 'large', shadowIntensity: 'subtle' },
    icons: { style: 'outline' },
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
          createdBy, isPublic, isApprovedForKids, isDefault
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
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
        ],
      );
    } catch (err) {
      console.error(`Failed to seed theme ${theme.id}:`, err);
    }
  }

  // Set the default theme in settings
  await q(`UPDATE settings SET defaultThemeId = 'habitrack-classic' WHERE id = 1 AND defaultThemeId IS NULL`);
}
