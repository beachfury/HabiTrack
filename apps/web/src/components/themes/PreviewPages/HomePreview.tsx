// apps/web/src/components/themes/PreviewPages/HomePreview.tsx
// Home/Dashboard page preview replica for theme editor - mirrors actual HomePage
// Uses .themed-* CSS classes instead of inline style computation

import { Check, Calendar, ShoppingCart, Sun, Settings, Trophy, Utensils, Sparkles, LayoutDashboard } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

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

/** Extract animated background effect CSS classes from customCSS string */
function getAnimatedBgClasses(customCSS?: string): string {
  if (!customCSS) return '';
  const classes: string[] = [];
  if (customCSS.includes('matrix-rain: true') || customCSS.includes('matrix-rain:true')) {
    classes.push('matrix-rain-bg');
    const speedMatch = customCSS.match(/matrix-rain-speed:\s*(slow|normal|fast|veryfast)/i);
    if (speedMatch) classes.push(`matrix-rain-${speedMatch[1].toLowerCase()}`);
  }
  if (customCSS.includes('snowfall: true') || customCSS.includes('snowfall:true')) classes.push('snowfall-bg');
  if (customCSS.includes('sparkle: true') || customCSS.includes('sparkle:true')) classes.push('sparkle-bg');
  if (customCSS.includes('bubbles: true') || customCSS.includes('bubbles:true')) classes.push('bubbles-bg');
  if (customCSS.includes('embers: true') || customCSS.includes('embers:true')) classes.push('embers-bg');
  return classes.join(' ');
}

export function HomePreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: HomePreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  // Detect animated background effects from home-background customCSS
  const homeBgCustomCSS = theme.elementStyles?.['home-background']?.customCSS
    || theme.elementStyles?.['page-background']?.customCSS;
  const animatedBgClasses = getAnimatedBgClasses(homeBgCustomCSS);

  return (
    <ClickableElement
      element="home-background"
      isSelected={selectedElement === 'home-background'}
      onClick={() => onSelectElement('home-background')}
      className={`themed-home-bg flex-1 overflow-auto ${animatedBgClasses}`}
    >
      <div className="p-4 space-y-4">
        {/* Page header - matches real HomePage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} style={{ color: colors.primary }} />
            <ClickableElement
              element="home-title"
              isSelected={selectedElement === 'home-title'}
              onClick={() => onSelectElement('home-title')}
            >
              <div>
                <h1 className="themed-home-title text-lg font-bold transition-all duration-200">
                  Home
                </h1>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Your household at a glance</p>
              </div>
            </ClickableElement>
          </div>
          <ClickableElement
            element="button-secondary"
            isSelected={selectedElement === 'button-secondary'}
            onClick={() => onSelectElement('button-secondary')}
          >
            <button className="themed-btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs font-medium">
              <Settings size={14} />
              Customize
            </button>
          </ClickableElement>
        </div>

        {/* Welcome Banner - matches WelcomeWidget */}
        <ClickableElement
          element="home-welcome-banner"
          isSelected={selectedElement === 'home-welcome-banner'}
          onClick={() => onSelectElement('home-welcome-banner')}
          className="themed-home-welcome"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Good evening, Admin User!
                <Sparkles size={20} style={{ color: colors.warning }} />
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                Here's what's happening with your family today.
              </p>
            </div>
          </div>
        </ClickableElement>

        {/* Widget Grid - matches real dashboard layout */}
        <div className="grid grid-cols-4 gap-3">
          {/* Quick Stats Widget (spans 2 cols) */}
          <ClickableElement
            element="home-stats-widget"
            isSelected={selectedElement === 'home-stats-widget'}
            onClick={() => onSelectElement('home-stats-widget')}
            className="themed-home-stats col-span-2"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
                  <Calendar size={16} style={{ color: colors.primary }} />
                </div>
                <p className="text-lg font-bold mt-1">{MOCK_STATS.events}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Events</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.warning}20` }}>
                  <Check size={16} style={{ color: colors.warning }} />
                </div>
                <p className="text-lg font-bold mt-1">{MOCK_STATS.chores}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Chores</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <ShoppingCart size={16} style={{ color: colors.success }} />
                </div>
                <p className="text-lg font-bold mt-1">{MOCK_STATS.shopping}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Shopping</p>
              </div>
            </div>
          </ClickableElement>

          {/* Weather Widget */}
          <ClickableElement
            element="home-weather-widget"
            isSelected={selectedElement === 'home-weather-widget'}
            onClick={() => onSelectElement('home-weather-widget')}
            className="themed-home-weather col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Weather</p>
                <p className="text-2xl font-bold">72°F</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Sunny</p>
              </div>
              <Sun size={32} style={{ color: colors.warning }} />
            </div>
          </ClickableElement>

          {/* Today's Chores Card */}
          <ClickableElement
            element="home-chores-card"
            isSelected={selectedElement === 'home-chores-card'}
            onClick={() => onSelectElement('home-chores-card')}
            className="themed-home-chores col-span-2 row-span-2"
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                    <p className={`text-xs ${chore.done ? 'line-through opacity-60' : ''}`}>
                      {chore.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>{chore.assignee}</p>
                  </div>
                </div>
              ))}
            </div>
          </ClickableElement>

          {/* Today's Events Card */}
          <ClickableElement
            element="home-events-card"
            isSelected={selectedElement === 'home-events-card'}
            onClick={() => onSelectElement('home-events-card')}
            className="themed-home-events col-span-2 row-span-2"
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Calendar size={14} style={{ color: colors.primary }} />
              Today's Events
            </h3>
            <div className="space-y-2">
              {MOCK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ClickableElement>

          {/* Leaderboard Widget */}
          <ClickableElement
            element="home-leaderboard-widget"
            isSelected={selectedElement === 'home-leaderboard-widget'}
            onClick={() => onSelectElement('home-leaderboard-widget')}
            className="themed-home-leaderboard col-span-2"
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Trophy size={14} style={{ color: colors.warning }} />
              Leaderboard
            </h3>
            <div className="space-y-1">
              {MOCK_LEADERBOARD.map((user, idx) => (
                <div key={user.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold w-4" style={{ color: 'var(--color-muted-foreground)' }}>#{idx + 1}</span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: user.color }}>
                    {user.name[0]}
                  </div>
                  <span className="flex-1 text-xs">{user.name}</span>
                  <span className="text-xs font-semibold" style={{ color: colors.primary }}>{user.points}</span>
                </div>
              ))}
            </div>
          </ClickableElement>

          {/* Upcoming Meals Widget */}
          <ClickableElement
            element="home-meals-widget"
            isSelected={selectedElement === 'home-meals-widget'}
            onClick={() => onSelectElement('home-meals-widget')}
            className="themed-home-meals col-span-2"
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Utensils size={14} style={{ color: colors.success }} />
              Upcoming Meals
            </h3>
            <div className="space-y-1">
              {MOCK_MEALS.map((meal) => (
                <div key={meal.day} className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>{meal.day}</span>
                  <span className="text-xs">{meal.meal}</span>
                </div>
              ))}
            </div>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
