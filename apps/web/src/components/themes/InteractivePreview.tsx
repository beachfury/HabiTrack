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
} from 'lucide-react';
import type { ExtendedTheme, ThemeableElement, ElementStyle } from '../../types/theme';
import { HomePreview } from './PreviewPages/HomePreview';
import { ChoresPreview } from './PreviewPages/ChoresPreview';
import { CalendarPreview } from './PreviewPages/CalendarPreview';
import { ShoppingPreview } from './PreviewPages/ShoppingPreview';
import { MessagesPreview } from './PreviewPages/MessagesPreview';
import { SettingsPreview } from './PreviewPages/SettingsPreview';
import { LoginPreview } from './PreviewPages/LoginPreview';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return url;
}

interface InteractivePreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  onColorModeChange: (mode: 'light' | 'dark') => void;
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement | null) => void;
  isAdmin?: boolean;
  brandingVersion?: number; // Increment to trigger LoginPreview refresh
}

type PreviewPage = 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'login';

// Tab order mirrors the actual app sidebar (see SidebarLayout.tsx navItems)
const PAGE_TABS: { id: PreviewPage; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { id: 'chores', label: 'Chores', icon: ClipboardList },
  { id: 'messages', label: 'Messages', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'login', label: 'Login', icon: Lock, adminOnly: true },
];

export function InteractivePreview({
  theme,
  colorMode,
  onColorModeChange,
  selectedElement,
  onSelectElement,
  isAdmin = false,
  brandingVersion = 0,
}: InteractivePreviewProps) {
  const [activePage, setActivePage] = useState<PreviewPage>('home');
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

  // Auto-switch to login page when login-page element is selected
  useEffect(() => {
    if (selectedElement === 'login-page') {
      setActivePage('login');
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

  // Check if there are element styles defined for sidebar
  const hasElementStyles = sidebarElementStyle && (
    sidebarElementStyle.backgroundColor ||
    sidebarElementStyle.backgroundGradient ||
    sidebarElementStyle.backgroundImage
  );

  if (hasElementStyles) {
    // Use element styles (new system)
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

    if (sidebarElementStyle.borderRadius !== undefined) {
      sidebarStyle.borderRadius = `${sidebarElementStyle.borderRadius}px`;
    }
    if (sidebarElementStyle.borderWidth && sidebarElementStyle.borderColor) {
      sidebarStyle.border = `${sidebarElementStyle.borderWidth}px ${sidebarElementStyle.borderStyle || 'solid'} ${sidebarElementStyle.borderColor}`;
    }
    if (sidebarElementStyle.boxShadow) {
      const shadowMap: Record<string, string> = {
        none: 'none',
        subtle: '0 1px 3px rgba(0,0,0,0.08)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        strong: '0 10px 15px rgba(0,0,0,0.15)',
      };
      sidebarStyle.boxShadow = shadowMap[sidebarElementStyle.boxShadow] || sidebarElementStyle.boxShadow;
    }
    if (sidebarElementStyle.blur) {
      sidebarStyle.backdropFilter = `blur(${sidebarElementStyle.blur}px)`;
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

  // Text color for sidebar
  const textColor = theme.sidebar?.textColor || colors.foreground;

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
              onClick={() => setActivePage(tab.id)}
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
            {/* Sidebar - only show for non-login pages */}
            {activePage !== 'login' && (theme.layout.type === 'sidebar-left' || theme.layout.type === 'sidebar-right') && (
              <ClickableElement
                element="sidebar"
                isSelected={selectedElement === 'sidebar'}
                onClick={() => handleElementClick('sidebar')}
                className={theme.layout.type === 'sidebar-right' ? 'order-2' : ''}
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
                    style={{ color: textColor }}
                  >
                    {theme.name || 'HabiTrack'}
                  </div>

                  <nav className="space-y-1 flex-1">
                    {PAGE_TABS.filter((t) => t.id !== 'login').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePage(tab.id);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                        style={{
                          borderRadius,
                          backgroundColor:
                            activePage === tab.id ? `${colors.primary}20` : 'transparent',
                          color: activePage === tab.id ? colors.primary : textColor,
                        }}
                      >
                        <tab.icon size={20} />
                        {theme.layout.navStyle !== 'icons-only' && (
                          <span className="text-sm font-medium">{tab.label}</span>
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

      {/* Element label */}
      {isHovered && !isSelected && (
        <div className="absolute top-1 right-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded shadow-lg pointer-events-none z-50">
          Click to edit {element.replace('-', ' ')}
        </div>
      )}

      {isSelected && (
        <div className="absolute top-1 right-1 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded shadow-lg pointer-events-none z-50">
          Editing: {element.replace('-', ' ')}
        </div>
      )}
    </div>
  );
}
