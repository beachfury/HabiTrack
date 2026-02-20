// apps/web/src/types/widget.ts
// Widget manifest and registry type definitions

/** Widget category identifiers */
export type WidgetCategory =
  | 'general'
  | 'calendar'
  | 'chores'
  | 'shopping'
  | 'meals'
  | 'messages'
  | 'family'
  | 'finance'
  | 'custom';

/** Widget size constraints for the grid layout */
export interface WidgetSize {
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  maxW: number | null;
  maxH: number | null;
}

/**
 * Widget Manifest — the standard descriptor for every widget.
 *
 * Every widget (built-in or imported) must declare a manifest.
 * The manifest describes what the widget is, what data it needs,
 * and how it should behave in the grid layout.
 */
export interface WidgetManifest {
  /** Unique ID, kebab-case (e.g. "todays-chores") */
  id: string;
  /** Semver version string (e.g. "1.0.0") */
  version: string;
  /** Display name shown in the store and widget picker */
  name: string;
  /** Short description of the widget's purpose */
  description: string;
  /** Author name — "HabiTrack" for built-in widgets */
  author: string;
  /** Widget category for filtering and grouping */
  category: WidgetCategory;
  /** Lucide icon name (e.g. "calendar", "check-square") */
  icon: string;
  /** Grid layout size constraints */
  size: WidgetSize;
  /**
   * Data source keys this widget needs from /api/dashboard/data.
   * Maps to keys in DashboardData (e.g. ["todaysChores", "choreStats"]).
   * Empty array means the widget manages its own data (e.g. WeatherWidget).
   */
  dataSources: string[];
  /**
   * Required roles to see this widget, or null for all roles.
   * e.g. ["admin"] for admin-only widgets.
   */
  roles: string[] | null;
  /** JSON Schema for widget-specific configuration, or null if none */
  configSchema: Record<string, unknown> | null;
  /** true for widgets that ship with HabiTrack */
  builtIn: boolean;
  /** Searchable tags for the store */
  tags: string[];
  /** Themed CSS class for the widget container */
  themedClass?: string;
}

/**
 * Props adapter — maps from dashboard data to a widget's specific props.
 * Each widget declares how to extract its props from the centralized data.
 */
export type WidgetPropsAdapter = (
  data: Record<string, unknown>,
  currentUserId?: number,
  config?: Record<string, unknown>,
) => Record<string, unknown>;

/** A registered widget — manifest + component + props adapter */
export interface WidgetRegistryEntry {
  manifest: WidgetManifest;
  component: React.ComponentType<any>;
  /** Extracts widget-specific props from the centralized DashboardData */
  getProps: WidgetPropsAdapter;
}
