// apps/web/src/components/layouts/MinimalLayout.tsx
// Minimal layout with hamburger menu only

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
  Wallet,
  DollarSign,
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

interface MinimalLayoutProps {
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

export function MinimalLayout({
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
}: MinimalLayoutProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Get theme values
  const colors = theme ? (resolvedMode === 'dark' ? theme.colorsDark : theme.colorsLight) : null;

  // Get elementStyles from extended theme (new system)
  const extTheme = theme as ExtendedTheme | null;
  const pageBackgroundStyle = extTheme?.elementStyles?.['page-background'];

  // Build styles - use theme's primary color for accents (NOT household accentColor - that's login-only)
  const accentColor = colors?.primary || '#3cb371';

  // Page background color - check elementStyles first
  let bgColor = colors?.background || (resolvedMode === 'dark' ? '#111827' : '#f9fafb');
  let bgGradient: string | undefined;
  if (pageBackgroundStyle) {
    if (pageBackgroundStyle.backgroundGradient) {
      const { from, to, direction } = pageBackgroundStyle.backgroundGradient;
      bgGradient = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    } else if (pageBackgroundStyle.backgroundColor) {
      bgColor = pageBackgroundStyle.backgroundColor;
    }
  }
  const cardBg = colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
  const textColor = colors?.foreground || (resolvedMode === 'dark' ? '#f9fafb' : '#1f2937');
  const mutedColor = colors?.mutedForeground || (resolvedMode === 'dark' ? '#9ca3af' : '#6b7280');
  const borderColor = colors?.border || (resolvedMode === 'dark' ? '#374151' : '#e5e7eb');

  // Border radius from theme
  const radiusMap = { none: '0', small: '0.25rem', medium: '0.5rem', large: '0.75rem' };
  const borderRadius = radiusMap[theme?.ui?.borderRadius || 'large'] || '0.75rem';

  const renderNavItem = (item: typeof navItems[0], hasUnread = false) => {
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-4 px-4 py-3 transition-colors"
        style={{
          borderRadius,
          backgroundColor: active ? `${accentColor}15` : 'transparent',
          color: active ? accentColor : textColor,
        }}
      >
        <div className="relative">
          {hasUnread ? (
            <>
              <item.icon size={22} className="bell-shake" style={{ color: '#f97316' }} />
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </>
          ) : (
            <item.icon size={22} />
          )}
        </div>
        <span className={`text-base font-medium ${hasUnread ? 'text-[var(--color-primary)]' : ''}`}>
          {item.label}
        </span>
        {hasUnread && !active && (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full uppercase tracking-wide">
            New
          </span>
        )}
      </Link>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundColor: bgColor,
        background: bgGradient || undefined,
      }}
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
      {/* Impersonation Banner */}
      {impersonation.active && (
        <div className="bg-[var(--color-warning)] text-[var(--color-warning-foreground)] px-4 py-2 flex items-center justify-center gap-4 z-50">
          <UserCheck size={18} />
          <span className="text-sm">
            Viewing as <strong>{user?.displayName}</strong>
          </span>
          <button
            onClick={onStopImpersonating}
            className="ml-2 px-2 py-0.5 rounded text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 80%, black)', color: 'var(--color-warning-foreground)' }}
          >
            Exit
          </button>
        </div>
      )}

      {/* Floating menu button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg transition-transform hover:scale-105"
        style={{
          backgroundColor: cardBg,
          color: accentColor,
          borderRadius,
        }}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
        {unreadCount > 0 && !menuOpen && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-out menu */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] flex flex-col shadow-2xl transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: cardBg }}
      >
        {/* Menu header */}
        <div
          className="p-6 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <img
            src={householdSettings?.logoUrl
              ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${householdSettings.logoUrl}`
              : '/assets/HabiTrack_logo.png'
            }
            alt="HabiTrack Logo"
            className="w-10 h-10 object-contain"
          />
          <h1
            className="text-xl font-bold"
            style={{ color: accentColor }}
          >
            {householdSettings?.name || 'HabiTrack'}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const hasUnread = item.path === '/messages' && unreadCount > 0;
            return renderNavItem(item, hasUnread);
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                <p
                  className="px-4 text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: mutedColor }}
                >
                  Admin
                </p>
              </div>
              {adminItems.map((item) => renderNavItem(item))}
            </>
          )}

          {/* Settings */}
          <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
            {userItems.map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4" style={{ borderTop: `1px solid ${borderColor}` }}>
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
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ color: textColor }}>
                {user?.displayName || 'Guest'}
              </p>
              <p className="text-sm capitalize" style={{ color: mutedColor }}>
                {user?.role || 'Not logged in'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {canImpersonate && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onShowUserSwitcher();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}10`,
                  borderRadius,
                }}
              >
                <UserCheck size={16} />
                Switch
              </button>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
              style={{
                color: mutedColor,
                backgroundColor: `${mutedColor}15`,
                borderRadius,
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main
        className="flex-1 overflow-auto relative z-10"
        style={{
          // Apply global typography from theme
          fontFamily: theme?.typography?.fontFamily || 'var(--font-family)',
          fontSize: theme?.typography?.baseFontSize ? `${theme.typography.baseFontSize}px` : 'var(--font-size-base)',
          fontWeight: theme?.typography?.fontWeight
            ? ({ normal: 400, medium: 500, semibold: 600, bold: 700 }[theme.typography.fontWeight] || 400)
            : undefined,
        }}
      >
        <div className="p-4 pt-20 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
