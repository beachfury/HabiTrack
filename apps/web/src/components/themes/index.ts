// apps/web/src/components/themes/index.ts
// Theme system exports - Advanced theme editor with element-level customization

// Main components
export { ThemeCard } from './ThemeCard';
export { ThemePicker } from './ThemePicker';
export { KidThemePicker } from './KidThemePicker';

// Advanced theme editor (primary editor)
export { ThemeEditorAdvanced } from './ThemeEditorAdvanced';
export { InteractivePreview, ClickableElement } from './InteractivePreview';
export { ElementStyleEditor } from './ElementStyleEditor';
export { LoginPageEditor } from './LoginPageEditor';

// Editor sub-components (used by ThemeEditorAdvanced)
export { ColorSchemeEditor } from './ColorSchemeEditor';
export { LayoutEditor } from './LayoutEditor';
export { TypographyEditor } from './TypographyEditor';

// Preview pages
export { HomePreview } from './PreviewPages/HomePreview';
export { ChoresPreview } from './PreviewPages/ChoresPreview';
export { CalendarPreview } from './PreviewPages/CalendarPreview';
export { ShoppingPreview } from './PreviewPages/ShoppingPreview';
export { MessagesPreview } from './PreviewPages/MessagesPreview';
export { SettingsPreview } from './PreviewPages/SettingsPreview';
export { LoginPreview } from './PreviewPages/LoginPreview';
