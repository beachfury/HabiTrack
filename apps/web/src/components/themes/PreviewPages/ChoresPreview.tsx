// apps/web/src/components/themes/PreviewPages/ChoresPreview.tsx
// Chores page preview replica for theme editor - mirrors actual ChoresPage

import { Check, Plus, Clock, DollarSign, User, CheckSquare, Users, Trophy, Settings, Star, Flame, Target } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

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

  // Default fallbacks
  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  // Page-specific background - check early for card fallback logic
  const choresBgStyle = theme.elementStyles?.['chores-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  // Check if chores background has custom styling
  const hasCustomChoresBg = choresBgStyle.backgroundColor || choresBgStyle.backgroundGradient || choresBgStyle.backgroundImage || choresBgStyle.customCSS;

  // When chores has custom background, use semi-transparent card backgrounds by default
  const cardBgFallback = hasCustomChoresBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomChoresBg ? 'rgba(255,255,255,0.15)' : colors.border;

  const cardStyle = theme.elementStyles?.card || {};
  const widgetStyle = theme.elementStyles?.widget || {};
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};

  // Build computed styles with semi-transparent fallbacks
  const computedCardStyle = buildElementStyle(cardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedWidgetStyle = buildElementStyle(widgetStyle, hasCustomChoresBg ? 'rgba(255,255,255,0.06)' : colors.muted, cardBorderFallback, defaultRadius, 'none', colors.foreground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.primary, colors.primaryForeground, 'transparent', '8px');
  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    choresBgStyle,
    globalPageBgStyle,
    colors.background
  );

  // Detect animated background effect classes from customCSS
  const getAnimatedBgClasses = (css?: string): string => {
    if (!css) return '';
    const classes: string[] = [];
    if (css.includes('matrix-rain: true') || css.includes('matrix-rain:true')) {
      classes.push('matrix-rain-bg');
      const speedMatch = css.match(/matrix-rain-speed:\s*(slow|normal|fast|veryfast)/i);
      if (speedMatch) classes.push(`matrix-rain-${speedMatch[1].toLowerCase()}`);
    }
    if (css.includes('snowfall: true') || css.includes('snowfall:true')) classes.push('snowfall-bg');
    if (css.includes('sparkle: true') || css.includes('sparkle:true')) classes.push('sparkle-bg');
    if (css.includes('bubbles: true') || css.includes('bubbles:true')) classes.push('bubbles-bg');
    if (css.includes('embers: true') || css.includes('embers:true')) classes.push('embers-bg');
    return classes.join(' ');
  };

  const animatedBgClasses = getAnimatedBgClasses(customCSS);

  return (
    <ClickableElement
      element="chores-background"
      isSelected={selectedElement === 'chores-background'}
      onClick={() => onSelectElement('chores-background')}
      className={`flex-1 overflow-auto ${animatedBgClasses}`}
      style={pageBgStyle}
    >
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: choresBgStyle.backgroundOpacity ?? globalPageBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}
      <div className="relative z-10 p-4">
        {/* Page header - matches real ChoresPage */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.foreground }}>
              <CheckSquare size={20} style={{ color: colors.primary }} />
              Chores
            </h1>
            <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
              Track and complete your tasks
            </p>
          </div>
          <ClickableElement
            element="button-primary"
            isSelected={selectedElement === 'button-primary'}
            onClick={() => onSelectElement('button-primary')}
          >
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
              style={computedButtonPrimaryStyle}
            >
              <Plus size={14} />
              Add Chore
            </button>
          </ClickableElement>
        </div>

        {/* Stats Bar - matches real StatsBar component */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            style={{
              ...computedCardStyle,
              padding: '10px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.warning}20` }}>
                <Star size={14} style={{ color: colors.warning }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: colors.foreground }}>{MOCK_STATS.totalPoints}</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Total Points</p>
              </div>
            </div>
          </ClickableElement>

          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            style={{
              ...computedCardStyle,
              padding: '10px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.destructive}20` }}>
                <Flame size={14} style={{ color: colors.destructive }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: colors.foreground }}>{MOCK_STATS.currentStreak}</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Day Streak</p>
              </div>
            </div>
          </ClickableElement>

          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            style={{
              ...computedCardStyle,
              padding: '10px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.success}20` }}>
                <CheckSquare size={14} style={{ color: colors.success }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: colors.foreground }}>{MOCK_STATS.thisWeek}</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>This Week</p>
              </div>
            </div>
          </ClickableElement>

          <ClickableElement
            element="chores-task-card"
            isSelected={selectedElement === 'chores-task-card'}
            onClick={() => onSelectElement('chores-task-card')}
            style={{
              ...computedCardStyle,
              padding: '10px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.primary}20` }}>
                <Target size={14} style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: colors.foreground }}>{MOCK_STATS.completionRate}%</p>
                <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Completion</p>
              </div>
            </div>
          </ClickableElement>
        </div>

        {/* View Tabs - matches real page */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: idx === 0 ? colors.primary : colors.muted,
                color: idx === 0 ? colors.primaryForeground : colors.mutedForeground,
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
          style={{
            ...computedCardStyle,
            padding: cardStyle.padding || '12px',
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
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
                    style={{ color: colors.foreground }}
                  >
                    {chore.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: colors.mutedForeground }}>
                      <User size={10} />
                      {chore.assignee}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: colors.mutedForeground }}>
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
          className="mt-3"
          style={{
            ...computedCardStyle,
            padding: cardStyle.padding || '12px',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} style={{ color: colors.success }} />
            <h3 className="text-sm font-semibold" style={{ color: colors.foreground }}>
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
                  <p className="text-xs font-medium" style={{ color: colors.foreground }}>{chore.name}</p>
                  <p className="text-[10px]" style={{ color: colors.mutedForeground }}>Claim to earn</p>
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
