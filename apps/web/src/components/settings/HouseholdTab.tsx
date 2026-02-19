// apps/web/src/components/settings/HouseholdTab.tsx
import { useState, useEffect } from 'react';
import { Home, Palette, Globe, Check } from 'lucide-react';
import { TIMEZONES } from './constants';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';

const AVAILABLE_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
];

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
  const [holidayCountries, setHolidayCountries] = useState<string[]>([]);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [holidaySuccess, setHolidaySuccess] = useState('');

  useEffect(() => {
    fetchHolidaySettings();
  }, []);

  const fetchHolidaySettings = async () => {
    try {
      const data = await apiClient.get<{ countries: string[] }>('/settings/holidays', { params: undefined });
      setHolidayCountries(data.countries || []);
    } catch {
      // Settings might not exist yet
      setHolidayCountries([]);
    } finally {
      setHolidayLoading(false);
    }
  };

  const toggleCountry = (code: string) => {
    setHolidayCountries((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : prev.length < 10
          ? [...prev, code]
          : prev
    );
  };

  const saveHolidaySettings = async () => {
    setHolidaySaving(true);
    try {
      await apiClient.put('/settings/holidays', { countries: holidayCountries });
      setHolidaySuccess('Holiday settings saved!');
      setTimeout(() => setHolidaySuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save holiday settings:', err);
    } finally {
      setHolidaySaving(false);
    }
  };

  return (
    <div className="space-y-8">
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

      {/* National Holidays Section */}
      <div className="space-y-4">
        <div className="p-4 bg-[var(--color-muted)] rounded-xl">
          <h3 className="font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-2">
            <Globe size={18} />
            National Holidays
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Select countries to display their national holidays on the calendar (max 10)
          </p>
        </div>

        {holidaySuccess && (
          <div
            className="p-3 rounded-xl text-sm flex items-center gap-2"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
              color: 'var(--color-success)',
              border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)',
            }}
          >
            <Check size={16} />
            {holidaySuccess}
          </div>
        )}

        {holidayLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_COUNTRIES.map((country) => {
                const isSelected = holidayCountries.includes(country.code);
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => toggleCountry(country.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors text-left ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="truncate">
                      {country.code} — {country.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {holidayCountries.length >= 10 && (
              <p className="text-xs text-[var(--color-warning)]">
                Maximum of 10 countries reached
              </p>
            )}

            <button
              type="button"
              onClick={saveHolidaySettings}
              disabled={holidaySaving}
              className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
            >
              {holidaySaving ? 'Saving...' : `Save Holiday Settings (${holidayCountries.length} selected)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
