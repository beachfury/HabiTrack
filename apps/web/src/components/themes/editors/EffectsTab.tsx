// apps/web/src/components/themes/editors/EffectsTab.tsx
// Effects editing tab — shadow, blur, opacity, transforms, filters, glow, hover

import type { ElementStyle } from '../../../types/theme';
import { ColorInput } from './ColorInput';

const SHADOW_PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

export function EffectsTab({
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
