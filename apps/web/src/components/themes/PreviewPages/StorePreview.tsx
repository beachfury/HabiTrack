// apps/web/src/components/themes/PreviewPages/StorePreview.tsx
// Store page preview replica for theme editor - mirrors actual StorePage

import { Store, Package, Palette, Search, CloudSun, Trophy, Send } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface StorePreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Tab configuration - matches real StorePage
const TABS = [
  { id: 'widgets', label: 'Widgets', icon: Package },
  { id: 'themes', label: 'Themes', icon: Palette },
];

// Mock catalog items - matches real StorePage card layout
const MOCK_ITEMS = [
  { name: 'Weather Widget', desc: 'Local weather forecast', icon: CloudSun, category: 'Dashboard', tags: ['weather', 'forecast'], builtIn: true },
  { name: 'Leaderboard', desc: 'Family chore rankings', icon: Trophy, category: 'Dashboard', tags: ['gamification', 'chores'], builtIn: true },
  { name: 'Ocean Theme', desc: 'Calm blue ocean vibes', icon: Palette, category: 'Theme', tags: ['blue', 'calm'], builtIn: false },
];

export function StorePreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: StorePreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="store-background"
      isSelected={selectedElement === 'store-background'}
      onClick={() => onSelectElement('store-background')}
      className="themed-store-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Header - Standard pattern */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={20} style={{ color: colors.primary }} />
            <div>
              <h1 className="text-lg font-bold">Store</h1>
              <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                Browse widgets and themes
              </p>
            </div>
          </div>
          <ClickableElement
            element="button-secondary"
            isSelected={selectedElement === 'button-secondary'}
            onClick={() => onSelectElement('button-secondary')}
          >
            <button className="themed-btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs font-medium">
              <Send size={14} />
              Request
            </button>
          </ClickableElement>
        </div>

        {/* Tabs - Standard underline pattern */}
        <div className="flex gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
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

        {/* Search bar */}
        <ClickableElement
          element="input"
          isSelected={selectedElement === 'input'}
          onClick={() => onSelectElement('input')}
        >
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search widgets..."
              className="themed-input w-full pl-8 pr-3 py-1.5 text-xs"
              readOnly
            />
          </div>
        </ClickableElement>

        {/* Catalog Grid */}
        <div className="grid grid-cols-2 gap-3">
          {MOCK_ITEMS.map((item) => (
            <ClickableElement
              key={item.name}
              element="card"
              isSelected={selectedElement === 'card'}
              onClick={() => onSelectElement('card')}
              className="themed-card p-3 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <item.icon size={14} style={{ color: colors.primary }} />
                </div>
                {item.builtIn && (
                  <span
                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${colors.success}15`, color: colors.success }}
                  >
                    Built-in
                  </span>
                )}
              </div>
              <h3 className="text-xs font-semibold mb-0.5">{item.name}</h3>
              <p className="text-[10px] mb-2" style={{ color: 'var(--color-muted-foreground)' }}>
                {item.desc}
              </p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: colors.muted, color: 'var(--color-muted-foreground)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </ClickableElement>
          ))}
        </div>
      </div>
    </ClickableElement>
  );
}
