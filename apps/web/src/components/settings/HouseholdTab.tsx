// apps/web/src/components/settings/HouseholdTab.tsx
import { useRef } from 'react';
import { Home, Upload, Camera } from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker';
import { TIMEZONES } from './constants';

interface HouseholdForm {
  name: string;
  brandColor: string;
  loginBackground: 'gradient' | 'solid' | 'image';
  loginBackgroundValue: string;
  timezone: string;
}

interface HouseholdTabProps {
  form: HouseholdForm;
  logoUrl?: string;
  saving: boolean;
  onChange: (form: HouseholdForm) => void;
  onSave: (e: React.FormEvent) => void;
  onLogoUpload: (file: File) => Promise<void>;
  onLogoRemove: () => Promise<void>;
  onBackgroundUpload: (file: File) => Promise<void>;
}

export function HouseholdTab({
  form,
  logoUrl,
  saving,
  onChange,
  onSave,
  onLogoUpload,
  onLogoRemove,
  onBackgroundUpload,
}: HouseholdTabProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onLogoUpload(file);
  };

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onBackgroundUpload(file);
  };

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <h3 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Home size={18} />
          Household Settings
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customize your household's appearance and settings
        </p>
      </div>

      {/* Household Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Household Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
          placeholder="The Smith Family"
        />
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Household Logo
        </label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Home size={24} className="text-gray-400" />
            </div>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-2"
            >
              <Camera size={14} /> Upload
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={onLogoRemove}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brand Color */}
      <ColorPicker
        color={form.brandColor}
        onChange={(color) => onChange({ ...form, brandColor: color })}
        label="Brand Color"
      />

      {/* Login Background */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Login Background
        </label>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {(['gradient', 'solid', 'image'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...form, loginBackground: type })}
              className={`p-3 rounded-xl border-2 capitalize text-sm ${
                form.loginBackground === type
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {form.loginBackground === 'solid' && (
          <ColorPicker
            color={form.loginBackgroundValue || '#8b5cf6'}
            onChange={(color) => onChange({ ...form, loginBackgroundValue: color })}
            label="Background Color"
          />
        )}
        {form.loginBackground === 'image' && (
          <div>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => backgroundInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm flex items-center gap-2"
            >
              <Upload size={16} /> Upload Background Image
            </button>
          </div>
        )}
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Timezone
        </label>
        <select
          value={form.timezone}
          onChange={(e) => onChange({ ...form, timezone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Household Settings'}
      </button>
    </form>
  );
}
