// apps/web/src/components/themes/InteractivePreview.tsx
// Interactive theme preview with click-to-edit functionality

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Home,
  Calendar,
  ClipboardList,
  ShoppingCart,
  Bell,
  Settings,
  Lock,
  Minus,
  Plus,
  Maximize2,
  LayoutGrid,
  Tablet,
  DollarSign,
  Users,
  Wallet,
  UtensilsCrossed,
  BookOpen,
} from 'lucide-react';
import type { ExtendedTheme, ThemeableElement, ElementStyle } from '../../types/theme';
import { HomePreview } from './PreviewPages/HomePreview';
import { ChoresPreview } from './PreviewPages/ChoresPreview';
import { CalendarPreview } from './PreviewPages/CalendarPreview';
import { ShoppingPreview } from './PreviewPages/ShoppingPreview';
import { MessagesPreview } from './PreviewPages/MessagesPreview';
import { SettingsPreview } from './PreviewPages/SettingsPreview';
import { LoginPreview } from './PreviewPages/LoginPreview';
import { ModalPreview } from './PreviewPages/ModalPreview';
import { KioskPreview } from './PreviewPages/KioskPreview';
import { BudgetPreview } from './PreviewPages/BudgetPreview';
import { MealsPreview } from './PreviewPages/MealsPreview';
import { RecipesPreview } from './PreviewPages/RecipesPreview';
import { PaidChoresPreview } from './PreviewPages/PaidChoresPreview';
import { FamilyPreview } from './PreviewPages/FamilyPreview';

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

  // Split by semicolons
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

interface InteractivePreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  onColorModeChange: (mode: 'light' | 'dark') => void;
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement | null) => void;
  onPageChange?: (page: 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'modal' | 'login' | 'kiosk') => void;
  isAdmin?: boolean;
  brandingVersion?: number; // Increment to trigger LoginPreview refresh
}

type PreviewPage = 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'modal' | 'login' | 'kiosk';

// Tab order mirrors the actual app sidebar (see SidebarLayout.tsx navItems)
const PAGE_TABS: { id: PreviewPage; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { id: 'chores', label: 'Chores', icon: ClipboardList },
  { id: 'paidchores', label: 'Paid Chores', icon: DollarSign },
  { id: 'messages', label: 'Messages', icon: Bell },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'modal', label: 'Modal', icon: LayoutGrid },
  { id: 'login', label: 'Login', icon: Lock, adminOnly: true },
  { id: 'kiosk', label: 'Kiosk', icon: Tablet, adminOnly: true },
];

