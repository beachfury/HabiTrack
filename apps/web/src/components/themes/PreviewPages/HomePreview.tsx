// apps/web/src/components/themes/PreviewPages/HomePreview.tsx
// Home/Dashboard page preview replica for theme editor - mirrors actual HomePage

import { Check, Calendar, ShoppingCart, Sun, Settings, Trophy, DollarSign, Users, Utensils } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface HomePreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock data matching real dashboard widgets
const MOCK_STATS = { events: 3, chores: 5, shopping: 12 };

const MOCK_CHORES = [
  { id: 1, name: 'Clean kitchen', assignee: 'Alex', done: true },
  { id: 2, name: 'Take out trash', assignee: 'Sam', done: false },
  { id: 3, name: 'Water plants', assignee: 'Jordan', done: false },
];

const MOCK_EVENTS = [
  { id: 1, title: 'Soccer Practice', time: '3:00 PM', color: '#22c55e' },
  { id: 2, title: 'Piano Lesson', time: '5:30 PM', color: '#3cb371' },
  { id: 3, title: 'Dinner with Grandma', time: '7:00 PM', color: '#f59e0b' },
];

const MOCK_LEADERBOARD = [
  { name: 'Alex', points: 245, color: '#3cb371' },
  { name: 'Sam', points: 198, color: '#6366f1' },
  { name: 'Jordan', points: 156, color: '#f59e0b' },
];

const MOCK_MEALS = [
  { day: 'Today', meal: 'Spaghetti Bolognese' },
  { day: 'Tomorrow', meal: 'Grilled Chicken' },
];

