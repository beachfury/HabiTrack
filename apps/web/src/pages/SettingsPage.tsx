// apps/web/src/pages/SettingsPage.tsx

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Palette,
  Lock,
  Home,
  Upload,
  Sun,
  Moon,
  Monitor,
  Check,
  AlertCircle,
  Camera,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserSettings, HouseholdSettings } from '../types';
import { ColorPicker } from '../components/common/ColorPicker';
import { ThemePicker, KidThemePicker } from '../components/themes';

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

// Default color for new profiles/settings
const DEFAULT_COLOR = '#8b5cf6';

type Tab = 'profile' | 'themes' | 'appearance' | 'security' | 'household';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
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
    brandColor: '#8b5cf6',
    loginBackground: 'gradient' as 'gradient' | 'solid' | 'image',
    loginBackgroundValue: '',
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
          brandColor: household.brandColor || '#8b5cf6',
          loginBackground: (household.loginBackground as 'gradient' | 'solid' | 'image') || 'gradient',
          loginBackgroundValue: household.loginBackgroundValue || '',
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
        brandColor: householdForm.brandColor,
        loginBackground: householdForm.loginBackground,
        loginBackgroundValue: householdForm.loginBackgroundValue || undefined,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as Tab, icon: User, label: 'Profile' },
    { id: 'themes' as Tab, icon: Palette, label: 'Themes' },
    { id: 'appearance' as Tab, icon: Settings, label: 'Appearance' },
    { id: 'security' as Tab, icon: Lock, label: 'Security' },
    ...(isAdmin ? [{ id: 'household' as Tab, icon: Home, label: 'Household' }] : []),
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="text-purple-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

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
                    className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
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
                  <p className="font-medium text-gray-900">{userSettings?.displayName}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  {userSettings?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="text-sm text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove avatar
                    </button>
                  )}
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text"
                  value={profileForm.nickname}
                  onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Short name for calendar"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Themes</h2>
              {user?.role === 'kid' ? (
                <KidThemePicker />
              ) : (
                <ThemePicker userRole={user?.role as 'admin' | 'member' | 'kid'} />
              )}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h2>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                      theme === 'light'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun size={20} />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                      theme === 'dark'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon size={20} />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                      theme === 'system'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Monitor size={20} />
                    System
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <ColorPicker
                  color={accentColor}
                  onChange={setAccentColor}
                  label="Accent Color"
                  className="max-w-md"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This color will be used for buttons and highlights throughout the app.
                </p>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* Household Tab (Admin only) */}
          {activeTab === 'household' && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Household Settings</h2>

              {/* Logo Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Household Logo
                </label>
                <LogoGallery
                  currentLogo={householdSettings?.logoUrl}
                  onSelect={async (url: string) => {
                    await api.selectUpload('logos', url);
                    showSuccessMsg('Logo updated!');
                    fetchSettings();
                  }}
                  onUpload={async (file: File) => {
                    await handleFileSelect({ target: { files: [file] } } as any, 'logo');
                  }}
                  onDelete={async (filename: string) => {
                    await api.deleteUploadedFile('logos', filename);
                    showSuccessMsg('Logo deleted!');
                    fetchSettings();
                  }}
                />
              </div>

              {/* Household Name */}
              <form onSubmit={handleSaveHousehold} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Household Name
                  </label>
                  <input
                    type="text"
                    value={householdForm.name}
                    onChange={(e) => setHouseholdForm({ ...householdForm, name: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="The Smith Family"
                  />
                </div>

                {/* Brand Color */}
                <ColorPicker
                  color={householdForm.brandColor}
                  onChange={(color) => setHouseholdForm({ ...householdForm, brandColor: color })}
                  label="Brand Color"
                  className="max-w-md"
                />

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={householdForm.timezone}
                    onChange={(e) =>
                      setHouseholdForm({ ...householdForm, timezone: e.target.value })
                    }
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <optgroup label="United States">
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Phoenix">Arizona (MST - No DST)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Anchorage">Alaska Time (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">London (GMT/BST)</option>
                      <option value="Europe/Paris">Paris (CET/CEST)</option>
                      <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                      <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    This affects when daily chores reset and scheduling
                  </p>
                </div>

                {/* Login Background */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login Background
                  </label>
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setHouseholdForm({
                          ...householdForm,
                          loginBackground: 'gradient',
                          loginBackgroundValue: '',
                        })
                      }
                      className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                        householdForm.loginBackground === 'gradient'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Gradient
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHouseholdForm({ ...householdForm, loginBackground: 'solid' })
                      }
                      className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                        householdForm.loginBackground === 'solid'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Solid Color
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHouseholdForm({ ...householdForm, loginBackground: 'image' })
                      }
                      className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                        householdForm.loginBackground === 'image'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Image
                    </button>
                  </div>

                  {householdForm.loginBackground === 'solid' && (
                    <ColorPicker
                      color={householdForm.loginBackgroundValue || '#8b5cf6'}
                      onChange={(color) =>
                        setHouseholdForm({
                          ...householdForm,
                          loginBackgroundValue: color,
                        })
                      }
                      label="Background Color"
                      className="max-w-md"
                    />
                  )}

                  {householdForm.loginBackground === 'image' && (
                    <BackgroundGallery
                      currentBackground={householdSettings?.loginBackgroundValue}
                      onSelect={async (url: string) => {
                        await api.selectUpload('backgrounds', url);
                        showSuccessMsg('Background updated!');
                        fetchSettings();
                      }}
                      onUpload={async (file: File) => {
                        await handleFileSelect({ target: { files: [file] } } as any, 'background');
                      }}
                      onDelete={async (filename: string) => {
                        await api.deleteUploadedFile('backgrounds', filename);
                        showSuccessMsg('Background deleted!');
                        fetchSettings();
                      }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Household Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Logo Gallery Component
  function LogoGallery({
    currentLogo,
    onSelect,
    onUpload,
    onDelete,
  }: {
    currentLogo: string | null | undefined;
    onSelect: (url: string) => void;
    onUpload: (file: File) => void;
    onDelete: (filename: string) => void;
  }) {
    const [files, setFiles] = useState<Array<{ filename: string; url: string; size: number }>>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      loadFiles();
    }, []);

    const loadFiles = async () => {
      try {
        const data = await api.listUploads('logos');
        setFiles(data.files);
      } catch (err) {
        console.error('Failed to load logos:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
        setTimeout(loadFiles, 1000);
      }
    };

    const handleDelete = async (filename: string) => {
      if (confirm('Delete this logo?')) {
        await onDelete(filename);
        loadFiles();
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 flex items-center justify-center text-gray-400 hover:text-purple-500 transition-colors"
          >
            <Upload size={24} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {files.map((file) => (
            <div
              key={file.filename}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                currentLogo === file.url
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(file.url)}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${file.url}`}
                alt="Logo"
                className="w-full h-full object-cover"
              />
              {currentLogo === file.url && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <Check size={24} className="text-purple-600" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.filename);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {loading && (
            <div className="w-20 h-20 rounded-xl border border-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          )}
        </div>
        {files.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No logos uploaded yet. Click + to upload.</p>
        )}
      </div>
    );
  }

  // Background Gallery Component
  function BackgroundGallery({
    currentBackground,
    onSelect,
    onUpload,
    onDelete,
  }: {
    currentBackground: string | null | undefined;
    onSelect: (url: string) => void;
    onUpload: (file: File) => void;
    onDelete: (filename: string) => void;
  }) {
    const [files, setFiles] = useState<Array<{ filename: string; url: string; size: number }>>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      loadFiles();
    }, []);

    const loadFiles = async () => {
      try {
        const data = await api.listUploads('backgrounds');
        setFiles(data.files);
      } catch (err) {
        console.error('Failed to load backgrounds:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
        setTimeout(loadFiles, 1000);
      }
    };

    const handleDelete = async (filename: string) => {
      if (confirm('Delete this background?')) {
        await onDelete(filename);
        loadFiles();
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 flex items-center justify-center text-gray-400 hover:text-purple-500 transition-colors"
          >
            <Upload size={24} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {files.map((file) => (
            <div
              key={file.filename}
              className={`relative w-32 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                currentBackground === file.url
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(file.url)}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${file.url}`}
                alt="Background"
                className="w-full h-full object-cover"
              />
              {currentBackground === file.url && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <Check size={24} className="text-purple-600" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.filename);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {loading && (
            <div className="w-32 h-20 rounded-xl border border-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          )}
        </div>
        {files.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No backgrounds uploaded yet. Click + to upload.</p>
        )}
      </div>
    );
  }
}