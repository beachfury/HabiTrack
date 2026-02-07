// apps/web/src/components/themes/BackgroundEditor.tsx
// Editor for page background settings

import { Square, Layers, Image, Grid3X3 } from 'lucide-react';
import type { ThemePageBackground, PageBackgroundType, PatternType } from '../../types/theme';
import { ColorPicker } from '../common/ColorPicker';
import { ImageUploader } from '../common/ImageUploader';

interface BackgroundEditorProps {
  background: ThemePageBackground;
  onChange: (background: ThemePageBackground) => void;
  themeId?: string;
}

const BACKGROUND_TYPES: Array<{ id: PageBackgroundType; label: string; icon: typeof Square }> = [
  { id: 'solid', label: 'Solid Color', icon: Square },
  { id: 'gradient', label: 'Gradient', icon: Layers },
  { id: 'pattern', label: 'Pattern', icon: Grid3X3 },
  { id: 'image', label: 'Image', icon: Image },
];

const PATTERN_OPTIONS: Array<{ id: PatternType; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'lines', label: 'Lines' },
];

const GRADIENT_PRESETS = [
  { from: '#667eea', to: '#764ba2', label: 'Purple Haze' },
  { from: '#f093fb', to: '#f5576c', label: 'Pink Sunset' },
  { from: '#4facfe', to: '#00f2fe', label: 'Ocean Blue' },
  { from: '#43e97b', to: '#38f9d7', label: 'Fresh Mint' },
  { from: '#fa709a', to: '#fee140', label: 'Warm Peach' },
  { from: '#a8edea', to: '#fed6e3', label: 'Soft Cotton' },
];

export function BackgroundEditor({ background, onChange, themeId }: BackgroundEditorProps) {
  return (
    <div className="space-y-6">
      {/* Background Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Background Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onChange({ ...background, type: type.id })}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                background.type === type.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <type.icon
                size={18}
                className={background.type === type.id ? 'text-purple-600' : 'text-gray-400'}
              />
              <span
                className={`text-sm font-medium ${
                  background.type === type.id
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color Options */}
      {background.type === 'solid' && (
        <div>
          <ColorPicker
            color={background.color || '#f9fafb'}
            onChange={(color) => onChange({ ...background, color })}
            label="Background Color"
          />
        </div>
      )}

      {/* Gradient Options */}
      {background.type === 'gradient' && (
        <div className="space-y-4">
          {/* Gradient presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preset Gradients
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() =>
                    onChange({
                      ...background,
                      gradientFrom: preset.from,
                      gradientTo: preset.to,
                    })
                  }
                  className={`h-12 rounded-lg border-2 transition-all ${
                    background.gradientFrom === preset.from && background.gradientTo === preset.to
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                  }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          {/* Custom colors */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              color={background.gradientFrom || '#667eea'}
              onChange={(color) => onChange({ ...background, gradientFrom: color })}
              label="From Color"
            />
            <ColorPicker
              color={background.gradientTo || '#764ba2'}
              onChange={(color) => onChange({ ...background, gradientTo: color })}
              label="To Color"
            />
          </div>

          {/* Gradient direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Direction
            </label>
            <select
              value={background.gradientDirection || '180deg'}
              onChange={(e) => onChange({ ...background, gradientDirection: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="0deg">Top to Bottom</option>
              <option value="180deg">Bottom to Top</option>
              <option value="90deg">Left to Right</option>
              <option value="270deg">Right to Left</option>
              <option value="135deg">Diagonal (Top-Left to Bottom-Right)</option>
              <option value="45deg">Diagonal (Bottom-Left to Top-Right)</option>
            </select>
          </div>
        </div>
      )}

      {/* Pattern Options */}
      {background.type === 'pattern' && (
        <div className="space-y-4">
          <ColorPicker
            color={background.color || '#f9fafb'}
            onChange={(color) => onChange({ ...background, color })}
            label="Base Color"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pattern Style
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PATTERN_OPTIONS.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => onChange({ ...background, pattern: pattern.id })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    background.pattern === pattern.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      background.pattern === pattern.id
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {pattern.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {background.pattern && background.pattern !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pattern Opacity: {background.patternOpacity || 10}%
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={background.patternOpacity || 10}
                onChange={(e) =>
                  onChange({ ...background, patternOpacity: parseInt(e.target.value) })
                }
                className="w-full accent-purple-600"
              />
            </div>
          )}
        </div>
      )}

      {/* Image Options */}
      {background.type === 'image' && (
        <div className="space-y-4">
          <ImageUploader
            preset="background"
            value={background.imageUrl || ''}
            onChange={(url) => onChange({ ...background, imageUrl: url || undefined })}
            themeId={themeId}
            label="Background Image"
            showPreview={true}
            previewAspectRatio={16 / 9}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Position
            </label>
            <select
              value={background.imagePosition || 'cover'}
              onChange={(e) =>
                onChange({
                  ...background,
                  imagePosition: e.target.value as 'cover' | 'contain' | 'tile',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="cover">Cover (fill screen)</option>
              <option value="contain">Contain (fit inside)</option>
              <option value="tile">Tile (repeat)</option>
            </select>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</p>
        <div
          className="h-32 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden"
          style={{
            background:
              background.type === 'solid'
                ? background.color || '#f9fafb'
                : background.type === 'gradient'
                ? `linear-gradient(${background.gradientDirection || '180deg'}, ${
                    background.gradientFrom || '#667eea'
                  }, ${background.gradientTo || '#764ba2'})`
                : background.type === 'image' && background.imageUrl
                ? `url(${background.imageUrl}) center/${background.imagePosition || 'cover'}`
                : background.color || '#f9fafb',
          }}
        >
          {background.type === 'pattern' && background.pattern && background.pattern !== 'none' && (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: background.color || '#f9fafb',
                backgroundImage:
                  background.pattern === 'dots'
                    ? `radial-gradient(circle, rgba(0,0,0,${(background.patternOpacity || 10) / 100}) 1px, transparent 1px)`
                    : background.pattern === 'grid'
                    ? `linear-gradient(rgba(0,0,0,${(background.patternOpacity || 10) / 100}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,${(background.patternOpacity || 10) / 100}) 1px, transparent 1px)`
                    : background.pattern === 'lines'
                    ? `repeating-linear-gradient(0deg, rgba(0,0,0,${(background.patternOpacity || 10) / 100}), rgba(0,0,0,${(background.patternOpacity || 10) / 100}) 1px, transparent 1px, transparent 20px)`
                    : 'none',
                backgroundSize:
                  background.pattern === 'dots'
                    ? '20px 20px'
                    : background.pattern === 'grid'
                    ? '20px 20px'
                    : '100% 20px',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
