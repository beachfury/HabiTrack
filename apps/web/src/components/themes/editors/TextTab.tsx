// apps/web/src/components/themes/editors/TextTab.tsx
// Text editing tab — for element-specific text overrides

import { useState } from 'react';
import type { ElementStyle } from '../../../types/theme';
import { ColorInput } from './ColorInput';

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

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

export function TextTab({
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
