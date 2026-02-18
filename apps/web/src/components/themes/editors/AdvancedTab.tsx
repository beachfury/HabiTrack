// apps/web/src/components/themes/editors/AdvancedTab.tsx
// Advanced/custom CSS tab with preset categories

import { useState } from 'react';
import type { ElementStyle } from '../../../types/theme';

// Preset categories for the Advanced tab
const PRESET_CATEGORIES = {
  matrix: {
    label: '🖥️ Matrix/Hacker',
    presets: [
      {
        name: 'Matrix Glow',
        css: 'text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 20px #00ff00; box-shadow: 0 0 10px rgba(0,255,0,0.3), inset 0 0 10px rgba(0,255,0,0.1);',
      },
      {
        name: 'Terminal Green',
        css: 'background: linear-gradient(180deg, rgba(0,20,0,0.95) 0%, rgba(0,40,0,0.9) 100%); border: 1px solid #00ff00; box-shadow: 0 0 15px rgba(0,255,0,0.4), inset 0 0 30px rgba(0,255,0,0.05);',
      },
      {
        name: 'Scanlines',
        css: 'background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px);',
      },
      {
        name: 'CRT Flicker',
        css: 'animation: crt-flicker 0.15s infinite; box-shadow: 0 0 20px rgba(0,255,0,0.5);',
      },
      {
        name: 'Hacker Border',
        css: 'border: 2px solid #00ff00; border-image: linear-gradient(45deg, #00ff00, #00aa00, #00ff00) 1; box-shadow: 0 0 10px #00ff00;',
      },
      {
        name: 'Digital Rain BG',
        css: 'background: linear-gradient(180deg, #000 0%, #001a00 50%, #000 100%); position: relative;',
      },
    ],
  },
  retro: {
    label: '📺 Retro/CRT',
    presets: [
      {
        name: 'CRT Curve',
        css: 'border-radius: 20px / 40px; box-shadow: inset 0 0 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,0,0.2);',
      },
      {
        name: 'VHS Glitch',
        css: 'text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; animation: vhs-glitch 0.5s infinite;',
      },
      {
        name: 'Phosphor Burn',
        css: 'background: radial-gradient(ellipse at center, rgba(0,50,0,0.8) 0%, rgba(0,20,0,0.95) 70%, rgba(0,0,0,1) 100%);',
      },
      {
        name: '80s Neon',
        css: 'border: 2px solid #ff00ff; box-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff, inset 0 0 15px rgba(255,0,255,0.1);',
      },
      {
        name: 'Synthwave',
        css: 'background: linear-gradient(180deg, #2b1055 0%, #7597de 50%, #ff6b6b 100%); border-bottom: 3px solid #ff00ff;',
      },
      {
        name: 'Amber CRT',
        css: 'background: #1a0f00; color: #ffb000; text-shadow: 0 0 5px #ffb000; box-shadow: inset 0 0 50px rgba(255,176,0,0.1);',
      },
    ],
  },
  effects: {
    label: '✨ Effects',
    presets: [
      {
        name: 'Glass Panel',
        css: 'backdrop-filter: blur(10px); background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);',
      },
      {
        name: 'Hologram',
        css: 'background: linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.1) 50%, rgba(0,255,255,0.1) 100%); border: 1px solid rgba(0,255,255,0.5); box-shadow: 0 0 20px rgba(0,255,255,0.3);',
      },
      {
        name: 'Pulse Glow',
        css: 'animation: pulse-glow 2s ease-in-out infinite; box-shadow: 0 0 20px currentColor;',
      },
      {
        name: 'Gradient Border',
        css: 'border: 2px solid transparent; background-clip: padding-box; background-image: linear-gradient(#000, #000), linear-gradient(45deg, #00ff00, #00ffff, #ff00ff); background-origin: border-box;',
      },
      {
        name: 'Soft Shadow',
        css: 'box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);',
      },
      {
        name: 'Inner Glow',
        css: 'box-shadow: inset 0 0 30px rgba(0,255,0,0.2), inset 0 0 60px rgba(0,255,0,0.1);',
      },
    ],
  },
  shapes: {
    label: '🔷 Shapes',
    presets: [
      {
        name: 'LCARS Curve',
        css: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;',
      },
      {
        name: 'LCARS Clip',
        css: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);',
      },
      {
        name: 'Skew Left',
        css: 'transform: skewX(-3deg);',
      },
      {
        name: 'Skew Right',
        css: 'transform: skewX(3deg);',
      },
      {
        name: 'Hexagon',
        css: 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);',
      },
      {
        name: 'Notched',
        css: 'clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));',
      },
    ],
  },
  animations: {
    label: '🎬 Animations',
    presets: [
      {
        name: 'Breathing',
        css: 'animation: breathing 3s ease-in-out infinite;',
      },
      {
        name: 'Border Flow',
        css: 'animation: border-flow 3s linear infinite; border: 2px solid;',
      },
      {
        name: 'Shimmer',
        css: 'background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite;',
      },
      {
        name: 'Float',
        css: 'animation: float 3s ease-in-out infinite;',
      },
      {
        name: 'Rotate Slow',
        css: 'animation: rotate-slow 20s linear infinite;',
      },
      {
        name: 'Glitch',
        css: 'animation: glitch 0.3s infinite;',
      },
    ],
  },
};

export function AdvancedTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: ElementStyle;
  onChange: (updates: Partial<ElementStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PRESET_CATEGORIES>('matrix');

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div className="flex items-start gap-6">
        {/* Custom CSS */}
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Custom CSS Properties
          </label>
          <textarea
            value={style.customCSS || ''}
            onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
            placeholder="e.g., text-shadow: 0 0 10px #00ff00;&#10;animation: glow 2s infinite;&#10;transform: skewX(-3deg);"
            rows={5}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-y min-h-[80px] max-h-[300px]"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              Raw CSS for transforms, animations, clip-paths, etc.
            </p>
            {style.customCSS && (
              <button
                onClick={() => onChange({ customCSS: undefined })}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Preset categories */}
        <div className="flex-shrink-0 w-[420px]">
          {/* Category tabs */}
          <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
            {Object.entries(PRESET_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as keyof typeof PRESET_CATEGORIES)}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors ${
                  selectedCategory === key
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Presets grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {PRESET_CATEGORIES[selectedCategory].presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onChange({ customCSS: preset.css })}
                className="px-2 py-1.5 text-xs text-left bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors truncate"
                title={preset.css}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Append mode hint */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            💡 Tip: Copy current CSS, click preset, then paste back to combine effects
          </p>
        </div>
      </div>
    );
  }

  // Vertical layout (original)
  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Advanced:</strong> Custom CSS allows radical customizations like LCARS-style
          clip-paths, transforms, and animations.
        </p>
      </div>

      {/* Custom CSS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom CSS
        </label>
        <textarea
          value={style.customCSS || ''}
          onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
          placeholder={`Example:\nclip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);\ntransform: skewX(-5deg);`}
          rows={6}
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* LCARS presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Presets
        </label>
        <div className="space-y-2">
          <button
            onClick={() =>
              onChange({
                customCSS: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);',
              })
            }
            className="w-full px-3 py-2 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            LCARS Button Clip
          </button>
          <button
            onClick={() =>
              onChange({
                customCSS: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;',
              })
            }
            className="w-full px-3 py-2 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            LCARS Sidebar Curve
          </button>
          <button
            onClick={() =>
              onChange({
                customCSS: 'transform: skewX(-3deg);',
              })
            }
            className="w-full px-3 py-2 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Skewed Element
          </button>
        </div>
      </div>
    </div>
  );
}
