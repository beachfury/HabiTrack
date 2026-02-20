// apps/web/src/components/themes/PreviewPages/SettingsPreview.tsx
// Settings page preview replica for theme editor - mirrors actual SettingsPage

import { Settings, User, Palette, Lock, Home, Sun, Moon, Monitor, Camera } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface SettingsPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Tab configuration - matches real SettingsPage
const TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'themes', icon: Palette, label: 'Themes', active: true },
  { id: 'appearance', icon: Settings, label: 'Appearance' },
  { id: 'security', icon: Lock, label: 'Security' },
  { id: 'household', icon: Home, label: 'Household' },
];

// Theme options - matches real page
const THEME_OPTIONS = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Monitor, label: 'System' },
];

export function SettingsPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: SettingsPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="settings-background"
      isSelected={selectedElement === 'settings-background'}
      onClick={() => onSelectElement('settings-background')}
      className="themed-settings-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Page header - matches real SettingsPage */}
        <div className="flex items-center gap-2">
          <Settings size={20} style={{ color: colors.primary }} />
          <div>
            <h1 className="text-lg font-bold">
              Settings
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Sidebar navigation - matches real page */}
          <ClickableElement
            element="settings-nav-card"
            isSelected={selectedElement === 'settings-nav-card'}
            onClick={() => onSelectElement('settings-nav-card')}
            className="themed-settings-nav w-32 flex-shrink-0"
          >
            <nav className="space-y-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                  style={{
                    backgroundColor: tab.active ? `${colors.primary}15` : 'transparent',
                    color: tab.active ? colors.primary : colors.mutedForeground,
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </ClickableElement>

          {/* Main content - matches real page */}
          <ClickableElement
            element="settings-content-card"
            isSelected={selectedElement === 'settings-content-card'}
            onClick={() => onSelectElement('settings-content-card')}
            className="themed-settings-content flex-1 space-y-4"
            style={{ padding: '12px' }}
          >
            {/* Profile section */}
            <div>
              <h2 className="text-sm font-semibold mb-3">
                Profile Settings
              </h2>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold relative"
                  style={{ backgroundColor: colors.primary }}
                >
                  U
                  <button
                    className="absolute -bottom-1 -right-1 p-1 rounded-full"
                    style={{ backgroundColor: colors.primary, border: `2px solid ${colors.card}` }}
                  >
                    <Camera size={8} style={{ color: colors.primaryForeground }} />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">User Name</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Admin</p>
                </div>
              </div>
            </div>

            {/* Theme mode selector - matches real Appearance tab */}
            <div>
              <label className="block text-xs font-medium mb-2">
                Theme
              </label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.id}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-medium"
                    style={{
                      backgroundColor: idx === (colorMode === 'dark' ? 1 : 0) ? `${colors.primary}15` : 'transparent',
                      border: idx === (colorMode === 'dark' ? 1 : 0) ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                      color: idx === (colorMode === 'dark' ? 1 : 0) ? colors.primary : colors.foreground,
                    }}
                  >
                    <opt.icon size={12} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input field example */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Nickname
              </label>
              <ClickableElement
                element="input"
                isSelected={selectedElement === 'input'}
                onClick={() => onSelectElement('input')}
              >
                <input
                  type="text"
                  defaultValue="User"
                  className="themed-input w-full px-2 py-1.5 outline-none text-xs"
                  readOnly
                />
              </ClickableElement>
            </div>

            {/* Save button */}
            <ClickableElement
              element="button-primary"
              isSelected={selectedElement === 'button-primary'}
              onClick={() => onSelectElement('button-primary')}
            >
              <button
                className="themed-btn-primary px-3 py-1.5 text-xs font-medium"
              >
                Save Profile
              </button>
            </ClickableElement>
          </ClickableElement>
        </div>
      </div>
    </ClickableElement>
  );
}
