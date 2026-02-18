// apps/web/src/components/themes/editors/BorderTab.tsx
// Border editing tab — border color, width, radius, and style

import type { ElementStyle } from '../../../types/theme';
import { ColorInput } from './ColorInput';

export function BorderTab({
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
