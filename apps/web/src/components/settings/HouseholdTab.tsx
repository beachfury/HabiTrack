// apps/web/src/components/settings/HouseholdTab.tsx
import { Home, Palette } from 'lucide-react';
import { TIMEZONES } from './constants';
import { Link } from 'react-router-dom';

interface HouseholdForm {
  name: string;
  timezone: string;
}

interface HouseholdTabProps {
  form: HouseholdForm;
  saving: boolean;
  onChange: (form: HouseholdForm) => void;
  onSave: (e: React.FormEvent) => void;
}

export function HouseholdTab({
  form,
  saving,
  onChange,
  onSave,
}: HouseholdTabProps) {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-4 bg-[var(--color-muted)] rounded-xl">
        <h3 className="font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-2">
          <Home size={18} />
          Household Settings
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Configure your household's general settings
        </p>
      </div>

      {/* Household Name */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Household Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-background)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="The Smith Family"
        />
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Timezone
        </label>
        <select
          value={form.timezone}
          onChange={(e) => onChange({ ...form, timezone: e.target.value })}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-background)] text-[var(--color-foreground)]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Branding Notice */}
      <div className="p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Palette size={20} className="text-[var(--color-primary)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Looking for branding options?
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Logo, brand colors, and login page appearance are now configured in the Theme Editor.
            </p>
            <Link
              to="/settings?tab=themes"
              className="inline-block mt-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              Go to Theme Editor →
            </Link>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Household Settings'}
      </button>
    </form>
  );
}
