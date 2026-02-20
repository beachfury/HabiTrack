// apps/web/src/components/themes/PreviewPages/MealsPreview.tsx
// Meals page preview replica for theme editor

import { UtensilsCrossed, Calendar, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface MealsPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock meal data
const MOCK_WEEK = [
  { day: 'Mon', meal: 'Spaghetti Bolognese', votes: 3 },
  { day: 'Tue', meal: 'Chicken Stir Fry', votes: 2 },
  { day: 'Wed', meal: 'Tacos', votes: 4 },
  { day: 'Thu', meal: null, votes: 0 },
  { day: 'Fri', meal: 'Pizza Night', votes: 5 },
  { day: 'Sat', meal: null, votes: 0 },
  { day: 'Sun', meal: 'Roast Dinner', votes: 3 },
];

export function MealsPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: MealsPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="meals-background"
      isSelected={selectedElement === 'meals-background'}
      onClick={() => onSelectElement('meals-background')}
      className="themed-meals-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold">
              Dinner Planner
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded" style={{ color: 'var(--color-muted-foreground)' }}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium">This Week</span>
            <button className="p-1 rounded" style={{ color: 'var(--color-muted-foreground)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {MOCK_WEEK.map((day) => (
            <div
              key={day.day}
              className="themed-card p-2 rounded-lg text-center"
            >
              <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
                {day.day}
              </p>
              {day.meal ? (
                <>
                  <p className="text-[10px] leading-tight mb-1">
                    {day.meal}
                  </p>
                  <div className="flex items-center justify-center gap-0.5">
                    <ThumbsUp size={10} style={{ color: colors.success }} />
                    <span className="text-[9px]" style={{ color: 'var(--color-muted-foreground)' }}>
                      {day.votes}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  No meal
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Upcoming Meals */}
        <div className="themed-card p-4 rounded-lg">
          <h2 className="text-sm font-semibold mb-3">
            Upcoming Dinners
          </h2>
          <div className="space-y-2">
            {MOCK_WEEK.filter(d => d.meal).slice(0, 3).map((day) => (
              <div
                key={day.day}
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: colors.muted }}
              >
                <div>
                  <p className="text-xs font-medium">
                    {day.meal}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                    {day.day}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp size={12} style={{ color: colors.success }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {day.votes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClickableElement>
  );
}
