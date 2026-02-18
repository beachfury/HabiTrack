// apps/web/src/components/themes/PreviewPages/MealsPreview.tsx
// Meals page preview replica for theme editor

import { UtensilsCrossed, Calendar, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface MealsPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock meal data
const MOCK_WEEK = [
  { day: 'Mon', meal: 'Spaghetti Bolognese', votes: 3 },
  { day: 'Tue', meal: 'Chicken Stir Fry', votes: 2 },
  { day: 'Wed', meal: 'Tacos', votes: 4 },
  { day: 'Thu', meal: null, votes: 0 },
  { day: 'Fri', meal: 'Pizza Night', votes: 5 },
  { day: 'Sat', meal: null, votes: 0 },
  { day: 'Sun', meal: 'Roast Dinner', votes: 3 },
];

export function MealsPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: MealsPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  const mealsBgStyle = theme.elementStyles?.['meals-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  const hasCustomMealsBg = mealsBgStyle.backgroundColor || mealsBgStyle.backgroundGradient || mealsBgStyle.backgroundImage || mealsBgStyle.customCSS;

  const cardBgFallback = hasCustomMealsBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomMealsBg ? 'rgba(255,255,255,0.15)' : colors.border;

  const cardStyle = theme.elementStyles?.card || {};
  const computedCardStyle = buildElementStyle(cardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);

  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    mealsBgStyle,
    globalPageBgStyle,
    colors.background
  );

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
      element="meals-background"
      isSelected={selectedElement === 'meals-background'}
      onClick={() => onSelectElement('meals-background')}
      className={`flex-1 overflow-auto ${animatedBgClasses}`}
      style={{
        ...pageBgStyle,
        position: 'relative',
      }}
    >
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: mealsBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}

      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold" style={{ color: colors.foreground }}>
              Dinner Planner
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded" style={{ color: colors.mutedForeground }}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium" style={{ color: colors.foreground }}>This Week</span>
            <button className="p-1 rounded" style={{ color: colors.mutedForeground }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {MOCK_WEEK.map((day) => (
            <div
              key={day.day}
              className="p-2 rounded-lg text-center"
              style={computedCardStyle}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
                {day.day}
              </p>
              {day.meal ? (
                <>
                  <p className="text-[10px] leading-tight mb-1" style={{ color: colors.foreground }}>
                    {day.meal}
                  </p>
                  <div className="flex items-center justify-center gap-0.5">
                    <ThumbsUp size={10} style={{ color: colors.success }} />
                    <span className="text-[9px]" style={{ color: colors.mutedForeground }}>
                      {day.votes}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>
                  No meal
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Upcoming Meals */}
        <div className="p-4 rounded-lg" style={computedCardStyle}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
            Upcoming Dinners
          </h2>
          <div className="space-y-2">
            {MOCK_WEEK.filter(d => d.meal).slice(0, 3).map((day) => (
              <div
                key={day.day}
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: colors.muted }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: colors.foreground }}>
                    {day.meal}
                  </p>
                  <p className="text-[10px]" style={{ color: colors.mutedForeground }}>
                    {day.day}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp size={12} style={{ color: colors.success }} />
                  <span className="text-xs" style={{ color: colors.mutedForeground }}>
                    {day.votes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClickableElement>
  );
}
