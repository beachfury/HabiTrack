// apps/web/src/components/themes/PreviewPages/SettingsPreview.tsx
// Settings page preview replica for theme editor - mirrors actual SettingsPage

import { Settings, User, Palette, Lock, Home, Sun, Moon, Monitor, Camera } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

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
  const cardStyle = theme.elementStyles?.card || {};
  const widgetStyle = theme.elementStyles?.widget || {};
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};
  const inputStyle = theme.elementStyles?.input || {};

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Build computed styles
  const computedCardStyle = buildElementStyle(cardStyle, colors.card, colors.border, defaultRadius, defaultShadow, colors.cardForeground);
  const computedWidgetStyle = buildElementStyle(widgetStyle, colors.muted, colors.border, defaultRadius, 'none', colors.foreground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.primary, colors.primaryForeground, 'transparent', '8px');
  const computedInputStyle = buildElementStyle(inputStyle, colors.background, colors.border, defaultRadius, 'none', colors.foreground);

  // Page-specific background
  const settingsBgStyle = theme.elementStyles?.['settings-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};
  const { style: pageBgStyle, backgroundImageUrl } = buildPageBackgroundStyle(
    settingsBgStyle,
    globalPageBgStyle,
    colors.background
  );

  return (
    <ClickableElement
      element="settings-background"
      isSelected={selectedElement === 'settings-background'}
      onClick={() => onSelectElement('settings-background')}
      className="flex-1 overflow-auto"
      style={pageBgStyle}
    >
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: settingsBgStyle.backgroundOpacity ?? globalPageBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}
      <div className="relative z-10 p-4">
        {/* Page header - matches real SettingsPage */}
        <div className="mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.foreground }}>
            <Settings size={20} style={{ color: colors.primary }} />
            Settings
          </h1>
          <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            Manage your account and preferences
          </p>
        </div>

        <div className="flex gap-4">
          {/* Sidebar navigation - matches real page */}
          <ClickableElement
            element="settings-nav-card"
            isSelected={selectedElement === 'settings-nav-card'}
            onClick={() => onSelectElement('settings-nav-card')}
            className="w-32 flex-shrink-0"
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
            className="flex-1"
            style={{
              ...computedCardStyle,
              padding: '12px',
            }}
          >
            {/* Profile section */}
            <div className="mb-4">
              <h2 className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
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
                  <p className="text-sm font-medium" style={{ color: colors.foreground }}>User Name</p>
                  <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Admin</p>
                </div>
              </div>
            </div>

            {/* Theme mode selector - matches real Appearance tab */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: colors.foreground }}>
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
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: colors.foreground }}>
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
                  className="w-full px-2 py-1.5 outline-none text-xs"
                  style={{
                    ...computedInputStyle,
                    color: colors.foreground,
                    borderRadius: defaultRadius,
                  }}
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
                className="px-4 py-1.5 text-xs font-medium"
                style={computedButtonPrimaryStyle}
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