export function HomePreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: HomePreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;
  const cardStyle = theme.elementStyles?.card || {};
  const widgetStyle = theme.elementStyles?.widget || {};
  const buttonSecondaryStyle = theme.elementStyles?.['button-secondary'] || {};

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Build computed styles
  const computedCardStyle = buildElementStyle(cardStyle, colors.card, colors.border, defaultRadius, defaultShadow, colors.cardForeground);
  const computedWidgetStyle = buildElementStyle(widgetStyle, colors.muted, colors.border, defaultRadius, 'none', colors.foreground);
  const computedButtonSecondaryStyle = buildButtonStyle(buttonSecondaryStyle, colors.secondary, colors.secondaryForeground, colors.border, '8px');

  // Page-specific background
  const dashboardBgStyle = theme.elementStyles?.['dashboard-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};
  const { style: pageBgStyle, backgroundImageUrl } = buildPageBackgroundStyle(
    dashboardBgStyle,
    globalPageBgStyle,
    colors.background
  );

  return (
    <ClickableElement
      element="dashboard-background"
      isSelected={selectedElement === 'dashboard-background'}
      onClick={() => onSelectElement('dashboard-background')}
      className="flex-1 overflow-auto"
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
            opacity: dashboardBgStyle.backgroundOpacity ?? globalPageBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}
      <div className="relative z-10 p-4">
        {/* Page header - matches real HomePage */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ color: colors.foreground }}>
            Dashboard
          </h1>
          <ClickableElement
            element="button-secondary"
            isSelected={selectedElement === 'button-secondary'}
            onClick={() => onSelectElement('button-secondary')}
          >
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
              style={computedButtonSecondaryStyle}
            >
              <Settings size={14} />
              Customize
            </button>
          </ClickableElement>
        </div>

        {/* Widget Grid - matches real dashboard layout */}
        <div className="grid grid-cols-4 gap-3">
          {/* Quick Stats Widget (spans 2 cols) */}
          <ClickableElement
            element="dashboard-stats-widget"
            isSelected={selectedElement === 'dashboard-stats-widget'}
            onClick={() => onSelectElement('dashboard-stats-widget')}
            className="col-span-2"
            style={{
              ...computedCardStyle,
              padding: cardStyle.padding || '12px',
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
                  <Calendar size={16} style={{ color: colors.primary }} />
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: colors.foreground }}>{MOCK_STATS.events}</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Events</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.warning}20` }}>
                  <Check size={16} style={{ color: colors.warning }} />
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: colors.foreground }}>{MOCK_STATS.chores}</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Chores</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <ShoppingCart size={16} style={{ color: colors.success }} />
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: colors.foreground }}>{MOCK_STATS.shopping}</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Shopping</p>
              </div>
            </div>
          </ClickableElement>

          {/* Weather Widget */}
          <ClickableElement
            element="dashboard-weather-widget"
            isSelected={selectedElement === 'dashboard-weather-widget'}
            onClick={() => onSelectElement('dashboard-weather-widget')}
            className="col-span-2"
            style={{
              ...computedCardStyle,
              padding: cardStyle.padding || '12px',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: colors.mutedForeground }}>Weather</p>
                <p className="text-2xl font-bold" style={{ color: colors.foreground }}>72°F</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Sunny</p>
              </div>
              <Sun size={32} style={{ color: colors.warning }} />
            </div>
          </ClickableElement>

          {/* Today's Chores Card */}
          <ClickableElement
            element="dashboard-chores-card"
            isSelected={selectedElement === 'dashboard-chores-card'}
            onClick={() => onSelectElement('dashboard-chores-card')}
            className="col-span-2 row-span-2"
            style={{
              ...computedCardStyle,
              padding: cardStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.foreground }}>
              <Check size={14} style={{ color: colors.primary }} />
              Today's Chores
            </h3>
            <div className="space-y-2">
              {MOCK_CHORES.map((chore) => (
                <div key={chore.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: chore.done ? colors.success : colors.border,
                      backgroundColor: chore.done ? colors.success : 'transparent',
                    }}
                  >
                    {chore.done && <Check size={10} style={{ color: colors.successForeground }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${chore.done ? 'line-through opacity-60' : ''}`} style={{ color: colors.foreground }}>
                      {chore.name}
                    </p>
                    <p className="text-[10px]" style={{ color: colors.mutedForeground }}>{chore.assignee}</p>
                  </div>
                </div>
              ))}
            </div>
          </ClickableElement>

          {/* Today's Events Card */}
          <ClickableElement
            element="dashboard-events-card"
            isSelected={selectedElement === 'dashboard-events-card'}
            onClick={() => onSelectElement('dashboard-events-card')}
            className="col-span-2 row-span-2"
            style={{
              ...computedCardStyle,
              padding: cardStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.foreground }}>
              <Calendar size={14} style={{ color: colors.primary }} />
              Today's Events
            </h3>
            <div className="space-y-2">
              {MOCK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: colors.foreground }}>{event.title}</p>
                    <p className="text-[10px]" style={{ color: colors.mutedForeground }}>{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ClickableElement>

          {/* Leaderboard Widget */}
          <ClickableElement
            element="widget"
            isSelected={selectedElement === 'widget'}
            onClick={() => onSelectElement('widget')}
            className="col-span-2"
            style={{
              ...computedCardStyle,
              padding: cardStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.foreground }}>
              <Trophy size={14} style={{ color: colors.warning }} />
              Leaderboard
            </h3>
            <div className="space-y-1">
              {MOCK_LEADERBOARD.map((user, idx) => (
                <div key={user.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold w-4" style={{ color: colors.mutedForeground }}>#{idx + 1}</span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: user.color }}>
                    {user.name[0]}
                  </div>
                  <span className="flex-1 text-xs" style={{ color: colors.foreground }}>{user.name}</span>
                  <span className="text-xs font-semibold" style={{ color: colors.primary }}>{user.points}</span>
                </div>
              ))}
            </div>
          </ClickableElement>

          {/* Upcoming Meals Widget */}
          <ClickableElement
            element="widget"
            isSelected={selectedElement === 'widget'}
            onClick={() => onSelectElement('widget')}
            className="col-span-2"
            style={{
              ...computedCardStyle,
              padding: cardStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.foreground }}>
              <Utensils size={14} style={{ color: colors.success }} />
              Upcoming Meals
            </h3>
            <div className="space-y-1">
              {MOCK_MEALS.map((meal) => (
                <div key={meal.day} className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: colors.mutedForeground }}>{meal.day}</span>
                  <span className="text-xs" style={{ color: colors.foreground }}>{meal.meal}</span>
                </div>
              ))}
            </div>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
