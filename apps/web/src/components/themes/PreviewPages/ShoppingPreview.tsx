// apps/web/src/components/themes/PreviewPages/ShoppingPreview.tsx
// Shopping page preview replica for theme editor - mirrors actual ShoppingPage

import { ShoppingCart, Package, Sparkles, History, Settings, ChevronDown, Plus, Store } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

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

  return (
    <ClickableElement
      element="shopping-background"
      isSelected={selectedElement === 'shopping-background'}
      onClick={() => onSelectElement('shopping-background')}
      className="themed-shopping-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Standard Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: colors.warning }} />
            <h1 className="text-lg font-bold">Shopping</h1>
          </div>
          <div className="text-right text-xs">
            <p style={{ color: 'var(--color-muted-foreground)' }}>
              Needs: <span className="font-semibold" style={{ color: colors.success }}>$0.00</span>
            </p>
            <p style={{ color: 'var(--color-muted-foreground)' }}>
              Total: <span className="font-semibold" style={{ color: colors.warning }}>$0.00</span>
            </p>
          </div>
        </div>

        {/* Tabs - inside themed-shopping-filter wrapper */}
        <ClickableElement
          element="shopping-filter-widget"
          isSelected={selectedElement === 'shopping-filter-widget'}
          onClick={() => onSelectElement('shopping-filter-widget')}
          className="themed-shopping-filter"
          style={{ padding: '0', borderRadius: 0 }}
        >
          <div className="flex gap-2 px-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium"
                style={{
                  color: i === 0 ? colors.primary : 'var(--color-muted-foreground)',
                  borderBottom: i === 0 ? `2px solid ${colors.primary}` : '2px solid transparent',
                }}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </ClickableElement>

        {/* Shopping List Content */}
        <div className="space-y-4">
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
            className="themed-shopping-list"
            style={{ padding: 0 }}
          >
            <button
              className="w-full p-3 flex items-center gap-3"
              style={{ backgroundColor: 'transparent' }}
            >
              <Store size={16} style={{ color: colors.primary }} />
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm">
                  Costco
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  1 items • $0.00
                </p>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
