// apps/web/src/components/themes/PreviewPages/ShoppingPreview.tsx
// Shopping page preview replica for theme editor - mirrors actual ShoppingPage

import { Check, ShoppingCart, ListPlus, Package, Sparkles, History, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface ShoppingPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock shopping data matching real page
const MOCK_ITEMS_BY_STORE = {
  'Costco': [
    { id: 1, name: 'Milk', quantity: 2, category: 'Dairy', done: false, price: 5.99 },
    { id: 2, name: 'Eggs', quantity: 1, category: 'Dairy', done: true, price: 8.99 },
    { id: 3, name: 'Bread', quantity: 1, category: 'Bakery', done: false, price: 4.49 },
  ],
  'Safeway': [
    { id: 4, name: 'Apples', quantity: 6, category: 'Produce', done: false, price: 3.99 },
    { id: 5, name: 'Chicken breast', quantity: 2, category: 'Meat', done: false, price: 12.99 },
  ],
};

// Tab configuration - matches real page
const TABS = [
  { id: 'list', label: 'List', icon: ShoppingCart },
  { id: 'requests', label: 'Requests', icon: ListPlus },
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
  const cardStyle = theme.elementStyles?.card || {};
  const widgetStyle = theme.elementStyles?.widget || {};
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Build computed styles
  const computedCardStyle = buildElementStyle(cardStyle, colors.card, colors.border, defaultRadius, defaultShadow, colors.cardForeground);
  const computedWidgetStyle = buildElementStyle(widgetStyle, colors.muted, colors.border, defaultRadius, 'none', colors.foreground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.primary, colors.primaryForeground, 'transparent', '8px');

  // Page-specific background
  const shoppingBgStyle = theme.elementStyles?.['shopping-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};
  const { style: pageBgStyle, backgroundImageUrl } = buildPageBackgroundStyle(
    shoppingBgStyle,
    globalPageBgStyle,
    colors.background
  );

  return (
    <ClickableElement
      element="shopping-background"
      isSelected={selectedElement === 'shopping-background'}
      onClick={() => onSelectElement('shopping-background')}
      className="flex-1 overflow-auto"
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
        {/* Sticky Header - matches real page */}
        <ClickableElement
          element="shopping-filter-widget"
          isSelected={selectedElement === 'shopping-filter-widget'}
          onClick={() => onSelectElement('shopping-filter-widget')}
          className="sticky top-0 z-10 border-b"
          style={{
            ...computedCardStyle,
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
                Needs: <span className="font-semibold" style={{ color: colors.success }}>$24.45</span>
              </p>
              <p style={{ color: colors.mutedForeground }}>
                Total: <span className="font-semibold" style={{ color: colors.warning }}>$36.45</span>
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
        <div className="p-3">
          {/* Store sections */}
          {Object.entries(MOCK_ITEMS_BY_STORE).map(([storeName, items]) => (
            <ClickableElement
              key={storeName}
              element="shopping-list-card"
              isSelected={selectedElement === 'shopping-list-card'}
              onClick={() => onSelectElement('shopping-list-card')}
              className="mb-3"
              style={{
                ...computedCardStyle,
                padding: 0,
              }}
            >
              {/* Store header */}
              <div
                className="flex items-center justify-between px-3 py-2 border-b cursor-pointer"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown size={14} style={{ color: colors.mutedForeground }} />
                  <span className="text-sm font-semibold" style={{ color: colors.foreground }}>{storeName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: colors.muted, color: colors.mutedForeground }}>
                    {items.filter(i => !i.done).length}
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: colors.success }}>
                  ${items.reduce((sum, i) => sum + (i.done ? 0 : i.price), 0).toFixed(2)}
                </span>
              </div>

              {/* Items */}
              <div className="p-2 space-y-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: item.done ? `${colors.success}10` : 'transparent',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: item.done ? colors.success : colors.border,
                        backgroundColor: item.done ? colors.success : 'transparent',
                      }}
                    >
                      {item.done && <Check size={12} style={{ color: colors.successForeground }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${item.done ? 'line-through opacity-60' : ''}`}
                        style={{ color: colors.foreground }}
                      >
                        {item.name}
                      </p>
                      <p className="text-[10px]" style={{ color: colors.mutedForeground }}>
                        {item.category} • x{item.quantity}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: colors.mutedForeground }}>
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </ClickableElement>
          ))}

          {/* Add to List Button - matches real page FAB style */}
          <ClickableElement
            element="button-primary"
            isSelected={selectedElement === 'button-primary'}
            onClick={() => onSelectElement('button-primary')}
            className="fixed bottom-4 right-4"
          >
            <button
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium shadow-lg"
              style={{
                ...computedButtonPrimaryStyle,
                borderRadius: '9999px',
              }}
            >
              <ListPlus size={16} />
              Add to List
            </button>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
