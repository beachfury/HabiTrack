// apps/web/src/components/themes/ElementStyleEditor.tsx
// Editor panel for customizing individual theme elements

import { useState } from 'react';
import { X, Paintbrush, Type, Square, Sparkles, Code, RotateCcw } from 'lucide-react';
import type { ElementStyle, ThemeableElement } from '../../types/theme';
import {
  DEFAULT_CARD_STYLE,
  DEFAULT_WIDGET_STYLE,
  DEFAULT_BUTTON_STYLE,
} from '../../types/theme';
import { AdvancedCSSEffects } from './AdvancedCSSEffects';

// Sub-editor imports
import { BackgroundTab } from './editors/BackgroundTab';
import { TextTab } from './editors/TextTab';
import { BorderTab } from './editors/BorderTab';
import { EffectsTab } from './editors/EffectsTab';

// Helper to resolve image URLs - converts relative API paths to full URLs
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // If it starts with /, it's a relative API path - prepend the API base
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  // Already an absolute URL
  return url;
}

// HabiTrack Classic default styles for each element type
// These do NOT include explicit background colors - colors come from the theme's
// colorsLight/colorsDark which are mode-aware. Only structural properties are set here.
export const HABITRACK_DEFAULT_STYLES: Partial<Record<ThemeableElement, ElementStyle>> = {
  card: {
    ...DEFAULT_CARD_STYLE,
    // No backgroundColor - falls back to theme's colors.card (mode-aware)
  },
  widget: {
    ...DEFAULT_WIDGET_STYLE,
    // No backgroundColor - falls back to theme's colors.muted (mode-aware)
  },
  'button-primary': {
    ...DEFAULT_BUTTON_STYLE,
    // No backgroundColor/textColor - falls back to theme's colors.primary (mode-aware)
  },
  'button-secondary': {
    ...DEFAULT_BUTTON_STYLE,
    // No backgroundColor/textColor - falls back to theme's colors.secondary (mode-aware)
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: '8px 12px',
    // No backgroundColor/borderColor - falls back to theme colors (mode-aware)
  },
  modal: {
    borderRadius: 16,
    boxShadow: 'strong',
    padding: '24px',
    // No backgroundColor - falls back to theme's colors.card (mode-aware)
  },
  sidebar: {
    // No backgroundColor - falls back to theme colors (mode-aware)
  },
  header: {
    // No backgroundColor - falls back to theme colors (mode-aware)
  },
  'page-background': {
    // No backgroundColor - falls back to theme's colors.background (mode-aware)
  },
  // Calendar page elements use card/widget defaults
  'calendar-grid': {
    ...DEFAULT_CARD_STYLE,
    // No backgroundColor - falls back to theme's colors.card (mode-aware)
  },
  'calendar-meal-widget': {
    ...DEFAULT_WIDGET_STYLE,
    // No backgroundColor - falls back to theme's colors.muted (mode-aware)
  },
  'calendar-user-card': {
    ...DEFAULT_CARD_STYLE,
    // No backgroundColor - falls back to theme's colors.card (mode-aware)
  },
};

interface ElementStyleEditorProps {
  element: ThemeableElement;
  style: ElementStyle;
  onChange: (style: ElementStyle) => void;
  onClose: () => void;
  onApplyToAll?: () => void; // Apply style to all elements of same type (deprecated - use onApplyAsDefault)
  onApplyAsDefault?: (globalElement: ThemeableElement) => void; // Apply this page-specific style as the global default
  isReadOnly?: boolean; // For system themes
  layout?: 'vertical' | 'horizontal'; // Layout mode: vertical (right panel) or horizontal (bottom panel)
}

const ELEMENT_LABELS: Record<ThemeableElement, string> = {
  // Global elements
  'page-background': 'Page Background',
  sidebar: 'Sidebar',
  header: 'Header',
  card: 'Card',
  widget: 'Widget',
  'button-primary': 'Primary Button',
  'button-secondary': 'Secondary Button',
  modal: 'Modal',
  input: 'Input Field',
  'login-page': 'Login Page',
  kiosk: 'Kiosk Mode',
  // Page-specific backgrounds
  'home-background': 'Home Background',
  'calendar-background': 'Calendar Background',
  'chores-background': 'Chores Background',
  'shopping-background': 'Shopping Background',
  'messages-background': 'Messages Background',
  'settings-background': 'Settings Background',
  'budget-background': 'Budget Background',
  'meals-background': 'Meals Background',
  'recipes-background': 'Recipes Background',
  'paidchores-background': 'Paid Chores Background',
  'family-background': 'Family Background',
  // Home page specific elements
  'home-title': 'Page Title',
  'home-welcome-banner': 'Welcome Banner',
  'home-stats-widget': 'Stats Widget',
  'home-chores-card': 'Chores Card',
  'home-events-card': 'Events Card',
  'home-weather-widget': 'Weather Widget',
  'home-leaderboard-widget': 'Leaderboard Widget',
  'home-meals-widget': 'Meals Widget',
  // Calendar page specific elements
  'calendar-title': 'Page Title',
  'calendar-grid': 'Calendar Grid',
  'calendar-meal-widget': 'Meal Planner Widget',
  'calendar-user-card': 'User Schedule Card',
  // Chores page specific elements
  'chores-task-card': 'Task List Card',
  'chores-paid-card': 'Paid Chores Card',
  // Shopping page specific elements
  'shopping-filter-widget': 'Filter Widget',
  'shopping-list-card': 'Shopping List Card',
  // Messages page specific elements
  'messages-announcements-card': 'Announcements Card',
  'messages-chat-card': 'Chat Card',
  // Settings page specific elements
  'settings-nav-card': 'Navigation Card',
  'settings-content-card': 'Content Card',
};

