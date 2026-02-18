// apps/web/src/components/themes/editors/LoginBackgroundEditor.tsx
// Background tab for the Login Page Editor.
// Handles gradient presets, solid color, and image background selection.

import { Upload, Trash2 } from 'lucide-react';
import { ColorInput } from './LoginColorInput';
import {
  BrandingData,
  HABITRACK_GREEN,
  GRADIENT_PRESETS,
  getAssetUrl,
} from './LoginBrandingTypes';

interface BackgroundTabProps {
  branding: BrandingData;
  gradientFrom: string;
  gradientTo: string;
  onBackgroundTypeChange: (type: 'gradient' | 'solid' | 'image') => void;
  onGradientChange: (from: string, to: string) => void;
  onSolidColorChange: (color: string) => void;
  onImageUpload: () => void;
  onImageRemove: () => void;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
  uploading: boolean;
  saving: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function BackgroundTab({
  branding,
  gradientFrom,
  gradientTo,
  onBackgroundTypeChange,
  onGradientChange,
  onSolidColorChange,
  onImageUpload,
  onImageRemove,
  showColorPicker,
  setShowColorPicker,
  uploading,
  saving,
  layout = 'vertical',
}: BackgroundTabProps) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        {/* Background type & gradient */}
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Background Type
          </h4>
          <div className="flex gap-2">
            {(['gradient', 'solid', 'image'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onBackgroundTypeChange(type)}
                disabled={saving}
                className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-colors capitalize ${
                  branding.loginBackground === type
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {branding.loginBackground === 'gradient' && (
            <>
              <div className="flex gap-2 flex-wrap">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onGradientChange(preset.from, preset.to)}
                    disabled={saving}
                    className="w-12 h-8 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                    style={{
                      background: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <ColorInput
                    color={gradientFrom}
                    onChange={(color) => onGradientChange(color, gradientTo)}
                    showPicker={showColorPicker === 'gradientFrom'}
                    onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientFrom' ? null : 'gradientFrom')}
                    label="Start Color"
                  />
                </div>
                <div className="flex-1">
                  <ColorInput
                    color={gradientTo}
                    onChange={(color) => onGradientChange(gradientFrom, color)}
                    showPicker={showColorPicker === 'gradientTo'}
                    onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientTo' ? null : 'gradientTo')}
                    label="End Color"
                  />
                </div>
              </div>
            </>
          )}

          {branding.loginBackground === 'solid' && (
            <ColorInput
              color={branding.loginBackgroundValue || HABITRACK_GREEN}
              onChange={onSolidColorChange}
              showPicker={showColorPicker === 'bgColor'}
              onTogglePicker={() => setShowColorPicker(showColorPicker === 'bgColor' ? null : 'bgColor')}
              label="Background Color"
            />
          )}
        </div>

        {/* Image upload (shown for image type or as option) */}
        {branding.loginBackground === 'image' && (
          <div className="w-64 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Background Image
            </h4>
            {branding.loginBackgroundValue ? (
              <div className="space-y-2">
                <div
                  className="h-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                  style={{ backgroundImage: `url(${getAssetUrl(branding.loginBackgroundValue)})` }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onImageUpload}
                    disabled={uploading || saving}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Upload size={12} />
                    Change
                  </button>
                  <button
                    onClick={onImageRemove}
                    disabled={saving}
                    className="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onImageUpload}
                disabled={uploading || saving}
                className="w-full h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
                ) : (
                  <>
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Upload image</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="w-48">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Preview
          </h4>
          <div
            className="h-24 rounded-lg border border-gray-200 dark:border-gray-600"
            style={{
              background: branding.loginBackground === 'image' && branding.loginBackgroundValue
                ? `url(${getAssetUrl(branding.loginBackgroundValue)}) center/cover`
                : branding.loginBackground === 'solid'
                ? branding.loginBackgroundValue || HABITRACK_GREEN
                : `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
            }}
          />
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Background Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['gradient', 'solid', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onBackgroundTypeChange(type)}
              disabled={saving}
              className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-colors capitalize ${
                branding.loginBackground === type
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {branding.loginBackground === 'gradient' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient Presets
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onGradientChange(preset.from, preset.to)}
                  disabled={saving}
                  className="h-10 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                  style={{
                    background: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          <ColorInput
            color={gradientFrom}
            onChange={(color) => onGradientChange(color, gradientTo)}
            showPicker={showColorPicker === 'gradientFrom'}
            onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientFrom' ? null : 'gradientFrom')}
            label="Start Color"
          />

          <ColorInput
            color={gradientTo}
            onChange={(color) => onGradientChange(gradientFrom, color)}
            showPicker={showColorPicker === 'gradientTo'}
            onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientTo' ? null : 'gradientTo')}
            label="End Color"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div
              className="h-16 rounded-lg border border-gray-200 dark:border-gray-600"
              style={{
                background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
              }}
            />
          </div>
        </>
      )}

      {branding.loginBackground === 'solid' && (
        <ColorInput
          color={branding.loginBackgroundValue || HABITRACK_GREEN}
          onChange={onSolidColorChange}
          showPicker={showColorPicker === 'bgColor'}
          onTogglePicker={() => setShowColorPicker(showColorPicker === 'bgColor' ? null : 'bgColor')}
          label="Background Color"
        />
      )}

      {branding.loginBackground === 'image' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Background Image
          </label>
          {branding.loginBackgroundValue ? (
            <div className="space-y-2">
              <div
                className="h-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                style={{ backgroundImage: `url(${getAssetUrl(branding.loginBackgroundValue)})` }}
              />
              <div className="flex gap-2">
                <button
                  onClick={onImageUpload}
                  disabled={uploading || saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Upload size={14} />
                  Change
                </button>
                <button
                  onClick={onImageRemove}
                  disabled={saving}
                  className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onImageUpload}
              disabled={uploading || saving}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
              ) : (
                <>
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click to upload image
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