export function InteractivePreview({
  theme,
  colorMode,
  onColorModeChange,
  selectedElement,
  onSelectElement,
  onPageChange,
  isAdmin = false,
  brandingVersion = 0,
}: InteractivePreviewProps) {
  const [activePage, setActivePage] = useState<PreviewPage>('home');

  // Notify parent when page changes
  const handlePageChange = (page: PreviewPage) => {
    setActivePage(page);
    onPageChange?.(page);
  };
  const [zoom, setZoom] = useState(75); // Higher default zoom
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Measure container size for responsive scaling and auto-fit zoom
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    // Auto-fit zoom on initial mount after layout settles
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const padding = 16;
        const availableWidth = rect.width - padding;
        const availableHeight = rect.height - padding;
        const scaleX = availableWidth / 960;
        const scaleY = availableHeight / 640;
        const fitZoom = Math.min(Math.floor(Math.min(scaleX, scaleY) * 100), 120);
        setZoom(Math.max(fitZoom, 70));
      }
    }, 150);

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, []);

  // Calculate optimal zoom based on container size
  const calculateFitZoom = useCallback(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 80;
    const padding = 16;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    const scaleX = availableWidth / 960;
    const scaleY = availableHeight / 640;
    return Math.min(Math.floor(Math.min(scaleX, scaleY) * 100), 120);
  }, [containerSize]);

  // Auto-switch to appropriate preview when special elements are selected
  useEffect(() => {
    if (selectedElement === 'login-page') {
      handlePageChange('login');
    } else if (selectedElement === 'kiosk') {
      handlePageChange('kiosk');
    } else if (selectedElement === 'modal') {
      handlePageChange('modal');
    }
  }, [selectedElement]);

  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  // Handle element click
  const handleElementClick = useCallback(
    (element: ThemeableElement) => {
      onSelectElement(element === selectedElement ? null : element);
    },
    [selectedElement, onSelectElement]
  );

  // Get element styles with defaults
  const getElementStyle = useCallback(
    (element: ThemeableElement): ElementStyle => {
      return theme.elementStyles?.[element] || {};
    },
    [theme.elementStyles]
  );

  // Build sidebar style - prioritize elementStyles over legacy theme.sidebar
  const sidebarElementStyle = getElementStyle('sidebar');
  const sidebarStyle: React.CSSProperties = {
    width: theme.layout.sidebarWidth || 256,
    position: 'relative',
    overflow: 'hidden',
  };

  // Check if there are BACKGROUND element styles defined for sidebar
  const hasBackgroundElementStyles = sidebarElementStyle && (
    sidebarElementStyle.backgroundColor ||
    sidebarElementStyle.backgroundGradient ||
    sidebarElementStyle.backgroundImage
  );

  // Apply background styles - prioritize elementStyles over legacy
  if (hasBackgroundElementStyles) {
    // Use element styles (new system) for background
    if (sidebarElementStyle.backgroundGradient) {
      const { from, to, direction } = sidebarElementStyle.backgroundGradient;
      sidebarStyle.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    } else if (sidebarElementStyle.backgroundImage) {
      const resolvedUrl = resolveImageUrl(sidebarElementStyle.backgroundImage);
      if (resolvedUrl) {
        sidebarStyle.backgroundImage = `url(${resolvedUrl})`;
      }
      sidebarStyle.backgroundSize = 'cover';
      sidebarStyle.backgroundPosition = 'center';
      if (sidebarElementStyle.backgroundColor) {
        sidebarStyle.backgroundColor = sidebarElementStyle.backgroundColor;
      }
    } else if (sidebarElementStyle.backgroundColor) {
      sidebarStyle.backgroundColor = sidebarElementStyle.backgroundColor;
    }
  } else if (theme.sidebar?.backgroundType === 'solid') {
    // Fallback to legacy sidebar settings
    sidebarStyle.backgroundColor = theme.sidebar.backgroundColor || colors.card;
  } else if (theme.sidebar?.backgroundType === 'gradient') {
    sidebarStyle.background = `linear-gradient(${theme.sidebar.gradientDirection || '180deg'}, ${theme.sidebar.gradientFrom || colors.primary}, ${theme.sidebar.gradientTo || colors.accent})`;
  } else if (theme.sidebar?.backgroundType === 'image' && theme.sidebar.imageUrl) {
    // Legacy image support is handled separately in the JSX
    sidebarStyle.backgroundColor = colors.card;
  } else {
    sidebarStyle.backgroundColor = colors.card;
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

  // Page background style - prioritize elementStyles over legacy pageBackground
  const pageBackgroundStyle = getElementStyle('page-background');
  const pageStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.baseFontSize,
    backgroundColor: colors.background,
  };

  const hasPageBgElementStyles = pageBackgroundStyle && (
    pageBackgroundStyle.backgroundColor ||
    pageBackgroundStyle.backgroundGradient ||
    pageBackgroundStyle.backgroundImage
  );

  if (hasPageBgElementStyles) {
    // Use element styles (new system)
    if (pageBackgroundStyle.backgroundGradient) {
      const { from, to, direction } = pageBackgroundStyle.backgroundGradient;
      pageStyle.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    } else if (pageBackgroundStyle.backgroundImage) {
      const resolvedUrl = resolveImageUrl(pageBackgroundStyle.backgroundImage);
      if (resolvedUrl) {
        pageStyle.backgroundImage = `url(${resolvedUrl})`;
      }
      pageStyle.backgroundSize = 'cover';
      pageStyle.backgroundPosition = 'center';
    } else if (pageBackgroundStyle.backgroundColor) {
      pageStyle.backgroundColor = pageBackgroundStyle.backgroundColor;
    }
  } else if (theme.pageBackground?.type === 'solid' && theme.pageBackground.color) {
    // Fallback to legacy pageBackground settings
    pageStyle.backgroundColor = theme.pageBackground.color;
  } else if (theme.pageBackground?.type === 'gradient') {
    pageStyle.background = `linear-gradient(${theme.pageBackground.gradientDirection || '180deg'}, ${theme.pageBackground.gradientFrom}, ${theme.pageBackground.gradientTo})`;
  }

  // Border radius
  const radiusMap = { none: '0', small: '4px', medium: '8px', large: '16px' };
  const borderRadius = radiusMap[theme.ui.borderRadius] || '8px';

  // Text color for sidebar - prioritize elementStyles over legacy sidebar system
  const textColor = sidebarElementStyle?.textColor || theme.sidebar?.textColor || colors.foreground;

  // Apply text styling from elementStyles to sidebar
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
  // Apply text color to sidebar style for CSS inheritance
  sidebarStyle.color = textColor;

  // Visible tabs based on admin status
  const visibleTabs = PAGE_TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Preview header with page tabs and controls */}
      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Page tabs */}
        <div className="flex gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handlePageChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activePage === tab.id
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Zoom out"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(120, z + 10))}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Zoom in"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setZoom(calculateFitZoom())}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-1"
              title="Fit to window"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Theme mode toggle */}
          <div className="flex gap-1 ml-2 border-l border-gray-200 dark:border-gray-600 pl-2">
            <button
              onClick={() => onColorModeChange('light')}
              className={`p-1.5 rounded ${
                colorMode === 'light'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Light mode"
            >
              <Sun size={16} />
            </button>
            <button
              onClick={() => onColorModeChange('dark')}
              className={`p-1.5 rounded ${
                colorMode === 'dark'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Dark mode"
            >
              <Moon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-2 flex items-start justify-center"
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
          style={{
            width: 960,
            height: 640,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            flexShrink: 0,
          }}
        >
          {/* App layout preview */}
          <div className="h-full flex" style={pageStyle}>
            {/* Sidebar - only show for pages that have sidebars (not login, kiosk, or modal) */}
            {activePage !== 'login' && activePage !== 'kiosk' && activePage !== 'modal' && (theme.layout.type === 'sidebar-left' || theme.layout.type === 'sidebar-right') && (
              <ClickableElement
                element="sidebar"
                isSelected={selectedElement === 'sidebar'}
                onClick={() => handleElementClick('sidebar')}
                className={`${theme.layout.type === 'sidebar-right' ? 'order-2' : ''} ${getAnimatedBackgroundClasses(sidebarElementStyle?.customCSS)}`}
                style={sidebarStyle}
              >
                {/* Image background */}
                {theme.sidebar?.backgroundType === 'image' && theme.sidebar.imageUrl && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${resolveImageUrl(theme.sidebar.imageUrl)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: (theme.sidebar.imageOpacity || 30) / 100,
                      filter: theme.sidebar.blur ? `blur(${theme.sidebar.blur}px)` : undefined,
                    }}
                  />
                )}

                {/* Sidebar navigation */}
                <div className="relative z-10 h-full flex flex-col p-4">
                  <div
                    className="text-xl font-bold mb-6"
                    style={{
                      color: textColor,
                      textShadow: sidebarStyle.textShadow,
                    }}
                  >
                    {theme.name || 'HabiTrack'}
                  </div>

                  <nav className="space-y-1 flex-1">
                    {PAGE_TABS.filter((t) => t.id !== 'login').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePageChange(tab.id);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                        style={{
                          borderRadius,
                          backgroundColor:
                            activePage === tab.id ? `${colors.primary}20` : 'transparent',
                          color: activePage === tab.id ? colors.primary : textColor,
                          textShadow: sidebarStyle.textShadow,
                          fontFamily: sidebarStyle.fontFamily,
                          fontWeight: sidebarStyle.fontWeight,
                          fontSize: sidebarStyle.fontSize,
                        }}
                      >
                        <tab.icon size={20} />
                        {theme.layout.navStyle !== 'icons-only' && (
                          <span className="font-medium">{tab.label}</span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </ClickableElement>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activePage === 'login' ? (
                <LoginPreview
                  key={brandingVersion}
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'kiosk' ? (
                <KioskPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'modal' ? (
                <ModalPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'home' ? (
                <HomePreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'chores' ? (
                <ChoresPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'calendar' ? (
                <CalendarPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'messages' ? (
                <MessagesPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'settings' ? (
                <SettingsPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'budget' ? (
                <BudgetPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'meals' ? (
                <MealsPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'recipes' ? (
                <RecipesPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'paidchores' ? (
                <PaidChoresPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : activePage === 'family' ? (
                <FamilyPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              ) : (
                <ShoppingPreview
                  theme={theme}
                  colorMode={colorMode}
                  selectedElement={selectedElement}
                  onSelectElement={handleElementClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Clickable element wrapper for click-to-edit
interface ClickableElementProps {
  element: ThemeableElement;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ClickableElement({
  element,
  isSelected,
  onClick,
  children,
  className = '',
  style = {},
}: ClickableElementProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative cursor-pointer transition-all ${className}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Hover/selection overlay */}
      {(isHovered || isSelected) && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isSelected
              ? 'ring-2 ring-emerald-500 ring-offset-2'
              : 'ring-1 ring-emerald-400'
          }`}
          style={{ borderRadius: 'inherit' }}
        />
      )}

      {/* Element label - only show on hover, not when selected (selected uses highlight border only) */}
      {isHovered && !isSelected && (
        <div className="absolute top-1 left-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded shadow-lg pointer-events-none z-50">
          Click to edit {element.replace('-', ' ')}
        </div>
      )}
    </div>
  );
}
