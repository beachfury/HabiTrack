// apps/web/src/components/settings/SecurityTab.tsx
import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecurityTabProps {
  saving: boolean;
  onChangePassword: (form: PasswordForm) => Promise<void>;
}

export function SecurityTab({ saving, onChangePassword }: SecurityTabProps) {
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onChangePassword(form);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-[var(--color-muted)] rounded-xl">
        <h3 className="font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-2">
          <Lock size={18} />
          Change Password
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Update your password to keep your account secure
        </p>
      </div>

      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full px-3 py-2 pr-10 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          >
            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full px-3 py-2 pr-10 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          >
            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Must be at least 8 characters</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 pr-10 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          >
            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
          <p className="text-xs text-[var(--color-destructive)] mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword}
        className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
