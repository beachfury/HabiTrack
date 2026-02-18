// apps/web/src/components/themes/ThemeEditorAdvanced.tsx
// Advanced theme editor with interactive preview and element-level customization

import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { X, Save, Undo2, Redo2, Palette, Layout, Type, Layers, Wand2, Upload, Image, Trash2, GripHorizontal, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type {
  Theme,
  ThemeColors,
  ThemeLayout,
  ThemeTypography,
  ThemeSidebar,
  ThemePageBackground,
  ThemeUI,
  ThemeIcons,
  CreateThemeInput,
  ExtendedTheme,
  ElementStyle,
  ThemeableElement,
  LoginPageStyle,
  LcarsMode,
} from '../../types/theme';
import {
  DEFAULT_COLORS_LIGHT,
  DEFAULT_COLORS_DARK,
  DEFAULT_LAYOUT,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_UI,
  DEFAULT_ICONS,
  DEFAULT_PAGE_BACKGROUND,
  DEFAULT_SIDEBAR,
} from '../../types/theme';
import { LayoutEditor } from './LayoutEditor';
import { TypographyEditor } from './TypographyEditor';
import { InteractivePreview } from './InteractivePreview';
import { ElementStyleEditor } from './ElementStyleEditor';
import { LoginPageEditor } from './LoginPageEditor';
import { KioskStyleEditor } from './KioskStyleEditor';
import { DEFAULT_LOGIN_PAGE } from '../../types/theme';
import type { KioskStyle } from '../../types/theme';
import * as themesApi from '../../api/themes';

type EditorTab = 'layout' | 'typography' | 'elements' | 'presets';

// History state for undo/redo
interface ThemeHistoryState {
  colorsLight: ThemeColors;
  colorsDark: ThemeColors;
  layout: ThemeLayout;
  typography: ThemeTypography;
  sidebar: ThemeSidebar;
  pageBackground: ThemePageBackground;
  ui: ThemeUI;
  icons: ThemeIcons;
  elementStyles: Partial<Record<ThemeableElement, ElementStyle>>;
  loginPage?: LoginPageStyle;
  lcarsMode?: LcarsMode;
  kioskStyle?: KioskStyle;
}

const MAX_HISTORY_SIZE = 30; // Allow up to 30 undo steps

// Custom hook for undo/redo functionality
function useThemeHistory(initialState: ThemeHistoryState) {
  const [history, setHistory] = useState<ThemeHistoryState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  const currentState = history[historyIndex];

  const pushState = useCallback((newState: ThemeHistoryState) => {
    // Don't push if this is from an undo/redo operation
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add the new state
      newHistory.push(newState);
      // Trim if exceeding max size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev - 1);
      return history[historyIndex - 1];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev + 1);
      return history[historyIndex + 1];
    }
    return null;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    historyLength: history.length,
  };
}

interface ThemeEditorAdvancedProps {
  theme?: Theme;
  onSave: (theme: Theme) => void;
  onClose: () => void;
}

