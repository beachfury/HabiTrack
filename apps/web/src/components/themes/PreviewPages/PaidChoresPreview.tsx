// apps/web/src/components/themes/PreviewPages/PaidChoresPreview.tsx
// Paid Chores page preview replica for theme editor

import { DollarSign, Zap, Trophy, Clock, User, CheckCircle } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

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

  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  const paidchoresBgStyle = theme.elementStyles?.['paidchores-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  const hasCustomBg = paidchoresBgStyle.backgroundColor || paidchoresBgStyle.backgroundGradient || paidchoresBgStyle.backgroundImage || paidchoresBgStyle.customCSS;

  const cardBgFallback = hasCustomBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomBg ? 'rgba(255,255,255,0.15)' : colors.border;

  const cardStyle = theme.elementStyles?.card || {};
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};

  const computedCardStyle = buildElementStyle(cardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.success, '#ffffff', 'transparent', '8px');

  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    paidchoresBgStyle,
    globalPageBgStyle,
    colors.background
  );

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
      className={`flex-1 overflow-auto ${animatedBgClasses}`}
      style={{
        ...pageBgStyle,
        position: 'relative',
      }}
    >
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: paidchoresBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}

      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={20} style={{ color: colors.success }} />
            <h1 className="text-lg font-bold" style={{ color: colors.foreground }}>
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
        <div className="flex gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium"
              style={{
                color: i === 0 ? colors.primary : colors.mutedForeground,
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
              className="p-3 rounded-lg"
              style={computedCardStyle}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: colors.foreground }}>
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
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium"
                  style={computedButtonPrimaryStyle}
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
