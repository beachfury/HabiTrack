// apps/web/src/components/themes/PreviewPages/RecipesPreview.tsx
// Recipes page preview replica for theme editor

import { BookOpen, Clock, Users, Star, Plus } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface RecipesPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock recipe data
const MOCK_RECIPES = [
  { name: 'Spaghetti Bolognese', time: '45 min', servings: 4, rating: 4.5 },
  { name: 'Chicken Stir Fry', time: '25 min', servings: 2, rating: 4.8 },
  { name: 'Homemade Pizza', time: '60 min', servings: 6, rating: 4.2 },
];

const TABS = [
  { id: 'all', label: 'All Recipes' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
];

export function RecipesPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: RecipesPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="recipes-background"
      isSelected={selectedElement === 'recipes-background'}
      onClick={() => onSelectElement('recipes-background')}
      className="themed-recipes-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold">
              Recipe Book
            </h1>
          </div>
          <button
            className="themed-btn-primary flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
          >
            <Plus size={12} />
            Add Recipe
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              className="px-3 py-2 text-xs font-medium"
              style={{
                color: i === 0 ? colors.primary : 'var(--color-muted-foreground)',
                borderBottom: i === 0 ? `2px solid ${colors.primary}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recipe Cards */}
        <div className="space-y-3">
          {MOCK_RECIPES.map((recipe) => (
            <div
              key={recipe.name}
              className="themed-card p-3 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {recipe.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={10} style={{ color: 'var(--color-muted-foreground)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                        {recipe.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={10} style={{ color: 'var(--color-muted-foreground)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                        {recipe.servings} servings
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={12} fill={colors.warning} style={{ color: colors.warning }} />
                  <span className="text-xs font-medium">
                    {recipe.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClickableElement>
  );
}
