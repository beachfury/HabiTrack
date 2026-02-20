// widgets/index.ts
// Thin barrel — delegates to _registry/ for the widget system.
// HomePage.tsx imports from this path: '../components/dashboard/widgets'

export { widgetRegistry, getWidgetData, getWidgetThemedClass } from './_registry';
