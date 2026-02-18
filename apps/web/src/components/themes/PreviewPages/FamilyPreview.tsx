// apps/web/src/components/themes/PreviewPages/FamilyPreview.tsx
// Family page preview replica for theme editor

import { Users, Plus, Edit2, Key, Shield, User } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';
import { buildElementStyle, buildButtonStyle, buildPageBackgroundStyle, RADIUS_MAP, SHADOW_MAP } from './styleUtils';

interface FamilyPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock family members
const MOCK_MEMBERS = [
  { name: 'John', role: 'admin', color: '#3b82f6', initial: 'J' },
  { name: 'Sarah', role: 'member', color: '#22c55e', initial: 'S' },
  { name: 'Alex', role: 'kid', color: '#f59e0b', initial: 'A' },
  { name: 'Emma', role: 'kid', color: '#ec4899', initial: 'E' },
];

export function FamilyPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: FamilyPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  const defaultRadius = RADIUS_MAP[theme.ui.borderRadius] || '8px';
  const defaultShadow = SHADOW_MAP[theme.ui.shadowIntensity] || 'none';

  const familyBgStyle = theme.elementStyles?.['family-background'] || {};
  const globalPageBgStyle = theme.elementStyles?.['page-background'] || {};

  const hasCustomBg = familyBgStyle.backgroundColor || familyBgStyle.backgroundGradient || familyBgStyle.backgroundImage || familyBgStyle.customCSS;

  const cardBgFallback = hasCustomBg ? 'rgba(255,255,255,0.08)' : colors.card;
  const cardBorderFallback = hasCustomBg ? 'rgba(255,255,255,0.15)' : colors.border;

  const cardStyle = theme.elementStyles?.card || {};
  const buttonPrimaryStyle = theme.elementStyles?.['button-primary'] || {};

  const computedCardStyle = buildElementStyle(cardStyle, cardBgFallback, cardBorderFallback, defaultRadius, defaultShadow, colors.cardForeground);
  const computedButtonPrimaryStyle = buildButtonStyle(buttonPrimaryStyle, colors.primary, colors.primaryForeground, 'transparent', '8px');

  const { style: pageBgStyle, backgroundImageUrl, customCSS } = buildPageBackgroundStyle(
    familyBgStyle,
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.primary;
      case 'member': return colors.accent;
      case 'kid': return colors.success;
      default: return colors.mutedForeground;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      default: return User;
    }
  };

  return (
    <ClickableElement
      element="family-background"
      isSelected={selectedElement === 'family-background'}
      onClick={() => onSelectElement('family-background')}
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
            opacity: familyBgStyle.backgroundOpacity ?? 1,
          }}
        />
      )}

      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold" style={{ color: colors.foreground }}>
              Family Members
            </h1>
          </div>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={computedButtonPrimaryStyle}
          >
            <Plus size={12} />
            Add Member
          </button>
        </div>

        {/* Members Card */}
        <div className="p-4 rounded-lg" style={computedCardStyle}>
          <div className="space-y-3">
            {MOCK_MEMBERS.map((member) => {
              const RoleIcon = getRoleIcon(member.role);
              return (
                <div
                  key={member.name}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initial}
                    </div>
                    {/* Info */}
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.foreground }}>
                        {member.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <RoleIcon size={10} style={{ color: getRoleColor(member.role) }} />
                        <span
                          className="text-[10px] capitalize"
                          style={{ color: getRoleColor(member.role) }}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded"
                      style={{ color: colors.mutedForeground }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="p-1.5 rounded"
                      style={{ color: colors.mutedForeground }}
                    >
                      <Key size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ClickableElement>
  );
}
