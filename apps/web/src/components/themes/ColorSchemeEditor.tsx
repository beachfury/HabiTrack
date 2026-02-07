// apps/web/src/components/themes/ColorSchemeEditor.tsx
// Editor for theme color schemes

import { Sun, Moon } from 'lucide-react';
import type { ThemeColors } from '../../types/theme';
import { ColorPicker } from '../common/ColorPicker';

interface ColorSchemeEditorProps {
  colors: ThemeColors;
  onChange: (colors: ThemeColors) => void;
  colorMode: 'light' | 'dark';
  onColorModeChange: (mode: 'light' | 'dark') => void;
}

interface ColorGroup {
  title: string;
  colors: Array<{
    key: keyof ThemeColors;
    label: string;
    description?: string;
  }>;
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    title: 'Primary Colors',
    colors: [
      { key: 'primary', label: 'Primary', description: 'Main brand color for buttons and accents' },
      { key: 'primaryForeground', label: 'Primary Foreground', description: 'Text color on primary backgrounds' },
      { key: 'accent', label: 'Accent', description: 'Secondary accent color' },
      { key: 'accentForeground', label: 'Accent Foreground', description: 'Text on accent backgrounds' },
    ],
  },
  {
    title: 'Background Colors',
    colors: [
      { key: 'background', label: 'Background', description: 'Main page background' },
      { key: 'foreground', label: 'Foreground', description: 'Default text color' },
      { key: 'card', label: 'Card', description: 'Card and panel backgrounds' },
      { key: 'cardForeground', label: 'Card Foreground', description: 'Text on cards' },
    ],
  },
  {
    title: 'Secondary Colors',
    colors: [
      { key: 'secondary', label: 'Secondary', description: 'Secondary buttons and elements' },
      { key: 'secondaryForeground', label: 'Secondary Foreground', description: 'Text on secondary' },
      { key: 'muted', label: 'Muted', description: 'Subtle backgrounds' },
      { key: 'mutedForeground', label: 'Muted Foreground', description: 'Subtle text' },
    ],
  },
  {
    title: 'UI Colors',
    colors: [
      { key: 'border', label: 'Border', description: 'Borders and dividers' },
      { key: 'destructive', label: 'Destructive', description: 'Error and delete actions' },
      { key: 'destructiveForeground', label: 'Destructive Foreground', description: 'Text on destructive' },
    ],
  },
  {
    title: 'Status Colors',
    colors: [
      { key: 'success', label: 'Success', description: 'Success states' },
      { key: 'successForeground', label: 'Success Foreground', description: 'Text on success' },
      { key: 'warning', label: 'Warning', description: 'Warning states' },
      { key: 'warningForeground', label: 'Warning Foreground', description: 'Text on warning' },
    ],
  },
];

export function ColorSchemeEditor({
  colors,
  onChange,
  colorMode,
  onColorModeChange,
}: ColorSchemeEditorProps) {
  const updateColor = (key: keyof ThemeColors, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Editing Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onColorModeChange('light')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
              colorMode === 'light'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Sun size={18} />
            Light Mode
          </button>
          <button
            onClick={() => onColorModeChange('dark')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
              colorMode === 'dark'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Moon size={18} />
            Dark Mode
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Configure colors for {colorMode} mode. Switch modes to configure each separately.
        </p>
      </div>

      {/* Color groups */}
      {COLOR_GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {group.title}
          </h4>
          <div className="space-y-3">
            {group.colors.map((colorDef) => (
              <div key={colorDef.key} className="flex items-start gap-3">
                <div className="flex-1">
                  <ColorPicker
                    color={colors[colorDef.key]}
                    onChange={(value) => updateColor(colorDef.key, value)}
                    label={colorDef.label}
                  />
                  {colorDef.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {colorDef.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Quick preview swatches */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Color Preview
        </p>
        <div className="flex flex-wrap gap-2">
          {(['primary', 'secondary', 'accent', 'success', 'warning', 'destructive'] as const).map((key) => (
            <div
              key={key}
              className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center text-xs font-medium"
              style={{
                backgroundColor: colors[key],
                color: colors[`${key}Foreground` as keyof ThemeColors],
              }}
              title={key}
            >
              Aa
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
          <p style={{ color: colors.cardForeground }} className="text-sm font-medium">
            Card Preview
          </p>
          <p style={{ color: colors.mutedForeground }} className="text-xs mt-1">
            This is how text will look on cards
          </p>
        </div>
      </div>
    </div>
  );
}