// Mapping from page-specific elements to their global fallback type
// Note: Page elements are independent - no global fallbacks
const PAGE_ELEMENT_TO_GLOBAL: Partial<Record<ThemeableElement, ThemeableElement>> = {
  // Page-specific backgrounds (optional: could fall back to page-background for initial styling)
  // Home page elements - no fallback, each page is independent
  // 'home-title' - text element, no fallback
  // 'home-stats-widget' - independent
  // etc.
  // Calendar page elements
  'calendar-grid': 'card',
  'calendar-meal-widget': 'widget',
  'calendar-user-card': 'card',
  // Chores page elements
  'chores-task-card': 'card',
  'chores-paid-card': 'card',
  // Shopping page elements
  'shopping-filter-widget': 'widget',
  'shopping-list-card': 'card',
  // Messages page elements
  'messages-announcements-card': 'card',
  'messages-chat-card': 'card',
  // Settings page elements
  'settings-nav-card': 'card',
  'settings-content-card': 'card',
};

// Check if element is page-specific
const isPageSpecificElement = (element: ThemeableElement): boolean => {
  return element in PAGE_ELEMENT_TO_GLOBAL;
};

// Get the global fallback element type
const getGlobalElement = (element: ThemeableElement): ThemeableElement => {
  return PAGE_ELEMENT_TO_GLOBAL[element] || element;
};

type EditorTab = 'background' | 'text' | 'border' | 'effects' | 'advanced';

export function ElementStyleEditor({
  element,
  style,
  onChange,
  onClose,
  onApplyToAll,
  onApplyAsDefault,
  isReadOnly = false,
  layout = 'vertical',
}: ElementStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('background');
  const isPageSpecific = isPageSpecificElement(element);
  const globalElement = getGlobalElement(element);
  const isHorizontal = layout === 'horizontal';

  const updateStyle = (updates: Partial<ElementStyle>) => {
    if (isReadOnly) return;
    onChange({ ...style, ...updates });
  };

  const resetStyle = () => {
    if (isReadOnly) return;
    // Reset by clearing ALL custom styles for this element
    // This makes the element fall back to the theme's base colors (colorsLight/colorsDark)
    // which are mode-aware and will show correctly in both light and dark modes

    // Get only structural defaults (border radius, shadow, etc.) - no colors
    const defaultStyle = HABITRACK_DEFAULT_STYLES[element] || HABITRACK_DEFAULT_STYLES[globalElement] || {};

    // Create a clean style object with only structural properties (no colors)
    const resetStyleObj: ElementStyle = {
      ...defaultStyle,
    };

    // Ensure NO color properties are in the object - they should fall back to theme colors
    delete (resetStyleObj as any).backgroundColor;
    delete (resetStyleObj as any).textColor;
    delete (resetStyleObj as any).borderColor;
    delete (resetStyleObj as any).backgroundGradient;
    delete (resetStyleObj as any).backgroundImage;
    delete (resetStyleObj as any).fontFamily;
    delete (resetStyleObj as any).fontWeight;
    delete (resetStyleObj as any).textSize;

    onChange(resetStyleObj);
  };

  const tabs: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'background', label: 'Background', icon: Paintbrush },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'border', label: 'Border', icon: Square },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  // Horizontal layout (bottom panel)
  if (isHorizontal) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* Top bar - Element name, horizontal tabs, and close button */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {/* Element name */}
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
              {ELEMENT_LABELS[element]}
            </h3>
            {isReadOnly && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
                View only
              </span>
            )}
          </div>

          {/* Horizontal tabs */}
          <div className="flex items-center gap-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isReadOnly && (
              <button
                onClick={resetStyle}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reset to default"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-4">
          {activeTab === 'background' && (
            <BackgroundTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'text' && (
            <TextTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'border' && (
            <BorderTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'effects' && (
            <EffectsTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'advanced' && (
            <AdvancedCSSEffects style={style} onChange={updateStyle} layout="horizontal" />
          )}
        </div>
      </div>
    );
  }

  // Vertical layout (right panel) - original
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {ELEMENT_LABELS[element]}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isReadOnly
              ? 'View only (system theme)'
              : isPageSpecific
                ? `Calendar page only • Based on ${ELEMENT_LABELS[globalElement]}`
                : "Customize this element's appearance"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      {/* Read-only warning */}
      {isReadOnly && (
        <div className="mx-4 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg">
          HabiTrack Classic cannot be modified. Create a copy to customize.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'background' && (
          <BackgroundTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'text' && (
          <TextTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'border' && (
          <BorderTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'effects' && (
          <EffectsTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedCSSEffects style={style} onChange={updateStyle} />
        )}
      </div>

      {/* Footer actions */}
      {!isReadOnly && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={resetStyle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={14} />
            Reset to Default
          </button>
          {/* For page-specific elements, offer to make it the global default */}
          {isPageSpecific && onApplyAsDefault && (
            <button
              onClick={() => onApplyAsDefault(globalElement)}
              className="w-full px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              Make Default for All {ELEMENT_LABELS[globalElement]}s
            </button>
          )}
          {/* Legacy onApplyToAll for non-page-specific elements */}
          {!isPageSpecific && onApplyToAll && (
            <button
              onClick={onApplyToAll}
              className="w-full px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              Apply to All {ELEMENT_LABELS[element]}s
            </button>
          )}
        </div>
      )}
    </div>
  );
}
