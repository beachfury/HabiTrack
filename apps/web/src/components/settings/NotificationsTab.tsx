// apps/web/src/components/settings/NotificationsTab.tsx
// User notification preferences configuration
// Includes admin-only section for household chore deadline reminders

import { useState, useEffect } from 'react';
import { Bell, Clock, Moon, Mail, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface NotificationPreferences {
  emailEnabled: boolean;
  choreReminders: boolean;
  choreAssignments: boolean;
  choreCompletions: boolean;
  eventReminders: boolean;
  shoppingUpdates: boolean;
  messageNotifications: boolean;
  achievementNotifications: boolean;
  reminderLeadTime: number;
  digestMode: 'instant' | 'daily' | 'weekly';
  digestTime: string;
  digestDayOfWeek: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface DeadlineReminderSettings {
  choreDeadlineReminder1Enabled: boolean;
  choreDeadlineReminder1Time: string;
  choreDeadlineReminder2Enabled: boolean;
  choreDeadlineReminder2Time: string;
  choreDeadlineReminder3Enabled: boolean;
  choreDeadlineReminder3Time: string;
  choreDeadlineReminder4Enabled: boolean;
  choreDeadlineReminder4Time: string;
}

const DEFAULT_DEADLINE_SETTINGS: DeadlineReminderSettings = {
  choreDeadlineReminder1Enabled: false,
  choreDeadlineReminder1Time: '12:00:00',
  choreDeadlineReminder2Enabled: false,
  choreDeadlineReminder2Time: '19:00:00',
  choreDeadlineReminder3Enabled: false,
  choreDeadlineReminder3Time: '15:00:00',
  choreDeadlineReminder4Enabled: false,
  choreDeadlineReminder4Time: '21:00:00',
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

export function NotificationsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    choreReminders: true,
    choreAssignments: true,
    choreCompletions: false,
    eventReminders: true,
    shoppingUpdates: false,
    messageNotifications: true,
    achievementNotifications: true,
    reminderLeadTime: 24,
    digestMode: 'instant',
    digestTime: '09:00:00',
    digestDayOfWeek: 1,
    quietHoursEnabled: false,
    quietHoursStart: '22:00:00',
    quietHoursEnd: '07:00:00',
  });

  // Admin-only: chore deadline reminder settings (household-wide)
  const [deadlineSettings, setDeadlineSettings] = useState<DeadlineReminderSettings>(DEFAULT_DEADLINE_SETTINGS);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const res = await apiClient.get<{ preferences: NotificationPreferences }>(
        '/notifications/preferences',
        { params: undefined },
      );
      setPrefs(res.preferences);

      // Admin: also load household deadline settings
      if (isAdmin) {
        try {
          const householdRes = await fetch(API_BASE + '/api/settings/household', {
            credentials: 'include',
          });
          if (householdRes.ok) {
            const data = await householdRes.json();
            const h = data.data?.household || data.household || {};
            setDeadlineSettings({
              choreDeadlineReminder1Enabled: !!h.choreDeadlineReminder1Enabled,
              choreDeadlineReminder1Time: h.choreDeadlineReminder1Time || '12:00:00',
              choreDeadlineReminder2Enabled: !!h.choreDeadlineReminder2Enabled,
              choreDeadlineReminder2Time: h.choreDeadlineReminder2Time || '19:00:00',
              choreDeadlineReminder3Enabled: !!h.choreDeadlineReminder3Enabled,
              choreDeadlineReminder3Time: h.choreDeadlineReminder3Time || '15:00:00',
              choreDeadlineReminder4Enabled: !!h.choreDeadlineReminder4Enabled,
              choreDeadlineReminder4Time: h.choreDeadlineReminder4Time || '21:00:00',
            });
          }
        } catch (err) {
          console.error('Failed to load household deadline settings:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.put('/notifications/preferences', prefs);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDeadlineSettings() {
    setSavingDeadline(true);
    try {
      const csrfRes = await fetch(API_BASE + '/api/csrf', { credentials: 'include' });
      const csrfData = await csrfRes.json();

      await fetch(API_BASE + '/api/settings/household', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-HabiTrack-CSRF': csrfData.token || csrfData.data?.token || '',
        },
        body: JSON.stringify(deadlineSettings),
      });
    } catch (err) {
      console.error('Failed to save deadline reminder settings:', err);
    } finally {
      setSavingDeadline(false);
    }
  }

  function handleToggle(key: keyof NotificationPreferences) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleDeadlineToggle(slot: 1 | 2 | 3 | 4) {
    const key = `choreDeadlineReminder${slot}Enabled` as keyof DeadlineReminderSettings;
    setDeadlineSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleDeadlineTimeChange(slot: 1 | 2 | 3 | 4, time: string) {
    const key = `choreDeadlineReminder${slot}Time` as keyof DeadlineReminderSettings;
    setDeadlineSettings(prev => ({ ...prev, [key]: time + ':00' }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-[var(--color-muted)] rounded-xl">
        <h3 className="font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-2">
          <Bell size={18} />
          Notification Preferences
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Choose which notifications you want to receive via email
        </p>
      </div>

      {/* Master Email Toggle */}
      <div className="p-4 border border-[var(--color-border)] rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-[var(--color-primary)]" />
            <div>
              <p className="font-medium text-[var(--color-foreground)]">Email Notifications</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Enable or disable all email notifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('emailEnabled')}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              prefs.emailEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                prefs.emailEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notification Types */}
      {prefs.emailEnabled && (
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <h4 className="font-medium text-[var(--color-foreground)]">Notification Types</h4>

          <div className="space-y-3">
            <ToggleRow
              label="Chore Reminders"
              description="Get reminded before chores are due"
              checked={prefs.choreReminders}
              onChange={() => handleToggle('choreReminders')}
            />

            <ToggleRow
              label="Chore Assignments"
              description="When a chore is assigned to you"
              checked={prefs.choreAssignments}
              onChange={() => handleToggle('choreAssignments')}
            />

            <ToggleRow
              label="Chore Completions"
              description="When family members complete chores"
              checked={prefs.choreCompletions}
              onChange={() => handleToggle('choreCompletions')}
            />

            <ToggleRow
              label="Event Reminders"
              description="Reminders for upcoming calendar events"
              checked={prefs.eventReminders}
              onChange={() => handleToggle('eventReminders')}
            />

            <ToggleRow
              label="Shopping Updates"
              description="When items are added to the shopping list"
              checked={prefs.shoppingUpdates}
              onChange={() => handleToggle('shoppingUpdates')}
            />

            <ToggleRow
              label="Direct Messages"
              description="When you receive a new message"
              checked={prefs.messageNotifications}
              onChange={() => handleToggle('messageNotifications')}
            />

            <ToggleRow
              label="Achievements"
              description="When you earn achievements or rewards"
              checked={prefs.achievementNotifications}
              onChange={() => handleToggle('achievementNotifications')}
            />
          </div>
        </div>
      )}

      {/* Reminder Timing */}
      {prefs.emailEnabled && (
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <h4 className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
            <Clock size={16} />
            Reminder Timing
          </h4>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Send reminders this many hours before due
            </label>
            <select
              value={prefs.reminderLeadTime}
              onChange={(e) => setPrefs({ ...prefs, reminderLeadTime: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours (1 day)</option>
              <option value={48}>48 hours (2 days)</option>
              <option value={72}>72 hours (3 days)</option>
              <option value={168}>168 hours (1 week)</option>
            </select>
          </div>
        </div>
      )}

      {/* Digest Mode */}
      {prefs.emailEnabled && (
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <h4 className="font-medium text-[var(--color-foreground)]">Email Frequency</h4>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Choose how often you want to receive email notifications
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="digestMode"
                checked={prefs.digestMode === 'instant'}
                onChange={() => setPrefs({ ...prefs, digestMode: 'instant' })}
                className="w-4 h-4 text-[var(--color-primary)]"
              />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Instant</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Receive emails as events happen
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="digestMode"
                checked={prefs.digestMode === 'daily'}
                onChange={() => setPrefs({ ...prefs, digestMode: 'daily' })}
                className="w-4 h-4 text-[var(--color-primary)]"
              />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Daily Digest</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Receive a summary email once per day
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="digestMode"
                checked={prefs.digestMode === 'weekly'}
                onChange={() => setPrefs({ ...prefs, digestMode: 'weekly' })}
                className="w-4 h-4 text-[var(--color-primary)]"
              />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Weekly Digest</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Receive a summary email once per week
                </p>
              </div>
            </label>
          </div>

          {prefs.digestMode !== 'instant' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Send digest at
                </label>
                <input
                  type="time"
                  value={prefs.digestTime.slice(0, 5)}
                  onChange={(e) => setPrefs({ ...prefs, digestTime: e.target.value + ':00' })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                />
              </div>

              {prefs.digestMode === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Day of week
                  </label>
                  <select
                    value={prefs.digestDayOfWeek}
                    onChange={(e) => setPrefs({ ...prefs, digestDayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quiet Hours */}
      {prefs.emailEnabled && (
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-[var(--color-muted-foreground)]" />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Quiet Hours</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Don't send notifications during these hours
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('quietHoursEnabled')}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs.quietHoursEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  prefs.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursStart.slice(0, 5)}
                  onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value + ':00' })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd.slice(0, 5)}
                  onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value + ':00' })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Button for user preferences */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Notification Preferences'}
      </button>

      {/* ============================================ */}
      {/* Admin-Only: Chore Deadline Reminders */}
      {/* Household-wide setting for timed reminders */}
      {/* ============================================ */}
      {isAdmin && (
        <>
          <div className="p-4 bg-[var(--color-muted)] rounded-xl mt-8">
            <h3 className="font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-2">
              <AlertTriangle size={18} />
              Chore Deadline Reminders
              <span className="text-xs px-2 py-0.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full">
                Admin
              </span>
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Send email reminders when chores due today aren't completed by these times.
              Reminders go to the assigned user and all admins. Applies to all household members.
            </p>
          </div>

          <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
            <h4 className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
              <Clock size={16} />
              Reminder Check Times
            </h4>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Enable up to 4 check times. At each time, any pending chores for today will trigger a reminder.
            </p>

            <div className="space-y-3">
              {([1, 2, 3, 4] as const).map((slot) => {
                const enabledKey = `choreDeadlineReminder${slot}Enabled` as keyof DeadlineReminderSettings;
                const timeKey = `choreDeadlineReminder${slot}Time` as keyof DeadlineReminderSettings;
                const isEnabled = !!deadlineSettings[enabledKey];
                const timeValue = String(deadlineSettings[timeKey] || '12:00:00').slice(0, 5);

                return (
                  <div key={slot} className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleDeadlineToggle(slot)}
                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                      />
                      <span className={`font-medium ${isEnabled ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'}`}>
                        Reminder {slot}
                      </span>
                    </label>
                    <input
                      type="time"
                      value={timeValue}
                      onChange={(e) => handleDeadlineTimeChange(slot, e.target.value)}
                      disabled={!isEnabled}
                      className={`px-3 py-1.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] ${
                        !isEnabled ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveDeadlineSettings}
            disabled={savingDeadline}
            className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
          >
            {savingDeadline ? 'Saving...' : 'Save Deadline Reminder Settings'}
          </button>
        </>
      )}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-[var(--color-foreground)]">{label}</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
