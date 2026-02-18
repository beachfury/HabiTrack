// apps/web/src/components/themes/PreviewPages/HomePreview.tsx
// Home/Dashboard page preview replica for theme editor - mirrors actual HomePage

import { Check, Calendar, ShoppingCart, Sun, Settings, Trophy, DollarSign, Users, Utensils, Sparkles } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, parseCustomCssToStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

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
  const buttonSecondaryStyle = theme.elementStyles?.['button-secondary'] || {};

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Page-specific background - check early so we can use it for card fallbacks
  const homeBgStyle = theme.elementStyles?.['home-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  // Check if home background has custom styling (gradient, image, or explicit color)
  const hasCustomHomeBg = homeBgStyle.backgroundColor || homeBgStyle.backgroundGradient || homeBgStyle.backgroundImage || homeBgStyle.customCSS;

  // When home has custom background, use semi-transparent card backgrounds by default
  // This allows the background to show through while still having distinct cards
  const cardBgFallback = hasCustomHomeBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomHomeBg ? 'rgba(255,255,255,0.15)' : colors.border;

  // Build computed styles with conditional fallbacks
  const computedButtonSecondaryStyle = buildButtonStyle(buttonSecondaryStyle, colors.secondary, colors.secondaryForeground, colors.border, '8px');

  // Dashboard-specific element styles
  const titleStyle = theme.elementStyles?.['home-title'] || {};
  const welcomeBannerStyle = theme.elementStyles?.['home-welcome-banner'] || {};
  const statsWidgetStyle = theme.elementStyles?.['home-stats-widget'] || {};
  const choresCardStyle = theme.elementStyles?.['home-chores-card'] || {};
  const eventsCardStyle = theme.elementStyles?.['home-events-card'] || {};
  const weatherWidgetStyle = theme.elementStyles?.['home-weather-widget'] || {};
  const leaderboardWidgetStyle = theme.elementStyles?.['home-leaderboard-widget'] || {};
  const mealsWidgetStyle = theme.elementStyles?.['home-meals-widget'] || {};

  // Build dashboard element styles with text color support
  const computedWelcomeStyle = buildElementStyle(welcomeBannerStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedStatsStyle = buildElementStyle(statsWidgetStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedChoresStyle = buildElementStyle(choresCardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedEventsStyle = buildElementStyle(eventsCardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedWeatherStyle = buildElementStyle(weatherWidgetStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedLeaderboardStyle = buildElementStyle(leaderboardWidgetStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedMealsStyle = buildElementStyle(mealsWidgetStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);

  // Get text colors with fallbacks
  const statsTextColor = statsWidgetStyle.textColor || colors.foreground;
  const statsMutedColor = colors.mutedForeground;
  const choresTextColor = choresCardStyle.textColor || colors.foreground;
  const choresMutedColor = colors.mutedForeground;
  const eventsTextColor = eventsCardStyle.textColor || colors.foreground;
  const eventsMutedColor = colors.mutedForeground;
  const weatherTextColor = weatherWidgetStyle.textColor || colors.foreground;
  const weatherMutedColor = colors.mutedForeground;
  const leaderboardTextColor = leaderboardWidgetStyle.textColor || colors.foreground;
  const mealsTextColor = mealsWidgetStyle.textColor || colors.foreground;

  // Build page background style
  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    homeBgStyle,
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
      element="home-background"
      isSelected={selectedElement === 'home-background'}
      onClick={() => onSelectElement('home-background')}
      className={`flex-1 overflow-auto ${animatedBgClasses}`}
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
            opacity: homeBgStyle.backgroundOpacity ?? globalPageBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}
      <div className="relative z-10 p-4">
        {/* Page header - matches real HomePage */}
        <div className="flex items-center justify-between mb-4">
          <ClickableElement
            element="home-title"
            isSelected={selectedElement === 'home-title'}
            onClick={() => onSelectElement('home-title')}
          >
            <h1
              className="text-xl font-bold transition-all duration-200"
              style={{
                color: titleStyle.textColor || colors.foreground,
                fontSize: titleStyle.textSize ? `${titleStyle.textSize}px` : undefined,
                fontWeight: titleStyle.fontWeight || 'bold',
                fontFamily: titleStyle.fontFamily || undefined,
                // Border support
                borderWidth: titleStyle.borderWidth ? `${titleStyle.borderWidth}px` : undefined,
                borderStyle: titleStyle.borderStyle || (titleStyle.borderWidth ? 'solid' : undefined),
                borderColor: titleStyle.borderColor || undefined,
                borderRadius: titleStyle.borderRadius ? `${titleStyle.borderRadius}px` : undefined,
                padding: titleStyle.padding || (titleStyle.borderWidth ? '4px 8px' : undefined),
                // Effects
                opacity: titleStyle.opacity ?? 1,
                backdropFilter: titleStyle.blur ? `blur(${titleStyle.blur}px)` : undefined,
                filter: (titleStyle.saturation !== undefined || titleStyle.grayscale !== undefined)
                  ? `saturate(${titleStyle.saturation ?? 100}%) grayscale(${titleStyle.grayscale ?? 0}%)`
                  : undefined,
                transform: (titleStyle.scale !== undefined || titleStyle.rotate !== undefined || titleStyle.skewX !== undefined || titleStyle.skewY !== undefined)
                  ? `scale(${titleStyle.scale ?? 1}) rotate(${titleStyle.rotate ?? 0}deg) skewX(${titleStyle.skewX ?? 0}deg) skewY(${titleStyle.skewY ?? 0}deg)`
                  : undefined,
                boxShadow: titleStyle.glowColor && titleStyle.glowSize
                  ? `0 0 ${titleStyle.glowSize}px ${titleStyle.glowColor}`
                  : titleStyle.boxShadow || undefined,
                // Apply custom CSS from Advanced tab
                ...(titleStyle.customCSS ? parseCustomCssToStyle(titleStyle.customCSS) : {}),
              }}
            >
              Home
            </h1>
          </ClickableElement>
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

        {/* Welcome Banner - matches WelcomeWidget */}
        <ClickableElement
          element="home-welcome-banner"
          isSelected={selectedElement === 'home-welcome-banner'}
          onClick={() => onSelectElement('home-welcome-banner')}
          className="mb-4"
          style={{
            ...computedWelcomeStyle,
            padding: welcomeBannerStyle.padding || '16px',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: welcomeBannerStyle.textColor || colors.foreground }}>
                Good evening, Admin User!
                <Sparkles size={20} style={{ color: colors.warning }} />
              </h2>
              <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
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
            className="col-span-2"
            style={{
              ...computedStatsStyle,
              padding: statsWidgetStyle.padding || '12px',
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
                  <Calendar size={16} style={{ color: colors.primary }} />
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: statsTextColor }}>{MOCK_STATS.events}</p>
                <p className="text-[10px]" style={{ color: statsMutedColor }}>Events</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.warning}20` }}>
                  <Check size={16} style={{ color: colors.warning }} />
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: statsTextColor }}>{MOCK_STATS.chores}</p>
                <p className="text-[10px]" style={{ color: statsMutedColor }}>Chores</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.success}20` }}>
                  <ShoppingCart size={16} style={{ color: colors.success }} />
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: statsTextColor }}>{MOCK_STATS.shopping}</p>
                <p className="text-[10px]" style={{ color: statsMutedColor }}>Shopping</p>
              </div>
            </div>
          </ClickableElement>

          {/* Weather Widget */}
          <ClickableElement
            element="home-weather-widget"
            isSelected={selectedElement === 'home-weather-widget'}
            onClick={() => onSelectElement('home-weather-widget')}
            className="col-span-2"
            style={{
              ...computedWeatherStyle,
              padding: weatherWidgetStyle.padding || '12px',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: weatherMutedColor }}>Weather</p>
                <p className="text-2xl font-bold" style={{ color: weatherTextColor }}>72°F</p>
                <p className="text-[10px]" style={{ color: weatherMutedColor }}>Sunny</p>
              </div>
              <Sun size={32} style={{ color: colors.warning }} />
            </div>
          </ClickableElement>

          {/* Today's Chores Card */}
          <ClickableElement
            element="home-chores-card"
            isSelected={selectedElement === 'home-chores-card'}
            onClick={() => onSelectElement('home-chores-card')}
            className="col-span-2 row-span-2"
            style={{
              ...computedChoresStyle,
              padding: choresCardStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: choresTextColor }}>
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
                    <p className={`text-xs ${chore.done ? 'line-through opacity-60' : ''}`} style={{ color: choresTextColor }}>
                      {chore.name}
                    </p>
                    <p className="text-[10px]" style={{ color: choresMutedColor }}>{chore.assignee}</p>
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
            className="col-span-2 row-span-2"
            style={{
              ...computedEventsStyle,
              padding: eventsCardStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: eventsTextColor }}>
              <Calendar size={14} style={{ color: colors.primary }} />
              Today's Events
            </h3>
            <div className="space-y-2">
              {MOCK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: eventsTextColor }}>{event.title}</p>
                    <p className="text-[10px]" style={{ color: eventsMutedColor }}>{event.time}</p>
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
            className="col-span-2"
            style={{
              ...computedLeaderboardStyle,
              padding: leaderboardWidgetStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: leaderboardTextColor }}>
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
                  <span className="flex-1 text-xs" style={{ color: leaderboardTextColor }}>{user.name}</span>
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
            className="col-span-2"
            style={{
              ...computedMealsStyle,
              padding: mealsWidgetStyle.padding || '12px',
            }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: mealsTextColor }}>
              <Utensils size={14} style={{ color: colors.success }} />
              Upcoming Meals
            </h3>
            <div className="space-y-1">
              {MOCK_MEALS.map((meal) => (
                <div key={meal.day} className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: colors.mutedForeground }}>{meal.day}</span>
                  <span className="text-xs" style={{ color: mealsTextColor }}>{meal.meal}</span>
                </div>
              ))}
            </div>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
