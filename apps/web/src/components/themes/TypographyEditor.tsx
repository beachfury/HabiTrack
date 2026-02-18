// apps/web/src/components/themes/TypographyEditor.tsx
// Editor for theme typography settings - matches per-element text editor style

import { useState } from 'react';
import type { ThemeTypography, LineHeight, FontWeight } from '../../types/theme';

interface TypographyEditorProps {
  typography: ThemeTypography;
  onChange: (typography: ThemeTypography) => void;
}

// System fonts (always available, no import needed)
const SYSTEM_FONTS = [
  { value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', label: 'System Default', group: 'system' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial', group: 'system' },
  { value: '"Segoe UI", Tahoma, Geneva, sans-serif', label: 'Segoe UI (Windows)', group: 'system' },
  { value: '-apple-system, BlinkMacSystemFont, sans-serif', label: 'San Francisco (Mac)', group: 'system' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana', group: 'system' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia', group: 'serif' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman', group: 'serif' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS', group: 'system' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New', group: 'monospace' },
  { value: 'Consolas, Monaco, monospace', label: 'Consolas', group: 'monospace' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans MS', group: 'fun' },
  { value: 'Impact, Haettenschweiler, sans-serif', label: 'Impact', group: 'fun' },
];

// Google Fonts (require import)
const GOOGLE_FONTS = [
  { value: 'Inter, sans-serif', label: 'Inter *', group: 'google' },
  { value: 'Roboto, sans-serif', label: 'Roboto *', group: 'google' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans *', group: 'google' },
  { value: 'Lato, sans-serif', label: 'Lato *', group: 'google' },
  { value: 'Poppins, sans-serif', label: 'Poppins *', group: 'google' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat *', group: 'google' },
  { value: 'Nunito, sans-serif', label: 'Nunito *', group: 'google' },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro *', group: 'google' },
  { value: 'Raleway, sans-serif', label: 'Raleway *', group: 'google' },
  { value: 'Quicksand, sans-serif', label: 'Quicksand *', group: 'google' },
  { value: '"Comic Neue", cursive', label: 'Comic Neue (Fun) *', group: 'google' },
  { value: '"Playfair Display", serif', label: 'Playfair Display *', group: 'google-serif' },
  { value: 'Merriweather, serif', label: 'Merriweather *', group: 'google-serif' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono *', group: 'google-mono' },
  { value: 'Orbitron, sans-serif', label: 'Orbitron (Sci-Fi) *', group: 'google' },
];

const ALL_FONTS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];

const FONT_SIZES = [
  { value: 14, label: 'Small', description: 'Compact, more content visible' },
  { value: 16, label: 'Medium', description: 'Standard comfortable size' },
  { value: 18, label: 'Large', description: 'Easier to read, less content' },
];

const FONT_WEIGHT_OPTIONS: Array<{ value: FontWeight; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

const LINE_HEIGHT_OPTIONS: Array<{ id: LineHeight; label: string; description: string; value: string }> = [
  { id: 'compact', label: 'Compact', description: 'Tighter spacing', value: '1.4' },
  { id: 'normal', label: 'Normal', description: 'Balanced spacing', value: '1.5' },
  { id: 'relaxed', label: 'Relaxed', description: 'More breathing room', value: '1.75' },
];

export function TypographyEditor({ typography, onChange }: TypographyEditorProps) {
  const [showCustomFont, setShowCustomFont] = useState(false);
  const [showCustomHeadingFont, setShowCustomHeadingFont] = useState(false);

  const isCustomFont = typography.fontFamily && !ALL_FONTS.some(f => f.value === typography.fontFamily);
  const isCustomHeadingFont = typography.fontFamilyHeading && !ALL_FONTS.some(f => f.value === typography.fontFamilyHeading);

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          These are the <strong>global defaults</strong> for all text in the app.
          Individual elements can override these in the Elements tab.
        </p>
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Body Font Family
        </label>
        <select
          value={isCustomFont ? '__custom__' : typography.fontFamily}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '__custom__') {
              setShowCustomFont(true);
              onChange({ ...typography, fontFamily: '' });
            } else {
              setShowCustomFont(false);
              onChange({ ...typography, fontFamily: value });
            }
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontFamily: typography.fontFamily || 'inherit' }}
        >
          <optgroup label="System Fonts (Always Available)">
            {SYSTEM_FONTS.filter(f => f.group === 'system').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Serif Fonts">
            {SYSTEM_FONTS.filter(f => f.group === 'serif').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Monospace Fonts">
            {SYSTEM_FONTS.filter(f => f.group === 'monospace').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Fun/Display Fonts">
            {SYSTEM_FONTS.filter(f => f.group === 'fun').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Google Fonts (Require Import)">
            {GOOGLE_FONTS.filter(f => f.group === 'google').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Google Serif Fonts">
            {GOOGLE_FONTS.filter(f => f.group === 'google-serif').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Google Monospace Fonts">
            {GOOGLE_FONTS.filter(f => f.group === 'google-mono').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <option value="__custom__">Custom Font...</option>
        </select>

        {/* Custom font input */}
        {(isCustomFont || showCustomFont) && (
          <div className="mt-2">
            <input
              type="text"
              value={typography.fontFamily || ''}
              onChange={(e) => onChange({ ...typography, fontFamily: e.target.value })}
              placeholder="e.g., 'Comic Sans MS', cursive"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a CSS font-family value. Google Fonts must be imported separately.
            </p>
          </div>
        )}

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Main font for body text, labels, and UI elements
        </p>
      </div>

      {/* Font preview */}
      {typography.fontFamily && (
        <div
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
          style={{ fontFamily: typography.fontFamily }}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </p>
        </div>
      )}

      {/* Heading Font Family (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Heading Font (Optional)
        </label>
        <select
          value={isCustomHeadingFont ? '__custom__' : (typography.fontFamilyHeading || '')}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '__custom__') {
              setShowCustomHeadingFont(true);
              onChange({ ...typography, fontFamilyHeading: '' });
            } else if (value === '') {
              setShowCustomHeadingFont(false);
              onChange({ ...typography, fontFamilyHeading: undefined });
            } else {
              setShowCustomHeadingFont(false);
              onChange({ ...typography, fontFamilyHeading: value });
            }
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontFamily: typography.fontFamilyHeading || typography.fontFamily || 'inherit' }}
        >
          <option value="">Same as body font</option>
          <optgroup label="System Fonts (Always Available)">
            {SYSTEM_FONTS.filter(f => f.group === 'system').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Serif Fonts">
            {SYSTEM_FONTS.filter(f => f.group === 'serif').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Fun/Display Fonts">
            {SYSTEM_FONTS.filter(f => f.group === 'fun').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Google Fonts (Require Import)">
            {GOOGLE_FONTS.filter(f => f.group === 'google').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <optgroup label="Google Serif Fonts">
            {GOOGLE_FONTS.filter(f => f.group === 'google-serif').map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </optgroup>
          <option value="__custom__">Custom Font...</option>
        </select>

        {/* Custom heading font input */}
        {(isCustomHeadingFont || showCustomHeadingFont) && (
          <div className="mt-2">
            <input
              type="text"
              value={typography.fontFamilyHeading || ''}
              onChange={(e) => onChange({ ...typography, fontFamilyHeading: e.target.value || undefined })}
              placeholder="e.g., 'Impact', sans-serif"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
        )}

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Different font for page titles and section headers
        </p>
      </div>

      {/* Base Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Base Font Size: {typography.baseFontSize}px
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => onChange({ ...typography, baseFontSize: size.value })}
              className={`p-2 rounded-lg text-center transition-colors ${
                typography.baseFontSize === size.value
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <p className="text-xs font-medium">{size.label}</p>
              <p className="text-xs opacity-75">{size.value}px</p>
            </button>
          ))}
        </div>
      </div>

      {/* Default Font Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Default Body Weight
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {FONT_WEIGHT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ ...typography, fontWeight: option.value })}
              className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                (typography.fontWeight || 'normal') === option.value
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={{ fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 }[option.value] }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Line Height
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {LINE_HEIGHT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange({ ...typography, lineHeight: option.id })}
              className={`p-2 rounded-lg text-center transition-colors ${
                typography.lineHeight === option.id
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <p className="text-xs font-medium">{option.label}</p>
              <p className="text-xs opacity-75">{option.value}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Combined Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Typography Preview
        </p>
        <div
          style={{
            fontFamily: typography.fontFamily,
            fontSize: `${typography.baseFontSize}px`,
            lineHeight: LINE_HEIGHT_OPTIONS.find((o) => o.id === typography.lineHeight)?.value || '1.5',
            fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 }[typography.fontWeight || 'normal'],
          }}
        >
          <h3
            className="text-xl font-bold text-gray-900 dark:text-white mb-2"
            style={{
              fontFamily: typography.fontFamilyHeading || typography.fontFamily,
            }}
          >
            Welcome to HabiTrack
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            This is how your body text will appear throughout the application.
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Smaller text for captions and secondary information.
          </p>
        </div>
      </div>

      {/* Note about fonts */}
      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Note:</strong> Fonts marked with * require Google Fonts to be loaded.
          System fonts work offline and load fastest.
        </p>
      </div>
    </div>
  );
}
