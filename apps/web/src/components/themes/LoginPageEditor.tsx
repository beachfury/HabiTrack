// apps/web/src/components/themes/LoginPageEditor.tsx
// Orchestrator for login page styling - edits HOUSEHOLD BRANDING settings.
// The login page is household-wide (admin controls it), not per-theme,
// because before login we don't know which user/theme to use.
//
// This file manages all API calls and state, then delegates rendering
// to sub-editor components in the ./editors/ directory:
//   - LoginBackgroundEditor  (Background tab)
//   - LoginBrandEditor       (Branding/Text tab)
//   - LoginButtonEditor      (Button/Border tab)
//   - LoginEffectsEditor     (Effects tab - placeholder)
//   - LoginAdvancedEditor    (Advanced tab - placeholder)

import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Paintbrush, Type, Square, Sparkles, Code } from 'lucide-react';

import {
  BrandingData,
  HABITRACK_GREEN,
  HABITRACK_NAVY,
  HABITRACK_DEFAULT_BRANDING,
} from './editors/LoginBrandingTypes';
import { BackgroundTab } from './editors/LoginBackgroundEditor';
import { BrandingTab } from './editors/LoginBrandEditor';
import { ButtonTab } from './editors/LoginButtonEditor';
import { EffectsTab } from './editors/LoginEffectsEditor';
import { AdvancedTab } from './editors/LoginAdvancedEditor';

// ---------------------------------------------------------------------------
// Props & types
// ---------------------------------------------------------------------------

interface LoginPageEditorProps {
  onClose: () => void;
  onBrandingChange?: () => void; // Callback when branding is saved
  layout?: 'vertical' | 'horizontal'; // Layout mode for bottom panel support
}

type EditorTab = 'background' | 'text' | 'border' | 'effects' | 'advanced';

// ---------------------------------------------------------------------------
// Helpers (file upload utilities kept here because they use local refs)
// ---------------------------------------------------------------------------

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // API: Load current branding on mount
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // API: Save branding to household settings
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // API: Reset branding to HabiTrack defaults
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // File uploads
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Background-specific handlers
  // -------------------------------------------------------------------------

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

  const handleGradientChange = async (from: string, to: string) => {
    setGradientFrom(from);
    setGradientTo(to);
    await saveBranding({
      loginBackground: 'gradient',
      loginBackgroundValue: `${from},${to}`,
    });
  };

  const handleSolidColorChange = async (color: string) => {
    await saveBranding({
      loginBackground: 'solid',
      loginBackgroundValue: color,
    });
  };

  // -------------------------------------------------------------------------
  // Tab definitions
  // -------------------------------------------------------------------------

  const tabs: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'background', label: 'Background', icon: Paintbrush },
    { id: 'text', label: 'Branding', icon: Type },
    { id: 'border', label: 'Button', icon: Square },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  // -------------------------------------------------------------------------
  // Shared tab content renderer (used by both layouts)
  // -------------------------------------------------------------------------

  const renderTabContent = (currentLayout: 'vertical' | 'horizontal') => (
    <>
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
          layout={currentLayout}
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
          layout={currentLayout}
        />
      )}
      {activeTab === 'border' && (
        <ButtonTab
          branding={branding}
          saveBranding={saveBranding}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          layout={currentLayout}
        />
      )}
      {activeTab === 'effects' && (
        <EffectsTab layout={currentLayout} />
      )}
      {activeTab === 'advanced' && (
        <AdvancedTab layout={currentLayout} />
      )}
    </>
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Horizontal layout (bottom panel)
  // -------------------------------------------------------------------------

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
          {renderTabContent('horizontal')}
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Vertical layout (right panel) — default
  // -------------------------------------------------------------------------

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
        {renderTabContent('vertical')}
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
