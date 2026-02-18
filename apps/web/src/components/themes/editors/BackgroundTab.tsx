// apps/web/src/components/themes/editors/BackgroundTab.tsx
// Background editing tab — solid color, gradient, image, or none

import { useState, useEffect } from 'react';
import type { ElementStyle } from '../../../types/theme';
import { ColorInput } from './ColorInput';
import { ImageUploadSection } from './ImageUploadSection';

export function BackgroundTab({
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
