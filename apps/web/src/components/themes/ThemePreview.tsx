// apps/web/src/components/themes/ThemePreview.tsx
// Live preview of theme settings

import { useState } from 'react';
import {
  Sun,
  Moon,
  Home,
  Calendar,
  ClipboardList,
  ShoppingCart,
  MessageSquare,
  Settings,
  User,
  Bell,
  Search,
  Plus,
  Check,
  X,
} from 'lucide-react';
import type { Theme } from '../../types/theme';

interface ThemePreviewProps {
  theme: Theme;
  colorMode: 'light' | 'dark';
  onColorModeChange: (mode: 'light' | 'dark') => void;
}

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard' },
  { icon: Calendar, label: 'Calendar' },
  { icon: ClipboardList, label: 'Chores' },
  { icon: ShoppingCart, label: 'Shopping' },
  { icon: MessageSquare, label: 'Messages' },
  { icon: Settings, label: 'Settings' },
];

export function ThemePreview({ theme, colorMode, onColorModeChange }: ThemePreviewProps) {
  const [activeNav, setActiveNav] = useState(0);
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  // Build sidebar background style
  const sidebarStyle: React.CSSProperties = {
    width: theme.layout.sidebarWidth || 256,
  };

  if (theme.sidebar) {
    if (theme.sidebar.backgroundType === 'solid') {
      sidebarStyle.backgroundColor = theme.sidebar.backgroundColor || colors.card;
    } else if (theme.sidebar.backgroundType === 'gradient') {
      sidebarStyle.background = `linear-gradient(${theme.sidebar.gradientDirection || '180deg'}, ${theme.sidebar.gradientFrom || colors.primary}, ${theme.sidebar.gradientTo || colors.accent})`;
    }
  } else {
    sidebarStyle.backgroundColor = colors.card;
  }

  // Page background style
  const pageStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.baseFontSize,
    lineHeight: theme.typography.lineHeight === 'compact' ? 1.4 : theme.typography.lineHeight === 'relaxed' ? 1.75 : 1.5,
  };

  if (theme.pageBackground.type === 'solid') {
    pageStyle.backgroundColor = theme.pageBackground.color || colors.background;
  } else if (theme.pageBackground.type === 'gradient') {
    pageStyle.background = `linear-gradient(${theme.pageBackground.gradientDirection || '180deg'}, ${theme.pageBackground.gradientFrom}, ${theme.pageBackground.gradientTo})`;
  } else {
    pageStyle.backgroundColor = colors.background;
  }

  // Border radius based on UI settings
  const radiusMap = { none: '0', small: '0.25rem', medium: '0.5rem', large: '1rem' };
  const borderRadius = radiusMap[theme.ui.borderRadius] || '0.5rem';

  // Shadow based on UI settings
  const shadowMap = {
    none: 'none',
    subtle: '0 1px 3px rgba(0,0,0,0.08)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    strong: '0 10px 15px rgba(0,0,0,0.15)',
  };
  const boxShadow = shadowMap[theme.ui.shadowIntensity] || 'none';

  const textColor = theme.sidebar?.textColor || (colorMode === 'dark' ? '#ffffff' : colors.foreground);
  const iconColor = theme.sidebar?.iconColor || textColor;

  return (
    <div className="h-full flex flex-col">
      {/* Preview header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Live Preview
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onColorModeChange('light')}
            className={`p-2 rounded-lg ${
              colorMode === 'light'
                ? 'bg-yellow-100 text-yellow-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sun size={18} />
          </button>
          <button
            onClick={() => onColorModeChange('dark')}
            className={`p-2 rounded-lg ${
              colorMode === 'dark'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Moon size={18} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-hidden" style={pageStyle}>
        <div className="h-full flex">
          {/* Sidebar */}
          {(theme.layout.type === 'sidebar-left' || theme.layout.type === 'sidebar-right') && (
            <div
              className={`flex flex-col relative overflow-hidden ${
                theme.layout.type === 'sidebar-right' ? 'order-2' : ''
              }`}
              style={sidebarStyle}
            >
              {/* Image background layer */}
              {theme.sidebar?.backgroundType === 'image' && theme.sidebar.imageUrl && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${theme.sidebar.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: (theme.sidebar.imageOpacity || 30) / 100,
                    filter: theme.sidebar.blur ? `blur(${theme.sidebar.blur}px)` : undefined,
                  }}
                />
              )}

              {/* Sidebar content */}
              <div className="relative flex-1 p-4">
                {/* Logo/Brand */}
                <div
                  className="text-xl font-bold mb-6"
                  style={{
                    color: textColor,
                    fontFamily: theme.typography.fontFamilyHeading || theme.typography.fontFamily,
                  }}
                >
                  {theme.name || 'HabiTrack'}
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {NAV_ITEMS.map((item, i) => (
                    <button
                      key={item.label}
                      onClick={() => setActiveNav(i)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                      style={{
                        borderRadius,
                        backgroundColor: activeNav === i ? `${colors.primary}20` : 'transparent',
                        color: activeNav === i ? colors.primary : textColor,
                      }}
                    >
                      {theme.layout.navStyle !== 'text-only' && (
                        <item.icon size={20} style={{ color: activeNav === i ? colors.primary : iconColor }} />
                      )}
                      {theme.layout.navStyle !== 'icons-only' && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* User section */}
              <div
                className="relative p-4 border-t"
                style={{ borderColor: `${textColor}20` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <User size={16} style={{ color: colors.primaryForeground }} />
                  </div>
                  {theme.layout.navStyle !== 'icons-only' && (
                    <div>
                      <div className="text-sm font-medium" style={{ color: textColor }}>
                        John Doe
                      </div>
                      <div className="text-xs" style={{ color: `${textColor}80` }}>
                        Admin
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top header (if top-header layout) */}
            {theme.layout.type === 'top-header' && (
              <header
                className="flex items-center justify-between px-6"
                style={{
                  height: theme.layout.headerHeight || 64,
                  backgroundColor: colors.card,
                  borderBottom: `1px solid ${colors.border}`,
                  boxShadow,
                }}
              >
                <div className="flex items-center gap-6">
                  <span
                    className="text-xl font-bold"
                    style={{
                      color: colors.foreground,
                      fontFamily: theme.typography.fontFamilyHeading || theme.typography.fontFamily,
                    }}
                  >
                    {theme.name || 'HabiTrack'}
                  </span>
                  <nav className="flex gap-1">
                    {NAV_ITEMS.slice(0, 5).map((item, i) => (
                      <button
                        key={item.label}
                        onClick={() => setActiveNav(i)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                          borderRadius,
                          backgroundColor: activeNav === i ? `${colors.primary}15` : 'transparent',
                          color: activeNav === i ? colors.primary : colors.mutedForeground,
                        }}
                      >
                        <item.icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  <Bell size={20} style={{ color: colors.mutedForeground }} />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                </div>
              </header>
            )}

            {/* Page content */}
            <div className="flex-1 p-6 overflow-auto">
              {/* Page header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{
                      color: colors.foreground,
                      fontFamily: theme.typography.fontFamilyHeading || theme.typography.fontFamily,
                    }}
                  >
                    {NAV_ITEMS[activeNav].label}
                  </h1>
                  <p style={{ color: colors.mutedForeground }} className="text-sm mt-1">
                    Welcome back! Here's what's happening today.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-2 px-3 py-2"
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.secondaryForeground,
                      borderRadius,
                    }}
                  >
                    <Search size={16} />
                    <span className="text-sm">Search</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryForeground,
                      borderRadius,
                      boxShadow: theme.ui.shadowIntensity !== 'none' ? '0 2px 4px rgba(0,0,0,0.1)' : undefined,
                    }}
                  >
                    <Plus size={16} />
                    <span className="text-sm">Add New</span>
                  </button>
                </div>
              </div>

              {/* Sample cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Stats card */}
                <div
                  className="p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderRadius,
                    boxShadow,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="text-sm" style={{ color: colors.mutedForeground }}>
                    Total Tasks
                  </div>
                  <div
                    className="text-3xl font-bold mt-1"
                    style={{ color: colors.foreground }}
                  >
                    24
                  </div>
                  <div
                    className="text-sm mt-2 flex items-center gap-1"
                    style={{ color: colors.success }}
                  >
                    <Check size={14} />
                    <span>8 completed today</span>
                  </div>
                </div>

                {/* List card */}
                <div
                  className="p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderRadius,
                    boxShadow,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    className="text-sm font-medium mb-3"
                    style={{ color: colors.foreground }}
                  >
                    Upcoming Tasks
                  </div>
                  <div className="space-y-2">
                    {['Clean kitchen', 'Take out trash', 'Water plants'].map((task, i) => (
                      <div
                        key={task}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: colors.foreground }}
                      >
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center"
                          style={{
                            borderColor: i === 0 ? colors.success : colors.border,
                            backgroundColor: i === 0 ? colors.success : 'transparent',
                          }}
                        >
                          {i === 0 && <Check size={10} style={{ color: colors.successForeground }} />}
                        </div>
                        <span className={i === 0 ? 'line-through opacity-60' : ''}>
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert card */}
                <div
                  className="col-span-2 p-4 flex items-center gap-3"
                  style={{
                    backgroundColor: `${colors.warning}15`,
                    borderRadius,
                    border: `1px solid ${colors.warning}40`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.warning }}
                  >
                    <Bell size={16} style={{ color: colors.warningForeground }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: colors.foreground }}>
                      Reminder
                    </div>
                    <div className="text-sm" style={{ color: colors.mutedForeground }}>
                      You have 3 overdue tasks that need attention.
                    </div>
                  </div>
                  <button
                    className="ml-auto p-1 rounded"
                    style={{ color: colors.mutedForeground }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
