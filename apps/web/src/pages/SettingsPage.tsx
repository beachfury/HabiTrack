// apps/web/src/pages/SettingsPage.tsx

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Palette,
  Lock,
  Home,
  Check,
  AlertCircle,
  Camera,
  X,
  Bell,
  Mail,
  Bug,
  Info,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserSettings, HouseholdSettings } from '../types';
import { ColorPicker } from '../components/common/ColorPicker';
import { ThemePicker, KidThemePicker } from '../components/themes';
import { NotificationsTab } from '../components/settings/NotificationsTab';
import { EmailSettingsTab } from '../components/settings/EmailSettingsTab';
import { DebugSettingsTab } from '../components/settings/DebugSettingsTab';
import { AboutTab } from '../components/settings/AboutTab';
import { HouseholdTab } from '../components/settings/HouseholdTab';
import { PageHeader } from '../components/common/PageHeader';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

const api = {
  async getUserSettings() {
    return request('/api/settings/user');
  },
  async getHouseholdSettings() {
    return request('/api/settings/household');
  },
  async updateUserSettings(payload: any) {
    return request('/api/settings/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  async changeSettingsPassword(currentPassword: string, newPassword: string) {
    return request('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  async updateHouseholdSettings(payload: any) {
    return request('/api/settings/household', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  async uploadAvatar(dataUrl: string, contentType: string) {
    return request('/api/upload/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, mimeType: contentType }),
    });
  },
  async uploadLogo(dataUrl: string, contentType: string) {
    return request('/api/upload/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, mimeType: contentType }),
    });
  },
  async uploadBackground(dataUrl: string, contentType: string) {
    return request('/api/upload/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, mimeType: contentType }),
    });
  },
  async deleteAvatar() {
    return request('/api/upload/avatar', { method: 'DELETE' });
  },
  async selectUpload(collection: string, url: string) {
    // Backend expects url and type in body. The :id param is not used but required.
    // Map collection names to type names the backend expects
    const typeMap: Record<string, string> = { logos: 'logo', backgrounds: 'background' };
    return request('/api/uploads/_/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type: typeMap[collection] || collection }),
    });
  },
  async deleteUploadedFile(_collection: string, filename: string) {
    // Backend expects just the filename, it searches all directories
    return request(`/api/uploads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  },
  async listUploads(collection: string) {
    // Backend returns all uploads, filter by collection type
    const data = await request('/api/uploads');
    const files = data.files || [];
    return { files: files.filter((f: any) => f.type === collection) };
  },
};

// Default color for new profiles/settings (HabiTrack Green)
const DEFAULT_COLOR = '#3cb371';

type Tab = 'profile' | 'themes' | 'security' | 'notifications' | 'household' | 'email' | 'debug' | 'about';

export function SettingsPage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Get animation classes for the settings page background
  const animationClasses = getPageAnimationClasses('settings-background');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    email: '',
    color: DEFAULT_COLOR,
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Household settings (admin only)
  const [householdSettings, setHouseholdSettings] = useState<HouseholdSettings | null>(null);
  const [householdForm, setHouseholdForm] = useState({
    name: '',
    timezone: 'America/Los_Angeles',
  });

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // GET /settings/user → { user: UserSettings }
      const userData = await api.getUserSettings();
      const userFromApi = userData.user;
      setUserSettings(userFromApi);
      setProfileForm({
        nickname: userFromApi.nickname || '',
        email: userFromApi.email || '',
        color: userFromApi.color || DEFAULT_COLOR,
      });

      // Note: Theme is already loaded by ThemeContext from API
      // Don't call setTheme/setAccentColor here as it would trigger duplicate API calls

      if (isAdmin) {
        // GET /settings/household → { household: HouseholdSettings }
        const householdData = await api.getHouseholdSettings();
        const household = householdData.household;
        setHouseholdSettings(household);
        setHouseholdForm({
          name: household.name || '',
          timezone: household.timezone || 'America/Los_Angeles',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMsg = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.updateUserSettings({
        nickname: profileForm.nickname || undefined,
        email: profileForm.email || undefined,
        color: profileForm.color,
      });
      showSuccessMsg('Profile updated successfully!');
      fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      setSaving(false);
      return;
    }

    try {
      // POST /settings/password with { currentPassword, newPassword }
      await api.changeSettingsPassword(passwordForm.currentPassword, passwordForm.newPassword);
      showSuccessMsg('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.updateHouseholdSettings({
        name: householdForm.name,
        timezone: householdForm.timezone,
      });
      showSuccessMsg('Household settings updated!');
      fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to update household settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'logo' | 'background',
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        try {
          if (type === 'avatar') {
            await api.uploadAvatar(base64, file.type);
            showSuccessMsg('Avatar uploaded!');
          } else if (type === 'logo') {
            await api.uploadLogo(base64, file.type);
            showSuccessMsg('Logo uploaded!');
          } else if (type === 'background') {
            await api.uploadBackground(base64, file.type);
            showSuccessMsg('Background uploaded!');
          }
          fetchSettings();
        } catch (err: any) {
          setError(err.message || 'Failed to upload image');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read file');
      setSaving(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Remove your avatar?')) return;

    setSaving(true);
    try {
      await api.deleteAvatar();
      showSuccessMsg('Avatar removed!');
      fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as Tab, icon: User, label: 'Profile' },
    { id: 'themes' as Tab, icon: Palette, label: 'Themes' },
    { id: 'notifications' as Tab, icon: Bell, label: 'Notifications' },
    { id: 'security' as Tab, icon: Lock, label: 'Security' },
    ...(isAdmin ? [{ id: 'household' as Tab, icon: Home, label: 'Household' }] : []),
    ...(isAdmin ? [{ id: 'email' as Tab, icon: Mail, label: 'Email' }] : []),
    ...(isAdmin ? [{ id: 'debug' as Tab, icon: Bug, label: 'Debug' }] : []),
    { id: 'about' as Tab, icon: Info, label: 'About' },
  ];

  return (
    <div className={`min-h-screen themed-settings-bg ${animationClasses}`}>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="Settings"
        icon={Settings}
        subtitle="Manage your account and preferences"
      />

      {/* Success/Error messages */}
      {success && (
        <div className="mb-6 p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-xl text-[var(--color-success)] flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-xl text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mobile Tabs - horizontal scrollable */}
      <div className="flex md:hidden overflow-x-auto gap-1 mb-4 -mx-1 px-1 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap text-sm ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Desktop Tabs - sidebar */}
        <div className="hidden md:block w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 themed-card p-4 sm:p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Profile Settings</h2>

              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {userSettings?.avatarUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${userSettings.avatarUrl}`}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                      style={{ backgroundColor: profileForm.color }}
                    >
                      {(userSettings?.nickname || userSettings?.displayName || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] p-2 rounded-full hover:opacity-90 transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'avatar')}
                  />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{userSettings?.displayName}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] capitalize">{user?.role}</p>
                  {userSettings?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="text-sm text-[var(--color-destructive)] hover:opacity-80 mt-1"
                    >
                      Remove avatar
                    </button>
                  )}
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nickname</label>
                <input
                  type="text"
                  value={profileForm.nickname}
                  onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                  className="themed-input w-full max-w-md"
                  placeholder="Short name for calendar"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="themed-input w-full max-w-md"
                  placeholder="your@email.com"
                />
              </div>

              {/* Profile Color */}
              <ColorPicker
                color={profileForm.color}
                onChange={(color) => setProfileForm({ ...profileForm, color })}
                label="Profile Color"
                className="max-w-md"
              />

              <button
                type="submit"
                disabled={saving}
                className="themed-btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Themes</h2>
              {user?.role === 'kid' ? (
                <KidThemePicker />
              ) : (
                <ThemePicker userRole={user?.role as 'admin' | 'member' | 'kid'} />
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Change Password</h2>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="themed-input w-full max-w-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="themed-input w-full max-w-md"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="themed-input w-full max-w-md"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="themed-btn-primary disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationsTab />
          )}

          {/* Email Settings Tab (Admin only) */}
          {activeTab === 'email' && isAdmin && (
            <EmailSettingsTab />
          )}

          {/* Household Tab (Admin only) */}
          {activeTab === 'household' && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Household Settings</h2>
              <HouseholdTab
                form={householdForm}
                saving={saving}
                onChange={setHouseholdForm}
                onSave={handleSaveHousehold}
              />
            </div>
          )}

          {/* Debug Settings Tab (Admin only) */}
          {activeTab === 'debug' && isAdmin && (
            <DebugSettingsTab />
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <AboutTab />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}