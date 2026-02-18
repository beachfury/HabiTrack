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

// Parse CSS string to React CSSProperties object
// Converts "background: red; box-shadow: 0 0 10px blue;" to { background: 'red', boxShadow: '0 0 10px blue' }
function parseCustomCssToStyle(cssString: string): React.CSSProperties {
  const style: Record<string, string> = {};

  // Remove comments
  const cleanCss = cssString.replace(/\/\*[\s\S]*?\*\//g, '');

  // Split by semicolons, but be careful with values containing semicolons (rare but possible)
  const declarations = cleanCss.split(';').filter(d => d.trim());

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();

    if (!property || !value) continue;

    // Convert CSS property name to camelCase (e.g., "box-shadow" -> "boxShadow")
    const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    style[camelProperty] = value;
  }

  return style as React.CSSProperties;
}

// Detect animated background effect classes from customCSS string
// Supports: matrix-rain (with speed variants), snowfall, sparkle, bubbles, embers
function getAnimatedBackgroundClasses(customCSS?: string): string {
  if (!customCSS) return '';

  const classes: string[] = [];

  // Matrix rain effect with speed variants
  if (customCSS.includes('matrix-rain: true') || customCSS.includes('matrix-rain:true')) {
    classes.push('matrix-rain-bg');

    // Check for speed setting: matrix-rain-speed: slow | normal | fast | veryfast
    const speedMatch = customCSS.match(/matrix-rain-speed:\s*(slow|normal|fast|veryfast)/i);
    if (speedMatch) {
      classes.push(`matrix-rain-${speedMatch[1].toLowerCase()}`);
    }
  }

  // Snowfall effect
  if (customCSS.includes('snowfall: true') || customCSS.includes('snowfall:true')) {
    classes.push('snowfall-bg');
  }

  // Sparkle/stars effect
  if (customCSS.includes('sparkle: true') || customCSS.includes('sparkle:true')) {
    classes.push('sparkle-bg');
  }

  // Bubbles effect
  if (customCSS.includes('bubbles: true') || customCSS.includes('bubbles:true')) {
    classes.push('bubbles-bg');
  }

  // Embers/fire effect
  if (customCSS.includes('embers: true') || customCSS.includes('embers:true')) {
    classes.push('embers-bg');
  }

  return classes.join(' ');
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

  // Get page-specific background style based on current route
  const getPageBackgroundElement = (): 'page-background' | 'home-background' | 'calendar-background' | 'chores-background' | 'shopping-background' | 'messages-background' | 'settings-background' | 'budget-background' | 'meals-background' | 'recipes-background' => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home-background';
    if (path === '/calendar') return 'calendar-background';
    if (path === '/chores' || path === '/paid-chores') return 'chores-background';
    if (path === '/shopping') return 'shopping-background';
    if (path === '/messages') return 'messages-background';
    if (path === '/settings') return 'settings-background';
    if (path === '/budgets') return 'budget-background';
    if (path === '/meals') return 'meals-background';
    if (path === '/recipes') return 'recipes-background';
    return 'page-background';
  };

  const pageBackgroundElement = getPageBackgroundElement();
  const pageSpecificStyle = extTheme?.elementStyles?.[pageBackgroundElement];
  const globalPageStyle = extTheme?.elementStyles?.['page-background'];
  // Use page-specific style if it has any background customization, otherwise fall back to global
  const pageBackgroundStyle = (pageSpecificStyle && (
    pageSpecificStyle.backgroundColor ||
    pageSpecificStyle.backgroundGradient ||
    pageSpecificStyle.backgroundImage ||
    pageSpecificStyle.customCSS
  )) ? pageSpecificStyle : globalPageStyle;

  // Build sidebar styles - prioritize elementStyles (new system) over sidebar (old system)
  // Use theme's primary color for sidebar accents (NOT household accentColor - that's login-only)
  const accentColor = colors?.primary || '#3cb371';

  // Check if using new elementStyles system for BACKGROUND
  const hasBackgroundElementStyles = sidebarElementStyle && (
    sidebarElementStyle.backgroundColor ||
    sidebarElementStyle.backgroundGradient ||
    sidebarElementStyle.backgroundImage
  );

  // Check for legacy image background
  const hasLegacyImageBackground = !hasBackgroundElementStyles && sidebar?.backgroundType === 'image' && sidebar?.imageUrl;
  // Check for new elementStyles image background
  const hasElementStyleImage = sidebarElementStyle?.backgroundImage;
  const hasImageBackground = hasLegacyImageBackground || hasElementStyleImage;

  const sidebarStyle: React.CSSProperties = {
    width: sidebarWidth,
    minWidth: sidebarWidth,
    // NOTE: position is NOT set here — desktop sidebar uses 'relative' (via className + inline),
    // mobile sidebar uses 'fixed'. Setting it here would override mobile's fixed positioning.
    overflow: 'hidden',
  };

  // Apply text styling from elementStyles
  if (sidebarElementStyle?.fontFamily) {
    sidebarStyle.fontFamily = sidebarElementStyle.fontFamily;
  }
  if (sidebarElementStyle?.fontWeight) {
    const weightMap: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
    sidebarStyle.fontWeight = weightMap[sidebarElementStyle.fontWeight] || 400;
  }
  if (sidebarElementStyle?.textSize) {
    sidebarStyle.fontSize = `${sidebarElementStyle.textSize}px`;
  }

  // Apply BACKGROUND styles - prioritize elementStyles (new) over sidebar (legacy)
  if (hasBackgroundElementStyles) {
    // NEW SYSTEM: Use elementStyles for background
    if (sidebarElementStyle.backgroundGradient) {
      const { from, to, direction } = sidebarElementStyle.backgroundGradient;
      sidebarStyle.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    } else if (sidebarElementStyle.backgroundImage) {
      // Image will be handled via the background layer div
      sidebarStyle.backgroundColor = sidebarElementStyle.backgroundColor || colors?.card || (resolvedMode === 'dark' ? '#1f2937' : '#ffffff');
    } else if (sidebarElementStyle.backgroundColor) {
      sidebarStyle.backgroundColor = sidebarElementStyle.backgroundColor;
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

  // Apply border, shadow, blur, and effects from elementStyles (independent of background)
  if (sidebarElementStyle) {
    if (sidebarElementStyle.borderRadius !== undefined) {
      sidebarStyle.borderRadius = `${sidebarElementStyle.borderRadius}px`;
    }
    if (sidebarElementStyle.borderWidth && sidebarElementStyle.borderColor) {
      sidebarStyle.border = `${sidebarElementStyle.borderWidth}px ${sidebarElementStyle.borderStyle || 'solid'} ${sidebarElementStyle.borderColor}`;
    }

    // Box shadow and glow
    let shadowValue = '';
    if (sidebarElementStyle.boxShadow) {
      const shadowMap: Record<string, string> = {
        none: 'none',
        subtle: '0 1px 3px rgba(0,0,0,0.08)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        strong: '0 10px 15px rgba(0,0,0,0.15)',
      };
      shadowValue = shadowMap[sidebarElementStyle.boxShadow] || sidebarElementStyle.boxShadow;
    }
    if (sidebarElementStyle.glowColor && sidebarElementStyle.glowSize) {
      const glowShadow = `0 0 ${sidebarElementStyle.glowSize}px ${sidebarElementStyle.glowColor}`;
      shadowValue = shadowValue && shadowValue !== 'none' ? `${shadowValue}, ${glowShadow}` : glowShadow;
    }
    if (shadowValue) {
      sidebarStyle.boxShadow = shadowValue;
    }

    if (sidebarElementStyle.blur) {
      sidebarStyle.backdropFilter = `blur(${sidebarElementStyle.blur}px)`;
    }
    if (sidebarElementStyle.opacity !== undefined) {
      sidebarStyle.opacity = sidebarElementStyle.opacity;
    }
    if (sidebarElementStyle.padding) {
      sidebarStyle.padding = sidebarElementStyle.padding;
    }
    if (sidebarElementStyle.margin) {
      sidebarStyle.margin = sidebarElementStyle.margin;
    }

    // Transform effects
    const transforms: string[] = [];
    if (sidebarElementStyle.scale !== undefined && sidebarElementStyle.scale !== 1) {
      transforms.push(`scale(${sidebarElementStyle.scale})`);
    }
    if (sidebarElementStyle.rotate !== undefined && sidebarElementStyle.rotate !== 0) {
      transforms.push(`rotate(${sidebarElementStyle.rotate}deg)`);
    }
    if (sidebarElementStyle.skewX !== undefined && sidebarElementStyle.skewX !== 0) {
      transforms.push(`skewX(${sidebarElementStyle.skewX}deg)`);
    }
    if (sidebarElementStyle.skewY !== undefined && sidebarElementStyle.skewY !== 0) {
      transforms.push(`skewY(${sidebarElementStyle.skewY}deg)`);
    }
    if (transforms.length > 0) {
      sidebarStyle.transform = transforms.join(' ');
    }

    // Filters
    const filters: string[] = [];
    if (sidebarElementStyle.saturation !== undefined && sidebarElementStyle.saturation !== 100) {
      filters.push(`saturate(${sidebarElementStyle.saturation}%)`);
    }
    if (sidebarElementStyle.grayscale !== undefined && sidebarElementStyle.grayscale !== 0) {
      filters.push(`grayscale(${sidebarElementStyle.grayscale}%)`);
    }
    if (filters.length > 0) {
      sidebarStyle.filter = filters.join(' ');
    }

    // Transition for hover effects
    if (sidebarElementStyle.hoverScale || sidebarElementStyle.hoverOpacity) {
      sidebarStyle.transition = 'transform 0.2s ease, opacity 0.2s ease';
    }

    // Apply customCSS as inline styles (highest priority)
    // Parse CSS string and convert to React style object
    if (sidebarElementStyle.customCSS) {
      const customStyles = parseCustomCssToStyle(sidebarElementStyle.customCSS);

      // Clear conflicting properties before applying custom CSS
      // CSS shorthand properties (like 'background') don't override longhand (like 'backgroundColor') in JS objects
      if ('background' in customStyles) {
        delete sidebarStyle.backgroundColor;
        delete sidebarStyle.backgroundImage;
      }
      if ('border' in customStyles) {
        delete sidebarStyle.borderColor;
        delete sidebarStyle.borderWidth;
        delete sidebarStyle.borderStyle;
      }
      if ('borderRight' in customStyles) {
        delete sidebarStyle.borderRightColor;
        delete sidebarStyle.borderRightWidth;
        delete sidebarStyle.borderRightStyle;
      }

      Object.assign(sidebarStyle, customStyles);
    }
  }

  // Text color: prioritize new elementStyles system over legacy sidebar system
  const textColor = sidebarElementStyle?.textColor || sidebar?.textColor || colors?.foreground || (resolvedMode === 'dark' ? '#f9fafb' : '#1f2937');
  const iconColor = sidebar?.iconColor || textColor;
  const mutedColor = colors?.mutedForeground || (resolvedMode === 'dark' ? '#9ca3af' : '#6b7280');

  // Apply text color to sidebar style for CSS inheritance
  sidebarStyle.color = textColor;

  // Extract text styling for use in nav items (from customCSS and elementStyles)
  const textStyling: React.CSSProperties = {
    textShadow: sidebarStyle.textShadow,
    fontFamily: sidebarStyle.fontFamily,
    fontWeight: sidebarStyle.fontWeight,
    fontSize: sidebarStyle.fontSize,
  };

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
          ...textStyling,
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
            className="w-24 h-24 lg:w-48 lg:h-48 flex items-center justify-center"
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
              className="w-20 h-20 lg:w-44 lg:h-44 object-contain"
            />
          </div>
          {navStyle !== 'icons-only' && (
            <h1
              className="text-xl font-bold"
              style={{ color: accentColor, textShadow: textStyling.textShadow }}
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
                  style={{ color: mutedColor, textShadow: textStyling.textShadow }}
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
              <p className="font-medium truncate" style={{ color: textColor, textShadow: textStyling.textShadow }}>
                {user?.displayName || 'Guest'}
              </p>
              <p className="text-sm capitalize" style={{ color: mutedColor, textShadow: textStyling.textShadow }}>
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
            style={{ color: accentColor, borderRadius, textShadow: textStyling.textShadow }}
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
        {/* Note: We only apply default border classes when there's no customCSS that might define its own border */}
        {/* Check for animated background effect flags in customCSS */}
        <aside
          className={`hidden lg:flex flex-col relative overflow-hidden ${
            !sidebarElementStyle?.customCSS ? (side === 'right' ? 'border-l border-gray-200 dark:border-gray-700' : 'border-r border-gray-200 dark:border-gray-700') : ''
          } ${getAnimatedBackgroundClasses(sidebarElementStyle?.customCSS)}`}
          style={{ ...sidebarStyle, position: 'relative' }}
        >
          {sidebarContent}
        </aside>

        {/* Sidebar - mobile */}
        <aside
          className={`lg:hidden fixed inset-y-0 ${side === 'right' ? 'right-0' : 'left-0'} z-40 flex flex-col overflow-hidden transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full'
          }`}
          style={{ ...sidebarStyle, width: 280, position: 'fixed' }}
        >
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 overflow-auto relative ${getAnimatedBackgroundClasses(pageBackgroundStyle?.customCSS)}`}
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
          <div className="relative z-10 min-h-full pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