export function ThemeEditorAdvanced({ theme, onSave, onClose }: ThemeEditorAdvancedProps) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isAdmin = user?.role === 'admin';
  const isEditing = !!theme;
  const isSystemTheme = theme?.isSystemTheme === true;
  const isDefaultTheme = theme?.isDefault === true;
  const canEditName = !isDefaultTheme; // Cannot rename default themes (HabiTrack Classic, Household Brand)

  // Form state
  const [name, setName] = useState(theme?.name || '');
  const [description, setDescription] = useState(theme?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(theme?.thumbnailUrl || '');
  const [isPublic, setIsPublic] = useState(theme?.isPublic ?? true);

  // Theme configuration state
  const [colorsLight, setColorsLight] = useState<ThemeColors>(theme?.colorsLight || DEFAULT_COLORS_LIGHT);
  const [colorsDark, setColorsDark] = useState<ThemeColors>(theme?.colorsDark || DEFAULT_COLORS_DARK);
  const [layout, setLayout] = useState<ThemeLayout>(theme?.layout || DEFAULT_LAYOUT);
  const [typography, setTypography] = useState<ThemeTypography>(theme?.typography || DEFAULT_TYPOGRAPHY);
  const [sidebar, setSidebar] = useState<ThemeSidebar>(theme?.sidebar || DEFAULT_SIDEBAR);
  const [pageBackground, setPageBackground] = useState<ThemePageBackground>(theme?.pageBackground || DEFAULT_PAGE_BACKGROUND);
  const [ui, setUi] = useState<ThemeUI>(theme?.ui || DEFAULT_UI);
  const [icons, setIcons] = useState<ThemeIcons>(theme?.icons || DEFAULT_ICONS);

  // Extended theme state
  const extTheme = theme as ExtendedTheme | undefined;
  const [elementStyles, setElementStyles] = useState<Partial<Record<ThemeableElement, ElementStyle>>>(
    extTheme?.elementStyles || {}
  );
  const [loginPage, setLoginPage] = useState<LoginPageStyle | undefined>(extTheme?.loginPage);
  const [lcarsMode, setLcarsMode] = useState<LcarsMode | undefined>(extTheme?.lcarsMode);
  const [kioskStyle, setKioskStyle] = useState<KioskStyle | undefined>(extTheme?.kioskStyle);

  // Track which page is currently being previewed
  type PreviewPage = 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'modal' | 'login' | 'kiosk';
  const [currentPreviewPage, setCurrentPreviewPage] = useState<PreviewPage>('home');

  // Create initial history state
  const initialHistoryState = useMemo<ThemeHistoryState>(() => ({
    colorsLight: theme?.colorsLight || DEFAULT_COLORS_LIGHT,
    colorsDark: theme?.colorsDark || DEFAULT_COLORS_DARK,
    layout: theme?.layout || DEFAULT_LAYOUT,
    typography: theme?.typography || DEFAULT_TYPOGRAPHY,
    sidebar: theme?.sidebar || DEFAULT_SIDEBAR,
    pageBackground: theme?.pageBackground || DEFAULT_PAGE_BACKGROUND,
    ui: theme?.ui || DEFAULT_UI,
    icons: theme?.icons || DEFAULT_ICONS,
    elementStyles: extTheme?.elementStyles || {},
    loginPage: extTheme?.loginPage,
    lcarsMode: extTheme?.lcarsMode,
    kioskStyle: extTheme?.kioskStyle,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []); // Only create once on mount

  // Undo/Redo history management
  const {
    pushState: pushHistoryState,
    undo: undoHistory,
    redo: redoHistory,
    canUndo,
    canRedo,
  } = useThemeHistory(initialHistoryState);

  // Ref to track if we're applying an undo/redo
  const isApplyingHistoryRef = useRef(false);

  // Ref to store current state for debounced history push
  const currentStateRef = useRef<ThemeHistoryState>({
    colorsLight,
    colorsDark,
    layout,
    typography,
    sidebar,
    pageBackground,
    ui,
    icons,
    elementStyles,
    loginPage,
    lcarsMode,
    kioskStyle,
  });

  // Keep ref updated with current state
  useEffect(() => {
    currentStateRef.current = {
      colorsLight,
      colorsDark,
      layout,
      typography,
      sidebar,
      pageBackground,
      ui,
      icons,
      elementStyles,
      loginPage,
      lcarsMode,
      kioskStyle,
    };
  }, [colorsLight, colorsDark, layout, typography, sidebar, pageBackground, ui, icons, elementStyles, loginPage, lcarsMode, kioskStyle]);

  // Debounced history push - only push after 500ms of no changes
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPushedStateRef = useRef<string>('');

  useEffect(() => {
    // Skip if we're applying a history state (undo/redo)
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }

    // Clear any pending timeout
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    // Set a new timeout to push history
    historyTimeoutRef.current = setTimeout(() => {
      const stateJson = JSON.stringify(currentStateRef.current);
      // Only push if state actually changed
      if (stateJson !== lastPushedStateRef.current) {
        lastPushedStateRef.current = stateJson;
        pushHistoryState(currentStateRef.current);
      }
    }, 500);

    return () => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
    };
  }, [colorsLight, colorsDark, layout, typography, sidebar, pageBackground, ui, icons, elementStyles, loginPage, lcarsMode, kioskStyle, pushHistoryState]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const prevState = undoHistory();
    if (prevState) {
      isApplyingHistoryRef.current = true;
      lastPushedStateRef.current = JSON.stringify(prevState);
      setColorsLight(prevState.colorsLight);
      setColorsDark(prevState.colorsDark);
      setLayout(prevState.layout);
      setTypography(prevState.typography);
      setSidebar(prevState.sidebar);
      setPageBackground(prevState.pageBackground);
      setUi(prevState.ui);
      setIcons(prevState.icons);
      setElementStyles(prevState.elementStyles);
      setLoginPage(prevState.loginPage);
      setLcarsMode(prevState.lcarsMode);
      setKioskStyle(prevState.kioskStyle);
    }
  }, [undoHistory]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const nextState = redoHistory();
    if (nextState) {
      isApplyingHistoryRef.current = true;
      lastPushedStateRef.current = JSON.stringify(nextState);
      setColorsLight(nextState.colorsLight);
      setColorsDark(nextState.colorsDark);
      setLayout(nextState.layout);
      setTypography(nextState.typography);
      setSidebar(nextState.sidebar);
      setPageBackground(nextState.pageBackground);
      setUi(nextState.ui);
      setIcons(nextState.icons);
      setElementStyles(nextState.elementStyles);
      setLoginPage(nextState.loginPage);
      setLcarsMode(nextState.lcarsMode);
      setKioskStyle(nextState.kioskStyle);
    }
  }, [redoHistory]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Ctrl+Shift+Z = Redo
          e.preventDefault();
          handleRedo();
        } else {
          // Ctrl+Z = Undo
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        // Ctrl+Y = Redo (alternative)
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // UI state
  const [activeTab, setActiveTab] = useState<EditorTab>('elements');
  // Initialize color mode from app's current theme mode
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(resolvedTheme);
  const [selectedElement, setSelectedElement] = useState<ThemeableElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [brandingVersion, setBrandingVersion] = useState(0); // Increment to trigger preview refresh

  // Bottom panel resize state - load from localStorage
  const [bottomPanelHeight, setBottomPanelHeight] = useState(() => {
    const saved = localStorage.getItem('theme-editor-bottom-height');
    return saved ? Math.max(150, Math.min(400, parseInt(saved))) : 220;
  });
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const resizeBottomRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const MIN_PANEL_HEIGHT = 150;
  const MAX_PANEL_HEIGHT = 400;

  // Left sidebar resize state - load from localStorage
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('theme-editor-left-width');
    return saved ? Math.max(220, Math.min(400, parseInt(saved))) : 280;
  });
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const resizeLeftRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const MIN_LEFT_WIDTH = 220;
  const MAX_LEFT_WIDTH = 400;

  // Save panel sizes to localStorage when they change
  useEffect(() => {
    localStorage.setItem('theme-editor-bottom-height', bottomPanelHeight.toString());
  }, [bottomPanelHeight]);

  useEffect(() => {
    localStorage.setItem('theme-editor-left-width', leftPanelWidth.toString());
  }, [leftPanelWidth]);

  // Handle bottom panel resize drag
  const handleResizeBottomMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingBottom(true);
    resizeBottomRef.current = { startY: e.clientY, startHeight: bottomPanelHeight };
  }, [bottomPanelHeight]);

  // Handle left panel resize drag
  const handleResizeLeftMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
    resizeLeftRef.current = { startX: e.clientX, startWidth: leftPanelWidth };
  }, [leftPanelWidth]);

  useEffect(() => {
    if (!isResizingBottom && !isResizingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingBottom && resizeBottomRef.current) {
        const deltaY = resizeBottomRef.current.startY - e.clientY;
        const newHeight = Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, resizeBottomRef.current.startHeight + deltaY));
        setBottomPanelHeight(newHeight);
      }
      if (isResizingLeft && resizeLeftRef.current) {
        const deltaX = e.clientX - resizeLeftRef.current.startX;
        const newWidth = Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, resizeLeftRef.current.startWidth + deltaX));
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingBottom(false);
      setIsResizingLeft(false);
      resizeBottomRef.current = null;
      resizeLeftRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingBottom, isResizingLeft]);

  // Helper to get full URL for uploaded assets
  const getAssetUrl = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      return `${apiBase}${path}`;
    }
    return path;
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum size is 2MB for thumbnails.');
      return;
    }

    setUploadingThumbnail(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const response = await fetch('/api/upload/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        setThumbnailUrl(data.url);
        setUploadingThumbnail(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploadingThumbnail(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload thumbnail:', err);
      setError('Failed to upload thumbnail. Please try again.');
      setUploadingThumbnail(false);
    }
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  useEffect(() => {
    setHasChanges(true);
  }, [name, description, thumbnailUrl, isPublic, colorsLight, colorsDark, layout, typography, sidebar, pageBackground, ui, icons, elementStyles, loginPage, lcarsMode, kioskStyle]);

  // Handle element style changes
  const handleElementStyleChange = useCallback((element: ThemeableElement, style: ElementStyle) => {
    setElementStyles((prev) => {
      // If style is empty (reset), remove the element from the styles
      if (!style || Object.keys(style).length === 0) {
        const newStyles = { ...prev };
        delete newStyles[element];
        return newStyles;
      }
      // Otherwise, update the style
      return {
        ...prev,
        [element]: style,
      };
    });
  }, []);

  // Handle "Make default for all X" - copies page-specific style to the global element
  const handleApplyAsDefault = useCallback((globalElement: ThemeableElement) => {
    if (!selectedElement) return;
    const currentStyle = elementStyles[selectedElement];
    if (!currentStyle) return;

    // Copy the page-specific style to the global element
    setElementStyles((prev) => ({
      ...prev,
      [globalElement]: { ...currentStyle },
    }));
  }, [selectedElement, elementStyles]);

  // Handle "Apply to all pages" - copies one page's element styles to all other pages
  const handleApplyPageToAll = useCallback((sourcePage: 'home' | 'calendar' | 'chores' | 'shopping' | 'messages' | 'settings') => {
    // Define element type mappings: what kind of element each page element is
    // This maps source elements to their "type" (background, card, widget, title)
    const pageElementTypes: Record<string, Record<string, string>> = {
      home: {
        'home-background': 'background',
        'home-title': 'title',
        'home-stats-widget': 'widget',
        'home-chores-card': 'card',
        'home-events-card': 'card',
        'home-weather-widget': 'widget',
        'home-leaderboard-widget': 'widget',
        'home-meals-widget': 'widget',
        'home-welcome-banner': 'banner',
      },
      calendar: {
        'calendar-background': 'background',
        'calendar-title': 'title',
        'calendar-grid': 'card',
        'calendar-meal-widget': 'widget',
        'calendar-user-card': 'card',
      },
      chores: {
        'chores-background': 'background',
        'chores-task-card': 'card',
        'chores-paid-card': 'card',
      },
      shopping: {
        'shopping-background': 'background',
        'shopping-list-card': 'card',
        'shopping-filter-widget': 'widget',
      },
      messages: {
        'messages-background': 'background',
        'messages-announcements-card': 'card',
        'messages-chat-card': 'card',
      },
      settings: {
        'settings-background': 'background',
        'settings-nav-card': 'card',
        'settings-content-card': 'card',
      },
    };

    // Define target elements for each page
    const targetPages: Record<string, Record<string, ThemeableElement>> = {
      calendar: {
        background: 'calendar-background',
        title: 'calendar-title',
        card: 'calendar-grid',
        widget: 'calendar-meal-widget',
      },
      chores: {
        background: 'chores-background',
        card: 'chores-task-card',
      },
      shopping: {
        background: 'shopping-background',
        card: 'shopping-list-card',
        widget: 'shopping-filter-widget',
      },
      messages: {
        background: 'messages-background',
        card: 'messages-announcements-card',
      },
      settings: {
        background: 'settings-background',
        card: 'settings-nav-card',
      },
      home: {
        background: 'home-background',
        card: 'home-chores-card',
        widget: 'home-stats-widget',
        title: 'home-title',
      },
      budget: {
        background: 'budget-background',
      },
      meals: {
        background: 'meals-background',
      },
      recipes: {
        background: 'recipes-background',
      },
      paidchores: {
        background: 'paidchores-background',
      },
      family: {
        background: 'family-background',
      },
    };

    const sourceElements = pageElementTypes[sourcePage];
    if (!sourceElements) return;

    const newStyles = { ...elementStyles };

    // For each element type on the source page
    for (const [sourceElement, elementType] of Object.entries(sourceElements)) {
      const sourceStyle = elementStyles[sourceElement as ThemeableElement];
      if (!sourceStyle) continue;

      // Apply to the same element type on all other pages
      for (const [pageName, pageTargets] of Object.entries(targetPages)) {
        if (pageName === sourcePage) continue; // Skip source page

        const targetElement = pageTargets[elementType];
        if (targetElement) {
          newStyles[targetElement] = { ...sourceStyle };
        }
      }
    }

    setElementStyles(newStyles);
  }, [elementStyles]);

  // Handle element selection from preview
  const handleSelectElement = useCallback((element: ThemeableElement | null) => {
    setSelectedElement(element);
    // Switch to elements tab when an element is selected
    if (element && activeTab !== 'elements') {
      setActiveTab('elements');
    }
  }, [activeTab]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Theme name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const themeData: CreateThemeInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        layout,
        colorsLight,
        colorsDark,
        typography,
        sidebar,
        pageBackground,
        ui,
        icons,
        isPublic,
        // Extended fields
        elementStyles: Object.keys(elementStyles).length > 0 ? elementStyles : undefined,
        loginPage: isAdmin ? loginPage : undefined,
        lcarsMode,
        kioskStyle: isAdmin ? kioskStyle : undefined,
      };

      let savedTheme: Theme;
      if (isEditing && theme) {
        savedTheme = await themesApi.updateTheme(theme.id, themeData);
      } else {
        savedTheme = await themesApi.createTheme(themeData);
      }

      setHasChanges(false);
      // Notify parent of the saved theme but don't close
      onSave(savedTheme);
      // Show success message (will auto-clear after 3 seconds)
      setSuccessMessage('Theme saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  const handleReset = () => {
    const message = isDefaultTheme && !isSystemTheme
      ? 'Reset Household Brand to HabiTrack defaults? This will remove all customizations.'
      : 'Reset all changes to defaults?';
    if (!confirm(message)) return;

    setColorsLight(DEFAULT_COLORS_LIGHT);
    setColorsDark(DEFAULT_COLORS_DARK);
    setLayout(DEFAULT_LAYOUT);
    setTypography(DEFAULT_TYPOGRAPHY);
    setSidebar(DEFAULT_SIDEBAR);
    setPageBackground(DEFAULT_PAGE_BACKGROUND);
    setUi(DEFAULT_UI);
    setIcons(DEFAULT_ICONS);
    setElementStyles({});
    setLoginPage(undefined);
    setLcarsMode(undefined);
    setKioskStyle(undefined);
  };

  const currentColors = colorMode === 'light' ? colorsLight : colorsDark;
  const setCurrentColors = colorMode === 'light' ? setColorsLight : setColorsDark;

  // Note: "Colors" tab removed - all color customization is now handled through
  // the "Elements" tab with click-to-edit in the preview. This provides
  // more granular control over each element's background, text, border, etc.
  const tabs: Array<{ id: EditorTab; label: string; icon: typeof Palette }> = [
    { id: 'elements', label: 'Elements', icon: Layers },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'typography', label: 'Type', icon: Type },
    { id: 'presets', label: 'Presets', icon: Wand2 },
  ];

  // Build current theme for preview
  const previewTheme: ExtendedTheme = {
    id: theme?.id || 'preview',
    name,
    description,
    thumbnailUrl: thumbnailUrl || undefined,
    layout,
    colorsLight,
    colorsDark,
    typography,
    sidebar,
    pageBackground,
    ui,
    icons,
    createdBy: theme?.createdBy || 0,
    isPublic,
    isApprovedForKids: theme?.isApprovedForKids || false,
    isDefault: theme?.isDefault || false,
    isSystemTheme: theme?.isSystemTheme || false, // For login preview to show correct branding
    usageCount: theme?.usageCount || 0,
    createdAt: theme?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elementStyles,
    loginPage,
    lcarsMode,
    kioskStyle,
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-100 dark:bg-gray-900">
      {/* Left Panel - Editor */}
      <div
        className="bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden flex-shrink-0 relative"
        style={{ width: leftPanelWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Theme' : 'Create Theme'}
          </h2>
          <div className="flex items-center gap-1">
            {/* Undo/Redo buttons */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-colors ${
                canUndo
                  ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-colors ${
                canRedo
                  ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={handleReset}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Reset all to defaults"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-3 mt-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* System theme warning */}
        {isSystemTheme && (
          <div className="mx-3 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg">
            This is a system theme and cannot be modified. Create a copy to customize.
          </div>
        )}

        {/* Theme name and description */}
        <div className="p-3 space-y-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEditName || isSystemTheme}
              className={`w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!canEditName || isSystemTheme ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="My Custom Theme"
            />
            {isDefaultTheme && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Default theme names cannot be changed
              </p>
            )}
          </div>

          {/* Theme Thumbnail */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme Icon
            </label>
            {thumbnailUrl ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0">
                  <img
                    src={getAssetUrl(thumbnailUrl)}
                    alt="Theme thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-1 flex-1">
                  <button
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Upload size={12} />
                    Change
                  </button>
                  <button
                    onClick={() => setThumbnailUrl('')}
                    className="px-2 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingThumbnail}
                className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
              >
                {uploadingThumbnail ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
                ) : (
                  <>
                    <Image size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Upload icon</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-2 flex-1">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Public</span>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex min-w-max px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {activeTab === 'layout' && (
            <LayoutEditor
              layout={layout}
              onChange={setLayout}
              ui={ui}
              onUiChange={setUi}
            />
          )}

          {activeTab === 'typography' && (
            <TypographyEditor
              typography={typography}
              onChange={setTypography}
            />
          )}

          {activeTab === 'elements' && (
            <ElementsTab
              elementStyles={elementStyles}
              onSelectElement={handleSelectElement}
              selectedElement={selectedElement}
              onApplyPageToAll={handleApplyPageToAll}
              currentPage={currentPreviewPage}
              isSystemTheme={isSystemTheme}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'presets' && (
            <PresetsTab
              onApplyPreset={(preset) => {
                if (preset.elementStyles) setElementStyles(preset.elementStyles);
                if (preset.lcarsMode) setLcarsMode(preset.lcarsMode);
                if (preset.colorsLight) setColorsLight(preset.colorsLight);
                if (preset.colorsDark) setColorsDark(preset.colorsDark);
              }}
            />
          )}
        </div>

        {/* Footer with save and exit buttons */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Success message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg">
              <Check size={16} />
              {successMessage}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || isSystemTheme}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Save size={16} />
            {isSystemTheme ? 'Cannot Edit System Theme' : saving ? 'Saving...' : isEditing ? 'Update Theme' : 'Create Theme'}
          </button>
          <button
            onClick={handleClose}
            className="w-full py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <LogOut size={16} />
            Exit Editor
          </button>
        </div>

        {/* Right edge resize handle */}
        <div
          className={`absolute top-0 right-0 w-1.5 h-full cursor-ew-resize hover:bg-emerald-400 transition-colors ${isResizingLeft ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}
          onMouseDown={handleResizeLeftMouseDown}
        />
      </div>

      {/* Center + Bottom Layout - Preview and Element Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Preview Area */}
        <div className={`${selectedElement ? 'flex-1' : 'h-full'} min-h-0`}>
          <InteractivePreview
            theme={previewTheme}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            selectedElement={selectedElement}
            onSelectElement={handleSelectElement}
            onPageChange={setCurrentPreviewPage}
            isAdmin={isAdmin}
            brandingVersion={brandingVersion}
          />
        </div>

        {/* Bottom Panel - Element Editor (when element selected) */}
        {selectedElement && (
          <div
            className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            style={{ height: bottomPanelHeight }}
          >
            {/* Resize handle */}
            <div
              className={`h-6 flex items-center justify-center cursor-ns-resize border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isResizingBottom ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}
              onMouseDown={handleResizeBottomMouseDown}
            >
              <div className="flex items-center gap-2 text-gray-400">
                <button
                  onClick={() => setBottomPanelHeight(Math.max(MIN_PANEL_HEIGHT, bottomPanelHeight - 50))}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Shrink panel"
                >
                  <ChevronDown size={14} />
                </button>
                <GripHorizontal size={16} className="text-gray-400" />
                <button
                  onClick={() => setBottomPanelHeight(Math.min(MAX_PANEL_HEIGHT, bottomPanelHeight + 50))}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Expand panel"
                >
                  <ChevronUp size={14} />
                </button>
              </div>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-hidden">
              {selectedElement === 'login-page' && isAdmin && !isSystemTheme ? (
                <LoginPageEditor
                  onClose={() => setSelectedElement(null)}
                  onBrandingChange={() => setBrandingVersion(v => v + 1)}
                  layout="horizontal"
                />
              ) : selectedElement === 'kiosk' && isAdmin && !isSystemTheme ? (
                <KioskStyleEditor
                  style={kioskStyle || {}}
                  onChange={(style) => setKioskStyle(style)}
                  onClose={() => setSelectedElement(null)}
                  isReadOnly={isSystemTheme}
                  layout="horizontal"
                />
              ) : (
                <ElementStyleEditor
                  element={selectedElement}
                  style={elementStyles[selectedElement] || {}}
                  onChange={(style) => handleElementStyleChange(selectedElement, style)}
                  onClose={() => setSelectedElement(null)}
                  onApplyAsDefault={handleApplyAsDefault}
                  isReadOnly={isSystemTheme}
                  layout="horizontal"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Elements overview tab
type PreviewPage = 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'modal' | 'login' | 'kiosk';

function ElementsTab({
  elementStyles,
  onSelectElement,
  selectedElement,
  onApplyPageToAll,
  currentPage,
  isSystemTheme = false,
  isAdmin = false,
}: {
  elementStyles: Partial<Record<ThemeableElement, ElementStyle>>;
  onSelectElement: (element: ThemeableElement) => void;
  selectedElement: ThemeableElement | null;
  onApplyPageToAll: (sourcePage: 'home' | 'calendar' | 'chores' | 'shopping' | 'messages' | 'settings') => void;
  currentPage: PreviewPage;
  isSystemTheme?: boolean;
  isAdmin?: boolean;
}) {
  // Global elements shared across all pages
  const globalElements: { id: ThemeableElement; label: string; description: string }[] = [
    { id: 'sidebar', label: 'Sidebar', description: 'Navigation sidebar (all pages)' },
    { id: 'button-primary', label: 'Primary Buttons', description: 'Main action buttons (all pages)' },
    { id: 'button-secondary', label: 'Secondary Buttons', description: 'Alternative buttons (all pages)' },
    { id: 'input', label: 'Input Fields', description: 'Text inputs and forms (all pages)' },
  ];

  // Page-specific elements - only show for the current page
  const pageElements: Record<PreviewPage, { id: ThemeableElement; label: string; description: string }[]> = {
    home: [
      { id: 'home-background', label: 'Page Background', description: 'Home page background' },
      { id: 'home-title', label: 'Page Title', description: '"Home" heading text' },
      { id: 'home-welcome-banner', label: 'Welcome Banner', description: 'Greeting banner at top of page' },
      { id: 'home-stats-widget', label: 'Stats Widget', description: 'Quick stats summary widget' },
      { id: 'home-chores-card', label: 'Chores Card', description: "Today's chores card" },
      { id: 'home-events-card', label: 'Events Card', description: "Today's events card" },
      { id: 'home-weather-widget', label: 'Weather Widget', description: 'Weather display widget' },
      { id: 'home-leaderboard-widget', label: 'Leaderboard Widget', description: 'Points leaderboard' },
      { id: 'home-meals-widget', label: 'Meals Widget', description: 'Upcoming meals preview' },
    ],
    calendar: [
      { id: 'calendar-background', label: 'Page Background', description: 'Calendar page background' },
      { id: 'calendar-title', label: 'Page Title', description: 'Month/Year heading text' },
      { id: 'calendar-grid', label: 'Calendar Grid', description: 'Main calendar card' },
      { id: 'calendar-meal-widget', label: 'Meal Planner', description: 'Weekly meal plan widget' },
      { id: 'calendar-user-card', label: 'User Schedule Cards', description: "Member's daily schedule cards" },
    ],
    chores: [
      { id: 'chores-background', label: 'Page Background', description: 'Chores page background' },
      { id: 'chores-task-card', label: 'Task List Card', description: 'Main chores list' },
      { id: 'chores-paid-card', label: 'Paid Chores Card', description: 'Paid chores/race section' },
    ],
    shopping: [
      { id: 'shopping-background', label: 'Page Background', description: 'Shopping page background' },
      { id: 'shopping-filter-widget', label: 'Filter Widget', description: 'Category filter bar' },
      { id: 'shopping-list-card', label: 'Shopping List', description: 'Main shopping list card' },
    ],
    messages: [
      { id: 'messages-background', label: 'Page Background', description: 'Messages page background' },
      { id: 'messages-announcements-card', label: 'Announcements', description: 'Family announcements section' },
      { id: 'messages-chat-card', label: 'Chat Card', description: 'Direct messages section' },
    ],
    settings: [
      { id: 'settings-background', label: 'Page Background', description: 'Settings page background' },
      { id: 'settings-nav-card', label: 'Navigation Card', description: 'Settings navigation sidebar' },
      { id: 'settings-content-card', label: 'Content Card', description: 'Settings content area' },
    ],
    budget: [
      { id: 'budget-background', label: 'Page Background', description: 'Budget page background' },
    ],
    meals: [
      { id: 'meals-background', label: 'Page Background', description: 'Meals page background' },
    ],
    recipes: [
      { id: 'recipes-background', label: 'Page Background', description: 'Recipes page background' },
    ],
    paidchores: [
      { id: 'paidchores-background', label: 'Page Background', description: 'Paid Chores page background' },
    ],
    family: [
      { id: 'family-background', label: 'Page Background', description: 'Family page background' },
    ],
    modal: [
      { id: 'modal', label: 'Modal Dialog', description: 'Popup dialog styling' },
    ],
    login: isAdmin && !isSystemTheme ? [
      { id: 'login-page', label: 'Login Page', description: 'Household branding (login screen)' },
    ] : [],
    kiosk: isAdmin && !isSystemTheme ? [
      { id: 'kiosk', label: 'Kiosk Mode', description: 'Tablet/kiosk PIN login screen' },
    ] : [],
  };

  // Get current page elements
  const currentPageElements = pageElements[currentPage] || [];
  const pageName = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

  const renderElementButton = (el: { id: ThemeableElement; label: string; description: string }) => {
    const hasCustomStyle = elementStyles[el.id] && Object.keys(elementStyles[el.id]!).length > 0;
    return (
      <button
        key={el.id}
        onClick={() => !isSystemTheme && onSelectElement(el.id)}
        disabled={isSystemTheme}
        className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
          selectedElement === el.id
            ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
            : isSystemTheme
              ? 'bg-gray-50 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isSystemTheme ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {el.label}
            </span>
            {hasCustomStyle && !isSystemTheme && (
              <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
                Custom
              </span>
            )}
            {isSystemTheme && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
                Locked
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {el.description}
          </p>
        </div>
      </button>
    );
  };

  // Determine if current page supports "Apply to all"
  const canApplyToAll = ['home', 'calendar', 'chores', 'shopping', 'messages', 'settings'].includes(currentPage);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isSystemTheme
          ? 'HabiTrack Classic cannot be modified. This is the default branding.'
          : `Editing ${pageName} page. Click an element below or in the preview to customize.`}
      </p>

      {/* Current Page Elements */}
      {currentPageElements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {pageName} Page Elements
            </h4>
            {!isSystemTheme && canApplyToAll && (
              <button
                onClick={() => onApplyPageToAll(currentPage as 'home' | 'calendar' | 'chores' | 'shopping' | 'messages' | 'settings')}
                className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                title={`Apply ${pageName} page styling to all other pages`}
              >
                Apply to all pages
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {currentPageElements.map(renderElementButton)}
          </div>
        </div>
      )}

      {/* Global Elements */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
          Global Elements
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Shared across all pages
        </p>
        <div className="space-y-1.5">
          {globalElements.map(renderElementButton)}
        </div>
      </div>
    </div>
  );
}

// Theme presets tab
function PresetsTab({
  onApplyPreset,
}: {
  onApplyPreset: (preset: Partial<ExtendedTheme>) => void;
}) {
  const presets: { name: string; description: string; preset: Partial<ExtendedTheme> }[] = [
    {
      name: 'LCARS',
      description: 'Star Trek-inspired interface',
      preset: {
        elementStyles: {
          sidebar: {
            backgroundColor: '#000000',
            borderRadius: 0,
            customCSS: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;',
          },
          card: {
            backgroundColor: 'rgba(204, 153, 0, 0.15)',
            borderColor: '#cc9900',
            borderWidth: 2,
            borderRadius: 0,
          },
          'button-primary': {
            backgroundColor: '#cc9900',
            borderRadius: 15,
            customCSS: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);',
          },
          widget: {
            backgroundColor: 'rgba(153, 153, 255, 0.1)',
            borderColor: '#9999ff',
            borderWidth: 1,
            borderRadius: 0,
          },
        },
        lcarsMode: {
          enabled: true,
          cornerStyle: 'lcars-curve',
          colorScheme: {
            primary: '#cc9900',
            secondary: '#9999ff',
            tertiary: '#cc6666',
            background: '#000000',
          },
        },
      },
    },
    {
      name: 'Glassmorphism',
      description: 'Frosted glass effect',
      preset: {
        elementStyles: {
          card: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            blur: 10,
          },
          sidebar: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            blur: 20,
          },
        },
      },
    },
    {
      name: 'Sharp',
      description: 'No rounded corners',
      preset: {
        elementStyles: {
          card: { borderRadius: 0 },
          widget: { borderRadius: 0 },
          'button-primary': { borderRadius: 0 },
          'button-secondary': { borderRadius: 0 },
          input: { borderRadius: 0 },
          modal: { borderRadius: 0 },
        },
      },
    },
    {
      name: 'Pill',
      description: 'Maximum rounded corners',
      preset: {
        elementStyles: {
          card: { borderRadius: 24 },
          widget: { borderRadius: 16 },
          'button-primary': { borderRadius: 9999 },
          'button-secondary': { borderRadius: 9999 },
          input: { borderRadius: 9999 },
        },
      },
    },
    {
      name: 'Neon',
      description: 'Glowing borders',
      preset: {
        elementStyles: {
          card: {
            backgroundColor: 'rgba(60, 179, 113, 0.1)',
            borderColor: '#3cb371',
            borderWidth: 1,
            boxShadow: '0 0 20px rgba(60, 179, 113, 0.3)',
          },
          'button-primary': {
            boxShadow: '0 0 15px rgba(60, 179, 113, 0.5)',
          },
        },
      },
    },
    {
      name: 'Matrix (Slow)',
      description: 'Digital rain - peaceful speed',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #000800 0%, #001a00 50%, #000800 100%);
border-right: 2px solid #00ff00;
box-shadow: inset 0 0 30px rgba(0,255,0,0.15), 0 0 25px rgba(0,255,0,0.4);
text-shadow: 0 0 8px #00ff00;
matrix-rain: true;
matrix-rain-speed: slow;`,
            textColor: '#00ff00',
          },
          card: {
            backgroundColor: 'rgba(0, 40, 0, 0.9)',
            borderColor: '#00ff00',
            borderWidth: 1,
            textColor: '#00ff00',
          },
        },
        colorsDark: {
          primary: '#00ff00',
          primaryForeground: '#000800',
          secondary: '#003300',
          secondaryForeground: '#00ff00',
          accent: '#00ff00',
          accentForeground: '#000800',
          background: '#000800',
          foreground: '#00ff00',
          card: '#001a00',
          cardForeground: '#00ff00',
          muted: '#002200',
          mutedForeground: '#00cc00',
          border: '#003300',
          destructive: '#ff0000',
          destructiveForeground: '#ffffff',
          success: '#00ff00',
          successForeground: '#000800',
          warning: '#ffff00',
          warningForeground: '#000000',
        },
      },
    },
    {
      name: 'Matrix (Fast)',
      description: 'Digital rain - intense hacker mode',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #000800 0%, #001a00 50%, #000800 100%);
border-right: 2px solid #00ff00;
box-shadow: inset 0 0 30px rgba(0,255,0,0.15), 0 0 25px rgba(0,255,0,0.4);
text-shadow: 0 0 8px #00ff00;
animation: crt-flicker 0.1s infinite;
matrix-rain: true;
matrix-rain-speed: fast;`,
            textColor: '#00ff00',
          },
          card: {
            backgroundColor: 'rgba(0, 40, 0, 0.9)',
            borderColor: '#00ff00',
            borderWidth: 1,
            textColor: '#00ff00',
          },
        },
        colorsDark: {
          primary: '#00ff00',
          primaryForeground: '#000800',
          secondary: '#003300',
          secondaryForeground: '#00ff00',
          accent: '#00ff00',
          accentForeground: '#000800',
          background: '#000800',
          foreground: '#00ff00',
          card: '#001a00',
          cardForeground: '#00ff00',
          muted: '#002200',
          mutedForeground: '#00cc00',
          border: '#003300',
          destructive: '#ff0000',
          destructiveForeground: '#ffffff',
          success: '#00ff00',
          successForeground: '#000800',
          warning: '#ffff00',
          warningForeground: '#000000',
        },
      },
    },
    {
      name: 'Winter Wonderland',
      description: 'Snowfall effect with icy colors',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #1a2a3a 0%, #0d1a26 100%);
border-right: 1px solid #87ceeb;
box-shadow: inset 0 0 20px rgba(135,206,235,0.1);
snowfall: true;`,
            textColor: '#e0f0ff',
          },
          card: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: '#87ceeb',
            borderWidth: 1,
            blur: 8,
          },
        },
        colorsLight: {
          primary: '#4a90d9',
          primaryForeground: '#ffffff',
          secondary: '#e8f4fc',
          secondaryForeground: '#2c5282',
          accent: '#63b3ed',
          accentForeground: '#1a365d',
          background: '#f0f8ff',
          foreground: '#2d3748',
          card: '#ffffff',
          cardForeground: '#2d3748',
          muted: '#e2e8f0',
          mutedForeground: '#718096',
          border: '#bee3f8',
          destructive: '#e53e3e',
          destructiveForeground: '#ffffff',
          success: '#48bb78',
          successForeground: '#ffffff',
          warning: '#ed8936',
          warningForeground: '#1a202c',
        },
      },
    },
    {
      name: 'Magical Sparkle',
      description: 'Twinkling stars effect',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
border-right: 1px solid #ffd700;
box-shadow: inset 0 0 30px rgba(255,215,0,0.1);
sparkle: true;`,
            textColor: '#f0e68c',
          },
          card: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            borderColor: '#ffd700',
            borderWidth: 1,
          },
        },
        colorsDark: {
          primary: '#ffd700',
          primaryForeground: '#1a1a2e',
          secondary: '#2a2a4e',
          secondaryForeground: '#ffd700',
          accent: '#ff6b6b',
          accentForeground: '#1a1a2e',
          background: '#0f0f23',
          foreground: '#f0e68c',
          card: '#1a1a2e',
          cardForeground: '#f0e68c',
          muted: '#2a2a4e',
          mutedForeground: '#b8860b',
          border: '#3a3a5e',
          destructive: '#ff6b6b',
          destructiveForeground: '#ffffff',
          success: '#98fb98',
          successForeground: '#1a1a2e',
          warning: '#ffa500',
          warningForeground: '#1a1a2e',
        },
      },
    },
    {
      name: 'Underwater',
      description: 'Rising bubbles effect',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #001830 0%, #003060 50%, #001830 100%);
border-right: 1px solid #00ced1;
box-shadow: inset 0 0 40px rgba(0,206,209,0.15);
bubbles: true;`,
            textColor: '#87ceeb',
          },
          card: {
            backgroundColor: 'rgba(0, 48, 96, 0.8)',
            borderColor: '#00ced1',
            borderWidth: 1,
            blur: 5,
          },
        },
        colorsDark: {
          primary: '#00ced1',
          primaryForeground: '#001830',
          secondary: '#003060',
          secondaryForeground: '#87ceeb',
          accent: '#20b2aa',
          accentForeground: '#001830',
          background: '#001830',
          foreground: '#b0e0e6',
          card: '#002040',
          cardForeground: '#b0e0e6',
          muted: '#003050',
          mutedForeground: '#5f9ea0',
          border: '#004080',
          destructive: '#ff6347',
          destructiveForeground: '#ffffff',
          success: '#3cb371',
          successForeground: '#001830',
          warning: '#ffa07a',
          warningForeground: '#001830',
        },
      },
    },
    {
      name: 'Cozy Fireplace',
      description: 'Floating embers effect',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #1a0a00 0%, #2d1506 50%, #1a0a00 100%);
border-right: 1px solid #ff6600;
box-shadow: inset 0 0 40px rgba(255,102,0,0.2);
embers: true;`,
            textColor: '#ffd9b3',
          },
          card: {
            backgroundColor: 'rgba(45, 21, 6, 0.95)',
            borderColor: '#ff9900',
            borderWidth: 1,
          },
        },
        colorsDark: {
          primary: '#ff6600',
          primaryForeground: '#1a0a00',
          secondary: '#3d1f0a',
          secondaryForeground: '#ffd9b3',
          accent: '#ff9900',
          accentForeground: '#1a0a00',
          background: '#1a0a00',
          foreground: '#ffeedd',
          card: '#2d1506',
          cardForeground: '#ffeedd',
          muted: '#3d1f0a',
          mutedForeground: '#cc7700',
          border: '#5d2f1a',
          destructive: '#ff4444',
          destructiveForeground: '#ffffff',
          success: '#88cc44',
          successForeground: '#1a0a00',
          warning: '#ffcc00',
          warningForeground: '#1a0a00',
        },
      },
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Apply a preset to quickly transform your theme. You can customize further after applying.
      </p>
      {presets.map((p) => (
        <button
          key={p.name}
          onClick={() => onApplyPreset(p.preset)}
          className="w-full flex flex-col p-3 rounded-lg text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {p.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {p.description}
          </span>
        </button>
      ))}
    </div>
  );
}
