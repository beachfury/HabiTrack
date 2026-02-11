// apps/web/src/components/dashboard/widgets/index.ts
// Widget registry - exports all available widgets

import React from 'react';
import { WelcomeWidget } from './WelcomeWidget';
import { QuickStatsWidget } from './QuickStatsWidget';
import { TodaysEventsWidget } from './TodaysEventsWidget';
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

export {
  WelcomeWidget,
  QuickStatsWidget,
  TodaysEventsWidget,
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

// Widget component map for dynamic rendering
export const widgetComponents: Record<string, React.ComponentType<any>> = {
  'welcome': WelcomeWidget,
  'quick-stats': QuickStatsWidget,
  'todays-events': TodaysEventsWidget,
  'upcoming-events': TodaysEventsWidget, // Reuses TodaysEventsWidget with different data
  'todays-chores': TodaysChoresWidget,
  'my-chores': MyChoresWidget,
  'chore-leaderboard': ChoreLeaderboardWidget,
  'shopping-list': ShoppingListWidget,
  'paid-chores': PaidChoresWidget,
  'earnings': EarningsWidget,
  'family-members': FamilyWidget,
  'announcements': AnnouncementsWidget,
  'weather': WeatherWidget,
  'upcoming-meals': UpcomingMealsWidget,
};
