// apps/web/src/pages/recipes/RecipeCard.tsx
// Recipe card component for grid display

import { Clock, Users, ChefHat, ExternalLink } from 'lucide-react';
import type { Recipe } from '../../types/meals';
import { getDifficultyLabel, getDifficultyStyle, formatCookTime } from '../../types/meals';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onApprove?: () => void;
  isAdmin: boolean;
}

export function RecipeCard({ recipe, onClick, onApprove, isAdmin }: RecipeCardProps) {
  const totalTime = formatCookTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes);

  return (
    <div
      onClick={onClick}
      className="themed-card p-4 cursor-pointer hover:shadow-lg transition-shadow group"
    >
      {/* Image or Placeholder */}
      <div className="aspect-video rounded-lg bg-[var(--color-muted)] mb-3 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted-foreground)]">
            <ChefHat size={48} className="opacity-30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Status Badge for pending */}
        {recipe.status === 'pending' && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
            Pending Approval
          </span>
        )}

        {/* Title */}
        <h3 className="font-semibold text-[var(--color-foreground)] line-clamp-1">
          {recipe.name}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {totalTime}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} />
            {recipe.servings}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={getDifficultyStyle(recipe.difficulty)}
          >
            {getDifficultyLabel(recipe.difficulty)}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* External link indicator */}
        {recipe.sourceUrl && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-primary)]">
            <ExternalLink size={12} />
            External recipe
          </div>
        )}

        {/* Approve button for pending (admin only) */}
        {onApprove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            className="w-full mt-2 py-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-colors text-sm font-medium"
          >
            Review & Approve
          </button>
        )}
      </div>
    </div>
  );
}
