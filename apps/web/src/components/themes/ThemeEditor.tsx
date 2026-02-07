// apps/web/src/components/themes/ThemeEditor.tsx
// Main theme editor component with tabs for different sections

import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, Palette, Layout, Type, Image, Sidebar, Undo2, ImagePlus } from 'lucide-react';
import { ImageUploader } from '../common/ImageUploader';
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
import { ColorSchemeEditor } from './ColorSchemeEditor';
import { LayoutEditor } from './LayoutEditor';
import { TypographyEditor } from './TypographyEditor';
import { BackgroundEditor } from './BackgroundEditor';
import { SidebarEditor } from './SidebarEditor';
import { ThemePreview } from './ThemePreview';
import * as themesApi from '../../api/themes';

type EditorTab = 'colors' | 'layout' | 'typography' | 'background' | 'sidebar';

interface ThemeEditorProps {
  theme?: Theme; // If provided, editing existing theme
  onSave: (theme: Theme) => void;
  onClose: () => void;
}

export function ThemeEditor({ theme, onSave, onClose }: ThemeEditorProps) {
  const isEditing = !!theme;

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

  // UI state
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(true);
  }, [name, description, thumbnailUrl, isPublic, colorsLight, colorsDark, layout, typography, sidebar, pageBackground, ui, icons]);

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
    if (!confirm('Reset all changes to defaults?')) return;

    setColorsLight(DEFAULT_COLORS_LIGHT);
    setColorsDark(DEFAULT_COLORS_DARK);
    setLayout(DEFAULT_LAYOUT);
    setTypography(DEFAULT_TYPOGRAPHY);
    setSidebar(DEFAULT_SIDEBAR);
    setPageBackground(DEFAULT_PAGE_BACKGROUND);
    setUi(DEFAULT_UI);
    setIcons(DEFAULT_ICONS);
  };

  const currentColors = colorMode === 'light' ? colorsLight : colorsDark;
  const setCurrentColors = colorMode === 'light' ? setColorsLight : setColorsDark;

  const tabs: Array<{ id: EditorTab; label: string; icon: typeof Palette }> = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'background', label: 'Background', icon: Image },
    { id: 'sidebar', label: 'Sidebar', icon: Sidebar },
  ];

  // Build current theme for preview
  const previewTheme: Theme = {
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
    usageCount: theme?.usageCount || 0,
    createdAt: theme?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Editor Panel */}
      <div className="w-[500px] max-w-[90vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Theme' : 'Create Theme'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Reset to defaults"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Theme name and description */}
        <div className="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              placeholder="My Custom Theme"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              placeholder="A brief description of your theme..."
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Make this theme public (others can use it)
            </span>
          </label>

          {/* Thumbnail Upload */}
          <div className="pt-2">
            <ImageUploader
              preset="thumbnail"
              value={thumbnailUrl}
              onChange={(url) => setThumbnailUrl(url || '')}
              themeId={theme?.id}
              label="Theme Thumbnail"
              showPreview={true}
              previewAspectRatio={4 / 3}
            />
          </div>
        </div>

        {/* Tabs - horizontally scrollable on small screens */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto scrollbar-thin">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content - scrollable area with padding for content visibility */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
          {activeTab === 'colors' && (
            <ColorSchemeEditor
              colors={currentColors}
              onChange={setCurrentColors}
              colorMode={colorMode}
              onColorModeChange={setColorMode}
            />
          )}

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

          {activeTab === 'background' && (
            <BackgroundEditor
              background={pageBackground}
              onChange={setPageBackground}
              themeId={theme?.id}
            />
          )}

          {activeTab === 'sidebar' && (
            <SidebarEditor
              sidebar={sidebar}
              onChange={setSidebar}
              themeId={theme?.id}
            />
          )}
        </div>

        {/* Footer with save button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : isEditing ? 'Update Theme' : 'Create Theme'}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <ThemePreview
            theme={previewTheme}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
          />
        </div>
      )}

      {/* Click outside to close (on the preview area) */}
      {!showPreview && (
        <div
          className="flex-1 bg-black/50"
          onClick={handleClose}
        />
      )}
    </div>
  );
}
