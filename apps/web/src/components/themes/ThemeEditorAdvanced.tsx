// apps/web/src/components/themes/ThemeEditorAdvanced.tsx
// Advanced theme editor with interactive preview and element-level customization

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Undo2, Palette, Layout, Type, Layers, Wand2, Upload, Image, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
import { DEFAULT_LOGIN_PAGE } from '../../types/theme';
import * as themesApi from '../../api/themes';

type EditorTab = 'layout' | 'typography' | 'elements' | 'presets';

interface ThemeEditorAdvancedProps {
  theme?: Theme;
  onSave: (theme: Theme) => void;
  onClose: () => void;
}

export function ThemeEditorAdvanced({ theme, onSave, onClose }: ThemeEditorAdvancedProps) {
  const { user } = useAuth();
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

  // UI state
  const [activeTab, setActiveTab] = useState<EditorTab>('elements');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const [selectedElement, setSelectedElement] = useState<ThemeableElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [brandingVersion, setBrandingVersion] = useState(0); // Increment to trigger preview refresh

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
  }, [name, description, thumbnailUrl, isPublic, colorsLight, colorsDark, layout, typography, sidebar, pageBackground, ui, icons, elementStyles, loginPage, lcarsMode]);

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
      };

      let savedTheme: Theme;
      if (isEditing && theme) {
        savedTheme = await themesApi.updateTheme(theme.id, themeData);
      } else {
        savedTheme = await themesApi.createTheme(themeData);
      }

      setHasChanges(false);
      onSave(savedTheme);
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
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-100 dark:bg-gray-900">
      {/* Left Panel - Editor */}
      <div className="w-[320px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Theme' : 'Create Theme'}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Reset to defaults"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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

        {/* Footer with save button */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || isSystemTheme}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Save size={16} />
            {isSystemTheme ? 'Cannot Edit System Theme' : saving ? 'Saving...' : isEditing ? 'Update Theme' : 'Create Theme'}
          </button>
        </div>
      </div>

      {/* Center - Interactive Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        <InteractivePreview
          theme={previewTheme}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          selectedElement={selectedElement}
          onSelectElement={handleSelectElement}
          isAdmin={isAdmin}
          brandingVersion={brandingVersion}
        />
      </div>

      {/* Right Panel - Element Editor (when element selected) */}
      {selectedElement && (
        <div className="w-[280px] flex-shrink-0">
          {selectedElement === 'login-page' && isAdmin && !isSystemTheme ? (
            <LoginPageEditor
              onClose={() => setSelectedElement(null)}
              onBrandingChange={() => setBrandingVersion(v => v + 1)}
            />
          ) : (
            <ElementStyleEditor
              element={selectedElement}
              style={elementStyles[selectedElement] || {}}
              onChange={(style) => handleElementStyleChange(selectedElement, style)}
              onClose={() => setSelectedElement(null)}
              onApplyAsDefault={handleApplyAsDefault}
              isReadOnly={isSystemTheme}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Elements overview tab
function ElementsTab({
  elementStyles,
  onSelectElement,
  selectedElement,
  isSystemTheme = false,
  isAdmin = false,
}: {
  elementStyles: Partial<Record<ThemeableElement, ElementStyle>>;
  onSelectElement: (element: ThemeableElement) => void;
  selectedElement: ThemeableElement | null;
  isSystemTheme?: boolean;
  isAdmin?: boolean;
}) {
  // Base/global elements available in all themes
  const globalElements: { id: ThemeableElement; label: string; description: string }[] = [
    { id: 'page-background', label: 'Page Background', description: 'Main page background color/image' },
    { id: 'sidebar', label: 'Sidebar', description: 'Navigation sidebar' },
    { id: 'card', label: 'Cards (Default)', description: 'Default style for all cards' },
    { id: 'widget', label: 'Widgets (Default)', description: 'Default style for all widgets' },
    { id: 'button-primary', label: 'Primary Buttons', description: 'Main action buttons' },
    { id: 'button-secondary', label: 'Secondary Buttons', description: 'Alternative action buttons' },
    { id: 'input', label: 'Input Fields', description: 'Text inputs and form fields' },
    { id: 'modal', label: 'Modals', description: 'Popup dialogs' },
  ];

  // Calendar page-specific elements
  const calendarElements: { id: ThemeableElement; label: string; description: string }[] = [
    { id: 'calendar-grid', label: 'Calendar Grid', description: 'Main calendar card on Calendar page' },
    { id: 'calendar-meal-widget', label: 'Meal Planner', description: 'Weekly meal plan widget' },
    { id: 'calendar-user-card', label: 'User Schedule Cards', description: "Member's daily schedule cards" },
  ];

  // Login page is only editable for non-system themes (Household Brand) and only by admins
  const adminElements: { id: ThemeableElement; label: string; description: string }[] = isAdmin && !isSystemTheme
    ? [{ id: 'login-page', label: 'Login Page', description: 'Household branding (login screen)' }]
    : [];

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

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isSystemTheme
          ? 'HabiTrack Classic cannot be modified. This is the default branding.'
          : 'Click an element below or click directly in the preview to customize it.'}
      </p>

      {/* Global Elements */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
          Global Elements
        </h4>
        <div className="space-y-1.5">
          {globalElements.map(renderElementButton)}
        </div>
      </div>

      {/* Calendar Page Elements */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
          Calendar Page
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Override defaults for the Calendar page only
        </p>
        <div className="space-y-1.5">
          {calendarElements.map(renderElementButton)}
        </div>
      </div>

      {/* Admin Elements */}
      {adminElements.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Admin Only
          </h4>
          <div className="space-y-1.5">
            {adminElements.map(renderElementButton)}
          </div>
        </div>
      )}
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
