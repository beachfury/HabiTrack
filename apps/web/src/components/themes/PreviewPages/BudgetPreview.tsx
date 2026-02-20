// apps/web/src/components/themes/PreviewPages/BudgetPreview.tsx
// Budget page preview replica for theme editor

import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface BudgetPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock budget data
const MOCK_BUDGETS = [
  { name: 'Groceries', spent: 450, limit: 600, color: '#22c55e' },
  { name: 'Entertainment', spent: 120, limit: 150, color: '#f59e0b' },
  { name: 'Utilities', spent: 180, limit: 200, color: '#3b82f6' },
];

export function BudgetPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: BudgetPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="budget-background"
      isSelected={selectedElement === 'budget-background'}
      onClick={() => onSelectElement('budget-background')}
      className="themed-budget-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={20} style={{ color: colors.primary }} />
            <div>
              <h1 className="text-lg font-bold">
                Budget Management
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Track household spending</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="themed-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} style={{ color: colors.success }} />
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Total Budget</span>
            </div>
            <p className="text-lg font-bold">$950</p>
          </div>
          <div className="themed-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} style={{ color: colors.warning }} />
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Spent</span>
            </div>
            <p className="text-lg font-bold">$750</p>
          </div>
          <div className="themed-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} style={{ color: colors.success }} />
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Remaining</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.success }}>$200</p>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="themed-card p-4 rounded-lg">
          <h2 className="text-sm font-semibold mb-3">
            Budget Categories
          </h2>
          <div className="space-y-3">
            {MOCK_BUDGETS.map((budget) => (
              <div key={budget.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{budget.name}</span>
                  <span style={{ color: 'var(--color-muted-foreground)' }}>
                    ${budget.spent} / ${budget.limit}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.muted }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(budget.spent / budget.limit) * 100}%`,
                      backgroundColor: budget.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClickableElement>
  );
}
