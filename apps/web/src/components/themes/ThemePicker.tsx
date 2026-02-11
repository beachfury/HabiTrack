// apps/web/src/components/themes/ThemePicker.tsx
import { useState } from 'react';
import { Palette, Sun, Moon, Monitor, RefreshCw, Plus, Edit2, Copy, ShieldCheck, ShieldOff } from 'lucide-react';
import { ThemeCard } from './ThemeCard';
import { ThemeEditorAdvanced } from './ThemeEditorAdvanced';
import { useTheme } from '../../context/ThemeContext';
import type { Theme, ThemeListItem } from '../../types/theme';
import * as themesApi from '../../api/themes';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemePickerProps {
  userRole?: 'admin' | 'member' | 'kid';
}

export function ThemePicker({ userRole = 'member' }: ThemePickerProps) {
  const {
    theme: mode,
    setTheme: setMode,
    activeThemeId,
    activeTheme,
    themes,
    loading,
    setActiveTheme,
    loadThemes,
  } = useTheme();

  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingKidApproval, setTogglingKidApproval] = useState<string | null>(null);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | undefined>(undefined);

  const isAdmin = userRole === 'admin';

  // Filter themes based on user role
  const filteredThemes = themes.filter((t) => {
    if (userRole === 'kid') {
      return t.isApprovedForKids;
    }
    return true;
  });

  const handleThemeSelect = async (theme: ThemeListItem) => {
    if (applying) return;

    // Check if kid trying to use non-approved theme
    if (userRole === 'kid' && !theme.isApprovedForKids) {
      setError('This theme is not available for your account.');
      return;
    }

    try {
      setApplying(theme.id);
      setError(null);
      await setActiveTheme(theme.id);
    } catch (err) {
      setError('Failed to apply theme. Please try again.');
      console.error('Failed to apply theme:', err);
    } finally {
      setApplying(null);
    }
  };

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const handleCreateTheme = () => {
    setEditingTheme(undefined);
    setShowEditor(true);
  };

  const handleEditTheme = async () => {
    if (!activeTheme) return;
    setEditingTheme(activeTheme);
    setShowEditor(true);
  };

  const handleDuplicateTheme = async () => {
    if (!activeThemeId) return;

    try {
      setApplying('duplicate');
      const duplicated = await themesApi.duplicateTheme(activeThemeId, `${activeTheme?.name || 'Theme'} Copy`);
      await loadThemes();
      await setActiveTheme(duplicated.id);
    } catch (err) {
      setError('Failed to duplicate theme.');
      console.error('Failed to duplicate theme:', err);
    } finally {
      setApplying(null);
    }
  };

  const handleEditorSave = async (theme: Theme) => {
    setShowEditor(false);
    await loadThemes();
    await setActiveTheme(theme.id);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingTheme(undefined);
  };

  const handleToggleKidApproval = async (theme: ThemeListItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent theme selection
    if (togglingKidApproval) return;

    try {
      setTogglingKidApproval(theme.id);
      setError(null);
      await themesApi.toggleKidApproval(theme.id, !theme.isApprovedForKids);
      await loadThemes();
    } catch (err) {
      setError('Failed to update kid approval status.');
      console.error('Failed to toggle kid approval:', err);
    } finally {
      setTogglingKidApproval(null);
    }
  };

  const modes: Array<{ id: ThemeMode; label: string; icon: typeof Sun }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  // Kids can't create/edit themes
  const canCreateThemes = userRole !== 'kid';

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Palette size={18} />
            Theme Settings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a theme and color mode for your interface
          </p>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Color Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`
                  p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2
                  ${mode === m.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <m.icon
                  size={24}
                  className={mode === m.id ? 'text-emerald-600' : 'text-gray-500'}
                />
                <span
                  className={`text-sm font-medium ${
                    mode === m.id ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Actions */}
        {canCreateThemes && (
          <div className="flex gap-2">
            <button
              onClick={handleCreateTheme}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create Theme
            </button>
            {activeTheme && (
              <>
                <button
                  onClick={handleEditTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                  Edit Current
                </button>
                <button
                  onClick={handleDuplicateTheme}
                  disabled={applying === 'duplicate'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Copy size={18} />
                  {applying === 'duplicate' ? 'Duplicating...' : 'Duplicate'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Theme Library */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme Library
            </label>
            <button
              onClick={() => loadThemes()}
              disabled={loading}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {loading && themes.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          ) : filteredThemes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Palette size={48} className="mx-auto mb-3 opacity-50" />
              <p>No themes available</p>
              {userRole === 'kid' ? (
                <p className="text-sm mt-1">
                  Ask a parent to approve more themes for you.
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Create your first theme to get started!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredThemes.map((theme) => (
                <div key={theme.id} className="relative">
                  <ThemeCard
                    theme={theme}
                    isActive={activeThemeId === theme.id}
                    onClick={() => handleThemeSelect(theme)}
                    disabled={applying === theme.id || (userRole === 'kid' && !theme.isApprovedForKids)}
                  />
                  {/* Admin kid approval toggle */}
                  {isAdmin && (
                    <button
                      onClick={(e) => handleToggleKidApproval(theme, e)}
                      disabled={togglingKidApproval === theme.id}
                      title={theme.isApprovedForKids ? 'Remove kid approval' : 'Approve for kids'}
                      className={`
                        absolute top-2 right-2 p-1.5 rounded-lg transition-colors z-10
                        ${theme.isApprovedForKids
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
                        }
                        ${togglingKidApproval === theme.id ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      {theme.isApprovedForKids ? (
                        <ShieldCheck size={16} />
                      ) : (
                        <ShieldOff size={16} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info for kids */}
        {userRole === 'kid' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Only themes approved by your parents are shown here. Ask them to add more themes if you want more options!
            </p>
          </div>
        )}

        {/* Admin kid approval info */}
        {isAdmin && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <h4 className="font-medium text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
              <ShieldCheck size={18} />
              Kid Approval Controls
            </h4>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">
              Click the shield icon on any theme to toggle whether it's available for kids.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500 text-white">
                  <ShieldCheck size={14} />
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">Approved for kids</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-gray-500">
                  <ShieldOff size={14} />
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">Not approved</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Theme Editor Modal */}
      {showEditor && (
        <ThemeEditorAdvanced
          theme={editingTheme}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
        />
      )}
    </>
  );
}
