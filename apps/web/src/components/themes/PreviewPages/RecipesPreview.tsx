// apps/web/src/components/themes/PreviewPages/RecipesPreview.tsx
// Recipes page preview replica for theme editor

import { BookOpen, Clock, Users, Star, Plus } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface RecipesPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock recipe data
const MOCK_RECIPES = [
  { name: 'Spaghetti Bolognese', time: '45 min', servings: 4, rating: 4.5 },
  { name: 'Chicken Stir Fry', time: '25 min', servings: 2, rating: 4.8 },
  { name: 'Homemade Pizza', time: '60 min', servings: 6, rating: 4.2 },
];

const TABS = [
  { id: 'all', label: 'All Recipes' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
];

export function RecipesPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: RecipesPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  const recipesBgStyle = theme.elementStyles?.['recipes-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  const hasCustomRecipesBg = recipesBgStyle.backgroundColor || recipesBgStyle.backgroundGradient || recipesBgStyle.backgroundImage || recipesBgStyle.customCSS;

  const cardBgFallback = hasCustomRecipesBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomRecipesBg ? 'rgba(255,255,255,0.15)' : colors.border;

  const cardStyle = theme.elementStyles?.card || {};
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};

  const computedCardStyle = buildElementStyle(cardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.primary, colors.primaryForeground, 'transparent', '8px');

  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    recipesBgStyle,
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
      element="recipes-background"
      isSelected={selectedElement === 'recipes-background'}
      onClick={() => onSelectElement('recipes-background')}
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
            opacity: recipesBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}

      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold" style={{ color: colors.foreground }}>
              Recipe Book
            </h1>
          </div>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={computedButtonPrimaryStyle}
          >
            <Plus size={12} />
            Add Recipe
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              className="px-3 py-2 text-xs font-medium"
              style={{
                color: i === 0 ? colors.primary : colors.mutedForeground,
                borderBottom: i === 0 ? `2px solid ${colors.primary}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recipe Cards */}
        <div className="space-y-3">
          {MOCK_RECIPES.map((recipe) => (
            <div
              key={recipe.name}
              className="p-3 rounded-lg"
              style={computedCardStyle}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: colors.foreground }}>
                    {recipe.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={10} style={{ color: colors.mutedForeground }} />
                      <span className="text-[10px]" style={{ color: colors.mutedForeground }}>
                        {recipe.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={10} style={{ color: colors.mutedForeground }} />
                      <span className="text-[10px]" style={{ color: colors.mutedForeground }}>
                        {recipe.servings} servings
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={12} fill={colors.warning} style={{ color: colors.warning }} />
                  <span className="text-xs font-medium" style={{ color: colors.foreground }}>
                    {recipe.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClickableElement>
  );
}
