// apps/web/src/components/settings/AppearanceTab.tsx
import { Sun, Moon, Monitor } from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker';

type Theme = 'light' | 'dark' | 'system';

interface AppearanceTabProps {
  theme: Theme;
  accentColor: string;
  onThemeChange: (theme: Theme) => void;
  onAccentColorChange: (color: string) => void;
}

export function AppearanceTab({
  theme,
  accentColor,
  onThemeChange,
  onAccentColorChange,
}: AppearanceTabProps) {
  const themes: Array<{ id: Theme; label: string; icon: any }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${
                theme === t.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <t.icon
                size={24}
                className={theme === t.id ? 'text-emerald-600' : 'text-gray-500'}
              />
              <span
                className={`text-sm font-medium ${
                  theme === t.id ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <ColorPicker
        color={accentColor}
        onChange={onAccentColorChange}
        label="Accent Color"
      />

      {/* Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</p>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-xl text-white font-medium"
            style={{ backgroundColor: accentColor }}
          >
            Primary Button
          </button>
          <button
            className="px-4 py-2 rounded-xl border-2 font-medium"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}
