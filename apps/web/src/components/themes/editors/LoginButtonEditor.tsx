// apps/web/src/components/themes/editors/LoginButtonEditor.tsx
// Button tab for the Login Page Editor.
// Controls the Sign In button color (brand color) with a live preview.

import { ColorInput } from './LoginColorInput';
import { BrandingData, HABITRACK_GREEN } from './LoginBrandingTypes';

interface ButtonTabProps {
  branding: BrandingData;
  saveBranding: (updates: Partial<BrandingData>) => Promise<void>;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
  layout?: 'vertical' | 'horizontal';
}

export function ButtonTab({
  branding,
  saveBranding,
  showColorPicker,
  setShowColorPicker,
  layout = 'vertical',
}: ButtonTabProps) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="w-64">
          <ColorInput
            color={branding.brandColor || HABITRACK_GREEN}
            onChange={(color) => saveBranding({ brandColor: color })}
            showPicker={showColorPicker === 'brandColor'}
            onTogglePicker={() => setShowColorPicker(showColorPicker === 'brandColor' ? null : 'brandColor')}
            label="Sign In Button Color"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Color for the Sign In button on login page
          </p>
        </div>

        {/* Preview */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Preview
          </label>
          <button
            className="px-6 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: branding.brandColor || HABITRACK_GREEN }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      <ColorInput
        color={branding.brandColor || HABITRACK_GREEN}
        onChange={(color) => saveBranding({ brandColor: color })}
        showPicker={showColorPicker === 'brandColor'}
        onTogglePicker={() => setShowColorPicker(showColorPicker === 'brandColor' ? null : 'brandColor')}
        label="Sign In Button Color"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
        Color for the Sign In button on login page
      </p>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preview
        </label>
        <button
          className="px-8 py-3 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: branding.brandColor || HABITRACK_GREEN }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
