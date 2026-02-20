// apps/web/src/components/themes/PreviewPages/ChoresPreview.tsx
// Chores page preview replica for theme editor - mirrors actual ChoresPage

import { Check, Plus, Clock, DollarSign, User, CheckSquare, Users, Trophy, Settings, Star, Flame, Target } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface ChoresPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock stats data - matches real StatsBar
const MOCK_STATS = {
  totalPoints: 245,
  currentStreak: 7,
  thisWeek: 12,
  completionRate: 85,
};

// Mock chores data
const MOCK_CHORES = [
  { id: 1, name: 'Clean kitchen', assignee: 'Alex', dueTime: '9:00 AM', done: true },
  { id: 2, name: 'Take out trash', assignee: 'Sam', dueTime: '10:00 AM', done: false },
  { id: 3, name: 'Vacuum living room', assignee: 'Jordan', dueTime: '2:00 PM', done: false },
  { id: 4, name: 'Water plants', assignee: 'Alex', dueTime: '5:00 PM', done: false },
];

// View tabs - matches real page
const TABS = [
  { id: 'my-chores', label: 'My Chores', icon: User },
  { id: 'all-chores', label: 'All', icon: Users },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'manage', label: 'Manage', icon: Settings },
];

export function ChoresPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: ChoresPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="chores-background"
      isSelected={selectedElement === 'chores-background'}
      onClick={() => onSelectElement('chores-background')}
      className="themed-chores-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Page header - matches real ChoresPage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={20} style={{ color: colors.primary }} />
            <div>
              <h1 className="text-lg font-bold">Chores</h1>
              <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                Track and complete your tasks
              </p>
            </div>
          </div>
          <ClickableElement
            element="button-primary"
            isSelected={selectedElement === 'button-primary'}
            onClick={() => onSelectElement('button-primary')}
          >
            <button
              className="themed-btn-primary flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
            >
              <Plus size={14} />
              Add Chore
            </button>
          </ClickableElement>
        </div>

        {/* Stats Bar - matches real StatsBar component */}
        <div className="grid grid-cols-4 gap-2">
          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            className="themed-chores-task"
            style={{ padding: '10px' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.warning}20` }}>
                <Star size={14} style={{ color: colors.warning }} />
              </div>
              <div>
                <p className="text-lg font-bold">{MOCK_STATS.totalPoints}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Total Points</p>
              </div>
            </div>
          </ClickableElement>

          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            className="themed-chores-task"
            style={{ padding: '10px' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.destructive}20` }}>
                <Flame size={14} style={{ color: colors.destructive }} />
              </div>
              <div>
                <p className="text-lg font-bold">{MOCK_STATS.currentStreak}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Day Streak</p>
              </div>
            </div>
          </ClickableElement>

          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            className="themed-chores-task"
            style={{ padding: '10px' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.success}20` }}>
                <CheckSquare size={14} style={{ color: colors.success }} />
              </div>
              <div>
                <p className="text-lg font-bold">{MOCK_STATS.thisWeek}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>This Week</p>
              </div>
            </div>
          </ClickableElement>

          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            className="themed-chores-task"
            style={{ padding: '10px' }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.primary}20` }}>
                <Target size={14} style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-lg font-bold">{MOCK_STATS.completionRate}%</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Completion</p>
              </div>
            </div>
          </ClickableElement>
        </div>

        {/* View Tabs - matches real page */}
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

        {/* Chores List - My Chores view */}
        <ClickableElement
          element="chores-task-card"
          isSelected={selectedElement === 'chores-task-card'}
          onClick={() => onSelectElement('chores-task-card')}
          className="themed-chores-task"
        >
          <h3 className="text-sm font-semibold mb-3">
            Today
          </h3>
          <div className="space-y-2">
            {MOCK_CHORES.map((chore) => (
              <div
                key={chore.id}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{
                  backgroundColor: chore.done ? `${colors.success}10` : colors.muted,
                  border: chore.done ? `1px solid ${colors.success}30` : 'none',
                }}
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: chore.done ? colors.success : colors.border,
                    backgroundColor: chore.done ? colors.success : 'transparent',
                  }}
                >
                  {chore.done && <Check size={12} style={{ color: colors.successForeground }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${chore.done ? 'line-through opacity-60' : ''}`}
                  >
                    {chore.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                      <User size={10} />
                      {chore.assignee}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                      <Clock size={10} />
                      {chore.dueTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ClickableElement>

        {/* Paid Chores Section */}
        <ClickableElement
          element="chores-paid-card"
          isSelected={selectedElement === 'chores-paid-card'}
          onClick={() => onSelectElement('chores-paid-card')}
          className="themed-chores-paid"
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} style={{ color: colors.success }} />
            <h3 className="text-sm font-semibold">
              Available Paid Chores
            </h3>
          </div>
          <div className="space-y-2">
            {[{ name: 'Wash car', value: 10 }, { name: 'Mow lawn', value: 15 }].map((chore) => (
              <div
                key={chore.name}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{
                  backgroundColor: `${colors.success}10`,
                  border: `1px solid ${colors.success}30`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{chore.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>Claim to earn</p>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: colors.success, color: colors.successForeground }}
                >
                  ${chore.value}
                </div>
              </div>
            ))}
          </div>
        </ClickableElement>
      </div>
    </ClickableElement>
  );
}
