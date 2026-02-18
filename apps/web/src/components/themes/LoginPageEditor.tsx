// apps/web/src/components/themes/LoginPageEditor.tsx
// Editor for login page styling - edits HOUSEHOLD BRANDING settings
// The login page is household-wide (admin controls it), not per-theme
// This is because before login, we don't know which user/theme to use
// Now uses the same 5-tab structure as other element editors for consistency

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, RotateCcw, Paintbrush, Type, Square, Sparkles, Code } from 'lucide-react';
import { ColorPickerModal } from '../common/ColorPickerModal';

interface LoginPageEditorProps {
  onClose: () => void;
  onBrandingChange?: () => void; // Callback when branding is saved
  layout?: 'vertical' | 'horizontal'; // Layout mode for bottom panel support
}

type EditorTab = 'background' | 'text' | 'border' | 'effects' | 'advanced';

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
  { name: 'Emerald', from: '#065f46', to: '#022c22' },
];

export function LoginPageEditor({ onClose, onBrandingChange, layout = 'vertical' }: LoginPageEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('background');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isHorizontal = layout === 'horizontal';

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
      const settingsPayload: Record<string, unknown> = {};

      if (updates.name !== undefined) settingsPayload.name = updates.name;
      if (updates.brandColor !== undefined) settingsPayload.brandColor = updates.brandColor;
      if (updates.logoUrl !== undefined) settingsPayload.logoUrl = updates.logoUrl;
      if (updates.loginBackground !== undefined) settingsPayload.loginBackground = updates.loginBackground;
      if (updates.loginBackgroundValue !== undefined) settingsPayload.loginBackgroundValue = updates.loginBackgroundValue;

      const res = await fetch('/api/settings/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsPayload),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setBranding(prev => ({ ...prev, ...updates }));
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
    if (!confirm('Reset to HabiTrack defaults? This will remove all custom branding.')) {
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

      setBranding(HABITRACK_DEFAULT_BRANDING);
      setGradientFrom(HABITRACK_NAVY);
      setGradientTo('#1a2530');
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

  const tabs: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'background', label: 'Background', icon: Paintbrush },
    { id: 'text', label: 'Branding', icon: Type },
    { id: 'border', label: 'Button', icon: Square },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'advanced', label: 'Advanced', icon: Code },
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

  // Horizontal layout (bottom panel)
  if (isHorizontal) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
              Login Page
            </h3>
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              Household
            </span>
          </div>

          {/* Horizontal tabs */}
          <div className="flex items-center gap-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {saving && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-500" />
                Saving...
              </span>
            )}
            <button
              onClick={handleResetToDefaults}
              disabled={saving}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Tab content area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-4">
          {activeTab === 'background' && (
            <BackgroundTab
              branding={branding}
              gradientFrom={gradientFrom}
              gradientTo={gradientTo}
              onBackgroundTypeChange={handleBackgroundTypeChange}
              onGradientChange={handleGradientChange}
              onSolidColorChange={handleSolidColorChange}
              onImageUpload={() => fileInputRef.current?.click()}
              onImageRemove={() => saveBranding({ loginBackgroundValue: null, loginBackground: 'gradient' })}
              showColorPicker={showColorPicker}
              setShowColorPicker={setShowColorPicker}
              uploading={uploading}
              saving={saving}
              layout="horizontal"
            />
          )}
          {activeTab === 'text' && (
            <BrandingTab
              branding={branding}
              setBranding={setBranding}
              saveBranding={saveBranding}
              onLogoUpload={() => logoInputRef.current?.click()}
              onLogoRemove={() => saveBranding({ logoUrl: null })}
              uploading={uploading}
              saving={saving}
              layout="horizontal"
            />
          )}
          {activeTab === 'border' && (
            <ButtonTab
              branding={branding}
              saveBranding={saveBranding}
              showColorPicker={showColorPicker}
              setShowColorPicker={setShowColorPicker}
              layout="horizontal"
            />
          )}
          {activeTab === 'effects' && (
            <EffectsTab layout="horizontal" />
          )}
          {activeTab === 'advanced' && (
            <AdvancedTab layout="horizontal" />
          )}
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
      </div>
    );
  }

  // Vertical layout (right panel)
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Login Page</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Household branding for all users
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={18} />
        </button>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'background' && (
          <BackgroundTab
            branding={branding}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
            onBackgroundTypeChange={handleBackgroundTypeChange}
            onGradientChange={handleGradientChange}
            onSolidColorChange={handleSolidColorChange}
            onImageUpload={() => fileInputRef.current?.click()}
            onImageRemove={() => saveBranding({ loginBackgroundValue: null, loginBackground: 'gradient' })}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            uploading={uploading}
            saving={saving}
          />
        )}
        {activeTab === 'text' && (
          <BrandingTab
            branding={branding}
            setBranding={setBranding}
            saveBranding={saveBranding}
            onLogoUpload={() => logoInputRef.current?.click()}
            onLogoRemove={() => saveBranding({ logoUrl: null })}
            uploading={uploading}
            saving={saving}
          />
        )}
        {activeTab === 'border' && (
          <ButtonTab
            branding={branding}
            saveBranding={saveBranding}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
          />
        )}
        {activeTab === 'effects' && (
          <EffectsTab />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab />
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
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
    </div>
  );
}

