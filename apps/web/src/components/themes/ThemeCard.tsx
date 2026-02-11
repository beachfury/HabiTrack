// apps/web/src/components/themes/ThemeCard.tsx
import { Check, Lock } from 'lucide-react';
import type { ThemeListItem } from '../../types/theme';

interface ThemeCardProps {
  theme: ThemeListItem;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ThemeCard({ theme, isActive, onClick, disabled }: ThemeCardProps) {
  // Generate a preview gradient from theme colors
  const previewGradient = `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full text-left rounded-xl overflow-hidden transition-all
        ${isActive
          ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-800'
          : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Preview area */}
      <div
        className="h-24 relative"
        style={{ background: theme.thumbnailUrl ? `url(${theme.thumbnailUrl}) center/cover` : previewGradient }}
      >
        {/* Show color swatches */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <div
            className="w-4 h-4 rounded-full border border-white/30"
            style={{ backgroundColor: theme.primaryColor }}
            title="Primary"
          />
          <div
            className="w-4 h-4 rounded-full border border-white/30"
            style={{ backgroundColor: theme.accentColor }}
            title="Accent"
          />
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
        )}

        {/* Kid-approved badge */}
        {theme.isApprovedForKids && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
            Kid Safe
          </div>
        )}

        {/* Lock indicator for restricted themes */}
        {disabled && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Lock size={24} className="text-white" />
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3 bg-white dark:bg-gray-800">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
          {theme.name}
        </h3>
        {theme.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {theme.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
            {theme.layoutType.replace('-', ' ')}
          </span>
          {theme.isDefault && (
            <span className="text-xs text-emerald-500 dark:text-emerald-400">
              Default
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
