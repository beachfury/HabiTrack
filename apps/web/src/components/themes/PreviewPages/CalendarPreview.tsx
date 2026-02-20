// apps/web/src/components/themes/PreviewPages/CalendarPreview.tsx
// Calendar page preview replica for theme editor
// Uses .themed-* CSS classes instead of inline style computation

import { Calendar, ChevronLeft, ChevronRight, Plus, CheckSquare, Utensils, User } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface CalendarPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock events matching actual page structure
const MOCK_EVENTS = [
  { id: 1, title: 'Soccer Practice', day: 15, color: '#22c55e', assignedTo: 'Emma' },
  { id: 2, title: 'Piano Lesson', day: 15, color: '#3b82f6', assignedTo: 'Jake' },
  { id: 3, title: 'Doctor Appt', day: 18, color: '#ef4444', assignedTo: null },
  { id: 4, title: 'Birthday Party', day: 20, color: '#f59e0b', assignedTo: 'Emma' },
  { id: 5, title: 'School Play', day: 22, color: '#ec4899', assignedTo: null },
];

// Mock chores
const MOCK_CHORES = [
  { id: 1, title: 'Clean Room', day: 15, points: 10, assignedTo: 'Jake', status: 'pending', color: '#8b5cf6' },
  { id: 2, title: 'Take Out Trash', day: 15, points: 5, assignedTo: 'Emma', status: 'completed', color: '#3cb371' },
  { id: 3, title: 'Walk Dog', day: 18, points: 15, assignedTo: 'Jake', status: 'pending', color: '#f59e0b' },
];

