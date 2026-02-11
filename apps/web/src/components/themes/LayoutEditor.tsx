// apps/web/src/components/themes/LayoutEditor.tsx
// Editor for theme layout and UI settings

import { Layout, PanelLeft, PanelRight, PanelTop, Minimize2 } from 'lucide-react';
import type { ThemeLayout, ThemeUI, LayoutType, NavStyle, BorderRadius, ShadowIntensity } from '../../types/theme';

interface LayoutEditorProps {
  layout: ThemeLayout;
  onChange: (layout: ThemeLayout) => void;
  ui: ThemeUI;
  onUiChange: (ui: ThemeUI) => void;
}

const LAYOUT_OPTIONS: Array<{ id: LayoutType; label: string; description: string; icon: typeof Layout }> = [
  { id: 'sidebar-left', label: 'Left Sidebar', description: 'Navigation on the left', icon: PanelLeft },
  { id: 'sidebar-right', label: 'Right Sidebar', description: 'Navigation on the right', icon: PanelRight },
  { id: 'top-header', label: 'Top Header', description: 'Horizontal navigation bar', icon: PanelTop },
  { id: 'minimal', label: 'Minimal', description: 'Hamburger menu only', icon: Minimize2 },
];

const NAV_STYLE_OPTIONS: Array<{ id: NavStyle; label: string; description: string }> = [
  { id: 'icons-text', label: 'Icons & Text', description: 'Show both icons and labels' },
  { id: 'icons-only', label: 'Icons Only', description: 'Compact view with tooltips' },
  { id: 'text-only', label: 'Text Only', description: 'Labels without icons' },
];

const BORDER_RADIUS_OPTIONS: Array<{ id: BorderRadius; label: string; preview: string }> = [
  { id: 'none', label: 'None', preview: '0' },
  { id: 'small', label: 'Small', preview: '0.25rem' },
  { id: 'medium', label: 'Medium', preview: '0.5rem' },
  { id: 'large', label: 'Large', preview: '1rem' },
];

const SHADOW_OPTIONS: Array<{ id: ShadowIntensity; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'medium', label: 'Medium' },
  { id: 'strong', label: 'Strong' },
];

export function LayoutEditor({ layout, onChange, ui, onUiChange }: LayoutEditorProps) {
  return (
    <div className="space-y-6">
      {/* Layout Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Layout Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {LAYOUT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange({ ...layout, type: option.id })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                layout.type === option.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <option.icon
                size={24}
                className={layout.type === option.id ? 'text-emerald-600' : 'text-gray-400'}
              />
              <p className={`mt-2 text-sm font-medium ${
                layout.type === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {option.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Width (for sidebar layouts) */}
      {(layout.type === 'sidebar-left' || layout.type === 'sidebar-right') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sidebar Width: {layout.sidebarWidth || 256}px
          </label>
          <input
            type="range"
            min={180}
            max={320}
            step={8}
            value={layout.sidebarWidth || 256}
            onChange={(e) => onChange({ ...layout, sidebarWidth: parseInt(e.target.value) })}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Compact (180px)</span>
            <span>Wide (320px)</span>
          </div>
        </div>
      )}

      {/* Header Height (for top-header layout) */}
      {layout.type === 'top-header' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Header Height: {layout.headerHeight || 64}px
          </label>
          <input
            type="range"
            min={48}
            max={80}
            step={4}
            value={layout.headerHeight || 64}
            onChange={(e) => onChange({ ...layout, headerHeight: parseInt(e.target.value) })}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Compact (48px)</span>
            <span>Tall (80px)</span>
          </div>
        </div>
      )}

      {/* Navigation Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Navigation Style
        </label>
        <div className="space-y-2">
          {NAV_STYLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange({ ...layout, navStyle: option.id })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                layout.navStyle === option.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <p className={`text-sm font-medium ${
                layout.navStyle === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {option.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Border Radius
        </label>
        <div className="flex gap-2">
          {BORDER_RADIUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onUiChange({ ...ui, borderRadius: option.id })}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                ui.borderRadius === option.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 mx-auto bg-emerald-500"
                style={{ borderRadius: option.preview }}
              />
              <p className={`mt-2 text-xs font-medium text-center ${
                ui.borderRadius === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {option.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Shadow Intensity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Shadow Intensity
        </label>
        <div className="flex gap-2">
          {SHADOW_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onUiChange({ ...ui, shadowIntensity: option.id })}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                ui.shadowIntensity === option.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <p className={`text-xs font-medium text-center ${
                ui.shadowIntensity === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {option.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          UI Element Preview
        </p>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium"
            style={{
              borderRadius: BORDER_RADIUS_OPTIONS.find((o) => o.id === ui.borderRadius)?.preview || '0.5rem',
              boxShadow:
                ui.shadowIntensity === 'none'
                  ? 'none'
                  : ui.shadowIntensity === 'subtle'
                  ? '0 1px 2px rgba(0,0,0,0.1)'
                  : ui.shadowIntensity === 'medium'
                  ? '0 4px 6px rgba(0,0,0,0.1)'
                  : '0 10px 15px rgba(0,0,0,0.15)',
            }}
          >
            Button
          </button>
          <div
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"
            style={{
              borderRadius: BORDER_RADIUS_OPTIONS.find((o) => o.id === ui.borderRadius)?.preview || '0.5rem',
              boxShadow:
                ui.shadowIntensity === 'none'
                  ? 'none'
                  : ui.shadowIntensity === 'subtle'
                  ? '0 1px 2px rgba(0,0,0,0.05)'
                  : ui.shadowIntensity === 'medium'
                  ? '0 4px 6px rgba(0,0,0,0.07)'
                  : '0 10px 15px rgba(0,0,0,0.1)',
            }}
          >
            Card
          </div>
        </div>
      </div>
    </div>
  );
}
