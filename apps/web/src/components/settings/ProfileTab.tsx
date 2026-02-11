// apps/web/src/components/settings/ProfileTab.tsx
import { useRef, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker';

interface ProfileForm {
  nickname: string;
  email: string;
  color: string;
}

interface ProfileTabProps {
  form: ProfileForm;
  avatarUrl?: string;
  saving: boolean;
  onChange: (form: ProfileForm) => void;
  onSave: (e: React.FormEvent) => void;
  onAvatarUpload: (file: File) => Promise<void>;
  onAvatarRemove: () => Promise<void>;
}

export function ProfileTab({
  form,
  avatarUrl,
  saving,
  onChange,
  onSave,
  onAvatarUpload,
  onAvatarRemove,
}: ProfileTabProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onAvatarUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Picture
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: form.color }}
              >
                {form.nickname?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600"
            >
              {uploading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>
          {avatarUrl && (
            <button
              type="button"
              onClick={onAvatarRemove}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Nickname */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nickname
        </label>
        <input
          type="text"
          value={form.nickname}
          onChange={(e) => onChange({ ...form, nickname: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500"
          placeholder="Your display name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500"
          placeholder="your@email.com"
        />
      </div>

      {/* Profile Color */}
      <ColorPicker
        color={form.color}
        onChange={(color) => onChange({ ...form, color })}
        label="Profile Color"
      />

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
