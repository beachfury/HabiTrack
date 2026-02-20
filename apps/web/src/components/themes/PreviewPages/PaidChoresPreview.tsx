// apps/web/src/components/themes/PreviewPages/PaidChoresPreview.tsx
// Paid Chores page preview replica for theme editor

import { DollarSign, Zap, Trophy, Clock, User, CheckCircle } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface PaidChoresPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock paid chores data
const MOCK_CHORES = [
  { name: 'Clean the garage', amount: 15, difficulty: 'hard', status: 'available' },
  { name: 'Mow the lawn', amount: 10, difficulty: 'medium', status: 'claimed' },
  { name: 'Wash the car', amount: 8, difficulty: 'easy', status: 'available' },
];

const TABS = [
  { id: 'available', label: 'Available', icon: Zap },
  { id: 'my-claims', label: 'My Claims', icon: User },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function PaidChoresPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: PaidChoresPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.destructive;
      default: return colors.mutedForeground;
    }
  };

  return (
    <ClickableElement
      element="paidchores-background"
      isSelected={selectedElement === 'paidchores-background'}
      onClick={() => onSelectElement('paidchores-background')}
      className="themed-paidchores-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={20} style={{ color: colors.success }} />
            <h1 className="text-lg font-bold">
              Paid Chores
            </h1>
          </div>
          <div
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: `${colors.success}20` }}
          >
            <p className="text-xs" style={{ color: colors.success }}>My Earnings</p>
            <p className="text-lg font-bold" style={{ color: colors.success }}>$45.00</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium"
              style={{
                color: i === 0 ? colors.primary : 'var(--color-muted-foreground)',
                borderBottom: i === 0 ? `2px solid ${colors.primary}` : '2px solid transparent',
              }}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chore Cards */}
        <div className="space-y-3">
          {MOCK_CHORES.map((chore) => (
            <div
              key={chore.name}
              className="themed-card p-3 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold">
                    {chore.name}
                  </h3>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${getDifficultyColor(chore.difficulty)}20`,
                      color: getDifficultyColor(chore.difficulty),
                    }}
                  >
                    {chore.difficulty}
                  </span>
                </div>
                <p className="text-xl font-bold" style={{ color: colors.success }}>
                  ${chore.amount}
                </p>
              </div>
              {chore.status === 'available' ? (
                <button
                  className="themed-btn-primary w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium"
                  style={{ backgroundColor: colors.success, color: 'var(--color-success-foreground)' }}
                >
                  <Zap size={12} />
                  Claim It!
                </button>
              ) : (
                <div
                  className="flex items-center justify-center gap-1 py-1.5 rounded text-xs"
                  style={{ backgroundColor: `${colors.warning}20`, color: colors.warning }}
                >
                  <Clock size={12} />
                  Claimed
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ClickableElement>
  );
}
