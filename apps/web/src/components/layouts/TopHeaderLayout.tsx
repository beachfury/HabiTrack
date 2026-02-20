// apps/web/src/components/layouts/TopHeaderLayout.tsx
// Top header layout component

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
  ChevronDown,
  Wallet,
  DollarSign,
  BookOpen,
  UtensilsCrossed,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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

interface TopHeaderLayoutProps {
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

export function TopHeaderLayout({
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
}: TopHeaderLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get theme values
  const colors = theme ? (resolvedMode === 'dark' ? theme.colorsDark : theme.colorsLight) : null;
  const layout = theme?.layout;
  const headerHeight = layout?.headerHeight || 64;
  const navStyle = layout?.navStyle || 'icons-text';

  // Get elementStyles from extended theme (new system)
  const extTheme = theme as ExtendedTheme | null;
  const headerElementStyle = extTheme?.elementStyles?.header;
  const pageBackgroundStyle = extTheme?.elementStyles?.['page-background'];

  // Build header styles - prioritize elementStyles (new) over colors (legacy)
  // Use theme's primary color for header accents (NOT household accentColor - that's login-only)
  const accentColor = colors?.primary || '#3cb371';

  // Header background
  let headerBg = colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
  const headerStyle: React.CSSProperties = {};

  if (headerElementStyle) {
    if (headerElementStyle.backgroundGradient) {
      const { from, to, direction } = headerElementStyle.backgroundGradient;
      headerStyle.background = `linear-gradient(${direction || 'to right'}, ${from}, ${to})`;
    } else if (headerElementStyle.backgroundColor) {
      headerBg = headerElementStyle.backgroundColor;
    }

    if (headerElementStyle.borderRadius !== undefined) {
      headerStyle.borderRadius = `${headerElementStyle.borderRadius}px`;
    }

    if (headerElementStyle.boxShadow) {
      const shadowMap: Record<string, string> = {
        none: 'none',
        subtle: '0 1px 3px rgba(0,0,0,0.08)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        strong: '0 10px 15px rgba(0,0,0,0.15)',
      };
      headerStyle.boxShadow = shadowMap[headerElementStyle.boxShadow] || headerElementStyle.boxShadow;
    }
  }

  const textColor = headerElementStyle?.textColor || colors?.foreground || (resolvedMode === 'dark' ? '#f9fafb' : '#1f2937');
  const mutedColor = colors?.mutedForeground || (resolvedMode === 'dark' ? '#9ca3af' : '#6b7280');
  const borderColor = headerElementStyle?.borderColor || colors?.border || (resolvedMode === 'dark' ? '#374151' : '#e5e7eb');

  // Border radius from theme
  const radiusMap = { none: '0', small: '0.25rem', medium: '0.5rem', large: '0.75rem' };
  const borderRadius = radiusMap[theme?.ui?.borderRadius || 'large'] || '0.75rem';

  const allNavItems = [...navItems, ...(isAdmin ? adminItems : []), ...userItems];

  const renderNavItem = (item: typeof navItems[0], hasUnread = false) => {
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 transition-colors relative"
        style={{
          borderRadius,
          backgroundColor: active ? `${accentColor}15` : 'transparent',
          color: active ? accentColor : mutedColor,
        }}
        title={navStyle === 'icons-only' ? item.label : undefined}
      >
        <div className="relative">
          {hasUnread ? (
            <>
              <item.icon size={18} className="bell-shake" style={{ color: '#f97316' }} />
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </>
          ) : (
            <item.icon size={18} />
          )}
        </div>
        {navStyle !== 'icons-only' && (
          <span className={`text-sm font-medium ${hasUnread ? 'text-[var(--color-primary)]' : ''}`}>
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Impersonation Banner */}
      {impersonation.active && (
        <div className="bg-[var(--color-warning)] text-[var(--color-warning-foreground)] px-4 py-2 flex items-center justify-center gap-4 z-50">
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
            className="ml-4 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 80%, black)', color: 'var(--color-warning-foreground)' }}
          >
            <X size={14} />
            Exit
          </button>
        </div>
      )}

      {/* Top Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 shadow-sm"
        style={{
          height: headerHeight,
          backgroundColor: headerBg,
          borderBottom: `1px solid ${borderColor}`,
          ...headerStyle,
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={householdSettings?.logoUrl
              ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${householdSettings.logoUrl}`
              : '/assets/HabiTrack_logo.png'
            }
            alt="HabiTrack Logo"
            className="w-8 h-8 object-contain"
          />
          <h1
            className="text-lg font-bold hidden sm:block"
            style={{ color: accentColor }}
          >
            {householdSettings?.name || 'HabiTrack'}
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const hasUnread = item.path === '/messages' && unreadCount > 0;
            return renderNavItem(item, hasUnread);
          })}
          {isAdmin && adminItems.map((item) => renderNavItem(item))}
          {userItems.map((item) => renderNavItem(item))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:opacity-80"
              style={{ color: textColor }}
            >
              {user?.avatarUrl ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${user.avatarUrl}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: user?.color || accentColor }}
                >
                  {user?.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <ChevronDown size={16} className="hidden sm:block" style={{ color: mutedColor }} />
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 py-2 shadow-lg border"
                style={{
                  backgroundColor: headerBg,
                  borderColor,
                  borderRadius,
                }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor }}>
                  <p className="font-medium text-sm" style={{ color: textColor }}>
                    {user?.displayName || 'Guest'}
                  </p>
                  <p className="text-xs capitalize" style={{ color: mutedColor }}>
                    {user?.role || 'Not logged in'}
                  </p>
                </div>

                {canImpersonate && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onShowUserSwitcher();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: accentColor }}
                  >
                    <UserCheck size={16} />
                    {impersonation.active ? 'Switch User' : 'View as User'}
                  </button>
                )}

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
                  style={{ color: mutedColor }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg"
            style={{ color: textColor }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-b shadow-sm py-2 px-4"
          style={{
            backgroundColor: headerBg,
            borderColor,
          }}
        >
          <nav className="flex flex-col gap-1">
            {allNavItems.map((item) => {
              const hasUnread = item.path === '/messages' && unreadCount > 0;
              return renderNavItem(item, hasUnread);
            })}
          </nav>
        </div>
      )}

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
        <div className="p-4 lg:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
