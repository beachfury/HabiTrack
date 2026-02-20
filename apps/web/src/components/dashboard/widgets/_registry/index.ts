// _registry/index.ts
// Barrel export for the widget registry

// Public API consumed by HomePage
export { widgetRegistry, getWidgetData, getWidgetThemedClass } from './registry';

// Community widget infrastructure (not re-exported from widgets/index.ts)
export { registerCommunityWidget } from './registry';
export { validateManifest, scanWidgetCode } from './validation';
export type { ValidationResult, CodeScanResult } from './validation';

// Store page previews
export { WidgetPreviewModal, WidgetCardMockup } from './WidgetPreviewModal';
