// apps/web/src/components/settings/HouseholdTab.tsx
import { useState, useEffect } from 'react';
import { Home, Palette, Globe, Check } from 'lucide-react';
import { TIMEZONES } from './constants';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';

const AVAILABLE_COUNTRIES = [
  { code: 'US', name: 'United States', gradient: ['#B22234', '#FFFFFF', '#3C3B6E'] },
  { code: 'PR', name: 'Puerto Rico', gradient: ['#E42131', '#FFFFFF', '#0050F0'] },
  { code: 'CA', name: 'Canada', gradient: ['#FF0000', '#FFFFFF', '#FF0000'] },
  { code: 'GB', name: 'United Kingdom', gradient: ['#012169', '#CF142B', '#FFFFFF'] },
  { code: 'DE', name: 'Germany', gradient: ['#000000', '#DD0000', '#FFCC00'] },
  { code: 'FR', name: 'France', gradient: ['#002395', '#FFFFFF', '#ED2939'] },
  { code: 'AU', name: 'Australia', gradient: ['#00008B', '#FFFFFF', '#FF0000'] },
  { code: 'NZ', name: 'New Zealand', gradient: ['#00247D', '#CC142B'] },
  { code: 'MX', name: 'Mexico', gradient: ['#006847', '#FFFFFF', '#CE1126'] },
  { code: 'BR', name: 'Brazil', gradient: ['#009739', '#FEDD00', '#002776'] },
  { code: 'JP', name: 'Japan', gradient: ['#BC002D', '#FFFFFF', '#BC002D'] },
  { code: 'KR', name: 'South Korea', gradient: ['#003478', '#CD2E3A', '#FFFFFF'] },
  { code: 'IN', name: 'India', gradient: ['#FF9933', '#FFFFFF', '#138808'] },
  { code: 'IT', name: 'Italy', gradient: ['#009246', '#FFFFFF', '#CE2B37'] },
  { code: 'ES', name: 'Spain', gradient: ['#AA151B', '#F1BF00', '#AA151B'] },
  { code: 'NL', name: 'Netherlands', gradient: ['#AE1C28', '#FFFFFF', '#21468B'] },
  { code: 'BE', name: 'Belgium', gradient: ['#000000', '#FAE042', '#ED2939'] },
  { code: 'SE', name: 'Sweden', gradient: ['#006AA7', '#FECC00'] },
  { code: 'NO', name: 'Norway', gradient: ['#BA0C2F', '#FFFFFF', '#00205B'] },
  { code: 'DK', name: 'Denmark', gradient: ['#C60C30', '#FFFFFF', '#C60C30'] },
  { code: 'FI', name: 'Finland', gradient: ['#FFFFFF', '#003580', '#FFFFFF'] },
  { code: 'AT', name: 'Austria', gradient: ['#ED2939', '#FFFFFF', '#ED2939'] },
  { code: 'CH', name: 'Switzerland', gradient: ['#FF0000', '#FFFFFF', '#FF0000'] },
  { code: 'IE', name: 'Ireland', gradient: ['#169B62', '#FFFFFF', '#FF883E'] },
  { code: 'PL', name: 'Poland', gradient: ['#FFFFFF', '#DC143C'] },
  { code: 'PT', name: 'Portugal', gradient: ['#006600', '#FF0000'] },
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
                    <div
                      className="w-6 h-4 rounded-sm flex-shrink-0 border border-black/10"
                      style={{ background: `linear-gradient(to right, ${country.gradient.join(', ')})` }}
                    />
                    <span className="truncate">
                      {country.name}
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
