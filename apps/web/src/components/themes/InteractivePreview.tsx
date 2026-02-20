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
  Store,
} from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../types/theme';
import { buildCssVariables } from '../../context/css/index';
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
import { StorePreview } from './PreviewPages/StorePreview';

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
  onPageChange?: (page: 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'store' | 'modal' | 'login' | 'kiosk') => void;
  isAdmin?: boolean;
  brandingVersion?: number; // Increment to trigger LoginPreview refresh
}

type PreviewPage = 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'store' | 'modal' | 'login' | 'kiosk';

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
  { id: 'store', label: 'Store', icon: Store },
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

  // Build scoped CSS variables for the preview container
  // These override the document-level variables within the preview, so .themed-* classes pick up the editor's theme
  const previewCssVars = buildCssVariables(theme, colorMode, colors.accent || '#3cb371');
  const previewVarStyle: React.CSSProperties = {};
  for (const [key, value] of Object.entries(previewCssVars)) {
    (previewVarStyle as Record<string, string>)[key] = value;
  }

  // Handle element click
  const handleElementClick = useCallback(
    (element: ThemeableElement) => {
      onSelectElement(element === selectedElement ? null : element);
    },
    [selectedElement, onSelectElement]
  );

  // Sidebar width (layout property, not theme variable)
  const sidebarWidth = theme.layout.sidebarWidth || 256;

  // Page background style — CSS variables handle everything now via .themed-* classes
  // Only keep typography for the main flex container
  const pageStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.baseFontSize,
    backgroundColor: colors.background,
  };

  // Border radius for sidebar nav items
  const radiusMap = { none: '0', small: '4px', medium: '8px', large: '16px' };
  const borderRadius = radiusMap[theme.ui.borderRadius] || '8px';

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
          {/* App layout preview — scoped CSS variables for .themed-* classes */}
          <div className="h-full flex" style={{ ...pageStyle, ...previewVarStyle }}>
            {/* Sidebar - only show for pages that have sidebars (not login, kiosk, or modal) */}
            {activePage !== 'login' && activePage !== 'kiosk' && activePage !== 'modal' && (theme.layout.type === 'sidebar-left' || theme.layout.type === 'sidebar-right') && (
              <ClickableElement
                element="sidebar"
                isSelected={selectedElement === 'sidebar'}
                onClick={() => handleElementClick('sidebar')}
                className={`themed-sidebar ${theme.layout.type === 'sidebar-right' ? 'order-2' : ''} ${getAnimatedBackgroundClasses(theme.elementStyles?.sidebar?.customCSS)}`}
                style={{ width: sidebarWidth }}
              >
                {/* Sidebar navigation — .themed-sidebar handles bg, text, effects via CSS vars */}
                <div className="h-full flex flex-col p-4">
                  <div className="text-xl font-bold mb-6">
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
                          color: activePage === tab.id ? colors.primary : 'inherit',
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
              ) : activePage === 'store' ? (
                <StorePreview
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
