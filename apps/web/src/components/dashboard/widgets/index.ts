// apps/web/src/components/dashboard/widgets/index.ts
// Manifest-driven widget registry — the single source of truth for all widgets.
//
// Each built-in widget declares a manifest (WidgetManifest) and a props adapter
// (WidgetPropsAdapter) that maps from the centralized DashboardData to the
// widget's specific props. Future imported widgets will follow the same pattern.

import React from 'react';
import type { WidgetManifest, WidgetPropsAdapter, WidgetRegistryEntry } from '../../../types/widget';

// ─── Widget Components ────────────────────────────────────────────────────────
import { WelcomeWidget } from './WelcomeWidget';
import { QuickStatsWidget } from './QuickStatsWidget';
import { TodaysEventsWidget } from './TodaysEventsWidget';
import { UpcomingEventsWidget } from './UpcomingEventsWidget';
import { TodaysChoresWidget } from './TodaysChoresWidget';
import { MyChoresWidget } from './MyChoresWidget';
import { ShoppingListWidget } from './ShoppingListWidget';
import { ChoreLeaderboardWidget } from './ChoreLeaderboardWidget';
import { PaidChoresWidget } from './PaidChoresWidget';
import { EarningsWidget } from './EarningsWidget';
import { FamilyWidget } from './FamilyWidget';
import { AnnouncementsWidget } from './AnnouncementsWidget';
import { WeatherWidget } from './WeatherWidget';
import { UpcomingMealsWidget } from './UpcomingMealsWidget';

// Re-export components for backward compatibility
export {
  WelcomeWidget,
  QuickStatsWidget,
  TodaysEventsWidget,
  UpcomingEventsWidget,
  TodaysChoresWidget,
  MyChoresWidget,
  ShoppingListWidget,
  ChoreLeaderboardWidget,
  PaidChoresWidget,
  EarningsWidget,
  FamilyWidget,
  AnnouncementsWidget,
  WeatherWidget,
  UpcomingMealsWidget,
};

// ─── Manifests ────────────────────────────────────────────────────────────────

