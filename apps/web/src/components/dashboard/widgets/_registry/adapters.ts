// _registry/adapters.ts
// Props adapters that map from centralized DashboardData to widget-specific props.

import type { WidgetPropsAdapter } from '../../../../types/widget';

export const welcomeAdapter: WidgetPropsAdapter = (data) => ({
  userName: (data.user as any)?.displayName || 'User',
});

export const quickStatsAdapter: WidgetPropsAdapter = (data) => {
  const stats = (data.quickStats as any) || { events: 0, chores: 0, shopping: 0 };
  return {
    eventsToday: stats.events,
    choresDue: stats.chores,
    shoppingItems: stats.shopping,
    earnings: Number((data.myEarnings as any)?.total) || 0,
  };
};

export const todaysEventsAdapter: WidgetPropsAdapter = (data) => ({
  events: data.todaysEvents || [],
});

export const upcomingEventsAdapter: WidgetPropsAdapter = (data, _userId, config) => ({
  events: data.upcomingEvents || [],
  daysAhead: (config?.daysAhead as number) || 7,
  showAllDay: config?.showAllDay !== false,
});

export const todaysChoresAdapter: WidgetPropsAdapter = (data) => ({
  chores: data.todaysChores || [],
});

export const myChoresAdapter: WidgetPropsAdapter = (data) => ({
  chores: data.myChores || [],
});

export const choreLeaderboardAdapter: WidgetPropsAdapter = (data, currentUserId) => ({
  leaderboard: data.choreLeaderboard || [],
  currentUserId,
});

export const shoppingListAdapter: WidgetPropsAdapter = (data) => ({
  items: data.shoppingItems || [],
});

export const paidChoresAdapter: WidgetPropsAdapter = (data) => ({
  chores: data.availablePaidChores || [],
});

export const earningsAdapter: WidgetPropsAdapter = (data) => ({
  totalEarnings: Number((data.myEarnings as any)?.total) || 0,
});

export const familyMembersAdapter: WidgetPropsAdapter = (data, currentUserId) => ({
  members: data.familyMembers || [],
  currentUserId,
});

export const announcementsAdapter: WidgetPropsAdapter = (data) => ({
  announcements: data.announcements || [],
});

export const weatherAdapter: WidgetPropsAdapter = () => ({
  location: undefined, // Uses browser geolocation
});

export const upcomingMealsAdapter: WidgetPropsAdapter = (data) => ({
  meals: data.upcomingMeals || [],
});
