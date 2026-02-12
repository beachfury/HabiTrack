// apps/web/src/types/theme-simple.ts
// Simplified theme system types for quick theming

// ============================================
// SIMPLIFIED THEME (User-Friendly System)
// ============================================

export type SidebarStyle = 'solid' | 'gradient' | 'image';
export type ThemeRoundness = 'sharp' | 'rounded' | 'pill';
export type ThemeFontSize = 'small' | 'medium' | 'large';

export interface SimpleSidebar {
  style: SidebarStyle;
  color?: string;           // For solid
  gradientFrom?: string;    // For gradient
  gradientTo?: string;
  imageUrl?: string;        // For image
}

export interface SimpleTheme {
  id: string;
  name: string;
  description?: string;

  // Core settings
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;

  // Sidebar appearance
  sidebar: SimpleSidebar;

  // Style preferences
  roundness: ThemeRoundness;
  fontSize: ThemeFontSize;

  // Metadata
  createdBy?: number;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Default Simple Theme Values - HabiTrack Branded
// ============================================

export const DEFAULT_SIMPLE_THEME: Omit<SimpleTheme, 'id' | 'name'> = {
  mode: 'dark',
  primaryColor: '#3cb371',      // HabiTrack Green
  accentColor: '#4fd693',       // Light green accent
  sidebar: {
    style: 'solid',
    color: '#243340',           // Navy-tinted
  },
  roundness: 'rounded',
  fontSize: 'medium',
};

// ============================================
// Pre-built Themes - HabiTrack Branded
// ============================================

export const PRESET_THEMES: Array<Omit<SimpleTheme, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'HabiTrack Light',
    description: 'Official HabiTrack light theme with green and navy colors',
    mode: 'light',
    primaryColor: '#3cb371',    // HabiTrack Green
    accentColor: '#3cb371',
    sidebar: { style: 'solid', color: '#ffffff' },
    roundness: 'rounded',
    fontSize: 'medium',
    isPublic: true,
  },
  {
    name: 'HabiTrack Dark',
    description: 'Official HabiTrack dark theme with navy-tinted colors',
    mode: 'dark',
    primaryColor: '#4fd693',    // Light green for dark mode
    accentColor: '#4fd693',
    sidebar: { style: 'solid', color: '#243340' }, // Navy-tinted
    roundness: 'rounded',
    fontSize: 'medium',
    isPublic: true,
  },
];
