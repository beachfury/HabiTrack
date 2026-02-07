// apps/web/src/components/themes/SidebarEditor.tsx
// Editor for sidebar/navigation background settings

import { Square, Layers, Image } from 'lucide-react';
import type { ThemeSidebar, BackgroundType } from '../../types/theme';
import { ColorPicker } from '../common/ColorPicker';
import { ImageUploader } from '../common/ImageUploader';

interface SidebarEditorProps {
  sidebar: ThemeSidebar;
  onChange: (sidebar: ThemeSidebar) => void;
  themeId?: string;
}

const BACKGROUND_TYPES: Array<{ id: BackgroundType; label: string; icon: typeof Square }> = [
  { id: 'solid', label: 'Solid Color', icon: Square },
  { id: 'gradient', label: 'Gradient', icon: Layers },
  { id: 'image', label: 'Image', icon: Image },
];

const SIDEBAR_GRADIENT_PRESETS = [
  { from: '#1e3a5f', to: '#2d5a87', label: 'Deep Ocean' },
  { from: '#2d1b4e', to: '#4a2c7a', label: 'Royal Purple' },
  { from: '#1a1a2e', to: '#16213e', label: 'Dark Space' },
  { from: '#0f3443', to: '#34e89e', label: 'Emerald Night' },
  { from: '#232526', to: '#414345', label: 'Slate Gray' },
  { from: '#200122', to: '#6f0000', label: 'Dark Cherry' },
];

export function SidebarEditor({ sidebar, onChange, themeId }: SidebarEditorProps) {
  return (
    <div className="space-y-6">
      {/* Background Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Sidebar Background
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onChange({ ...sidebar, backgroundType: type.id })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                sidebar.backgroundType === type.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <type.icon
                size={20}
                className={sidebar.backgroundType === type.id ? 'text-purple-600' : 'text-gray-400'}
              />
              <span
                className={`text-xs font-medium ${
                  sidebar.backgroundType === type.id
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color Options */}
      {sidebar.backgroundType === 'solid' && (
        <ColorPicker
          color={sidebar.backgroundColor || '#1f2937'}
          onChange={(color) => onChange({ ...sidebar, backgroundColor: color })}
          label="Background Color"
        />
      )}

      {/* Gradient Options */}
      {sidebar.backgroundType === 'gradient' && (
        <div className="space-y-4">
          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preset Gradients
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SIDEBAR_GRADIENT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() =>
                    onChange({
                      ...sidebar,
                      gradientFrom: preset.from,
                      gradientTo: preset.to,
                    })
                  }
                  className={`h-12 rounded-lg border-2 transition-all ${
                    sidebar.gradientFrom === preset.from && sidebar.gradientTo === preset.to
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{
                    background: `linear-gradient(180deg, ${preset.from}, ${preset.to})`,
                  }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          {/* Custom gradient colors */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              color={sidebar.gradientFrom || '#1e3a5f'}
              onChange={(color) => onChange({ ...sidebar, gradientFrom: color })}
              label="Top Color"
            />
            <ColorPicker
              color={sidebar.gradientTo || '#2d5a87'}
              onChange={(color) => onChange({ ...sidebar, gradientTo: color })}
              label="Bottom Color"
            />
          </div>

          {/* Gradient direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient Direction
            </label>
            <select
              value={sidebar.gradientDirection || '180deg'}
              onChange={(e) => onChange({ ...sidebar, gradientDirection: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="180deg">Top to Bottom</option>
              <option value="0deg">Bottom to Top</option>
              <option value="135deg">Diagonal</option>
              <option value="90deg">Left to Right</option>
            </select>
          </div>
        </div>
      )}

      {/* Image Options */}
      {sidebar.backgroundType === 'image' && (
        <div className="space-y-4">
          <ImageUploader
            preset="sidebar"
            value={sidebar.imageUrl || ''}
            onChange={(url) => onChange({ ...sidebar, imageUrl: url || undefined })}
            themeId={themeId}
            label="Sidebar Background Image"
            showPreview={true}
            previewAspectRatio={0.5}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Opacity: {sidebar.imageOpacity || 30}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={sidebar.imageOpacity || 30}
              onChange={(e) => onChange({ ...sidebar, imageOpacity: parseInt(e.target.value) })}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Blur Effect: {sidebar.blur || 0}px
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={sidebar.blur || 0}
              onChange={(e) => onChange({ ...sidebar, blur: parseInt(e.target.value) })}
              className="w-full accent-purple-600"
            />
          </div>
        </div>
      )}

      {/* Text Colors */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sidebar Text Colors
        </h4>

        <ColorPicker
          color={sidebar.textColor || '#ffffff'}
          onChange={(color) => onChange({ ...sidebar, textColor: color })}
          label="Text Color"
        />

        <ColorPicker
          color={sidebar.iconColor || sidebar.textColor || '#ffffff'}
          onChange={(color) => onChange({ ...sidebar, iconColor: color })}
          label="Icon Color"
        />
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</p>
        <div
          className="w-48 h-64 rounded-lg overflow-hidden relative"
          style={{
            background:
              sidebar.backgroundType === 'solid'
                ? sidebar.backgroundColor || '#1f2937'
                : sidebar.backgroundType === 'gradient'
                ? `linear-gradient(${sidebar.gradientDirection || '180deg'}, ${
                    sidebar.gradientFrom || '#1e3a5f'
                  }, ${sidebar.gradientTo || '#2d5a87'})`
                : '#1f2937',
          }}
        >
          {/* Image background layer */}
          {sidebar.backgroundType === 'image' && sidebar.imageUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${sidebar.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: (sidebar.imageOpacity || 30) / 100,
                filter: sidebar.blur ? `blur(${sidebar.blur}px)` : undefined,
              }}
            />
          )}

          {/* Content preview */}
          <div className="relative p-4 space-y-3">
            <div
              className="text-lg font-bold"
              style={{ color: sidebar.textColor || '#ffffff' }}
            >
              HabiTrack
            </div>
            <div className="space-y-2">
              {['Dashboard', 'Calendar', 'Chores', 'Shopping'].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm"
                  style={{ color: sidebar.textColor || '#ffffff' }}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: sidebar.iconColor || sidebar.textColor || '#ffffff',
                      opacity: 0.7,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
