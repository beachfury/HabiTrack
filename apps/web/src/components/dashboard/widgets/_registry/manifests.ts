// _registry/manifests.ts
// All built-in widget manifest declarations

import type { WidgetManifest } from '../../../../types/widget';

// ─── General ─────────────────────────────────────────────────────────────────

export const welcomeManifest: WidgetManifest = {
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

export const quickStatsManifest: WidgetManifest = {
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

export const weatherManifest: WidgetManifest = {
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

// ─── Calendar ────────────────────────────────────────────────────────────────

export const todaysEventsManifest: WidgetManifest = {
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

export const upcomingEventsManifest: WidgetManifest = {
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
  configSchema: {
    properties: {
      daysAhead: {
        type: 'number',
        title: 'Days Ahead',
        description: 'How many days ahead to show events',
        default: 7,
        minimum: 1,
        maximum: 30,
      },
      showAllDay: {
        type: 'boolean',
        title: 'Show All-Day Events',
        description: 'Include all-day events in the list',
        default: true,
      },
    },
  },
  builtIn: true,
  tags: ['calendar', 'events', 'upcoming', 'schedule'],
  themedClass: 'themed-home-events',
};

// ─── Chores ──────────────────────────────────────────────────────────────────

export const todaysChoresManifest: WidgetManifest = {
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

export const myChoresManifest: WidgetManifest = {
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

export const choreLeaderboardManifest: WidgetManifest = {
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

// ─── Shopping ────────────────────────────────────────────────────────────────

export const shoppingListManifest: WidgetManifest = {
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
  themedClass: 'themed-home-shopping',
};

// ─── Finance ─────────────────────────────────────────────────────────────────

export const paidChoresManifest: WidgetManifest = {
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

export const earningsManifest: WidgetManifest = {
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
  themedClass: 'themed-home-earnings',
};

// ─── Family ──────────────────────────────────────────────────────────────────

export const familyMembersManifest: WidgetManifest = {
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
  themedClass: 'themed-home-family',
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const announcementsManifest: WidgetManifest = {
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
  themedClass: 'themed-home-announcements',
};

// ─── Meals ───────────────────────────────────────────────────────────────────

export const upcomingMealsManifest: WidgetManifest = {
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
