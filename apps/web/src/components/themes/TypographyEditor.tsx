// apps/web/src/components/themes/TypographyEditor.tsx
// Editor for theme typography settings

import type { ThemeTypography, LineHeight } from '../../types/theme';

interface TypographyEditorProps {
  typography: ThemeTypography;
  onChange: (typography: ThemeTypography) => void;
}

const FONT_FAMILIES = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'System Default' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Open Sans', sans-serif", label: 'Open Sans' },
  { value: "'Lato', sans-serif", label: 'Lato' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Nunito', sans-serif", label: 'Nunito' },
  { value: "'Source Sans Pro', sans-serif", label: 'Source Sans Pro' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Raleway', sans-serif", label: 'Raleway' },
  { value: "'Quicksand', sans-serif", label: 'Quicksand' },
  { value: "'Comic Neue', cursive", label: 'Comic Neue (Fun)' },
  { value: "Georgia, serif", label: 'Georgia (Serif)' },
  { value: "'Playfair Display', serif", label: 'Playfair Display (Serif)' },
  { value: "'Merriweather', serif", label: 'Merriweather (Serif)' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono (Monospace)' },
];

const FONT_SIZES = [
  { value: 14, label: 'Small', description: 'Compact, more content visible' },
  { value: 16, label: 'Medium', description: 'Standard comfortable size' },
  { value: 18, label: 'Large', description: 'Easier to read, less content' },
];

const LINE_HEIGHT_OPTIONS: Array<{ id: LineHeight; label: string; description: string; value: string }> = [
  { id: 'compact', label: 'Compact', description: 'Tighter spacing', value: '1.4' },
  { id: 'normal', label: 'Normal', description: 'Balanced spacing', value: '1.5' },
  { id: 'relaxed', label: 'Relaxed', description: 'More breathing room', value: '1.75' },
];

export function TypographyEditor({ typography, onChange }: TypographyEditorProps) {
  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Font Family
        </label>
        <select
          value={typography.fontFamily}
          onChange={(e) => onChange({ ...typography, fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Main font for all text in the app
        </p>
      </div>

      {/* Heading Font Family (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Heading Font (Optional)
        </label>
        <select
          value={typography.fontFamilyHeading || ''}
          onChange={(e) =>
            onChange({
              ...typography,
              fontFamilyHeading: e.target.value || undefined,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Same as body font</option>
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Different font for headings (titles, section headers)
        </p>
      </div>

      {/* Base Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Base Font Size
        </label>
        <div className="space-y-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => onChange({ ...typography, baseFontSize: size.value })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                typography.baseFontSize === size.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`font-medium ${
                      typography.baseFontSize === size.value
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    style={{ fontSize: `${size.value}px` }}
                  >
                    {size.label} ({size.value}px)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {size.description}
                  </p>
                </div>
                <span
                  className="text-gray-400"
                  style={{ fontSize: `${size.value}px` }}
                >
                  Aa
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Line Height
        </label>
        <div className="flex gap-2">
          {LINE_HEIGHT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange({ ...typography, lineHeight: option.id })}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                typography.lineHeight === option.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  typography.lineHeight === option.id
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Typography Preview
        </p>
        <div
          style={{
            fontFamily: typography.fontFamily,
            fontSize: `${typography.baseFontSize}px`,
            lineHeight:
              LINE_HEIGHT_OPTIONS.find((o) => o.id === typography.lineHeight)?.value || '1.5',
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
            This is how your body text will appear throughout the application. The quick
            brown fox jumps over the lazy dog.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Smaller text for captions and secondary information.
          </p>
        </div>
      </div>

      {/* Note about fonts */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> Some fonts (Inter, Poppins, etc.) require Google Fonts to
          be loaded. System Default works offline and loads fastest.
        </p>
      </div>
    </div>
  );
}
