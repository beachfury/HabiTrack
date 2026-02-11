// apps/web/src/components/themes/LoginPageEditor.tsx
// Editor for login page styling - edits HOUSEHOLD BRANDING settings
// The login page is household-wide (admin controls it), not per-theme
// This is because before login, we don't know which user/theme to use

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image, Type, Trash2, RefreshCw, RotateCcw } from 'lucide-react';
import { ColorPickerModal } from '../common/ColorPickerModal';

interface LoginPageEditorProps {
  onClose: () => void;
  onBrandingChange?: () => void; // Callback when branding is saved
}

type EditorSection = 'background' | 'branding';

// Branding data from household settings
interface BrandingData {
  name: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  loginBackground: 'gradient' | 'solid' | 'image' | null;
  loginBackgroundValue: string | null;
}

// HabiTrack default colors
const HABITRACK_GREEN = '#3cb371';
const HABITRACK_NAVY = '#3d4f5f';

// Default HabiTrack branding (used for reset)
const HABITRACK_DEFAULT_BRANDING: BrandingData = {
  name: null, // Will show "HabiTrack" when null
  brandColor: HABITRACK_GREEN,
  logoUrl: null, // Will use default HabiTrack logo
  loginBackground: 'gradient',
  loginBackgroundValue: `${HABITRACK_NAVY},#1a2530`, // Navy gradient
};

