// _registry/registry.ts
// Widget registry — the single source of truth for all widgets.
// Assembles manifests, adapters, and components into registry entries.

import React from 'react';
import type { WidgetManifest, WidgetPropsAdapter, WidgetRegistryEntry } from '../../../../types/widget';
import { validateManifest, scanWidgetCode } from './validation';

// Manifests
import {
  welcomeManifest, quickStatsManifest, weatherManifest,
  todaysEventsManifest, upcomingEventsManifest,
  todaysChoresManifest, myChoresManifest, choreLeaderboardManifest,
  shoppingListManifest,
  paidChoresManifest, earningsManifest,
  familyMembersManifest,
  announcementsManifest,
  upcomingMealsManifest,
} from './manifests';

// Adapters
import {
  welcomeAdapter, quickStatsAdapter, weatherAdapter,
  todaysEventsAdapter, upcomingEventsAdapter,
  todaysChoresAdapter, myChoresAdapter, choreLeaderboardAdapter,
  shoppingListAdapter,
  paidChoresAdapter, earningsAdapter,
  familyMembersAdapter,
  announcementsAdapter,
  upcomingMealsAdapter,
} from './adapters';

// Components
import {
  WelcomeWidget, QuickStatsWidget, WeatherWidget,
  TodaysEventsWidget, UpcomingEventsWidget,
  TodaysChoresWidget, MyChoresWidget, ChoreLeaderboardWidget,
  ShoppingListWidget,
  PaidChoresWidget, EarningsWidget,
  FamilyWidget,
  AnnouncementsWidget,
  UpcomingMealsWidget,
} from '../_built-in';

// ─── Registry ────────────────────────────────────────────────────────────────

export const widgetRegistry: Map<string, WidgetRegistryEntry> = new Map([
  ['welcome',           { manifest: welcomeManifest,           component: WelcomeWidget,           getProps: welcomeAdapter }],
  ['quick-stats',       { manifest: quickStatsManifest,        component: QuickStatsWidget,        getProps: quickStatsAdapter }],
  ['todays-events',     { manifest: todaysEventsManifest,      component: TodaysEventsWidget,      getProps: todaysEventsAdapter }],
  ['upcoming-events',   { manifest: upcomingEventsManifest,    component: UpcomingEventsWidget,     getProps: upcomingEventsAdapter }],
  ['todays-chores',     { manifest: todaysChoresManifest,      component: TodaysChoresWidget,      getProps: todaysChoresAdapter }],
  ['my-chores',         { manifest: myChoresManifest,          component: MyChoresWidget,          getProps: myChoresAdapter }],
  ['chore-leaderboard', { manifest: choreLeaderboardManifest,  component: ChoreLeaderboardWidget,  getProps: choreLeaderboardAdapter }],
  ['shopping-list',     { manifest: shoppingListManifest,      component: ShoppingListWidget,      getProps: shoppingListAdapter }],
  ['paid-chores',       { manifest: paidChoresManifest,        component: PaidChoresWidget,        getProps: paidChoresAdapter }],
  ['earnings',          { manifest: earningsManifest,          component: EarningsWidget,          getProps: earningsAdapter }],
  ['family-members',    { manifest: familyMembersManifest,     component: FamilyWidget,            getProps: familyMembersAdapter }],
  ['announcements',     { manifest: announcementsManifest,     component: AnnouncementsWidget,     getProps: announcementsAdapter }],
  ['weather',           { manifest: weatherManifest,           component: WeatherWidget,           getProps: weatherAdapter }],
  ['upcoming-meals',    { manifest: upcomingMealsManifest,     component: UpcomingMealsWidget,     getProps: upcomingMealsAdapter }],
]);

// ─── Public API ──────────────────────────────────────────────────────────────

/** Get widget props from the centralized dashboard data */
export function getWidgetData(
  widgetId: string,
  data: Record<string, unknown>,
  currentUserId?: number,
  config?: Record<string, unknown>,
): Record<string, unknown> {
  const entry = widgetRegistry.get(widgetId);
  if (!entry) return {};
  return entry.getProps(data, currentUserId, config);
}

/** Get the themed CSS class for a widget container */
export function getWidgetThemedClass(widgetId: string): string {
  return widgetRegistry.get(widgetId)?.manifest.themedClass || 'themed-card';
}

// ─── Community Widget Registration ──────────────────────────────────────────

/**
 * Register a community widget at runtime.
 * Validates the manifest and optionally scans source code for forbidden patterns.
 *
 * This is the future entry point for community widget loading.
 * Currently unused — community widgets are not yet supported at runtime.
 *
 * @param manifest   - Widget manifest (validated against WidgetManifest schema)
 * @param component  - React component to render the widget
 * @param adapter    - Props adapter mapping DashboardData → widget props
 * @param sourceCode - Optional source code string for security scanning
 */
export function registerCommunityWidget(
  manifest: unknown,
  component: React.ComponentType<any>,
  adapter: WidgetPropsAdapter,
  sourceCode?: string,
): { success: boolean; errors: string[]; warnings: string[] } {
  // Validate manifest
  const validation = validateManifest(manifest);
  if (!validation.valid) {
    return { success: false, errors: validation.errors, warnings: validation.warnings };
  }

  const m = manifest as WidgetManifest;

  // Prevent overwriting built-in widgets
  if (widgetRegistry.has(m.id)) {
    const existing = widgetRegistry.get(m.id)!;
    if (existing.manifest.builtIn) {
      return { success: false, errors: [`Cannot override built-in widget "${m.id}"`], warnings: [] };
    }
  }

  // Optional code scanning (defense-in-depth, CSP is primary)
  if (sourceCode) {
    const scan = scanWidgetCode(sourceCode);
    if (!scan.safe) {
      return {
        success: false,
        errors: scan.violations.map((v) => `Line ${v.line}: ${v.description}`),
        warnings: validation.warnings,
      };
    }
  }

  // Register the widget
  widgetRegistry.set(m.id, { manifest: m, component, getProps: adapter });
  return { success: true, errors: [], warnings: validation.warnings };
}
