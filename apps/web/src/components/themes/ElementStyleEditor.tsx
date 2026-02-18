// apps/web/src/components/themes/ElementStyleEditor.tsx
// Editor panel for customizing individual theme elements

import { useState, useRef, useEffect } from 'react';
import { X, Paintbrush, Type, Square, Sparkles, Code, RotateCcw, Upload } from 'lucide-react';
import type { ElementStyle, ThemeableElement } from '../../types/theme';
import {
  DEFAULT_CARD_STYLE,
  DEFAULT_WIDGET_STYLE,
  DEFAULT_BUTTON_STYLE,
} from '../../types/theme';
import { ColorPickerModal } from '../common/ColorPickerModal';
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import { AdvancedCSSEffects } from './AdvancedCSSEffects';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // If it starts with /, it's a relative API path - prepend the API base
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  // Already an absolute URL
  return url;
}

// Reusable slider with number input for fine control
interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

function SliderWithInput({ label, value, min, max, step = 1, unit = '', onChange, className = '' }: SliderWithInputProps) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-emerald-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              onChange(Math.min(max, Math.max(min, val)));
            }
          }}
          className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
        />
        {unit && <span className="text-xs text-gray-500 w-6">{unit}</span>}
      </div>
    </div>
  );
}

// HabiTrack Classic default styles for each element type
// These do NOT include explicit background colors - colors come from the theme's
// colorsLight/colorsDark which are mode-aware. Only structural properties are set here.
const HABITRACK_DEFAULT_STYLES: Partial<Record<ThemeableElement, ElementStyle>> = {
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

const SHADOW_PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

// Available font families
// System fonts (always available, no import needed)
const SYSTEM_FONTS = [
  { value: '', label: 'Inherit from Theme', group: 'default' },
  { value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', label: 'System Default', group: 'system' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial', group: 'system' },
  { value: '"Segoe UI", Tahoma, Geneva, sans-serif', label: 'Segoe UI (Windows)', group: 'system' },
  { value: '-apple-system, BlinkMacSystemFont, sans-serif', label: 'San Francisco (Mac)', group: 'system' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana', group: 'system' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia', group: 'system' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman', group: 'system' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS', group: 'system' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New', group: 'monospace' },
  { value: 'Consolas, Monaco, monospace', label: 'Consolas', group: 'monospace' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans MS', group: 'fun' },
  { value: 'Impact, Haettenschweiler, sans-serif', label: 'Impact', group: 'fun' },
];

// Google Fonts (require import - marked with *)
const GOOGLE_FONTS = [
  { value: 'Inter, sans-serif', label: 'Inter *', group: 'google' },
  { value: 'Roboto, sans-serif', label: 'Roboto *', group: 'google' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans *', group: 'google' },
  { value: 'Lato, sans-serif', label: 'Lato *', group: 'google' },
  { value: 'Poppins, sans-serif', label: 'Poppins *', group: 'google' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat *', group: 'google' },
  { value: 'Orbitron, sans-serif', label: 'Orbitron (Sci-Fi) *', group: 'google' },
];

const FONT_FAMILY_OPTIONS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];

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

// Reusable color picker input that uses our custom ColorPickerModal
function ColorInput({
  value,
  onChange,
  placeholder = '#ffffff',
}: {
  value: string | undefined;
  onChange: (color: string) => void;
  placeholder?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowPicker(true)}
          className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0 transition-colors hover:border-emerald-400"
          style={{ backgroundColor: value || placeholder }}
          title="Click to choose color"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
        />
      </div>
      {showPicker && (
        <ColorPickerModal
          currentColor={value || placeholder}
          onSelect={onChange}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// Background editing tab
function BackgroundTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';
  // Determine current type from style
  const currentBgType = style.backgroundImage ? 'image' : style.backgroundGradient ? 'gradient' : style.backgroundColor ? 'solid' : 'none';
  const [bgType, setBgType] = useState<'solid' | 'gradient' | 'image' | 'none'>(currentBgType);

  // Sync bgType when style changes externally
  useEffect(() => {
    setBgType(currentBgType);
  }, [currentBgType]);

  // When user changes bgType, initialize the appropriate values
  const handleBgTypeChange = (type: 'solid' | 'gradient' | 'image' | 'none') => {
    setBgType(type);
    if (type === 'none') {
      onChange({ backgroundColor: undefined, backgroundGradient: undefined, backgroundImage: undefined });
    } else if (type === 'solid' && !style.backgroundColor) {
      // Initialize with a default color
      onChange({ backgroundColor: '#ffffff', backgroundGradient: undefined, backgroundImage: undefined });
    } else if (type === 'gradient' && !style.backgroundGradient) {
      // Initialize with default gradient
      onChange({
        backgroundGradient: { from: '#3cb371', to: '#ec4899', direction: 'to bottom' },
        backgroundColor: undefined,
        backgroundImage: undefined,
      });
    } else if (type === 'image') {
      // Clear other background types when switching to image
      onChange({ backgroundColor: undefined, backgroundGradient: undefined });
    }
  };

  // Horizontal layout renders controls side by side
  if (isHorizontal) {
    return (
      <div className="flex items-start gap-8">
        {/* Background type */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Type
          </label>
          <div className="flex gap-1">
            {(['none', 'solid', 'gradient', 'image'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleBgTypeChange(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors ${
                  bgType === type
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Solid color picker */}
        {bgType === 'solid' && (
          <div className="flex-1 min-w-[200px] max-w-[300px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Color
            </label>
            <ColorInput
              value={style.backgroundColor}
              onChange={(color) => onChange({ backgroundColor: color })}
              placeholder="#ffffff"
            />
          </div>
        )}

        {/* Gradient controls */}
        {bgType === 'gradient' && (
          <>
            <div className="flex-1 min-w-[180px] max-w-[280px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Start Color
              </label>
              <ColorInput
                value={style.backgroundGradient?.from}
                onChange={(color) =>
                  onChange({
                    backgroundGradient: {
                      from: color,
                      to: style.backgroundGradient?.to || '#ec4899',
                      direction: style.backgroundGradient?.direction,
                    },
                  })
                }
                placeholder="#3cb371"
              />
            </div>
            <div className="flex-1 min-w-[180px] max-w-[280px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                End Color
              </label>
              <ColorInput
                value={style.backgroundGradient?.to}
                onChange={(color) =>
                  onChange({
                    backgroundGradient: {
                      from: style.backgroundGradient?.from || '#3cb371',
                      to: color,
                      direction: style.backgroundGradient?.direction,
                    },
                  })
                }
                placeholder="#ec4899"
              />
            </div>
            <div className="flex-shrink-0 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Direction
              </label>
              <select
                value={style.backgroundGradient?.direction || 'to bottom'}
                onChange={(e) =>
                  onChange({
                    backgroundGradient: {
                      from: style.backgroundGradient?.from || '#3cb371',
                      to: style.backgroundGradient?.to || '#ec4899',
                      direction: e.target.value,
                    },
                  })
                }
                className="w-full px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="to bottom">↓ Down</option>
                <option value="to right">→ Right</option>
                <option value="to bottom right">↘ Diagonal</option>
                <option value="45deg">45°</option>
              </select>
            </div>
          </>
        )}

        {/* Image controls */}
        {bgType === 'image' && (
          <div className="flex-1 min-w-[250px] max-w-[400px]">
            <ImageUploadSection
              value={style.backgroundImage}
              onChange={(url) => onChange({ backgroundImage: url || undefined })}
            />
          </div>
        )}

        {/* Opacity */}
        <div className="flex-1 min-w-[150px] max-w-[250px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Opacity
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={(style.backgroundOpacity ?? 1) * 100}
              onChange={(e) => onChange({ backgroundOpacity: parseInt(e.target.value) / 100 })}
              className="flex-1 accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round((style.backgroundOpacity ?? 1) * 100)}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 100) onChange({ backgroundOpacity: val / 100 });
              }}
              className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (original)
  return (
    <div className="space-y-4">
      {/* Background type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Background Type
        </label>
        <div className="grid grid-cols-4 gap-1">
          {(['none', 'solid', 'gradient', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleBgTypeChange(type)}
              className={`px-2 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                bgType === type
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Solid color picker */}
      {bgType === 'solid' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Background Color
          </label>
          <ColorInput
            value={style.backgroundColor}
            onChange={(color) => onChange({ backgroundColor: color })}
            placeholder="#ffffff"
          />
        </div>
      )}

      {/* Gradient controls */}
      {bgType === 'gradient' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient Start
            </label>
            <ColorInput
              value={style.backgroundGradient?.from}
              onChange={(color) =>
                onChange({
                  backgroundGradient: {
                    from: color,
                    to: style.backgroundGradient?.to || '#ec4899',
                    direction: style.backgroundGradient?.direction,
                  },
                })
              }
              placeholder="#3cb371"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient End
            </label>
            <ColorInput
              value={style.backgroundGradient?.to}
              onChange={(color) =>
                onChange({
                  backgroundGradient: {
                    from: style.backgroundGradient?.from || '#3cb371',
                    to: color,
                    direction: style.backgroundGradient?.direction,
                  },
                })
              }
              placeholder="#ec4899"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Direction
            </label>
            <select
              value={style.backgroundGradient?.direction || 'to bottom'}
              onChange={(e) =>
                onChange({
                  backgroundGradient: {
                    from: style.backgroundGradient?.from || '#3cb371',
                    to: style.backgroundGradient?.to || '#ec4899',
                    direction: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="to bottom">Top to Bottom</option>
              <option value="to right">Left to Right</option>
              <option value="to bottom right">Diagonal (↘)</option>
              <option value="to bottom left">Diagonal (↙)</option>
              <option value="135deg">135°</option>
              <option value="45deg">45°</option>
            </select>
          </div>
        </>
      )}

      {/* Image controls */}
      {bgType === 'image' && (
        <ImageUploadSection
          value={style.backgroundImage}
          onChange={(url) => onChange({ backgroundImage: url || undefined })}
        />
      )}

      {/* Opacity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Opacity: {Math.round((style.backgroundOpacity ?? 1) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={(style.backgroundOpacity ?? 1) * 100}
          onChange={(e) => onChange({ backgroundOpacity: parseInt(e.target.value) / 100 })}
          className="w-full"
        />
      </div>
    </div>
  );
}

// Text editing tab - for element-specific text overrides
function TextTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const [showCustomFont, setShowCustomFont] = useState(false);
  const isCustomFont = style.fontFamily && !FONT_FAMILY_OPTIONS.some(opt => opt.value === style.fontFamily);
  const isHorizontal = layout === 'horizontal';

  // Check if any text overrides are set
  const hasOverrides = style.textColor || style.fontFamily || style.fontWeight || style.textSize;

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div className="flex items-start gap-8">
        {/* Text color */}
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Text Color
            </label>
            {style.textColor && (
              <button
                onClick={() => onChange({ textColor: undefined })}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Reset
              </button>
            )}
          </div>
          <ColorInput
            value={style.textColor}
            onChange={(color) => onChange({ textColor: color })}
            placeholder="Inherit"
          />
        </div>

        {/* Font family */}
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Font Family
          </label>
          <select
            value={isCustomFont ? '__custom__' : (style.fontFamily || '')}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__custom__') {
                setShowCustomFont(true);
                onChange({ fontFamily: '' });
              } else if (value === '') {
                onChange({ fontFamily: undefined });
                setShowCustomFont(false);
              } else {
                onChange({ fontFamily: value });
                setShowCustomFont(false);
              }
            }}
            className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Inherit from Theme</option>
            <optgroup label="System Fonts">
              {SYSTEM_FONTS.filter(o => o.group === 'system').map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
            <optgroup label="Monospace">
              {SYSTEM_FONTS.filter(o => o.group === 'monospace').map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
            <optgroup label="Google Fonts">
              {GOOGLE_FONTS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
            <option value="__custom__">Custom...</option>
          </select>
        </div>

        {/* Font weight */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Font Weight
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => onChange({ fontWeight: undefined })}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${!style.fontWeight ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              Auto
            </button>
            {FONT_WEIGHT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ fontWeight: option.value as ElementStyle['fontWeight'] })}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${style.fontWeight === option.value ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text size */}
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Text Size
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ textSize: undefined })}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${!style.textSize ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              Auto
            </button>
            <input
              type="range"
              min="10"
              max="48"
              value={style.textSize || 16}
              onChange={(e) => onChange({ textSize: parseInt(e.target.value) })}
              className="flex-1 accent-emerald-500"
            />
            <input
              type="number"
              min="8"
              max="72"
              value={style.textSize || 16}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 8 && val <= 72) {
                  onChange({ textSize: val });
                }
              }}
              className="w-14 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
            />
            <span className="text-xs text-gray-500">px</span>
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (original)
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          These settings override the global typography (Type tab) for this element only.
          Leave as "Inherit" to use global settings.
        </p>
      </div>

      {/* Text color */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Text Color
          </label>
          {style.textColor && (
            <button
              onClick={() => onChange({ textColor: undefined })}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Reset to inherit
            </button>
          )}
        </div>
        <ColorInput
          value={style.textColor}
          onChange={(color) => onChange({ textColor: color })}
          placeholder="Inherit from theme"
        />
        {!style.textColor && (
          <p className="text-xs text-gray-400 mt-1">Currently inheriting from theme</p>
        )}
      </div>

      {/* Font family override */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Font Family Override
          </label>
          {style.fontFamily && (
            <button
              onClick={() => {
                onChange({ fontFamily: undefined });
                setShowCustomFont(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Reset to inherit
            </button>
          )}
        </div>
        <select
          value={isCustomFont ? '__custom__' : (style.fontFamily || '')}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '__custom__') {
              setShowCustomFont(true);
              onChange({ fontFamily: '' });
            } else if (value === '') {
              onChange({ fontFamily: undefined });
              setShowCustomFont(false);
            } else {
              onChange({ fontFamily: value });
              setShowCustomFont(false);
            }
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontFamily: style.fontFamily || 'inherit' }}
        >
          <option value="">Inherit from Theme</option>
          <optgroup label="System Fonts (Always Available)">
            {SYSTEM_FONTS.filter(o => o.group === 'system').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Monospace">
            {SYSTEM_FONTS.filter(o => o.group === 'monospace').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Fun/Display">
            {SYSTEM_FONTS.filter(o => o.group === 'fun').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Google Fonts (Require Import)">
            {GOOGLE_FONTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <option value="__custom__">Custom Font...</option>
        </select>

        {/* Custom font input */}
        {(isCustomFont || showCustomFont) && (
          <div className="mt-2">
            <input
              type="text"
              value={style.fontFamily || ''}
              onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
              placeholder="e.g., 'Comic Sans MS', cursive"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a CSS font-family value. Google Fonts must be imported separately.
            </p>
          </div>
        )}

        {!style.fontFamily && !showCustomFont && (
          <p className="text-xs text-gray-400 mt-1">Currently using theme's font family</p>
        )}
      </div>

      {/* Font preview */}
      {style.fontFamily && (
        <div
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
          style={{ fontFamily: style.fontFamily }}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </p>
        </div>
      )}

      {/* Font weight override */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Font Weight Override
          </label>
          {style.fontWeight && (
            <button
              onClick={() => onChange({ fontWeight: undefined })}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Reset to inherit
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => onChange({ fontWeight: undefined })}
            className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              !style.fontWeight
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Inherit
          </button>
          {FONT_WEIGHT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ fontWeight: option.value as ElementStyle['fontWeight'] })}
              className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                style.fontWeight === option.value
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text size override */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Text Size Override: {style.textSize ? `${style.textSize}px` : 'Inherit'}
          </label>
          {style.textSize && (
            <button
              onClick={() => onChange({ textSize: undefined })}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Reset to inherit
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ textSize: undefined })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !style.textSize
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Auto
          </button>
          <input
            type="range"
            min="10"
            max="48"
            value={style.textSize || 16}
            onChange={(e) => onChange({ textSize: parseInt(e.target.value) })}
            className="flex-1"
          />
          <input
            type="number"
            min="8"
            max="72"
            value={style.textSize || 16}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 8 && val <= 72) {
                onChange({ textSize: val });
              }
            }}
            className="w-14 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
          />
          <span className="text-xs text-gray-500">px</span>
        </div>
      </div>

      {/* Summary of overrides */}
      {hasOverrides && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This element has text overrides. Click "Reset to Default" below to clear all.
          </p>
        </div>
      )}
    </div>
  );
}

// Border editing tab
function BorderTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div className="flex items-start gap-8">
        {/* Border radius */}
        <div className="flex-1 min-w-[150px] max-w-[250px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Border Radius
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="50"
              value={style.borderRadius ?? 12}
              onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
              className="flex-1 accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={style.borderRadius ?? 12}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 0) onChange({ borderRadius: val });
              }}
              className="w-14 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
            />
            <span className="text-xs text-gray-500">px</span>
          </div>
        </div>

        {/* Border width */}
        <div className="flex-1 min-w-[120px] max-w-[200px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Border Width
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="10"
              value={style.borderWidth ?? 1}
              onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) })}
              className="flex-1 accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              max="20"
              value={style.borderWidth ?? 1}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 0) onChange({ borderWidth: val });
              }}
              className="w-14 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
            />
            <span className="text-xs text-gray-500">px</span>
          </div>
        </div>

        {/* Border color */}
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Border Color
          </label>
          <ColorInput
            value={style.borderColor}
            onChange={(color) => onChange({ borderColor: color })}
            placeholder="#e5e7eb"
          />
        </div>

        {/* Border style */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Border Style
          </label>
          <div className="flex gap-1">
            {(['solid', 'dashed', 'dotted', 'none'] as const).map((bs) => (
              <button
                key={bs}
                onClick={() => onChange({ borderStyle: bs })}
                className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors ${
                  (style.borderStyle || 'solid') === bs
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {bs}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (original)
  return (
    <div className="space-y-4">
      {/* Border radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Border Radius: {style.borderRadius ?? 'Default'}px
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={style.borderRadius ?? 12}
          onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Sharp</span>
          <span>Rounded</span>
          <span>Pill</span>
        </div>
      </div>

      {/* Border width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Border Width: {style.borderWidth ?? 1}px
        </label>
        <input
          type="range"
          min="0"
          max="5"
          value={style.borderWidth ?? 1}
          onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Border color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Border Color
        </label>
        <ColorInput
          value={style.borderColor}
          onChange={(color) => onChange({ borderColor: color })}
          placeholder="#e5e7eb"
        />
      </div>

      {/* Border style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Border Style
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['solid', 'dashed', 'dotted', 'none'] as const).map((bs) => (
            <button
              key={bs}
              onClick={() => onChange({ borderStyle: bs })}
              className={`px-2 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                (style.borderStyle || 'solid') === bs
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {bs}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Effects editing tab
function EffectsTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  // Horizontal layout - organized rows with good spacing
  if (isHorizontal) {
    return (
      <div className="space-y-8">
        {/* Row 1: Shadow, Blur, Opacity */}
        <div className="flex items-start gap-16">
          {/* Shadow preset */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Shadow
            </label>
            <div className="flex gap-1">
              {SHADOW_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onChange({ boxShadow: preset.value })}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                    (style.boxShadow || 'subtle') === preset.value
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blur */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Blur
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={style.blur ?? 0}
                onChange={(e) => onChange({ blur: parseInt(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="0"
                max="50"
                value={style.blur ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0) onChange({ blur: val });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>

          {/* Opacity */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Opacity
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={(style.opacity ?? 1) * 100}
                onChange={(e) => onChange({ opacity: parseInt(e.target.value) / 100 })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round((style.opacity ?? 1) * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) onChange({ opacity: val / 100 });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

        </div>

        {/* Row 2: Transforms - Scale, Rotate, Skew X, Skew Y */}
        <div className="flex items-start gap-12">
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Scale
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="150"
                value={(style.scale ?? 1) * 100}
                onChange={(e) => onChange({ scale: parseInt(e.target.value) / 100 })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="10"
                max="200"
                value={Math.round((style.scale ?? 1) * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 10) onChange({ scale: val / 100 });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Rotate
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-180"
                max="180"
                value={style.rotate ?? 0}
                onChange={(e) => onChange({ rotate: parseInt(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="-360"
                max="360"
                value={style.rotate ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onChange({ rotate: val });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">°</span>
            </div>
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Skew X
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-30"
                max="30"
                value={style.skewX ?? 0}
                onChange={(e) => onChange({ skewX: parseInt(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="-90"
                max="90"
                value={style.skewX ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onChange({ skewX: val });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">°</span>
            </div>
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Skew Y
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-30"
                max="30"
                value={style.skewY ?? 0}
                onChange={(e) => onChange({ skewY: parseInt(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="-90"
                max="90"
                value={style.skewY ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onChange({ skewY: val });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">°</span>
            </div>
          </div>
        </div>

        {/* Row 3: Filters and Hover Effects */}
        <div className="flex items-start gap-12">
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Saturate
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="200"
                value={style.saturation ?? 100}
                onChange={(e) => onChange({ saturation: parseInt(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="0"
                max="300"
                value={style.saturation ?? 100}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0) onChange({ saturation: val });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Grayscale
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={style.grayscale ?? 0}
                onChange={(e) => onChange({ grayscale: parseInt(e.target.value) })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={style.grayscale ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) onChange({ grayscale: val });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          {/* Hover Effects */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Hover Scale
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="100"
                max="120"
                value={(style.hoverScale ?? 1) * 100}
                onChange={(e) => onChange({ hoverScale: parseInt(e.target.value) / 100 })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="100"
                max="150"
                value={Math.round((style.hoverScale ?? 1) * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 100) onChange({ hoverScale: val / 100 });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Hover Opacity
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="100"
                value={(style.hoverOpacity ?? 1) * 100}
                onChange={(e) => onChange({ hoverOpacity: parseInt(e.target.value) / 100 })}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round((style.hoverOpacity ?? 1) * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) onChange({ hoverOpacity: val / 100 });
                }}
                className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* Row 4: Glow and Spacing */}
        <div className="flex items-start gap-12">
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Glow Color
            </label>
            <ColorInput
              value={style.glowColor}
              onChange={(color) => {
                // When setting a glow color, also set a default glow size if not already set
                if (color && !style.glowSize) {
                  onChange({ glowColor: color, glowSize: 15 });
                } else {
                  onChange({ glowColor: color });
                }
              }}
              placeholder="None"
            />
          </div>

          {/* Glow Size (only shown when glow color is set) */}
          {style.glowColor && (
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Glow Size
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={style.glowSize ?? 0}
                  onChange={(e) => onChange({ glowSize: parseInt(e.target.value) })}
                  className="flex-1 accent-emerald-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={style.glowSize ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0) onChange({ glowSize: val });
                  }}
                  className="w-12 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
          )}

          {/* Padding */}
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Padding
            </label>
            <input
              type="text"
              value={style.padding || ''}
              onChange={(e) => onChange({ padding: e.target.value || undefined })}
              placeholder="16px"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Margin */}
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Margin
            </label>
            <input
              type="text"
              value={style.margin || ''}
              onChange={(e) => onChange({ margin: e.target.value || undefined })}
              placeholder="0px"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (original)
  return (
    <div className="space-y-4">
      {/* Shadow preset */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Shadow
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange({ boxShadow: preset.value })}
              className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                (style.boxShadow || 'subtle') === preset.value
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop blur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Backdrop Blur: {style.blur ?? 0}px
        </label>
        <input
          type="range"
          min="0"
          max="20"
          value={style.blur ?? 0}
          onChange={(e) => onChange({ blur: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Opacity: {Math.round((style.opacity ?? 1) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={(style.opacity ?? 1) * 100}
          onChange={(e) => onChange({ opacity: parseInt(e.target.value) / 100 })}
          className="w-full"
        />
      </div>

      {/* Padding */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Padding
        </label>
        <input
          type="text"
          value={style.padding || ''}
          onChange={(e) => onChange({ padding: e.target.value || undefined })}
          placeholder="e.g., 16px or 8px 16px"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Margin */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Margin
        </label>
        <input
          type="text"
          value={style.margin || ''}
          onChange={(e) => onChange({ margin: e.target.value || undefined })}
          placeholder="e.g., 8px"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Transform section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transforms</h4>

        {/* Scale */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Scale: {((style.scale ?? 1) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="50"
            max="150"
            value={(style.scale ?? 1) * 100}
            onChange={(e) => onChange({ scale: parseInt(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        {/* Rotate */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rotate: {style.rotate ?? 0}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={style.rotate ?? 0}
            onChange={(e) => onChange({ rotate: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Skew X */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skew X: {style.skewX ?? 0}°
          </label>
          <input
            type="range"
            min="-30"
            max="30"
            value={style.skewX ?? 0}
            onChange={(e) => onChange({ skewX: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Skew Y */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skew Y: {style.skewY ?? 0}°
          </label>
          <input
            type="range"
            min="-30"
            max="30"
            value={style.skewY ?? 0}
            onChange={(e) => onChange({ skewY: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Filters section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filters</h4>

        {/* Saturation */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Saturation: {style.saturation ?? 100}%
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={style.saturation ?? 100}
            onChange={(e) => onChange({ saturation: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Grayscale */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grayscale: {style.grayscale ?? 0}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={style.grayscale ?? 0}
            onChange={(e) => onChange({ grayscale: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Glow section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Glow Effect</h4>

        {/* Glow Color */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Glow Color
          </label>
          <ColorInput
            value={style.glowColor}
            onChange={(color) => {
              // When setting a glow color, also set a default glow size if not already set
              if (color && !style.glowSize) {
                onChange({ glowColor: color, glowSize: 15 });
              } else {
                onChange({ glowColor: color });
              }
            }}
            placeholder="No glow"
          />
        </div>

        {/* Glow Size */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Glow Size: {style.glowSize ?? 0}px
          </label>
          <input
            type="range"
            min="0"
            max="30"
            value={style.glowSize ?? 0}
            onChange={(e) => onChange({ glowSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Hover effects section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hover Effects</h4>

        {/* Hover Scale */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hover Scale: {((style.hoverScale ?? 1) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="100"
            max="120"
            value={(style.hoverScale ?? 1) * 100}
            onChange={(e) => onChange({ hoverScale: parseInt(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        {/* Hover Opacity */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hover Opacity: {Math.round((style.hoverOpacity ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={(style.hoverOpacity ?? 1) * 100}
            onChange={(e) => onChange({ hoverOpacity: parseInt(e.target.value) / 100 })}
            className="w-full"
          />
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => onChange({
          scale: undefined,
          rotate: undefined,
          skewX: undefined,
          skewY: undefined,
          saturation: undefined,
          grayscale: undefined,
          glowColor: undefined,
          glowSize: undefined,
          hoverScale: undefined,
          hoverOpacity: undefined,
        })}
        className="w-full mt-4 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Reset All Effects
      </button>
    </div>
  );
}

// Advanced/custom CSS tab
function AdvancedTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  // Preset categories for the Advanced tab
  const PRESET_CATEGORIES = {
    matrix: {
      label: '🖥️ Matrix/Hacker',
      presets: [
        {
          name: 'Matrix Glow',
          css: 'text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 20px #00ff00; box-shadow: 0 0 10px rgba(0,255,0,0.3), inset 0 0 10px rgba(0,255,0,0.1);',
        },
        {
          name: 'Terminal Green',
          css: 'background: linear-gradient(180deg, rgba(0,20,0,0.95) 0%, rgba(0,40,0,0.9) 100%); border: 1px solid #00ff00; box-shadow: 0 0 15px rgba(0,255,0,0.4), inset 0 0 30px rgba(0,255,0,0.05);',
        },
        {
          name: 'Scanlines',
          css: 'background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px);',
        },
        {
          name: 'CRT Flicker',
          css: 'animation: crt-flicker 0.15s infinite; box-shadow: 0 0 20px rgba(0,255,0,0.5);',
        },
        {
          name: 'Hacker Border',
          css: 'border: 2px solid #00ff00; border-image: linear-gradient(45deg, #00ff00, #00aa00, #00ff00) 1; box-shadow: 0 0 10px #00ff00;',
        },
        {
          name: 'Digital Rain BG',
          css: 'background: linear-gradient(180deg, #000 0%, #001a00 50%, #000 100%); position: relative;',
        },
      ],
    },
    retro: {
      label: '📺 Retro/CRT',
      presets: [
        {
          name: 'CRT Curve',
          css: 'border-radius: 20px / 40px; box-shadow: inset 0 0 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,0,0.2);',
        },
        {
          name: 'VHS Glitch',
          css: 'text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; animation: vhs-glitch 0.5s infinite;',
        },
        {
          name: 'Phosphor Burn',
          css: 'background: radial-gradient(ellipse at center, rgba(0,50,0,0.8) 0%, rgba(0,20,0,0.95) 70%, rgba(0,0,0,1) 100%);',
        },
        {
          name: '80s Neon',
          css: 'border: 2px solid #ff00ff; box-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff, inset 0 0 15px rgba(255,0,255,0.1);',
        },
        {
          name: 'Synthwave',
          css: 'background: linear-gradient(180deg, #2b1055 0%, #7597de 50%, #ff6b6b 100%); border-bottom: 3px solid #ff00ff;',
        },
        {
          name: 'Amber CRT',
          css: 'background: #1a0f00; color: #ffb000; text-shadow: 0 0 5px #ffb000; box-shadow: inset 0 0 50px rgba(255,176,0,0.1);',
        },
      ],
    },
    effects: {
      label: '✨ Effects',
      presets: [
        {
          name: 'Glass Panel',
          css: 'backdrop-filter: blur(10px); background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);',
        },
        {
          name: 'Hologram',
          css: 'background: linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.1) 50%, rgba(0,255,255,0.1) 100%); border: 1px solid rgba(0,255,255,0.5); box-shadow: 0 0 20px rgba(0,255,255,0.3);',
        },
        {
          name: 'Pulse Glow',
          css: 'animation: pulse-glow 2s ease-in-out infinite; box-shadow: 0 0 20px currentColor;',
        },
        {
          name: 'Gradient Border',
          css: 'border: 2px solid transparent; background-clip: padding-box; background-image: linear-gradient(#000, #000), linear-gradient(45deg, #00ff00, #00ffff, #ff00ff); background-origin: border-box;',
        },
        {
          name: 'Soft Shadow',
          css: 'box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);',
        },
        {
          name: 'Inner Glow',
          css: 'box-shadow: inset 0 0 30px rgba(0,255,0,0.2), inset 0 0 60px rgba(0,255,0,0.1);',
        },
      ],
    },
    shapes: {
      label: '🔷 Shapes',
      presets: [
        {
          name: 'LCARS Curve',
          css: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;',
        },
        {
          name: 'LCARS Clip',
          css: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);',
        },
        {
          name: 'Skew Left',
          css: 'transform: skewX(-3deg);',
        },
        {
          name: 'Skew Right',
          css: 'transform: skewX(3deg);',
        },
        {
          name: 'Hexagon',
          css: 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);',
        },
        {
          name: 'Notched',
          css: 'clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));',
        },
      ],
    },
    animations: {
      label: '🎬 Animations',
      presets: [
        {
          name: 'Breathing',
          css: 'animation: breathing 3s ease-in-out infinite;',
        },
        {
          name: 'Border Flow',
          css: 'animation: border-flow 3s linear infinite; border: 2px solid;',
        },
        {
          name: 'Shimmer',
          css: 'background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite;',
        },
        {
          name: 'Float',
          css: 'animation: float 3s ease-in-out infinite;',
        },
        {
          name: 'Rotate Slow',
          css: 'animation: rotate-slow 20s linear infinite;',
        },
        {
          name: 'Glitch',
          css: 'animation: glitch 0.3s infinite;',
        },
      ],
    },
  };

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PRESET_CATEGORIES>('matrix');

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div className="flex items-start gap-6">
        {/* Custom CSS */}
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Custom CSS Properties
          </label>
          <textarea
            value={style.customCSS || ''}
            onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
            placeholder="e.g., text-shadow: 0 0 10px #00ff00;&#10;animation: glow 2s infinite;&#10;transform: skewX(-3deg);"
            rows={5}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-y min-h-[80px] max-h-[300px]"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              Raw CSS for transforms, animations, clip-paths, etc.
            </p>
            {style.customCSS && (
              <button
                onClick={() => onChange({ customCSS: undefined })}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Preset categories */}
        <div className="flex-shrink-0 w-[420px]">
          {/* Category tabs */}
          <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
            {Object.entries(PRESET_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as keyof typeof PRESET_CATEGORIES)}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors ${
                  selectedCategory === key
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Presets grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {PRESET_CATEGORIES[selectedCategory].presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onChange({ customCSS: preset.css })}
                className="px-2 py-1.5 text-xs text-left bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors truncate"
                title={preset.css}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Append mode hint */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            💡 Tip: Copy current CSS, click preset, then paste back to combine effects
          </p>
        </div>
      </div>
    );
  }

  // Vertical layout (original)
  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Advanced:</strong> Custom CSS allows radical customizations like LCARS-style
          clip-paths, transforms, and animations.
        </p>
      </div>

      {/* Custom CSS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom CSS
        </label>
        <textarea
          value={style.customCSS || ''}
          onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
          placeholder={`Example:\nclip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);\ntransform: skewX(-5deg);`}
          rows={6}
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* LCARS presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Presets
        </label>
        <div className="space-y-2">
          <button
            onClick={() =>
              onChange({
                customCSS: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);',
              })
            }
            className="w-full px-3 py-2 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            LCARS Button Clip
          </button>
          <button
            onClick={() =>
              onChange({
                customCSS: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;',
              })
            }
            className="w-full px-3 py-2 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            LCARS Sidebar Curve
          </button>
          <button
            onClick={() =>
              onChange({
                customCSS: 'transform: skewX(-3deg);',
              })
            }
            className="w-full px-3 py-2 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Skewed Element
          </button>
        </div>
      </div>
    </div>
  );
}

// Image library asset type
interface LibraryAsset {
  id: string;
  url: string;
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
  assetType: string;
  category?: string | null;
  name?: string | null;
  createdAt: string;
  uploaderName?: string | null;
}

// Category type from API
interface CategoryInfo {
  id: string;
  label: string;
  description: string;
}

// Media Library Modal for browsing uploaded images
function MediaLibraryModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/uploads/categories', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data.predefinedCategories || []);
          const counts: Record<string, number> = {};
          (data.categories || []).forEach((c: { id: string; count: number }) => {
            counts[c.id] = c.count;
          });
          setCategoryCounts(counts);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load assets when category changes
  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }
        const response = await fetch(`/api/uploads/theme-library?${params}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load library');
        const data = await response.json();
        setAssets(data.assets || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load library');
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, [selectedCategory]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Build category tabs - show "All" + predefined categories that have images + uncategorized if any
  const categoryTabs = [
    { id: 'all', label: 'All', count: Object.values(categoryCounts).reduce((a, b) => a + b, 0) },
    ...categories
      .filter(c => categoryCounts[c.id] > 0)
      .map(c => ({ id: c.id, label: c.label, count: categoryCounts[c.id] || 0 })),
  ];

  // Add uncategorized if there are any
  if (categoryCounts['uncategorized'] > 0) {
    categoryTabs.push({ id: 'uncategorized', label: 'Uncategorized', count: categoryCounts['uncategorized'] });
  }

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Image Library"
      size="xl"
    >
      <ModalBody>
        {/* Category tabs */}
        {categoryTabs.length > 1 && (
          <div className="flex flex-wrap gap-1 pb-3 mb-4 border-b border-gray-200 dark:border-gray-700">
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
                {cat.count > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({cat.count})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No images in {selectedCategory === 'all' ? 'library' : `"${selectedCategory}" category`} yet.</p>
              <p className="text-sm">Upload an image to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset.url);
                    onClose();
                  }}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-colors focus:outline-none focus:border-emerald-500"
                >
                  <img
                    src={resolveImageUrl(asset.url)}
                    alt={asset.name || asset.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Category badge */}
                  {asset.category && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[9px] font-medium rounded">
                      {asset.category}
                    </span>
                  )}
                  {/* Hover overlay with info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                    {asset.name && (
                      <span className="text-white text-xs font-medium truncate max-w-full mb-1">
                        {asset.name}
                      </span>
                    )}
                    <span className="text-white text-xs truncate max-w-full">
                      {asset.width}×{asset.height}
                    </span>
                    <span className="text-white/70 text-xs">
                      {formatSize(asset.sizeBytes)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {assets.length} image{assets.length !== 1 ? 's' : ''} {selectedCategory !== 'all' && `in "${selectedCategory}"`}
          </p>
        </div>
      </ModalBody>
    </ModalPortal>
  );
}

// Predefined categories for upload
const UPLOAD_CATEGORIES = [
  { id: '', label: 'No Category' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'page-background', label: 'Page Background' },
  { id: 'card-background', label: 'Card Background' },
  { id: 'header', label: 'Header' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'modern', label: 'Modern' },
  { id: 'nature', label: 'Nature' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'fun', label: 'Fun' },
  { id: 'minimal', label: 'Minimal' },
];

// Image upload section for background images
function ImageUploadSection({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Use JPEG, PNG, WebP, or GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    // Store the file and show category/name form
    setPendingFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, '')); // Default name from filename
    setShowUploadForm(true);
    setError(null);
  };

  const handleFileUpload = async () => {
    if (!pendingFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', pendingFile);
      formData.append('preset', 'background');
      if (uploadCategory) {
        formData.append('category', uploadCategory);
      }
      if (uploadName) {
        formData.append('name', uploadName);
      }

      const response = await fetch('/api/uploads/theme-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.image.url);
      setShowUploadForm(false);
      setPendingFile(null);
      setUploadCategory('');
      setUploadName('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setShowUploadForm(false);
    setUploadCategory('');
    setUploadName('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Upload Form Modal */}
      {showUploadForm && pendingFile && (
        <ModalPortal
          isOpen={true}
          onClose={cancelUpload}
          title="Upload Image"
          size="md"
          footer={
            <div className="flex gap-2">
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          }
        >
          <ModalBody>
            {/* Preview */}
            <div className="mb-4">
              <img
                src={URL.createObjectURL(pendingFile)}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Name input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Enter a descriptive name"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Category select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {UPLOAD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Categories help organize images in the library
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </ModalBody>
        </ModalPortal>
      )}

      {/* Action buttons row */}
      <div className="flex gap-2">
        {/* Upload button */}
        <button
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-colors ${
            uploading
              ? 'border-gray-300 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
              <span className="text-xs text-gray-500">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={16} className="text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Upload New</span>
            </>
          )}
        </button>

        {/* Browse Library button */}
        <button
          onClick={() => setShowLibrary(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-600 dark:text-gray-400">Browse Library</span>
        </button>
      </div>

      {/* URL input */}
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Or enter URL
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Preview */}
      {value && (
        <div className="relative">
          <img
            src={resolveImageUrl(value)}
            alt="Background"
            className="w-full h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && !showUploadForm && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Media Library Modal */}
      {showLibrary && (
        <MediaLibraryModal
          onSelect={(url) => onChange(url)}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
