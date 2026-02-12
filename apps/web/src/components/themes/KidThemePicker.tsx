// apps/web/src/components/themes/KidThemePicker.tsx
// Simplified theme picker for kid accounts - shows only approved themes

import { useState } from 'react';
import { Palette, Sun, Moon, Sparkles } from 'lucide-react';
import { ThemeCard } from './ThemeCard';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeListItem } from '../../types/theme';

type ThemeMode = 'light' | 'dark';

export function KidThemePicker() {
  const {
    theme: mode,
    setTheme: setMode,
    activeThemeId,
    themes,
    loading,
    setActiveTheme,
  } = useTheme();

  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only show kid-approved themes
  const approvedThemes = themes.filter((t) => t.isApprovedForKids);

  const handleThemeSelect = async (theme: ThemeListItem) => {
    if (applying) return;

    try {
      setApplying(theme.id);
      setError(null);
      await setActiveTheme(theme.id);
    } catch (err) {
      setError('Oops! Something went wrong. Try again!');
      console.error('Failed to apply theme:', err);
    } finally {
      setApplying(null);
    }
  };

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  // Simplified mode options for kids (no system mode)
  const modes: Array<{ id: ThemeMode; label: string; icon: typeof Sun; emoji: string }> = [
    { id: 'light', label: 'Light', icon: Sun, emoji: '☀️' },
    { id: 'dark', label: 'Dark', icon: Moon, emoji: '🌙' },
  ];

  return (
    <div className="space-y-6">
      {/* Fun Header */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent))',
        }}
      >
        <h3 className="font-bold text-lg text-[var(--color-foreground)] mb-1 flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--color-warning)]" />
          Pick Your Style!
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Choose how you want your HabiTrack to look
        </p>
      </div>

      {/* Simple Light/Dark Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-3">
          Do you want it bright or dark?
        </label>
        <div className="grid grid-cols-2 gap-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`
                p-5 rounded-xl border-3 transition-all transform hover:scale-[1.02]
                ${(mode === m.id || (mode === 'system' && m.id === 'light'))
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }
              `}
            >
              <div className="text-3xl mb-2">{m.emoji}</div>
              <span
                className={`text-sm font-bold ${
                  (mode === m.id || (mode === 'system' && m.id === 'light'))
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)]'
                }`}
              >
                {m.label} Mode
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-3">
          Pick a theme you like!
        </label>

        {error && (
          <div
            className="mb-4 p-3 text-sm rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
              color: 'var(--color-destructive)',
            }}
          >
            {error}
          </div>
        )}

        {loading && approvedThemes.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-[var(--color-muted)] animate-pulse"
              />
            ))}
          </div>
        ) : approvedThemes.length === 0 ? (
          <div className="text-center py-8 bg-[var(--color-muted)] rounded-xl">
            <Palette size={48} className="mx-auto mb-3 text-[var(--color-muted-foreground)]" />
            <p className="text-[var(--color-foreground)] font-medium">
              No themes available yet!
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Ask a parent to add some themes for you! 🙏
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {approvedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={activeThemeId === theme.id}
                onClick={() => handleThemeSelect(theme)}
                disabled={applying === theme.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Friendly message */}
      <div
        className="p-4 rounded-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
        }}
      >
        <p className="text-sm text-[var(--color-foreground)]">
          🎨 Want more themes? Ask a parent to approve more options for you!
        </p>
      </div>
    </div>
  );
}
