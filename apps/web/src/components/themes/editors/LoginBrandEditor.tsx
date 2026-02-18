// apps/web/src/components/themes/editors/LoginBrandEditor.tsx
// Branding tab for the Login Page Editor.
// Handles household name input and logo upload/removal.

import { Upload, Trash2 } from 'lucide-react';
import { BrandingData, getAssetUrl } from './LoginBrandingTypes';

interface BrandingTabProps {
  branding: BrandingData;
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>;
  saveBranding: (updates: Partial<BrandingData>) => Promise<void>;
  onLogoUpload: () => void;
  onLogoRemove: () => void;
  uploading: boolean;
  saving: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function BrandingTab({
  branding,
  setBranding,
  saveBranding,
  onLogoUpload,
  onLogoRemove,
  uploading,
  saving,
  layout = 'vertical',
}: BrandingTabProps) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Household Name
          </label>
          <input
            type="text"
            value={branding.name || ''}
            onChange={(e) => setBranding(prev => ({ ...prev, name: e.target.value }))}
            onBlur={() => saveBranding({ name: branding.name })}
            placeholder="The Chambers Family"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Shown on the login page title
          </p>
        </div>

        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Logo
          </label>
          {branding.logoUrl ? (
            <div className="space-y-2">
              <div className="h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <img
                  src={getAssetUrl(branding.logoUrl)}
                  alt="Logo preview"
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onLogoUpload}
                  disabled={uploading || saving}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Upload size={12} />
                  Change
                </button>
                <button
                  onClick={onLogoRemove}
                  disabled={saving}
                  className="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLogoUpload}
              disabled={uploading || saving}
              className="w-full h-16 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
              ) : (
                <>
                  <Upload size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Upload logo</span>
                </>
              )}
            </button>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty for default HabiTrack logo
          </p>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Household Name
        </label>
        <input
          type="text"
          value={branding.name || ''}
          onChange={(e) => setBranding(prev => ({ ...prev, name: e.target.value }))}
          onBlur={() => saveBranding({ name: branding.name })}
          placeholder="The Chambers Family"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Shown on the login page title
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Logo
        </label>
        {branding.logoUrl ? (
          <div className="space-y-2">
            <div className="h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              <img
                src={getAssetUrl(branding.logoUrl)}
                alt="Logo preview"
                className="max-h-16 max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onLogoUpload}
                disabled={uploading || saving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Upload size={14} />
                Change
              </button>
              <button
                onClick={onLogoRemove}
                disabled={saving}
                className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLogoUpload}
            disabled={uploading || saving}
            className="w-full h-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
            ) : (
              <>
                <Upload size={24} className="text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click to upload logo
                </span>
              </>
            )}
          </button>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave empty to use default HabiTrack logo
        </p>
      </div>
    </div>
  );
}
