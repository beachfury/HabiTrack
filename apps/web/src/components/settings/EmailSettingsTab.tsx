// apps/web/src/components/settings/EmailSettingsTab.tsx
// Admin-only email/SMTP settings configuration

import { useState, useEffect } from 'react';
import { Mail, Server, TestTube2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { apiClient } from '../../api/client';

// Email provider presets
const EMAIL_PRESETS = [
  {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    note: 'Requires App Password (not your regular password). Generate at: myaccount.google.com/apppasswords',
  },
  {
    name: 'Outlook / Office 365',
    host: 'smtp.office365.com',
    port: '587',
    secure: false,
    note: 'Use your Microsoft account email and password (or App Password if 2FA enabled)',
  },
  {
    name: 'Yahoo',
    host: 'smtp.mail.yahoo.com',
    port: '587',
    secure: false,
    note: 'Requires App Password. Generate in Yahoo Account Security settings',
  },
  {
    name: 'iCloud',
    host: 'smtp.mail.me.com',
    port: '587',
    secure: false,
    note: 'Requires App-Specific Password. Generate at: appleid.apple.com',
  },
  {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: '587',
    secure: false,
    note: 'Username is "apikey", password is your SendGrid API key',
  },
  {
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: '587',
    secure: false,
    note: 'Use your Mailgun SMTP credentials from the domain settings',
  },
];

interface EmailSettings {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpSecure: boolean;
  fromEmail: string | null;
  fromName: string | null;
  maxEmailsPerHour: number;
  maxEmailsPerUserPerHour: number;
  lastTestSentAt: string | null;
  lastTestResult: string | null;
}

interface EmailSettingsForm {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  maxEmailsPerHour: string;
  maxEmailsPerUserPerHour: string;
}

export function EmailSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [form, setForm] = useState<EmailSettingsForm>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: 'HabiTrack',
    maxEmailsPerHour: '100',
    maxEmailsPerUserPerHour: '20',
  });
  const [lastTestInfo, setLastTestInfo] = useState<{ sentAt: string | null; result: string | null }>({
    sentAt: null,
    result: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await apiClient.get<{ settings: EmailSettings }>('/notifications/email-settings', { params: undefined });
      const settings = res.settings;

      setForm({
        smtpHost: settings.smtpHost || '',
        smtpPort: String(settings.smtpPort || 587),
        smtpUser: settings.smtpUser || '',
        smtpPassword: '', // Never returned from API
        smtpSecure: settings.smtpSecure,
        fromEmail: settings.fromEmail || '',
        fromName: settings.fromName || 'HabiTrack',
        maxEmailsPerHour: String(settings.maxEmailsPerHour),
        maxEmailsPerUserPerHour: String(settings.maxEmailsPerUserPerHour),
      });

      setLastTestInfo({
        sentAt: settings.lastTestSentAt,
        result: settings.lastTestResult,
      });
    } catch (err) {
      console.error('Failed to load email settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: any = {
        smtpHost: form.smtpHost || null,
        smtpPort: parseInt(form.smtpPort) || 587,
        smtpUser: form.smtpUser || null,
        smtpSecure: form.smtpSecure,
        fromEmail: form.fromEmail || null,
        fromName: form.fromName || null,
        maxEmailsPerHour: parseInt(form.maxEmailsPerHour) || 100,
        maxEmailsPerUserPerHour: parseInt(form.maxEmailsPerUserPerHour) || 20,
      };

      // Only send password if it was changed
      if (form.smtpPassword) {
        updates.smtpPassword = form.smtpPassword;
      }

      await apiClient.put('/notifications/email-settings', updates);
      setForm(prev => ({ ...prev, smtpPassword: '' })); // Clear password field
    } catch (err) {
      console.error('Failed to save email settings:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (!testEmail) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        '/notifications/email-settings/test',
        { toEmail: testEmail },
      );
      setTestResult(res);
      loadSettings(); // Reload to get updated last test info
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
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
          <Mail size={18} />
          Email Settings
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Configure SMTP settings for sending email notifications
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SMTP Server Settings */}
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <h4 className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
            <Server size={16} />
            SMTP Server
          </h4>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2 flex items-center gap-2">
              <Zap size={14} />
              Quick Setup - Select Provider
            </label>
            <div className="flex flex-wrap gap-2">
              {EMAIL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      smtpHost: preset.host,
                      smtpPort: preset.port,
                      smtpSecure: preset.secure,
                    });
                  }}
                  className="px-3 py-1.5 text-sm bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-lg hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
            {form.smtpHost && (
              <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                {EMAIL_PRESETS.find(p => p.host === form.smtpHost)?.note || 'Custom SMTP server configured'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                value={form.smtpHost}
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                placeholder="smtp.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Port
              </label>
              <input
                type="number"
                value={form.smtpPort}
                onChange={(e) => setForm({ ...form, smtpPort: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                placeholder="587"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Username
              </label>
              <input
                type="text"
                value={form.smtpUser}
                onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.smtpPassword}
                onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={form.smtpSecure}
              onChange={(e) => setForm({ ...form, smtpSecure: e.target.checked })}
              className="rounded border-[var(--color-border)]"
            />
            <label htmlFor="smtpSecure" className="text-sm text-[var(--color-foreground)]">
              Use direct SSL (port 465 only - uncheck for port 587/STARTTLS)
            </label>
          </div>
        </div>

        {/* From Address */}
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <h4 className="font-medium text-[var(--color-foreground)]">From Address</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                From Email
              </label>
              <input
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                placeholder="noreply@yourdomain.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                From Name
              </label>
              <input
                type="text"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                placeholder="HabiTrack"
              />
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
          <h4 className="font-medium text-[var(--color-foreground)]">Rate Limits</h4>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Prevent email flooding by limiting the number of emails sent
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Max Emails Per Hour (Global)
              </label>
              <input
                type="number"
                value={form.maxEmailsPerHour}
                onChange={(e) => setForm({ ...form, maxEmailsPerHour: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                min="1"
                max="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Max Emails Per User Per Hour
              </label>
              <input
                type="number"
                value={form.maxEmailsPerUserPerHour}
                onChange={(e) => setForm({ ...form, maxEmailsPerUserPerHour: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
                min="1"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Email Settings'}
        </button>
      </form>

      {/* Test Email Section */}
      <div className="p-4 border border-[var(--color-border)] rounded-xl space-y-4">
        <h4 className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
          <TestTube2 size={16} />
          Test Email
        </h4>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Send a test email to verify your SMTP settings are working correctly
        </p>

        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]"
            placeholder="Enter email address"
          />
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testing || !testEmail}
            className="px-4 py-2 bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>

        {testResult && (
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{
              backgroundColor: testResult.success
                ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                : 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: testResult.success
                ? 'color-mix(in srgb, var(--color-success) 30%, transparent)'
                : 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
            }}
          >
            {testResult.success ? (
              <CheckCircle size={18} className="mt-0.5" style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertCircle size={18} className="mt-0.5" style={{ color: 'var(--color-destructive)' }} />
            )}
            <p
              className="text-sm"
              style={{ color: testResult.success ? 'var(--color-success)' : 'var(--color-destructive)' }}
            >
              {testResult.message}
            </p>
          </div>
        )}

        {lastTestInfo.sentAt && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Last test: {new Date(lastTestInfo.sentAt).toLocaleString()}
            {lastTestInfo.result && ` - ${lastTestInfo.result}`}
          </p>
        )}
      </div>

      {/* Info Notice */}
      <div
        className="p-4 rounded-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
        }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5" style={{ color: 'var(--color-primary)' }} />
          <div className="text-sm text-[var(--color-foreground)]">
            <p className="font-medium">No SMTP server?</p>
            <p className="text-[var(--color-muted-foreground)] mt-1">
              In development mode, emails will be sent to Ethereal (a fake SMTP service) and you'll
              see preview URLs in the server console. For production, configure your SMTP server
              (Gmail, SendGrid, Mailgun, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
