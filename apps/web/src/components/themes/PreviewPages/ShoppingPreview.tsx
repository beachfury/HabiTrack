// apps/web/src/components/themes/PreviewPages/ShoppingPreview.tsx
// Shopping page preview replica for theme editor - mirrors actual ShoppingPage

import { ShoppingCart, Package, Sparkles, History, Settings, ChevronDown, Plus, Store } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface ShoppingPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Tab configuration - matches real page
const TABS = [
  { id: 'list', label: 'List', icon: ShoppingCart },
  { id: 'catalog', label: 'Catalog', icon: Package },
  { id: 'predictions', label: 'Predict', icon: Sparkles },
  { id: 'history', label: 'History', icon: History },
  { id: 'manage', label: 'Manage', icon: Settings },
];

export function ShoppingPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: ShoppingPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Page-specific background - check early for card fallback logic
  const shoppingBgStyle = theme.elementStyles?.['shopping-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  // Check if shopping background has custom styling
  const hasCustomShoppingBg = shoppingBgStyle.backgroundColor || shoppingBgStyle.backgroundGradient || shoppingBgStyle.backgroundImage || shoppingBgStyle.customCSS;
  const cardBgFallback = hasCustomShoppingBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomShoppingBg ? 'rgba(255,255,255,0.15)' : colors.border;

  // Shopping filter widget style
  const filterWidgetStyle = theme.elementStyles?.['shopping-filter-widget'] || {};
  const computedFilterStyle = buildElementStyle(filterWidgetStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.foreground);

  // Shopping list card style
  const listCardStyle = theme.elementStyles?.['shopping-list-card'] || {};
  const computedListStyle = buildElementStyle(listCardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    shoppingBgStyle,
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
      element="shopping-background"
      isSelected={selectedElement === 'shopping-background'}
      onClick={() => onSelectElement('shopping-background')}
      className={`flex-1 overflow-auto ${animatedBgClasses}`}
      style={pageBgStyle}
    >
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: shoppingBgStyle.backgroundOpacity ?? globalPageBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}
      <div className="relative z-10">
        {/* Header - Filter Widget */}
        <ClickableElement
          element="shopping-filter-widget"
          isSelected={selectedElement === 'shopping-filter-widget'}
          onClick={() => onSelectElement('shopping-filter-widget')}
          className="sticky top-0 z-10 border-b"
          style={{
            ...computedFilterStyle,
            borderRadius: 0,
            padding: '12px',
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.foreground }}>
              <ShoppingCart size={18} style={{ color: colors.warning }} />
              Shopping
            </h1>
            <div className="text-right text-xs">
              <p style={{ color: colors.mutedForeground }}>
                Needs: <span className="font-semibold" style={{ color: colors.success }}>$0.00</span>
              </p>
              <p style={{ color: colors.mutedForeground }}>
                Total: <span className="font-semibold" style={{ color: colors.warning }}>$0.00</span>
              </p>
            </div>
          </div>

          {/* Tabs - matches real page */}
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab, idx) => (
              <button
                key={tab.id}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap"
                style={{
                  backgroundColor: idx === 0 ? colors.primary : colors.muted,
                  color: idx === 0 ? colors.primaryForeground : colors.mutedForeground,
                }}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </ClickableElement>

        {/* Shopping List Content */}
        <div className="p-3 space-y-3">
          {/* Add Item to List Button - matches real page */}
          <ClickableElement
            element="button-primary"
            isSelected={selectedElement === 'button-primary'}
            onClick={() => onSelectElement('button-primary')}
          >
            <button
              className="w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm"
              style={{
                borderColor: colors.border,
                color: colors.mutedForeground,
              }}
            >
              <Plus size={16} /> Add Item to List
            </button>
          </ClickableElement>

          {/* Store Card - Collapsed by default like real page */}
          <ClickableElement
            element="shopping-list-card"
            isSelected={selectedElement === 'shopping-list-card'}
            onClick={() => onSelectElement('shopping-list-card')}
            style={{
              ...computedListStyle,
              padding: 0,
            }}
          >
            <button
              className="w-full p-3 flex items-center gap-3"
              style={{ backgroundColor: 'transparent' }}
            >
              <Store size={16} style={{ color: colors.primary }} />
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm" style={{ color: colors.foreground }}>
                  Costco
                </p>
                <p className="text-xs" style={{ color: colors.mutedForeground }}>
                  1 items • $0.00
                </p>
              </div>
              <ChevronDown size={16} style={{ color: colors.mutedForeground }} />
            </button>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