// Mock meal plans
const MOCK_MEALS = [
  { day: 'Sun', date: 11, meal: 'Spaghetti', icon: '🍝' },
  { day: 'Mon', date: 12, meal: 'Tacos', icon: '🌮' },
  { day: 'Tue', date: 13, meal: 'Salad', icon: '🥗' },
  { day: 'Wed', date: 14, meal: null, icon: '📭' },
  { day: 'Thu', date: 15, meal: 'Pizza', icon: '🍕', isToday: true },
  { day: 'Fri', date: 16, meal: 'Soup', icon: '🍲' },
  { day: 'Sat', date: 17, meal: 'BBQ', icon: '🍖' },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: CalendarPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  // Generate calendar days (February 2024 as example)
  const today = 15;
  const daysInMonth = 29;
  const firstDayOffset = 4; // Thursday

  const calendarDays: (number | null)[] = [];
  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOffset; i++) {
    calendarDays.push(null);
  }
  // Add the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getEventsForDay = (day: number) => MOCK_EVENTS.filter((e) => e.day === day);
  const getChoresForDay = (day: number) => MOCK_CHORES.filter((c) => c.day === day);

  return (
    <ClickableElement
      element="calendar-background"
      isSelected={selectedElement === 'calendar-background'}
      onClick={() => onSelectElement('calendar-background')}
      className="themed-calendar-bg flex-1 overflow-auto flex flex-col"
    >
      <div className="relative z-10 p-4 flex-1 flex flex-col space-y-4">
      {/* Page header - matches actual CalendarPage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} style={{ color: colors.primary }} />
          <ClickableElement
            element="calendar-title"
            isSelected={selectedElement === 'calendar-title'}
            onClick={() => onSelectElement('calendar-title')}
          >
            <h1 className="themed-calendar-title text-lg font-bold">
              February 2024
            </h1>
          </ClickableElement>
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
            >
              <ChevronLeft size={16} style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
            >
              <ChevronRight size={16} style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
          </div>
          <button
            className="px-2 py-1 text-xs font-medium rounded-lg"
            style={{ color: colors.primary }}
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Chores button */}
          <button
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
            style={{
              backgroundColor: `${colors.primary}15`,
              color: colors.primary,
            }}
          >
            <CheckSquare size={12} />
            Chores
          </button>
          {/* Add Event button */}
          <ClickableElement
            element="button-primary"
            isSelected={selectedElement === 'button-primary'}
            onClick={() => onSelectElement('button-primary')}
          >
            <button className="themed-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
              <Plus size={14} />
              Add Event
            </button>
          </ClickableElement>
        </div>
      </div>

      {/* Calendar card - main grid (page-specific: calendar-grid) */}
      <ClickableElement
        element="calendar-grid"
        isSelected={selectedElement === 'calendar-grid'}
        onClick={() => onSelectElement('calendar-grid')}
        className="themed-calendar-grid flex-1"
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Day headers */}
        <div
          className="grid grid-cols-7"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center"
              style={{ color: 'var(--color-muted-foreground)', fontSize: '0.75rem', fontWeight: 600 }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid - compact view */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {calendarDays.slice(0, 35).map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="p-1"
                  style={{
                    borderBottom: `1px solid ${colors.border}30`,
                    borderRight: `1px solid ${colors.border}30`,
                    backgroundColor: `${colors.muted}30`,
                  }}
                />
              );
            }

            const dayEvents = getEventsForDay(day);
            const dayChores = getChoresForDay(day);
            const isToday = day === today;
            const totalItems = dayEvents.length + dayChores.length;

            return (
              <div
                key={day}
                className="p-1"
                style={{
                  borderBottom: `1px solid ${colors.border}30`,
                  borderRight: `1px solid ${colors.border}30`,
                }}
              >
                {/* Day number */}
                <div className="flex items-center justify-center mb-0.5">
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isToday ? colors.primary : 'transparent',
                      color: isToday ? colors.primaryForeground : undefined,
                      fontWeight: isToday ? 700 : 400,
                      fontSize: '0.75rem',
                    }}
                  >
                    {day}
                  </span>
                </div>

                {/* Events/chores indicators */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={`event-${event.id}`}
                      className="text-[8px] px-1 py-0.5 rounded text-white truncate"
                      style={{ backgroundColor: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayChores.slice(0, Math.max(0, 2 - dayEvents.length)).map((chore) => (
                    <div
                      key={`chore-${chore.id}`}
                      className="text-[8px] px-1 py-0.5 rounded truncate flex items-center gap-0.5"
                      style={{
                        backgroundColor: chore.status === 'completed' ? `${colors.primary}15` : `${colors.muted}`,
                        color: chore.status === 'completed' ? colors.primary : 'var(--color-muted-foreground)',
                        textDecoration: chore.status === 'completed' ? 'line-through' : 'none',
                      }}
                    >
                      <CheckSquare size={6} />
                      {chore.title}
                    </div>
                  ))}
                  {totalItems > 2 && (
                    <div className="text-[8px] px-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      +{totalItems - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ClickableElement>

      {/* Bottom section: Weekly Meals & User Cards */}
      <div className="space-y-3">
        {/* Weekly Meal Planner Widget (page-specific: calendar-meal-widget) */}
        <ClickableElement
          element="calendar-meal-widget"
          isSelected={selectedElement === 'calendar-meal-widget'}
          onClick={() => onSelectElement('calendar-meal-widget')}
          className="themed-calendar-meal"
        >
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={14} style={{ color: colors.primary }} />
            <h3 className="text-sm font-semibold">
              Weekly Meal Plan
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {MOCK_MEALS.map((meal, i) => (
              <div
                key={i}
                className="p-1 rounded-lg text-center"
                style={{
                  backgroundColor: meal.isToday ? `${colors.primary}15` : 'transparent',
                  border: meal.isToday ? `1px solid ${colors.primary}` : 'none',
                }}
              >
                <span
                  className="block"
                  style={{ color: 'var(--color-muted-foreground)', fontSize: '9px' }}
                >
                  {meal.day}
                </span>
                <span
                  className="block"
                  style={{
                    color: meal.isToday ? colors.primary : undefined,
                    fontSize: '10px',
                    fontWeight: 500,
                  }}
                >
                  {meal.date}
                </span>
                <span style={{ fontSize: '0.875rem' }}>{meal.icon}</span>
                <p
                  className="truncate"
                  style={{
                    color: meal.meal ? undefined : 'var(--color-muted-foreground)',
                    fontSize: '8px',
                  }}
                >
                  {meal.meal || 'Not set'}
                </p>
              </div>
            ))}
          </div>
        </ClickableElement>

        {/* User Daily Cards (page-specific: calendar-user-card) */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <User size={12} style={{ color: colors.primary }} />
            <h3 className="text-xs font-semibold">
              Today's Schedule by Member
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* User card 1 - Clickable for styling */}
            <ClickableElement
              element="calendar-user-card"
              isSelected={selectedElement === 'calendar-user-card'}
              onClick={() => onSelectElement('calendar-user-card')}
              className="themed-calendar-user"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: '#8b5cf6', fontSize: '9px', fontWeight: 500 }}
                >
                  E
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 500 }}>
                    Emma <span style={{ color: colors.primary, fontSize: '8px' }}>(You)</span>
                  </p>
                  <p style={{ color: 'var(--color-muted-foreground)', fontSize: '8px' }}>
                    child
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{ backgroundColor: `${colors.muted}50`, fontSize: '8px' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                  <span>Soccer Practice</span>
                </div>
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{ backgroundColor: `${colors.primary}10`, fontSize: '8px' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3cb371' }} />
                  <span style={{ color: 'var(--color-muted-foreground)', textDecoration: 'line-through' }}>
                    Take Out Trash
                  </span>
                </div>
              </div>
            </ClickableElement>

            {/* User card 2 - Shows same style as card 1 */}
            <div className="themed-calendar-user rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: '#3b82f6', fontSize: '9px', fontWeight: 500 }}
                >
                  J
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 500 }}>
                    Jake
                  </p>
                  <p style={{ color: 'var(--color-muted-foreground)', fontSize: '8px' }}>
                    child
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{ backgroundColor: `${colors.muted}50`, fontSize: '8px' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  <span>Piano Lesson</span>
                </div>
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{ backgroundColor: `${colors.muted}50`, fontSize: '8px' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                  <span>Clean Room</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ClickableElement>
  );
}
