// _registry/previewData.ts
// Mock data for widget previews in the Store page
// Each entry matches the widget's actual prop interface so the real component can render

import type { WidgetEvent, WidgetChoreAssignment, WidgetMyChore } from '../_built-in/types';

// ── Date helpers (relative so previews always look current) ──────────────────

function todayAt(time: string): string {
  const d = new Date();
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function daysFromNow(days: number, time = '12:00'): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

// ── Preview data keyed by widget ID ──────────────────────────────────────────

export interface WidgetPreviewEntry {
  props: Record<string, unknown>;
  /** If true, render StaticWeatherPreview instead of the real widget */
  useStaticPreview?: boolean;
}

export const widgetPreviewData: Record<string, WidgetPreviewEntry> = {
  // ─── General ─────────────────────────────────────────────────────────
  'welcome': {
    props: {
      userName: 'Alex',
    },
  },

  'quick-stats': {
    props: {
      eventsToday: 3,
      choresDue: 5,
      shoppingItems: 12,
      earnings: 24.50,
    },
  },

  'weather': {
    props: {},
    useStaticPreview: true,
  },

  // ─── Calendar ────────────────────────────────────────────────────────
  'todays-events': {
    props: {
      events: [
        { id: 1, title: 'Team Meeting', startTime: todayAt('09:00'), endTime: todayAt('10:00'), color: '#4f46e5', allDay: false },
        { id: 2, title: 'Soccer Practice', startTime: todayAt('15:30'), endTime: todayAt('17:00'), color: '#059669', allDay: false },
        { id: 3, title: 'Family Game Night', startTime: todayAt('19:00'), endTime: todayAt('21:00'), color: '#d97706', allDay: false },
      ] as WidgetEvent[],
    },
  },

  'upcoming-events': {
    props: {
      events: [
        { id: 1, title: 'Dentist Appointment', startTime: daysFromNow(1, '10:00'), endTime: daysFromNow(1, '11:00'), color: '#ef4444', allDay: false },
        { id: 2, title: "Sam's Birthday Party", startTime: daysFromNow(3, '14:00'), endTime: daysFromNow(3, '17:00'), color: '#8b5cf6', allDay: false },
        { id: 3, title: 'Book Club', startTime: daysFromNow(5, '18:00'), endTime: daysFromNow(5, '19:30'), color: '#0ea5e9', allDay: false },
      ] as WidgetEvent[],
      daysAhead: 7,
      showAllDay: true,
    },
  },

  // ─── Chores ──────────────────────────────────────────────────────────
  'todays-chores': {
    props: {
      chores: [
        { id: 1, choreId: 101, title: 'Take out trash', status: 'completed', dueDate: todayStr(), completedAt: hoursAgo(2), assigneeName: 'Alex', assigneeColor: '#4f46e5' },
        { id: 2, choreId: 102, title: 'Vacuum living room', status: 'pending', dueDate: todayStr(), completedAt: null, assigneeName: 'Sam', assigneeColor: '#059669' },
        { id: 3, choreId: 103, title: 'Load dishwasher', status: 'pending', dueDate: todayStr(), completedAt: null, assigneeName: 'Jordan', assigneeColor: '#d97706' },
      ] as WidgetChoreAssignment[],
    },
  },

  'my-chores': {
    props: {
      chores: [
        { id: 1, choreId: 201, title: 'Make bed', status: 'completed', dueDate: todayStr(), completedAt: hoursAgo(3) },
        { id: 2, choreId: 202, title: 'Clean bathroom', status: 'pending', dueDate: todayStr(), completedAt: null },
        { id: 3, choreId: 203, title: 'Fold laundry', status: 'pending', dueDate: tomorrowStr(), completedAt: null },
      ] as WidgetMyChore[],
    },
  },

  'chore-leaderboard': {
    props: {
      leaderboard: [
        { id: 1, displayName: 'Alex', color: '#4f46e5', avatarUrl: null, points: 42 },
        { id: 2, displayName: 'Sam', color: '#059669', avatarUrl: null, points: 38 },
        { id: 3, displayName: 'Jordan', color: '#d97706', avatarUrl: null, points: 27 },
        { id: 4, displayName: 'Taylor', color: '#ef4444', avatarUrl: null, points: 15 },
      ],
      currentUserId: 2,
    },
  },

  // ─── Shopping ────────────────────────────────────────────────────────
  'shopping-list': {
    props: {
      items: [
        { id: 1, name: 'Milk', quantity: 1, unit: 'gal', purchased: false, categoryName: 'Dairy' },
        { id: 2, name: 'Bananas', quantity: 6, unit: null, purchased: false, categoryName: 'Produce' },
        { id: 3, name: 'Bread', quantity: 1, unit: 'loaf', purchased: true, categoryName: 'Bakery' },
        { id: 4, name: 'Chicken breast', quantity: 2, unit: 'lbs', purchased: false, categoryName: 'Meat' },
      ],
    },
  },

  // ─── Finance ─────────────────────────────────────────────────────────
  'paid-chores': {
    props: {
      chores: [
        { id: 'pc1', title: 'Mow the lawn', amount: 10.00, difficulty: 'medium', status: 'available' },
        { id: 'pc2', title: 'Wash the car', amount: 8.00, difficulty: 'easy', status: 'available' },
        { id: 'pc3', title: 'Organize garage', amount: 15.00, difficulty: 'hard', status: 'available' },
      ],
    },
  },

  'earnings': {
    props: {
      totalEarnings: 47.50,
    },
  },

  // ─── Family ──────────────────────────────────────────────────────────
  'family-members': {
    props: {
      members: [
        { id: 1, displayName: 'Mom', nickname: null, color: '#4f46e5', avatarUrl: null, role: 'admin' },
        { id: 2, displayName: 'Dad', nickname: null, color: '#059669', avatarUrl: null, role: 'admin' },
        { id: 3, displayName: 'Sam', nickname: 'Sammy', color: '#d97706', avatarUrl: null, role: 'kid' },
        { id: 4, displayName: 'Jordan', nickname: null, color: '#ef4444', avatarUrl: null, role: 'kid' },
      ],
      currentUserId: 1,
    },
  },

  // ─── Messages ────────────────────────────────────────────────────────
  'announcements': {
    props: {
      announcements: [
        {
          id: 1,
          title: 'Family vacation planning!',
          content: 'We\'re thinking about going to the beach this summer. Let\'s discuss tonight!',
          createdAt: hoursAgo(1),
          sender: { displayName: 'Mom', color: '#4f46e5' },
          isRead: false,
        },
        {
          id: 2,
          title: 'New chore schedule',
          content: 'Updated the weekly chore assignments. Check your tasks!',
          createdAt: hoursAgo(24),
          sender: { displayName: 'Dad', color: '#059669' },
          isRead: true,
        },
      ],
    },
  },

  // ─── Meals ───────────────────────────────────────────────────────────
  'upcoming-meals': {
    props: {
      meals: [
        { id: 1, date: todayStr(), recipeName: 'Spaghetti Bolognese', customMealName: null, isFendForYourself: false, ffyMessage: null, status: 'finalized', voteCount: 0 },
        { id: 2, date: tomorrowStr(), recipeName: null, customMealName: 'Taco Tuesday', isFendForYourself: false, ffyMessage: null, status: 'planned', voteCount: 0 },
        { id: 3, date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), recipeName: null, customMealName: null, isFendForYourself: false, ffyMessage: null, status: 'voting', voteCount: 3 },
      ],
    },
  },
};
