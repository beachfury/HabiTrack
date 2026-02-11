// apps/web/src/components/layouts/SidebarLayout.tsx
// Sidebar layout component (left or right)

import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  ShoppingCart,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  UserCheck,
  Bell,
  Menu,
  X,
  DollarSign,
  Wallet,
  BookOpen,
  UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import type { Theme, ExtendedTheme } from '../../types/theme';
import type { HouseholdSettings } from '../../api';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return url;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  theme: Theme | null;
  resolvedMode: 'light' | 'dark';
  householdSettings: HouseholdSettings | null;
  user: {
    displayName?: string;
    role?: string;
    avatarUrl?: string | null;
    color?: string | null;
  } | null;
  unreadCount: number;
  isAdmin: boolean;
  canImpersonate: boolean;
  impersonation: {
    active: boolean;
    originalAdmin?: { displayName: string } | null;
  };
  onLogout: () => void;
  onShowUserSwitcher: () => void;
  onStopImpersonating: () => void;
  side?: 'left' | 'right';
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/shopping', icon: ShoppingCart, label: 'Shopping' },
  { path: '/chores', icon: CheckSquare, label: 'Chores' },
  { path: '/paid-chores', icon: DollarSign, label: 'Paid Chores' },
  { path: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { path: '/recipes', icon: BookOpen, label: 'Recipes' },
  { path: '/messages', icon: Bell, label: 'Messages' },
];

const adminItems = [
  { path: '/family', icon: Users, label: 'Family' },
  { path: '/budgets', icon: Wallet, label: 'Budgets' },
];
const userItems = [{ path: '/settings', icon: Settings, label: 'Settings' }];

