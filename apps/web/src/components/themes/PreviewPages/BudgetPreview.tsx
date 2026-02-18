// apps/web/src/components/themes/PreviewPages/BudgetPreview.tsx
// Budget page preview replica for theme editor

import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface BudgetPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock budget data
const MOCK_BUDGETS = [
  { name: 'Groceries', spent: 450, limit: 600, color: '#22c55e' },
  { name: 'Entertainment', spent: 120, limit: 150, color: '#f59e0b' },
  { name: 'Utilities', spent: 180, limit: 200, color: '#3b82f6' },
];

export function BudgetPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: BudgetPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  const budgetBgStyle = theme.elementStyles?.['budget-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  const hasCustomBudgetBg = budgetBgStyle.backgroundColor || budgetBgStyle.backgroundGradient || budgetBgStyle.backgroundImage || budgetBgStyle.customCSS;

  const cardBgFallback = hasCustomBudgetBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomBudgetBg ? 'rgba(255,255,255,0.15)' : colors.border;

  const cardStyle = theme.elementStyles?.card || {};
  const computedCardStyle = buildElementStyle(cardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);

  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    budgetBgStyle,
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
      element="budget-background"
      isSelected={selectedElement === 'budget-background'}
      onClick={() => onSelectElement('budget-background')}
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
            opacity: budgetBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}

      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold" style={{ color: colors.foreground }}>
              Budget Management
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg" style={computedCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} style={{ color: colors.success }} />
              <span className="text-xs" style={{ color: colors.mutedForeground }}>Total Budget</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.foreground }}>$950</p>
          </div>
          <div className="p-3 rounded-lg" style={computedCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} style={{ color: colors.warning }} />
              <span className="text-xs" style={{ color: colors.mutedForeground }}>Spent</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.foreground }}>$750</p>
          </div>
          <div className="p-3 rounded-lg" style={computedCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} style={{ color: colors.success }} />
              <span className="text-xs" style={{ color: colors.mutedForeground }}>Remaining</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.success }}>$200</p>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="p-4 rounded-lg" style={computedCardStyle}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
            Budget Categories
          </h2>
          <div className="space-y-3">
            {MOCK_BUDGETS.map((budget) => (
              <div key={budget.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: colors.foreground }}>{budget.name}</span>
                  <span style={{ color: colors.mutedForeground }}>
                    ${budget.spent} / ${budget.limit}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.muted }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(budget.spent / budget.limit) * 100}%`,
                      backgroundColor: budget.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClickableElement>
  );
}
