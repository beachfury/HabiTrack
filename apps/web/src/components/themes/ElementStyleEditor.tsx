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
  // Page-specific backgrounds
  'dashboard-background': 'Dashboard Background',
  'calendar-background': 'Calendar Background',
  'chores-background': 'Chores Background',
  'shopping-background': 'Shopping Background',
  'messages-background': 'Messages Background',
  'settings-background': 'Settings Background',
  'budget-background': 'Budget Background',
  'meals-background': 'Meals Background',
  'recipes-background': 'Recipes Background',
  // Dashboard page specific elements
  'dashboard-stats-widget': 'Stats Widget',
  'dashboard-chores-card': 'Chores Card',
  'dashboard-events-card': 'Events Card',
  'dashboard-weather-widget': 'Weather Widget',
  // Calendar page specific elements
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
const PAGE_ELEMENT_TO_GLOBAL: Partial<Record<ThemeableElement, ThemeableElement>> = {
  // Page-specific backgrounds fall back to global page-background
  'dashboard-background': 'page-background',
  'calendar-background': 'page-background',
  'chores-background': 'page-background',
  'shopping-background': 'page-background',
  'messages-background': 'page-background',
  'settings-background': 'page-background',
  'budget-background': 'page-background',
  'meals-background': 'page-background',
  'recipes-background': 'page-background',
  // Dashboard page elements
  'dashboard-stats-widget': 'widget',
  'dashboard-chores-card': 'card',
  'dashboard-events-card': 'card',
  'dashboard-weather-widget': 'widget',
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
}: ElementStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('background');
  const isPageSpecific = isPageSpecificElement(element);
  const globalElement = getGlobalElement(element);

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
          <AdvancedTab style={style} onChange={updateStyle} />
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
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
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
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
}) {
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
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
}) {
  const [showCustomFont, setShowCustomFont] = useState(false);
  const isCustomFont = style.fontFamily && !FONT_FAMILY_OPTIONS.some(opt => opt.value === style.fontFamily);

  // Check if any text overrides are set
  const hasOverrides = style.textColor || style.fontFamily || style.fontWeight || style.textSize;

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
            Inherit
          </button>
          <input
            type="range"
            min="10"
            max="32"
            value={style.textSize || 16}
            onChange={(e) => onChange({ textSize: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-8">{style.textSize || 16}px</span>
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
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
}) {
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
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
}) {
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
    </div>
  );
}

// Advanced/custom CSS tab
function AdvancedTab({
  style,
  onChange,
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
}) {
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