const welcomeManifest: WidgetManifest = {
  id: 'welcome',
  version: '1.0.0',
  name: 'Welcome',
  description: 'Personalized greeting with time-of-day awareness',
  author: 'HabiTrack',
  category: 'general',
  icon: 'sparkles',
  size: { defaultW: 4, defaultH: 1, minW: 2, minH: 1, maxW: 4, maxH: 1 },
  dataSources: ['user'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['greeting', 'welcome', 'home'],
  themedClass: 'themed-home-welcome',
};

const quickStatsManifest: WidgetManifest = {
  id: 'quick-stats',
  version: '1.0.0',
  name: 'Quick Stats',
  description: 'At-a-glance summary of events, chores, shopping, and earnings',
  author: 'HabiTrack',
  category: 'general',
  icon: 'bar-chart-3',
  size: { defaultW: 4, defaultH: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },
  dataSources: ['quickStats', 'myEarnings'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['stats', 'overview', 'summary'],
  themedClass: 'themed-home-stats',
};

const todaysEventsManifest: WidgetManifest = {
  id: 'todays-events',
  version: '1.0.0',
  name: "Today's Events",
  description: 'Calendar events happening today',
  author: 'HabiTrack',
  category: 'calendar',
  icon: 'calendar',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['todaysEvents'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['calendar', 'events', 'today', 'schedule'],
  themedClass: 'themed-home-events',
};

const upcomingEventsManifest: WidgetManifest = {
  id: 'upcoming-events',
  version: '1.0.0',
  name: 'Upcoming Events',
  description: 'Events coming up in the next few days',
  author: 'HabiTrack',
  category: 'calendar',
  icon: 'calendar',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['upcomingEvents'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['calendar', 'events', 'upcoming', 'schedule'],
  themedClass: 'themed-home-events',
};

const todaysChoresManifest: WidgetManifest = {
  id: 'todays-chores',
  version: '1.0.0',
  name: "Today's Chores",
  description: 'Chores assigned to the family for today',
  author: 'HabiTrack',
  category: 'chores',
  icon: 'check-square',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['todaysChores'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['chores', 'tasks', 'today', 'assignments'],
  themedClass: 'themed-home-chores',
};

const myChoresManifest: WidgetManifest = {
  id: 'my-chores',
  version: '1.0.0',
  name: 'My Chores',
  description: 'Your personal chore list',
  author: 'HabiTrack',
  category: 'chores',
  icon: 'list-checks',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['myChores'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['chores', 'tasks', 'personal', 'my'],
  themedClass: 'themed-home-chores',
};

const choreLeaderboardManifest: WidgetManifest = {
  id: 'chore-leaderboard',
  version: '1.0.0',
  name: 'Chore Leaderboard',
  description: 'Family chore completion rankings',
  author: 'HabiTrack',
  category: 'chores',
  icon: 'trophy',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['choreLeaderboard'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['chores', 'leaderboard', 'points', 'ranking'],
  themedClass: 'themed-home-leaderboard',
};

const shoppingListManifest: WidgetManifest = {
  id: 'shopping-list',
  version: '1.0.0',
  name: 'Shopping List',
  description: 'Quick view of items on the shopping list',
  author: 'HabiTrack',
  category: 'shopping',
  icon: 'shopping-cart',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['shoppingItems'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['shopping', 'groceries', 'list', 'items'],
};

const paidChoresManifest: WidgetManifest = {
  id: 'paid-chores',
  version: '1.0.0',
  name: 'Paid Chores',
  description: 'Available paid chores and their rewards',
  author: 'HabiTrack',
  category: 'finance',
  icon: 'dollar-sign',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['availablePaidChores'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['chores', 'paid', 'money', 'earnings'],
  themedClass: 'themed-home-chores',
};

const earningsManifest: WidgetManifest = {
  id: 'earnings',
  version: '1.0.0',
  name: 'My Earnings',
  description: 'Total earnings from paid chores',
  author: 'HabiTrack',
  category: 'finance',
  icon: 'wallet',
  size: { defaultW: 1, defaultH: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },
  dataSources: ['myEarnings'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['earnings', 'money', 'wallet', 'finance'],
};

const familyMembersManifest: WidgetManifest = {
  id: 'family-members',
  version: '1.0.0',
  name: 'Family Members',
  description: 'See who is in your family',
  author: 'HabiTrack',
  category: 'family',
  icon: 'users',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['familyMembers'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['family', 'members', 'people'],
};

const announcementsManifest: WidgetManifest = {
  id: 'announcements',
  version: '1.0.0',
  name: 'Announcements',
  description: 'Family announcements and messages',
  author: 'HabiTrack',
  category: 'messages',
  icon: 'megaphone',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['announcements'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['announcements', 'messages', 'news'],
};

const weatherManifest: WidgetManifest = {
  id: 'weather',
  version: '1.0.0',
  name: 'Weather',
  description: 'Current weather conditions using Open-Meteo (no API key needed)',
  author: 'HabiTrack',
  category: 'general',
  icon: 'cloud-sun',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  dataSources: [], // Manages its own data via Open-Meteo API
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['weather', 'forecast', 'temperature'],
  themedClass: 'themed-home-weather',
};

const upcomingMealsManifest: WidgetManifest = {
  id: 'upcoming-meals',
  version: '1.0.0',
  name: 'Upcoming Meals',
  description: 'Upcoming meal plans and voting status',
  author: 'HabiTrack',
  category: 'meals',
  icon: 'utensils-crossed',
  size: { defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  dataSources: ['upcomingMeals'],
  roles: null,
  configSchema: null,
  builtIn: true,
  tags: ['meals', 'food', 'recipes', 'planning'],
  themedClass: 'themed-home-meals',
};

// ─── Props Adapters ───────────────────────────────────────────────────────────
// Each adapter maps from the centralized DashboardData to widget-specific props.

const welcomeAdapter: WidgetPropsAdapter = (data) => ({
  userName: (data.user as any)?.displayName || 'User',
});

const quickStatsAdapter: WidgetPropsAdapter = (data) => {
  const stats = (data.quickStats as any) || { events: 0, chores: 0, shopping: 0 };
  return {
    eventsToday: stats.events,
    choresDue: stats.chores,
    shoppingItems: stats.shopping,
    earnings: Number((data.myEarnings as any)?.total) || 0,
  };
};

const todaysEventsAdapter: WidgetPropsAdapter = (data) => ({
  events: data.todaysEvents || [],
});

const upcomingEventsAdapter: WidgetPropsAdapter = (data) => ({
  events: data.upcomingEvents || [],
});

const todaysChoresAdapter: WidgetPropsAdapter = (data) => ({
  chores: data.todaysChores || [],
});

const myChoresAdapter: WidgetPropsAdapter = (data) => ({
  chores: data.myChores || [],
});

const choreLeaderboardAdapter: WidgetPropsAdapter = (data, currentUserId) => ({
  leaderboard: data.choreLeaderboard || [],
  currentUserId,
});

const shoppingListAdapter: WidgetPropsAdapter = (data) => ({
  items: data.shoppingItems || [],
});

const paidChoresAdapter: WidgetPropsAdapter = (data) => ({
  chores: data.availablePaidChores || [],
});

const earningsAdapter: WidgetPropsAdapter = (data) => ({
  totalEarnings: Number((data.myEarnings as any)?.total) || 0,
});

const familyMembersAdapter: WidgetPropsAdapter = (data, currentUserId) => ({
  members: data.familyMembers || [],
  currentUserId,
});

const announcementsAdapter: WidgetPropsAdapter = (data) => ({
  announcements: data.announcements || [],
});

const weatherAdapter: WidgetPropsAdapter = () => ({
  location: undefined, // Uses browser geolocation
});

const upcomingMealsAdapter: WidgetPropsAdapter = (data) => ({
  meals: data.upcomingMeals || [],
});

// ─── Widget Registry ──────────────────────────────────────────────────────────
// The single source of truth: every widget has a manifest, component, and adapter.

export const widgetRegistry: Map<string, WidgetRegistryEntry> = new Map([
  ['welcome', { manifest: welcomeManifest, component: WelcomeWidget, getProps: welcomeAdapter }],
  ['quick-stats', { manifest: quickStatsManifest, component: QuickStatsWidget, getProps: quickStatsAdapter }],
  ['todays-events', { manifest: todaysEventsManifest, component: TodaysEventsWidget, getProps: todaysEventsAdapter }],
  ['upcoming-events', { manifest: upcomingEventsManifest, component: UpcomingEventsWidget, getProps: upcomingEventsAdapter }],
  ['todays-chores', { manifest: todaysChoresManifest, component: TodaysChoresWidget, getProps: todaysChoresAdapter }],
  ['my-chores', { manifest: myChoresManifest, component: MyChoresWidget, getProps: myChoresAdapter }],
  ['chore-leaderboard', { manifest: choreLeaderboardManifest, component: ChoreLeaderboardWidget, getProps: choreLeaderboardAdapter }],
  ['shopping-list', { manifest: shoppingListManifest, component: ShoppingListWidget, getProps: shoppingListAdapter }],
  ['paid-chores', { manifest: paidChoresManifest, component: PaidChoresWidget, getProps: paidChoresAdapter }],
  ['earnings', { manifest: earningsManifest, component: EarningsWidget, getProps: earningsAdapter }],
  ['family-members', { manifest: familyMembersManifest, component: FamilyWidget, getProps: familyMembersAdapter }],
  ['announcements', { manifest: announcementsManifest, component: AnnouncementsWidget, getProps: announcementsAdapter }],
  ['weather', { manifest: weatherManifest, component: WeatherWidget, getProps: weatherAdapter }],
  ['upcoming-meals', { manifest: upcomingMealsManifest, component: UpcomingMealsWidget, getProps: upcomingMealsAdapter }],
]);

/** Get all manifests (for the store, widget picker, etc.) */
export function getAllManifests(): WidgetManifest[] {
  return Array.from(widgetRegistry.values()).map(entry => entry.manifest);
}

/** Get a manifest by widget ID */
export function getManifest(widgetId: string): WidgetManifest | undefined {
  return widgetRegistry.get(widgetId)?.manifest;
}

/** Get widget props from the centralized dashboard data */
export function getWidgetData(widgetId: string, data: Record<string, unknown>, currentUserId?: number): Record<string, unknown> {
  const entry = widgetRegistry.get(widgetId);
  if (!entry) return {};
  return entry.getProps(data, currentUserId);
}

/** Get the themed CSS class for a widget container */
export function getWidgetThemedClass(widgetId: string): string {
  return widgetRegistry.get(widgetId)?.manifest.themedClass || 'themed-card';
}

// Legacy compatibility — preserve the widgetComponents map for existing code
export const widgetComponents: Record<string, React.ComponentType<any>> = Object.fromEntries(
  Array.from(widgetRegistry.entries()).map(([id, entry]) => [id, entry.component])
);