// Background tab content
function BackgroundTab({
  branding,
  gradientFrom,
  gradientTo,
  onBackgroundTypeChange,
  onGradientChange,
  onSolidColorChange,
  onImageUpload,
  onImageRemove,
  showColorPicker,
  setShowColorPicker,
  uploading,
  saving,
  layout = 'vertical',
}: {
  branding: BrandingData;
  gradientFrom: string;
  gradientTo: string;
  onBackgroundTypeChange: (type: 'gradient' | 'solid' | 'image') => void;
  onGradientChange: (from: string, to: string) => void;
  onSolidColorChange: (color: string) => void;
  onImageUpload: () => void;
  onImageRemove: () => void;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
  uploading: boolean;
  saving: boolean;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        {/* Background type & gradient */}
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Background Type
          </h4>
          <div className="flex gap-2">
            {(['gradient', 'solid', 'image'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onBackgroundTypeChange(type)}
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

          {branding.loginBackground === 'gradient' && (
            <>
              <div className="flex gap-2 flex-wrap">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onGradientChange(preset.from, preset.to)}
                    disabled={saving}
                    className="w-12 h-8 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                    style={{
                      background: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <ColorInput
                    color={gradientFrom}
                    onChange={(color) => onGradientChange(color, gradientTo)}
                    showPicker={showColorPicker === 'gradientFrom'}
                    onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientFrom' ? null : 'gradientFrom')}
                    label="Start Color"
                  />
                </div>
                <div className="flex-1">
                  <ColorInput
                    color={gradientTo}
                    onChange={(color) => onGradientChange(gradientFrom, color)}
                    showPicker={showColorPicker === 'gradientTo'}
                    onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientTo' ? null : 'gradientTo')}
                    label="End Color"
                  />
                </div>
              </div>
            </>
          )}

          {branding.loginBackground === 'solid' && (
            <ColorInput
              color={branding.loginBackgroundValue || HABITRACK_GREEN}
              onChange={onSolidColorChange}
              showPicker={showColorPicker === 'bgColor'}
              onTogglePicker={() => setShowColorPicker(showColorPicker === 'bgColor' ? null : 'bgColor')}
              label="Background Color"
            />
          )}
        </div>

        {/* Image upload (shown for image type or as option) */}
        {branding.loginBackground === 'image' && (
          <div className="w-64 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Background Image
            </h4>
            {branding.loginBackgroundValue ? (
              <div className="space-y-2">
                <div
                  className="h-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                  style={{ backgroundImage: `url(${getAssetUrl(branding.loginBackgroundValue)})` }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onImageUpload}
                    disabled={uploading || saving}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Upload size={12} />
                    Change
                  </button>
                  <button
                    onClick={onImageRemove}
                    disabled={saving}
                    className="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onImageUpload}
                disabled={uploading || saving}
                className="w-full h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
                ) : (
                  <>
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Upload image</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="w-48">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Preview
          </h4>
          <div
            className="h-24 rounded-lg border border-gray-200 dark:border-gray-600"
            style={{
              background: branding.loginBackground === 'image' && branding.loginBackgroundValue
                ? `url(${getAssetUrl(branding.loginBackgroundValue)}) center/cover`
                : branding.loginBackground === 'solid'
                ? branding.loginBackgroundValue || HABITRACK_GREEN
                : `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
            }}
          />
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Background Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['gradient', 'solid', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onBackgroundTypeChange(type)}
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

      {branding.loginBackground === 'gradient' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient Presets
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onGradientChange(preset.from, preset.to)}
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

          <ColorInput
            color={gradientFrom}
            onChange={(color) => onGradientChange(color, gradientTo)}
            showPicker={showColorPicker === 'gradientFrom'}
            onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientFrom' ? null : 'gradientFrom')}
            label="Start Color"
          />

          <ColorInput
            color={gradientTo}
            onChange={(color) => onGradientChange(gradientFrom, color)}
            showPicker={showColorPicker === 'gradientTo'}
            onTogglePicker={() => setShowColorPicker(showColorPicker === 'gradientTo' ? null : 'gradientTo')}
            label="End Color"
          />

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

      {branding.loginBackground === 'solid' && (
        <ColorInput
          color={branding.loginBackgroundValue || HABITRACK_GREEN}
          onChange={onSolidColorChange}
          showPicker={showColorPicker === 'bgColor'}
          onTogglePicker={() => setShowColorPicker(showColorPicker === 'bgColor' ? null : 'bgColor')}
          label="Background Color"
        />
      )}

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
                  onClick={onImageUpload}
                  disabled={uploading || saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Upload size={14} />
                  Change
                </button>
                <button
                  onClick={onImageRemove}
                  disabled={saving}
                  className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onImageUpload}
              disabled={uploading || saving}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
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
  );
}

// Branding tab (renamed from "Text" tab for login-specific content)
function BrandingTab({
  branding,
  setBranding,
  saveBranding,
  onLogoUpload,
  onLogoRemove,
  uploading,
  saving,
  layout = 'vertical',
}: {
  branding: BrandingData;
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>;
  saveBranding: (updates: Partial<BrandingData>) => Promise<void>;
  onLogoUpload: () => void;
  onLogoRemove: () => void;
  uploading: boolean;
  saving: boolean;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            Shown on the login page title
          </p>
        </div>

        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Logo
          </label>
          {branding.logoUrl ? (
            <div className="space-y-2">
              <div className="h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <img
                  src={getAssetUrl(branding.logoUrl)}
                  alt="Logo preview"
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onLogoUpload}
                  disabled={uploading || saving}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Upload size={12} />
                  Change
                </button>
                <button
                  onClick={onLogoRemove}
                  disabled={saving}
                  className="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLogoUpload}
              disabled={uploading || saving}
              className="w-full h-16 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
              ) : (
                <>
                  <Upload size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Upload logo</span>
                </>
              )}
            </button>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty for default HabiTrack logo
          </p>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
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
          Shown on the login page title
        </p>
      </div>

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
                onClick={onLogoUpload}
                disabled={uploading || saving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Upload size={14} />
                Change
              </button>
              <button
                onClick={onLogoRemove}
                disabled={saving}
                className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLogoUpload}
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
  );
}

// Button tab (the login button color)
function ButtonTab({
  branding,
  saveBranding,
  showColorPicker,
  setShowColorPicker,
  layout = 'vertical',
}: {
  branding: BrandingData;
  saveBranding: (updates: Partial<BrandingData>) => Promise<void>;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="w-64">
          <ColorInput
            color={branding.brandColor || HABITRACK_GREEN}
            onChange={(color) => saveBranding({ brandColor: color })}
            showPicker={showColorPicker === 'brandColor'}
            onTogglePicker={() => setShowColorPicker(showColorPicker === 'brandColor' ? null : 'brandColor')}
            label="Sign In Button Color"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Color for the Sign In button on login page
          </p>
        </div>

        {/* Preview */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Preview
          </label>
          <button
            className="px-6 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: branding.brandColor || HABITRACK_GREEN }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      <ColorInput
        color={branding.brandColor || HABITRACK_GREEN}
        onChange={(color) => saveBranding({ brandColor: color })}
        showPicker={showColorPicker === 'brandColor'}
        onTogglePicker={() => setShowColorPicker(showColorPicker === 'brandColor' ? null : 'brandColor')}
        label="Sign In Button Color"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
        Color for the Sign In button on login page
      </p>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preview
        </label>
        <button
          className="px-8 py-3 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: branding.brandColor || HABITRACK_GREEN }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

// Effects tab (placeholder for future enhancements)
function EffectsTab({ layout = 'vertical' }: { layout?: 'vertical' | 'horizontal' }) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={isHorizontal ? 'flex gap-8' : 'space-y-4'}>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
          Effects
        </p>
        <p>
          Additional effects like blur, animations, and transitions can be added here in future updates.
        </p>
        <p className="mt-2 text-xs">
          The login page currently uses a clean, simple design to ensure fast loading and broad compatibility.
        </p>
      </div>
    </div>
  );
}

// Advanced tab (placeholder for custom CSS)
function AdvancedTab({ layout = 'vertical' }: { layout?: 'vertical' | 'horizontal' }) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={isHorizontal ? 'flex gap-8' : 'space-y-4'}>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom CSS
        </label>
        <textarea
          disabled
          placeholder="Custom CSS support coming soon..."
          className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Advanced styling options will be available in a future update.
        </p>
      </div>
    </div>
  );
}

// Color input with picker
function ColorInput({
  color,
  onChange,
  showPicker,
  onTogglePicker,
  label,
}: {
  color: string;
  onChange: (color: string) => void;
  showPicker: boolean;
  onTogglePicker: () => void;
  label?: string;
}) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
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