// Helper to get full URL for uploaded assets
const getAssetUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${apiBase}${path}`;
  }
  return path;
};

const GRADIENT_PRESETS = [
  { name: 'Navy', from: '#3d4f5f', to: '#1a2530' },
  { name: 'Forest', from: '#1a472a', to: '#0d2818' },
  { name: 'Ocean', from: '#1e3a5f', to: '#0c1929' },
  { name: 'Sunset', from: '#c94b4b', to: '#4b134f' },
  { name: 'Purple', from: '#4c1d95', to: '#1e1b4b' },
];

export function LoginPageEditor({ onClose, onBrandingChange }: LoginPageEditorProps) {
  const [activeSection, setActiveSection] = useState<EditorSection>('background');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Branding state - loaded from household settings
  const [branding, setBranding] = useState<BrandingData>({
    name: null,
    brandColor: HABITRACK_GREEN,
    logoUrl: null,
    loginBackground: 'gradient',
    loginBackgroundValue: null,
  });

  // For gradient editing
  const [gradientFrom, setGradientFrom] = useState('#3d4f5f');
  const [gradientTo, setGradientTo] = useState('#1a2530');

  // Load current branding on mount
  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/branding');
      if (!res.ok) throw new Error('Failed to load branding');
      const data = await res.json();
      setBranding({
        name: data.name,
        brandColor: data.brandColor || HABITRACK_GREEN,
        logoUrl: data.logoUrl,
        loginBackground: data.loginBackground || 'gradient',
        loginBackgroundValue: data.loginBackgroundValue,
      });

      // Parse gradient values if it's a gradient background
      if (data.loginBackground === 'gradient' && data.loginBackgroundValue) {
        // Try to parse "from,to" format
        const parts = data.loginBackgroundValue.split(',');
        if (parts.length === 2) {
          setGradientFrom(parts[0].trim());
          setGradientTo(parts[1].trim());
        }
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
      setError('Failed to load current settings');
    } finally {
      setLoading(false);
    }
  };

  // Save branding to household settings
  const saveBranding = async (updates: Partial<BrandingData>) => {
    setSaving(true);
    setError(null);
    try {
      // Map our branding fields to the settings API fields
      const settingsPayload: Record<string, any> = {};

      // Map our branding fields to the household settings API fields
      if (updates.name !== undefined) {
        settingsPayload.name = updates.name;
      }
      if (updates.brandColor !== undefined) {
        settingsPayload.brandColor = updates.brandColor;
      }
      if (updates.logoUrl !== undefined) {
        settingsPayload.logoUrl = updates.logoUrl;
      }
      if (updates.loginBackground !== undefined) {
        settingsPayload.loginBackground = updates.loginBackground;
      }
      if (updates.loginBackgroundValue !== undefined) {
        settingsPayload.loginBackgroundValue = updates.loginBackgroundValue;
      }

      const res = await fetch('/api/settings/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsPayload),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      // Update local state
      setBranding(prev => ({ ...prev, ...updates }));

      // Notify parent that branding changed (so preview can refresh)
      onBrandingChange?.();
    } catch (err) {
      console.error('Failed to save branding:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Reset branding to HabiTrack defaults
  const handleResetToDefaults = async () => {
    if (!confirm('Reset to HabiTrack defaults? This will remove all custom branding (logo, colors, background).')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: HABITRACK_DEFAULT_BRANDING.name,
          brandColor: HABITRACK_DEFAULT_BRANDING.brandColor,
          logoUrl: HABITRACK_DEFAULT_BRANDING.logoUrl,
          loginBackground: HABITRACK_DEFAULT_BRANDING.loginBackground,
          loginBackgroundValue: HABITRACK_DEFAULT_BRANDING.loginBackgroundValue,
        }),
      });

      if (!res.ok) throw new Error('Failed to reset settings');

      // Update local state
      setBranding(HABITRACK_DEFAULT_BRANDING);
      setGradientFrom(HABITRACK_NAVY);
      setGradientTo('#1a2530');

      // Notify parent that branding changed
      onBrandingChange?.();
    } catch (err) {
      console.error('Failed to reset branding:', err);
      setError('Failed to reset to defaults');
    } finally {
      setSaving(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle background image upload
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/upload/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      await saveBranding({
        loginBackground: 'image',
        loginBackgroundValue: data.url,
      });
    } catch (err) {
      console.error('Failed to upload background:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      await saveBranding({ logoUrl: data.url });
    } catch (err) {
      console.error('Failed to upload logo:', err);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Handle background type change
  const handleBackgroundTypeChange = async (type: 'gradient' | 'solid' | 'image') => {
    if (type === 'gradient') {
      await saveBranding({
        loginBackground: 'gradient',
        loginBackgroundValue: `${gradientFrom},${gradientTo}`,
      });
    } else if (type === 'solid') {
      await saveBranding({
        loginBackground: 'solid',
        loginBackgroundValue: branding.brandColor || HABITRACK_GREEN,
      });
    } else {
      // For image, just set the type - user will upload
      setBranding(prev => ({ ...prev, loginBackground: 'image' }));
    }
  };

  // Handle gradient change
  const handleGradientChange = async (from: string, to: string) => {
    setGradientFrom(from);
    setGradientTo(to);
    await saveBranding({
      loginBackground: 'gradient',
      loginBackgroundValue: `${from},${to}`,
    });
  };

  // Handle solid color change
  const handleSolidColorChange = async (color: string) => {
    await saveBranding({
      loginBackground: 'solid',
      loginBackgroundValue: color,
    });
  };

  const sections: { id: EditorSection; label: string; icon: React.ElementType }[] = [
    { id: 'background', label: 'Background', icon: Image },
    { id: 'branding', label: 'Branding', icon: Type },
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Login Page</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Household Branding</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Login page for all users
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadBranding}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Info message */}
      <div className="mx-4 mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-lg">
        This is household-wide branding. All users see the same login page.
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="mx-4 mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-500" />
          Saving...
        </div>
      )}

      {/* Section tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mt-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              activeSection === section.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSection === 'background' && (
          <div className="space-y-4">
            {/* Background Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['gradient', 'solid', 'image'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleBackgroundTypeChange(type)}
                    disabled={saving}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-colors capitalize ${
                      branding.loginBackground === type
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Options */}
            {branding.loginBackground === 'gradient' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gradient Presets
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleGradientChange(preset.from, preset.to)}
                        disabled={saving}
                        className="h-10 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                        style={{
                          background: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
                        }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Color
                  </label>
                  <ColorInput
                    color={gradientFrom}
                    onChange={(color) => handleGradientChange(color, gradientTo)}
                    showPicker={showColorPicker === 'gradientFrom'}
                    onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientFrom' ? null : 'gradientFrom')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Color
                  </label>
                  <ColorInput
                    color={gradientTo}
                    onChange={(color) => handleGradientChange(gradientFrom, color)}
                    showPicker={showColorPicker === 'gradientTo'}
                    onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientTo' ? null : 'gradientTo')}
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div
                    className="h-16 rounded-lg border border-gray-200 dark:border-gray-600"
                    style={{
                      background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
                    }}
                  />
                </div>
              </>
            )}

            {/* Solid Color */}
            {branding.loginBackground === 'solid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <ColorInput
                  color={branding.loginBackgroundValue || HABITRACK_GREEN}
                  onChange={handleSolidColorChange}
                  showPicker={showColorPicker === 'bgColor'}
                  onTogglePicker={() => setShowColorPicker(showColorPicker === 'bgColor' ? null : 'bgColor')}
                />
              </div>
            )}

            {/* Image Upload */}
            {branding.loginBackground === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Image
                </label>
                {branding.loginBackgroundValue ? (
                  <div className="space-y-2">
                    <div
                      className="h-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                      style={{ backgroundImage: `url(${getAssetUrl(branding.loginBackgroundValue)})` }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || saving}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Upload size={14} />
                        Change
                      </button>
                      <button
                        onClick={() => saveBranding({ loginBackgroundValue: null, loginBackground: 'gradient' })}
                        disabled={saving}
                        className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || saving}
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Click to upload image
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === 'branding' && (
          <div className="space-y-4">
            {/* Household Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Household Name
              </label>
              <input
                type="text"
                value={branding.name || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, name: e.target.value }))}
                onBlur={() => saveBranding({ name: branding.name })}
                placeholder="The Chambers Family"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Shown on the login page
              </p>
            </div>

            {/* Brand Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Login Button Color
              </label>
              <ColorInput
                color={branding.brandColor || HABITRACK_GREEN}
                onChange={(color) => {
                  setBranding(prev => ({ ...prev, brandColor: color }));
                  saveBranding({ brandColor: color });
                }}
                showPicker={showColorPicker === 'brandColor'}
                onTogglePicker={() => setShowColorPicker(showColorPicker === 'brandColor' ? null : 'brandColor')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Color for the Sign In button on login page
              </p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo
              </label>
              {branding.logoUrl ? (
                <div className="space-y-2">
                  <div className="h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <img
                      src={getAssetUrl(branding.logoUrl)}
                      alt="Logo preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading || saving}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Upload size={14} />
                      Change
                    </button>
                    <button
                      onClick={() => saveBranding({ logoUrl: null })}
                      disabled={saving}
                      className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Click to upload logo
                      </span>
                    </>
                  )}
                </button>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to use default HabiTrack logo
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with reset button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleResetToDefaults}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Reset to HabiTrack Defaults
        </button>
        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
          Removes all custom branding
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />
    </div>
  );
}

// Color input with picker
function ColorInput({
  color,
  onChange,
  showPicker,
  onTogglePicker,
}: {
  color: string;
  onChange: (color: string) => void;
  showPicker: boolean;
  onTogglePicker: () => void;
}) {
  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={onTogglePicker}
          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0 transition-colors hover:border-emerald-400"
          style={{ backgroundColor: color }}
          title="Click to open color picker"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3cb371"
          className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <ColorPickerModal
            currentColor={color}
            onSelect={(newColor) => {
              onChange(newColor);
              onTogglePicker();
            }}
            onClose={onTogglePicker}
          />
        </div>
      )}
    </div>
  );
}