export function SidebarLayout({
  children,
  theme,
  resolvedMode,
  householdSettings,
  user,
  unreadCount,
  isAdmin,
  canImpersonate,
  impersonation,
  onLogout,
  onShowUserSwitcher,
  onStopImpersonating,
  side = 'left',
}: SidebarLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Get theme values
  const colors = theme ? (resolvedMode === 'dark' ? theme.colorsDark : theme.colorsLight) : null;
  const layout = theme?.layout;
  const sidebar = theme?.sidebar;
  const navStyle = layout?.navStyle || 'icons-text';
  const sidebarWidth = layout?.sidebarWidth || 256;

  // Get elementStyles from extended theme (new system)
  const extTheme = theme as ExtendedTheme | null;
  const sidebarElementStyle = extTheme?.elementStyles?.sidebar;
  const pageBackgroundStyle = extTheme?.elementStyles?.['page-background'];

  // Build sidebar styles - prioritize elementStyles (new system) over sidebar (old system)
  // Use theme's primary color for sidebar accents (NOT household accentColor - that's login-only)
  const accentColor = colors?.primary || '#3cb371';

  // Check if using new elementStyles system
  const hasElementStyles = sidebarElementStyle && (
    sidebarElementStyle.backgroundColor ||
    sidebarElementStyle.backgroundGradient ||
    sidebarElementStyle.backgroundImage
  );

  // Check for legacy image background
  const hasLegacyImageBackground = !hasElementStyles && sidebar?.backgroundType === 'image' && sidebar?.imageUrl;
  // Check for new elementStyles image background
  const hasElementStyleImage = sidebarElementStyle?.backgroundImage;
  const hasImageBackground = hasLegacyImageBackground || hasElementStyleImage;

  const sidebarStyle: React.CSSProperties = {
    width: sidebarWidth,
    minWidth: sidebarWidth,
    position: 'relative',
    overflow: 'hidden',
  };

  // Apply styles - prioritize elementStyles (new) over sidebar (legacy)
  if (hasElementStyles) {
    // NEW SYSTEM: Use elementStyles
    if (sidebarElementStyle.backgroundGradient) {
      const { from, to, direction } = sidebarElementStyle.backgroundGradient;
      sidebarStyle.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    } else if (sidebarElementStyle.backgroundImage) {
      // Image will be handled via the background layer div
      sidebarStyle.backgroundColor = sidebarElementStyle.backgroundColor || colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
    } else if (sidebarElementStyle.backgroundColor) {
      sidebarStyle.backgroundColor = sidebarElementStyle.backgroundColor;
    }

    // Apply border radius from elementStyles
    if (sidebarElementStyle.borderRadius !== undefined) {
      sidebarStyle.borderRadius = `${sidebarElementStyle.borderRadius}px`;
    }

    // Apply border from elementStyles
    if (sidebarElementStyle.borderWidth && sidebarElementStyle.borderColor) {
      sidebarStyle.border = `${sidebarElementStyle.borderWidth}px ${sidebarElementStyle.borderStyle || 'solid'} ${sidebarElementStyle.borderColor}`;
    }

    // Apply shadow from elementStyles
    if (sidebarElementStyle.boxShadow) {
      const shadowMap: Record<string, string> = {
        none: 'none',
        subtle: '0 1px 3px rgba(0,0,0,0.08)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        strong: '0 10px 15px rgba(0,0,0,0.15)',
      };
      sidebarStyle.boxShadow = shadowMap[sidebarElementStyle.boxShadow] || sidebarElementStyle.boxShadow;
    }
  } else if (sidebar) {
    // LEGACY SYSTEM: Use theme.sidebar
    if (sidebar.backgroundType === 'solid' && sidebar.backgroundColor) {
      sidebarStyle.backgroundColor = sidebar.backgroundColor;
    } else if (sidebar.backgroundType === 'gradient') {
      sidebarStyle.background = `linear-gradient(${sidebar.gradientDirection || '180deg'}, ${sidebar.gradientFrom}, ${sidebar.gradientTo})`;
    } else if (hasLegacyImageBackground) {
      // For image background, use a solid base color
      sidebarStyle.backgroundColor = colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
    } else {
      sidebarStyle.backgroundColor = colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
    }
  } else {
    sidebarStyle.backgroundColor = colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
  }

  const textColor = sidebar?.textColor || colors?.foreground || (resolvedMode === 'dark' ? '#f9fafb' : '#1f2937');
  const iconColor = sidebar?.iconColor || textColor;
  const mutedColor = colors?.mutedForeground || (resolvedMode === 'dark' ? '#9ca3af' : '#6b7280');

  // Border radius from theme
  const radiusMap = { none: '0', small: '0.25rem', medium: '0.5rem', large: '0.75rem' };
  const borderRadius = radiusMap[theme?.ui?.borderRadius || 'large'] || '0.75rem';

  const renderNavItem = (item: typeof navItems[0], hasUnread = false) => {
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 px-4 py-3 transition-colors relative"
        style={{
          borderRadius,
          backgroundColor: active ? `${accentColor}20` : 'transparent',
          color: active ? accentColor : textColor,
        }}
        title={navStyle === 'icons-only' ? item.label : undefined}
      >
        <div className="relative">
          {hasUnread ? (
            <>
              <item.icon size={20} className="bell-shake" style={{ color: '#f97316' }} />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </>
          ) : (
            <item.icon size={20} style={{ color: active ? accentColor : iconColor }} />
          )}
        </div>
        {navStyle !== 'icons-only' && (
          <span className={`font-medium ${hasUnread ? 'text-orange-500' : ''}`}>
            {item.label}
          </span>
        )}
        {hasUnread && !active && navStyle !== 'icons-only' && (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full uppercase tracking-wide animate-pulse">
            New
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Image background layer - must be first so it's behind other content */}
      {hasImageBackground && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: hasElementStyleImage
              ? `url(${resolveImageUrl(sidebarElementStyle!.backgroundImage)})`
              : `url(${resolveImageUrl(sidebar!.imageUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: hasElementStyleImage
              ? (sidebarElementStyle!.backgroundOpacity ?? 1)
              : (sidebar!.imageOpacity || 30) / 100,
            filter: hasElementStyleImage
              ? (sidebarElementStyle!.blur ? `blur(${sidebarElementStyle!.blur}px)` : undefined)
              : (sidebar!.blur ? `blur(${sidebar!.blur}px)` : undefined),
            zIndex: 0,
          }}
        />
      )}

      {/* Logo */}
      <div
        className="p-6 relative z-10"
        style={{ borderBottom: `1px solid ${textColor}15` }}
      >
        <Link to="/" className="flex flex-col items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-48 h-48 flex items-center justify-center"
            style={{
              filter: resolvedMode === 'dark'
                ? 'drop-shadow(0 0 25px rgba(79, 214, 147, 0.6)) drop-shadow(0 0 50px rgba(79, 214, 147, 0.35))'
                : 'drop-shadow(0 0 20px rgba(60, 179, 113, 0.45)) drop-shadow(0 0 40px rgba(60, 179, 113, 0.25))',
            }}
          >
            <img
              src={householdSettings?.logoUrl
                ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${householdSettings.logoUrl}`
                : '/assets/HabiTrack_logo.png'
              }
              alt="HabiTrack Logo"
              className="w-44 h-44 object-contain"
            />
          </div>
          {navStyle !== 'icons-only' && (
            <h1
              className="text-xl font-bold"
              style={{ color: accentColor }}
            >
              {householdSettings?.name || 'HabiTrack'}
            </h1>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const hasUnread = item.path === '/messages' && unreadCount > 0;
          return renderNavItem(item, hasUnread);
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${textColor}15` }}>
              {navStyle !== 'icons-only' && (
                <p
                  className="px-4 text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: mutedColor }}
                >
                  Admin
                </p>
              )}
            </div>
            {adminItems.map((item) => renderNavItem(item))}
          </>
        )}

        {/* Settings */}
        <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${textColor}15` }}>
          {userItems.map((item) => renderNavItem(item))}
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 relative z-10" style={{ borderTop: `1px solid ${textColor}15` }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {user?.avatarUrl ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${user.avatarUrl}`}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: user?.color || accentColor }}
            >
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          {navStyle !== 'icons-only' && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ color: textColor }}>
                {user?.displayName || 'Guest'}
              </p>
              <p className="text-sm capitalize" style={{ color: mutedColor }}>
                {user?.role || 'Not logged in'}
              </p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: mutedColor }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Impersonate User Button */}
        {canImpersonate && navStyle !== 'icons-only' && (
          <button
            onClick={onShowUserSwitcher}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl transition-colors hover:opacity-80"
            style={{ color: accentColor, borderRadius }}
          >
            <UserCheck size={16} />
            {impersonation.active ? 'Switch User' : 'View as User'}
          </button>
        )}
      </div>

    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Impersonation Banner */}
      {impersonation.active && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-4 z-50">
          <UserCheck size={18} />
          <span>
            Viewing as <strong>{user?.displayName}</strong> ({user?.role})
            {impersonation.originalAdmin && (
              <span className="opacity-75">
                {' '}— Logged in as {impersonation.originalAdmin.displayName}
              </span>
            )}
          </span>
          <button
            onClick={onStopImpersonating}
            className="ml-4 bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
          >
            <X size={14} />
            Exit
          </button>
        </div>
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
          style={{ color: accentColor }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`flex-1 flex ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        {/* Sidebar - desktop */}
        <aside
          className={`hidden lg:flex flex-col relative overflow-hidden ${
            side === 'right' ? 'border-l' : 'border-r'
          } border-gray-200 dark:border-gray-700`}
          style={sidebarStyle}
        >
          {sidebarContent}
        </aside>

        {/* Sidebar - mobile */}
        <aside
          className={`lg:hidden fixed inset-y-0 ${side === 'right' ? 'right-0' : 'left-0'} z-40 flex flex-col relative overflow-hidden transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full'
          }`}
          style={{ ...sidebarStyle, width: 280 }}
        >
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main
          className="flex-1 overflow-auto relative"
          style={(() => {
            const mainStyle: React.CSSProperties = {
              // Apply global typography from theme
              fontFamily: theme?.typography?.fontFamily || 'var(--font-family)',
              fontSize: theme?.typography?.baseFontSize ? `${theme.typography.baseFontSize}px` : 'var(--font-size-base)',
            };

            // Apply font weight if set
            if (theme?.typography?.fontWeight) {
              const weightMap: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
              mainStyle.fontWeight = weightMap[theme.typography.fontWeight] || 400;
            }

            // Check for new elementStyles page background
            if (pageBackgroundStyle) {
              if (pageBackgroundStyle.backgroundGradient) {
                const { from, to, direction } = pageBackgroundStyle.backgroundGradient;
                mainStyle.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
              } else if (pageBackgroundStyle.backgroundImage) {
                // For image backgrounds, set a base color (image rendered as separate layer)
                mainStyle.backgroundColor = pageBackgroundStyle.backgroundColor || colors?.background || (resolvedMode === 'dark' ? '#111827' : '#f9fafb');
              } else if (pageBackgroundStyle.backgroundColor) {
                mainStyle.backgroundColor = pageBackgroundStyle.backgroundColor;
              } else {
                mainStyle.backgroundColor = colors?.background || (resolvedMode === 'dark' ? '#111827' : '#f9fafb');
              }
            } else {
              mainStyle.backgroundColor = colors?.background || (resolvedMode === 'dark' ? '#111827' : '#f9fafb');
            }

            return mainStyle;
          })()}
        >
          {/* Background image layer for page background */}
          {pageBackgroundStyle?.backgroundImage && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${resolveImageUrl(pageBackgroundStyle.backgroundImage)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: pageBackgroundStyle.backgroundOpacity ?? 1,
                filter: pageBackgroundStyle.blur ? `blur(${pageBackgroundStyle.blur}px)` : undefined,
                zIndex: 0,
              }}
            />
          )}
          <div className="p-8 lg:p-8 pt-16 lg:pt-8 relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
