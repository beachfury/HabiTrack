// apps/web/src/components/themes/AdvancedCSSEffects.tsx
// Combinable CSS effects picker UI component.
// Effect definitions, types, and utility functions are in editors/cssEffectDefinitions.ts

import { useState, useCallback } from 'react';
import { Check, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { ElementStyle } from '../../types/theme';
import {
  ALL_PROPERTY_TYPES,
  isEffectActive,
  mergeCSSStrings,
  removeEffectFromCSS,
} from './editors/cssEffectDefinitions';
import type {
  CSSEffect,
  EffectCategory,
  PropertyType,
} from './editors/cssEffectDefinitions';

// Re-export types and constants so existing consumers don't break
export type { CSSEffect, EffectCategory, PropertyType };
export { ALL_PROPERTY_TYPES };

// ============================================
// COMPONENT
// ============================================

interface AdvancedCSSEffectsProps {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}

export function AdvancedCSSEffects({ style, onChange, layout = 'vertical' }: AdvancedCSSEffectsProps) {
  const [expandedPropertyType, setExpandedPropertyType] = useState<string | null>('background');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const currentCSS = style.customCSS || '';

  const toggleEffect = useCallback((effect: CSSEffect) => {
    const isActive = isEffectActive(currentCSS, effect.css);

    if (isActive) {
      // Remove the effect
      const newCSS = removeEffectFromCSS(currentCSS, effect.css);
      onChange({ customCSS: newCSS || undefined });
    } else {
      // Add the effect (merge with existing)
      const newCSS = mergeCSSStrings(currentCSS, effect.css);
      onChange({ customCSS: newCSS });
    }
  }, [currentCSS, onChange]);

  const clearAllEffects = useCallback(() => {
    onChange({ customCSS: undefined });
  }, [onChange]);

  // Count active effects in a category
  const countActiveEffects = useCallback((category: EffectCategory): number => {
    return category.effects.filter(effect => isEffectActive(currentCSS, effect.css)).length;
  }, [currentCSS]);

  // Count active effects in a property type
  const countActiveInPropertyType = useCallback((propertyType: PropertyType): number => {
    return propertyType.categories.reduce((sum, cat) => sum + countActiveEffects(cat), 0);
  }, [countActiveEffects]);

  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-4">
        {/* Left side: Effect picker */}
        <div className="flex-1 min-w-0">
          {/* Property type tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {ALL_PROPERTY_TYPES.map((propType) => {
              const activeCount = countActiveInPropertyType(propType);
              return (
                <button
                  key={propType.id}
                  onClick={() => setExpandedPropertyType(expandedPropertyType === propType.id ? null : propType.id)}
                  className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
                    expandedPropertyType === propType.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{propType.icon}</span>
                  <span>{propType.label}</span>
                  {activeCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Categories and effects for selected property type */}
          {expandedPropertyType && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {ALL_PROPERTY_TYPES.find(p => p.id === expandedPropertyType)?.categories.map((category) => {
                const activeCount = countActiveEffects(category);
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-sm font-medium text-gray-200">{category.label}</span>
                        {activeCount > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-emerald-600 text-white rounded-full">
                            {activeCount}
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                        {category.effects.map((effect) => {
                          const isActive = isEffectActive(currentCSS, effect.css);
                          return (
                            <button
                              key={effect.id}
                              onClick={() => toggleEffect(effect)}
                              className={`px-2 py-1.5 text-xs text-left rounded flex items-center gap-1.5 transition-colors ${
                                isActive
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              title={effect.description}
                            >
                              {isActive ? <Check size={12} /> : <Plus size={12} className="opacity-50" />}
                              <span className="truncate">{effect.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side: Current CSS and clear button */}
        <div className="w-[280px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">Combined CSS</label>
            {currentCSS && (
              <button
                onClick={clearAllEffects}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X size={12} />
                Clear All
              </button>
            )}
          </div>
          <textarea
            value={currentCSS}
            onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
            placeholder="Select effects or type custom CSS..."
            rows={8}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-600 rounded-lg bg-gray-800 text-gray-200 resize-y min-h-[120px]"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            💡 Toggle effects to combine them. Edit directly for custom values.
          </p>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/50">
        <p className="text-sm text-emerald-200">
          <strong>Combinable Effects:</strong> Toggle multiple effects to combine them. Each effect adds to your custom CSS.
        </p>
      </div>

      {/* Property types accordion */}
      <div className="space-y-2">
        {ALL_PROPERTY_TYPES.map((propType) => {
          const activeCount = countActiveInPropertyType(propType);
          const isExpanded = expandedPropertyType === propType.id;

          return (
            <div key={propType.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPropertyType(isExpanded ? null : propType.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{propType.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-200">{propType.label}</span>
                      {activeCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-emerald-600 text-white rounded-full">
                          {activeCount} active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{propType.description}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {propType.categories.map((category) => {
                    const catActiveCount = countActiveEffects(category);
                    const isCatExpanded = expandedCategory === category.id;

                    return (
                      <div key={category.id} className="bg-gray-900/50 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedCategory(isCatExpanded ? null : category.id)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="text-sm text-gray-300">{category.label}</span>
                            {catActiveCount > 0 && (
                              <span className="px-1.5 py-0.5 text-xs bg-emerald-600 text-white rounded-full">
                                {catActiveCount}
                              </span>
                            )}
                          </div>
                          {isCatExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                        </button>

                        {isCatExpanded && (
                          <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            {category.effects.map((effect) => {
                              const isActive = isEffectActive(currentCSS, effect.css);
                              return (
                                <button
                                  key={effect.id}
                                  onClick={() => toggleEffect(effect)}
                                  className={`px-3 py-2 text-sm text-left rounded-lg flex items-center gap-2 transition-all ${
                                    isActive
                                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                  }`}
                                  title={effect.description}
                                >
                                  {isActive ? <Check size={14} /> : <Plus size={14} className="opacity-50" />}
                                  <span>{effect.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current CSS display */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Combined CSS</label>
          {currentCSS && (
            <button
              onClick={clearAllEffects}
              className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X size={14} />
              Clear All
            </button>
          )}
        </div>
        <textarea
          value={currentCSS}
          onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
          placeholder="Select effects above or type custom CSS..."
          rows={4}
          className="w-full px-3 py-2 text-sm font-mono border border-gray-600 rounded-lg bg-gray-800 text-gray-200 resize-y"
        />
      </div>
    </div>
  );
}

export default AdvancedCSSEffects;
