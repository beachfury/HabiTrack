// apps/web/src/components/themes/PreviewPages/CalendarPreview.tsx
// Calendar page preview replica for theme editor
// Uses page-specific element IDs for independent styling

import { ChevronLeft, ChevronRight, Plus, CheckSquare, Utensils, User } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement, ElementStyle } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

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

/**
 * Helper to get element style with page-specific override support.
 * Falls back to global style if page-specific is not defined.
 */
function getElementStyleWithFallback(
  elementStyles: ExtendedTheme['elementStyles'],
  pageElement: ThemeableElement,
  globalElement: ThemeableElement
): ElementStyle {
  // First check for page-specific style
  const pageStyle = elementStyles?.[pageElement];
  if (pageStyle && Object.keys(pageStyle).length > 0) {
    return pageStyle;
  }
  // Fall back to global element style
  return elementStyles?.[globalElement] || {};
}

export function CalendarPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: CalendarPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Page-specific background - check early for card fallback logic
  const calendarBgStyle = theme.elementStyles?.['calendar-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  // Check if calendar background has custom styling (gradient, image, or explicit color)
  const hasCustomCalendarBg = calendarBgStyle.backgroundColor || calendarBgStyle.backgroundGradient || calendarBgStyle.backgroundImage || calendarBgStyle.customCSS;

  // When calendar has custom background, use semi-transparent card backgrounds by default
  // This allows the background to show through while still having distinct cards
  const cardBgFallback = hasCustomCalendarBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomCalendarBg ? 'rgba(255,255,255,0.15)' : colors.border;

  // Get styles with page-specific overrides
  // calendar-grid -> falls back to card
  // calendar-meal-widget -> falls back to widget
  // calendar-user-card -> falls back to card
  const calendarGridStyle = getElementStyleWithFallback(theme.elementStyles, 'calendar-grid', 'card');
  const mealWidgetStyle = getElementStyleWithFallback(theme.elementStyles, 'calendar-meal-widget', 'widget');
  const userCardStyle = getElementStyleWithFallback(theme.elementStyles, 'calendar-user-card', 'card');
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};

  // Build computed styles for each element (with text color fallback and semi-transparent fallbacks)
  const computedCalendarGridStyle = buildElementStyle(calendarGridStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedMealWidgetStyle = buildElementStyle(mealWidgetStyle, hasCustomCalendarBg ? 'rgba(255,255,255,0.06)' : colors.muted, cardBorderFallback, defaultRadius, 'none', colors.foreground);
  const computedUserCardStyle = buildElementStyle(userCardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.primary, colors.primaryForeground, 'transparent', '8px');

  // Extract text styles for child elements (with fallback to theme/defaults)
  const calendarGridTextColor = calendarGridStyle.textColor || colors.cardForeground;
  const calendarGridMutedColor = calendarGridStyle.textColor ? `${calendarGridStyle.textColor}99` : colors.mutedForeground;
  const calendarGridFontFamily = calendarGridStyle.fontFamily;
  const calendarGridFontSize = calendarGridStyle.textSize ? `${calendarGridStyle.textSize}px` : undefined;
  const calendarGridFontWeight = calendarGridStyle.fontWeight ? { normal: 400, medium: 500, semibold: 600, bold: 700 }[calendarGridStyle.fontWeight] : undefined;

  const mealWidgetTextColor = mealWidgetStyle.textColor || colors.foreground;
  const mealWidgetMutedColor = mealWidgetStyle.textColor ? `${mealWidgetStyle.textColor}99` : colors.mutedForeground;
  const mealWidgetFontFamily = mealWidgetStyle.fontFamily;
  const mealWidgetFontSize = mealWidgetStyle.textSize ? `${mealWidgetStyle.textSize}px` : undefined;
  const mealWidgetFontWeight = mealWidgetStyle.fontWeight ? { normal: 400, medium: 500, semibold: 600, bold: 700 }[mealWidgetStyle.fontWeight] : undefined;

  const userCardTextColor = userCardStyle.textColor || colors.cardForeground;
  const userCardMutedColor = userCardStyle.textColor ? `${userCardStyle.textColor}99` : colors.mutedForeground;
  const userCardFontFamily = userCardStyle.fontFamily;
  const userCardFontSize = userCardStyle.textSize ? `${userCardStyle.textSize}px` : undefined;
  const userCardFontWeight = userCardStyle.fontWeight ? { normal: 400, medium: 500, semibold: 600, bold: 700 }[userCardStyle.fontWeight] : undefined;

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

  // Build page background style (calendarBgStyle and globalPageBgStyle already defined above)
  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    calendarBgStyle,
    globalPageBgStyle,
    colors.background
  );

  // Detect animated background effect classes from customCSS
  const getAnimatedBgClasses = (css?: string): string => {
    if (!css) return '';
    const classes: string[] = [];
    if (css.includes('matrix-rain: true') || css.includes('matrix-rain:true')) {
      classes.push('matrix-rain-bg');
      const speedMatch = css.match(/matrix-rain-speed:\s*(slow|normal|fast|veryfast)/i);
      if (speedMatch) classes.push(`matrix-rain-${speedMatch[1].toLowerCase()}`);
    }
    if (css.includes('snowfall: true') || css.includes('snowfall:true')) classes.push('snowfall-bg');
    if (css.includes('sparkle: true') || css.includes('sparkle:true')) classes.push('sparkle-bg');
    if (css.includes('bubbles: true') || css.includes('bubbles:true')) classes.push('bubbles-bg');
    if (css.includes('embers: true') || css.includes('embers:true')) classes.push('embers-bg');
    return classes.join(' ');
  };

  const animatedBgClasses = getAnimatedBgClasses(customCSS);

  return (
    <ClickableElement
      element="calendar-background"
      isSelected={selectedElement === 'calendar-background'}
      onClick={() => onSelectElement('calendar-background')}
      className={`flex-1 overflow-auto flex flex-col ${animatedBgClasses}`}
      style={pageBgStyle}
    >
      {/* Background image layer */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: calendarBgStyle.backgroundOpacity ?? globalPageBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}
      <div className="relative z-10 p-4 flex-1 flex flex-col">
      {/* Page header - matches actual CalendarPage */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ClickableElement
            element="calendar-title"
            isSelected={selectedElement === 'calendar-title'}
            onClick={() => onSelectElement('calendar-title')}
          >
            <h1
              className="text-xl font-bold"
              style={{
                color: theme.elementStyles?.['calendar-title']?.textColor || colors.foreground,
                fontSize: theme.elementStyles?.['calendar-title']?.textSize
                  ? `${theme.elementStyles['calendar-title'].textSize}px`
                  : undefined,
                fontWeight: theme.elementStyles?.['calendar-title']?.fontWeight
                  ? { normal: 400, medium: 500, semibold: 600, bold: 700 }[theme.elementStyles['calendar-title'].fontWeight]
                  : undefined,
                fontFamily: theme.elementStyles?.['calendar-title']?.fontFamily,
              }}
            >
              February 2024
            </h1>
          </ClickableElement>
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
            >
              <ChevronLeft size={16} style={{ color: colors.mutedForeground }} />
            </button>
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
            >
              <ChevronRight size={16} style={{ color: colors.mutedForeground }} />
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
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
              style={computedButtonPrimaryStyle}
            >
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
        className="flex-1 mb-3"
        style={{
          ...computedCalendarGridStyle,
          padding: '0',
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
              style={{
                color: calendarGridMutedColor,
                fontSize: calendarGridFontSize || '0.75rem',
                fontWeight: calendarGridFontWeight || 600,
                fontFamily: calendarGridFontFamily,
              }}
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
                      color: isToday ? colors.primaryForeground : calendarGridTextColor,
                      fontWeight: isToday ? 700 : (calendarGridFontWeight || 400),
                      fontSize: calendarGridFontSize || '0.75rem',
                      fontFamily: calendarGridFontFamily,
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
                        color: chore.status === 'completed' ? colors.primary : calendarGridMutedColor,
                        textDecoration: chore.status === 'completed' ? 'line-through' : 'none',
                      }}
                    >
                      <CheckSquare size={6} />
                      {chore.title}
                    </div>
                  ))}
                  {totalItems > 2 && (
                    <div className="text-[8px] px-1" style={{ color: calendarGridMutedColor }}>
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
          style={{
            ...computedMealWidgetStyle,
            padding: mealWidgetStyle.padding || '12px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={14} style={{ color: colors.primary }} />
            <h3
              style={{
                color: mealWidgetTextColor,
                fontSize: mealWidgetFontSize || '0.875rem',
                fontWeight: mealWidgetFontWeight || 600,
                fontFamily: mealWidgetFontFamily,
              }}
            >
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
                  fontFamily: mealWidgetFontFamily,
                }}
              >
                <span
                  className="block"
                  style={{
                    color: mealWidgetMutedColor,
                    fontSize: mealWidgetFontSize ? `calc(${mealWidgetFontSize} * 0.6)` : '9px',
                    fontWeight: mealWidgetFontWeight,
                  }}
                >
                  {meal.day}
                </span>
                <span
                  className="block"
                  style={{
                    color: meal.isToday ? colors.primary : mealWidgetTextColor,
                    fontSize: mealWidgetFontSize ? `calc(${mealWidgetFontSize} * 0.7)` : '10px',
                    fontWeight: mealWidgetFontWeight || 500,
                  }}
                >
                  {meal.date}
                </span>
                <span style={{ fontSize: mealWidgetFontSize || '0.875rem' }}>{meal.icon}</span>
                <p
                  className="truncate"
                  style={{
                    color: meal.meal ? mealWidgetTextColor : mealWidgetMutedColor,
                    fontSize: mealWidgetFontSize ? `calc(${mealWidgetFontSize} * 0.5)` : '8px',
                    fontWeight: mealWidgetFontWeight,
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
            <h3
              style={{
                color: userCardTextColor,
                fontSize: userCardFontSize || '0.75rem',
                fontWeight: userCardFontWeight || 600,
                fontFamily: userCardFontFamily,
              }}
            >
              Today's Schedule by Member
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* User card 1 - Clickable for styling */}
            <ClickableElement
              element="calendar-user-card"
              isSelected={selectedElement === 'calendar-user-card'}
              onClick={() => onSelectElement('calendar-user-card')}
              style={{
                ...computedUserCardStyle,
                padding: userCardStyle.padding || '8px',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: '#8b5cf6',
                    fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.6)` : '9px',
                    fontWeight: userCardFontWeight || 500,
                  }}
                >
                  E
                </div>
                <div style={{ fontFamily: userCardFontFamily }}>
                  <p
                    style={{
                      color: userCardTextColor,
                      fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.7)` : '10px',
                      fontWeight: userCardFontWeight || 500,
                    }}
                  >
                    Emma <span style={{ color: colors.primary, fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px' }}>(You)</span>
                  </p>
                  <p
                    style={{
                      color: userCardMutedColor,
                      fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px',
                    }}
                  >
                    child
                  </p>
                </div>
              </div>
              <div className="space-y-1" style={{ fontFamily: userCardFontFamily }}>
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{
                    backgroundColor: `${colors.muted}50`,
                    fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px',
                    fontWeight: userCardFontWeight,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                  <span style={{ color: userCardTextColor }}>Soccer Practice</span>
                </div>
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px',
                    fontWeight: userCardFontWeight,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3cb371' }} />
                  <span style={{ color: userCardMutedColor, textDecoration: 'line-through' }}>
                    Take Out Trash
                  </span>
                </div>
              </div>
            </ClickableElement>

            {/* User card 2 - Shows same style as card 1 */}
            <div
              className="rounded-lg"
              style={{
                ...computedUserCardStyle,
                padding: userCardStyle.padding || '8px',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: '#3b82f6',
                    fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.6)` : '9px',
                    fontWeight: userCardFontWeight || 500,
                  }}
                >
                  J
                </div>
                <div style={{ fontFamily: userCardFontFamily }}>
                  <p
                    style={{
                      color: userCardTextColor,
                      fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.7)` : '10px',
                      fontWeight: userCardFontWeight || 500,
                    }}
                  >
                    Jake
                  </p>
                  <p
                    style={{
                      color: userCardMutedColor,
                      fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px',
                    }}
                  >
                    child
                  </p>
                </div>
              </div>
              <div className="space-y-1" style={{ fontFamily: userCardFontFamily }}>
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{
                    backgroundColor: `${colors.muted}50`,
                    fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px',
                    fontWeight: userCardFontWeight,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  <span style={{ color: userCardTextColor }}>Piano Lesson</span>
                </div>
                <div
                  className="flex items-center gap-1 p-1 rounded"
                  style={{
                    backgroundColor: `${colors.muted}50`,
                    fontSize: userCardFontSize ? `calc(${userCardFontSize} * 0.5)` : '8px',
                    fontWeight: userCardFontWeight,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                  <span style={{ color: userCardTextColor }}>Clean Room</span>
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
