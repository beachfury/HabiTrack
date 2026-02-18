// apps/web/src/types/theme.ts
// Main theme types barrel export
// Re-exports all theme-related types from split modules for backwards compatibility

// Core theme types
export type {
  ThemeColors,
  ThemeLayout,
  LayoutType,
  NavStyle,
  ThemeTypography,
  LineHeight,
  FontWeight,
  ThemeSidebar,
  BackgroundType,
  ThemePageBackground,
  PageBackgroundType,
  PatternType,
  ThemeUI,
  BorderRadius,
  ShadowIntensity,
  ThemeIcons,
  IconStyle,
  ThemeMode,
  Theme,
  UserThemePreferences,
  ThemeListItem,
  CreateThemeInput,
  UpdateThemeInput,
  ThemeListResponse,
  ThemeResponse,
  UserThemePreferencesResponse,
} from './theme-core';

// Extended theme types (LCARS-level customization)
export type {
  ThemeableElement,
  ElementStyle,
  WidgetStyleOverride,
  LoginPageStyle,
  KioskStyle,
  LcarsMode,
  ElementPreset,
} from './theme-extended';

export { LCARS_COLORS } from './theme-extended';

// Simple theme types
export type {
  SidebarStyle,
  ThemeRoundness,
  ThemeFontSize,
  SimpleSidebar,
  SimpleTheme,
} from './theme-simple';

export { DEFAULT_SIMPLE_THEME, PRESET_THEMES } from './theme-simple';

// Default values
export {
  DEFAULT_COLORS_LIGHT,
  DEFAULT_COLORS_DARK,
  DEFAULT_LAYOUT,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_UI,
  DEFAULT_ICONS,
  DEFAULT_PAGE_BACKGROUND,
  DEFAULT_SIDEBAR,
  DEFAULT_ELEMENT_STYLE,
  DEFAULT_CARD_STYLE,
  DEFAULT_WIDGET_STYLE,
  DEFAULT_BUTTON_STYLE,
  DEFAULT_LOGIN_PAGE,
  DEFAULT_LCARS_MODE,
} from './theme-defaults';

// For backwards compatibility - ExtendedTheme is now same as Theme
export type { Theme as ExtendedTheme } from './theme-core';
