// apps/web/src/components/settings/ProfileTab.tsx
import { useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
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
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
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
              className="absolute bottom-0 right-0 p-1.5 bg-[var(--color-card)] rounded-full shadow-lg border border-[var(--color-border)]"
            >
              {uploading ? (
                <RefreshCw size={14} className="animate-spin text-[var(--color-foreground)]" />
              ) : (
                <Camera size={14} className="text-[var(--color-foreground)]" />
              )}
            </button>
          </div>
          {avatarUrl && (
            <button
              type="button"
              onClick={onAvatarRemove}
              className="text-sm text-[var(--color-destructive)] hover:opacity-80"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Nickname */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Nickname
        </label>
        <input
          type="text"
          value={form.nickname}
          onChange={(e) => onChange({ ...form, nickname: e.target.value })}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="Your display name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
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
        className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
