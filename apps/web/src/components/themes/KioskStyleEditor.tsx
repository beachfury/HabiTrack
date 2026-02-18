// apps/web/src/components/themes/KioskStyleEditor.tsx
// Editor panel for customizing the kiosk/PIN login page theme
// Uses the same 5-tab structure as ElementStyleEditor for consistency

import { useState, useRef } from 'react';
import { X, Paintbrush, Type, Square, Sparkles, Code, RotateCcw, Upload, Trash2 } from 'lucide-react';
import type { KioskStyle } from '../../types/theme';
import { ColorPickerModal } from '../common/ColorPickerModal';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
}

// Default kiosk style
const DEFAULT_KIOSK_STYLE: KioskStyle = {
  backgroundGradient: {
    from: '#8b5cf6',
    to: '#3b82f6',
  },
  textColor: '#ffffff',
  buttonBgColor: 'rgba(255, 255, 255, 0.2)',
  buttonTextColor: '#ffffff',
  accentColor: '#ffffff',
};

interface KioskStyleEditorProps {
  style: KioskStyle;
  onChange: (style: KioskStyle) => void;
  onClose: () => void;
  isReadOnly?: boolean;
  layout?: 'vertical' | 'horizontal';
}

type EditorTab = 'background' | 'text' | 'border' | 'effects' | 'advanced';

export function KioskStyleEditor({
  style,
  onChange,
  onClose,
  isReadOnly = false,
  layout = 'vertical',
}: KioskStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('background');
  const isHorizontal = layout === 'horizontal';

  const updateStyle = (updates: Partial<KioskStyle>) => {
    if (isReadOnly) return;
    onChange({ ...style, ...updates });
  };

  const resetStyle = () => {
    if (isReadOnly) return;
    onChange(DEFAULT_KIOSK_STYLE);
  };

  const tabs: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'background', label: 'Background', icon: Paintbrush },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'border', label: 'Buttons', icon: Square },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  // Horizontal layout (bottom panel)
  if (isHorizontal) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
              Kiosk Mode
            </h3>
            {isReadOnly && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
                View only
              </span>
            )}
          </div>

          {/* Horizontal tabs */}
          <div className="flex items-center gap-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isReadOnly && (
              <button
                onClick={resetStyle}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reset to default"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-4">
          {activeTab === 'background' && (
            <BackgroundTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'text' && (
            <TextTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'border' && (
            <ButtonsTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'effects' && (
            <EffectsTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
          {activeTab === 'advanced' && (
            <AdvancedTab style={style} onChange={updateStyle} layout="horizontal" />
          )}
        </div>
      </div>
    );
  }

  // Vertical layout (right panel)
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Kiosk Mode
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isReadOnly
              ? 'View only (system theme)'
              : 'Customize tablet/kiosk PIN login'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      {/* Read-only warning */}
      {isReadOnly && (
        <div className="mx-4 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg">
          This theme cannot be modified. Create a copy to customize.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'background' && (
          <BackgroundTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'text' && (
          <TextTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'border' && (
          <ButtonsTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'effects' && (
          <EffectsTab style={style} onChange={updateStyle} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab style={style} onChange={updateStyle} />
        )}
      </div>

      {/* Footer actions */}
      {!isReadOnly && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetStyle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={14} />
            Reset to Default
          </button>
        </div>
      )}
    </div>
  );
}

// Reusable color picker input
function ColorInput({
  value,
  onChange,
  placeholder = '#ffffff',
  label,
}: {
  value: string | undefined;
  onChange: (color: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPicker(true)}
          className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0 transition-colors hover:border-emerald-400"
          style={{ backgroundColor: value || placeholder }}
          title="Click to choose color"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
        />
      </div>
      {showPicker && (
        <ColorPickerModal
          currentColor={value || placeholder}
          onSelect={(color) => {
            onChange(color);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// Gradient presets for kiosk background
const GRADIENT_PRESETS = [
  { name: 'Purple-Blue', from: '#8b5cf6', to: '#3b82f6' },
  { name: 'Green-Teal', from: '#22c55e', to: '#14b8a6' },
  { name: 'Pink-Purple', from: '#ec4899', to: '#8b5cf6' },
  { name: 'Orange-Red', from: '#f97316', to: '#ef4444' },
  { name: 'Navy', from: '#3d4f5f', to: '#1a2530' },
  { name: 'Dark', from: '#1f2937', to: '#111827' },
];

// Background tab
function BackgroundTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: KioskStyle;
  onChange: (updates: Partial<KioskStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const response = await fetch('/api/upload/background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        onChange({ backgroundImage: data.url });
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload:', err);
      alert('Failed to upload image');
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        {/* Gradient section */}
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Gradient Background
          </h4>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onChange({
                  backgroundGradient: { from: preset.from, to: preset.to },
                  backgroundImage: undefined,
                })}
                className="w-12 h-8 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                style={{
                  background: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
                }}
                title={preset.name}
              />
            ))}
          </div>

          {/* Custom gradient colors */}
          <div className="flex gap-4">
            <div className="flex-1">
              <ColorInput
                value={style.backgroundGradient?.from}
                onChange={(color) => onChange({
                  backgroundGradient: { ...style.backgroundGradient, from: color, to: style.backgroundGradient?.to || '#3b82f6' },
                })}
                label="Start Color"
              />
            </div>
            <div className="flex-1">
              <ColorInput
                value={style.backgroundGradient?.to}
                onChange={(color) => onChange({
                  backgroundGradient: { ...style.backgroundGradient, from: style.backgroundGradient?.from || '#8b5cf6', to: color },
                })}
                label="End Color"
              />
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="w-64 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Background Image
          </h4>

          {style.backgroundImage ? (
            <div className="space-y-2">
              <div
                className="h-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                style={{ backgroundImage: `url(${resolveImageUrl(style.backgroundImage)})` }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Upload size={12} />
                  Change
                </button>
                <button
                  onClick={() => onChange({ backgroundImage: undefined })}
                  className="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
              ) : (
                <>
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Upload image</span>
                </>
              )}
            </button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Overrides gradient when set
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        Gradient Background
      </h4>

      {/* Presets */}
      <div className="grid grid-cols-6 gap-2">
        {GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onChange({
              backgroundGradient: { from: preset.from, to: preset.to },
              backgroundImage: undefined,
            })}
            className="h-10 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
            style={{
              background: `linear-gradient(to bottom right, ${preset.from}, ${preset.to})`,
            }}
            title={preset.name}
          />
        ))}
      </div>

      <ColorInput
        value={style.backgroundGradient?.from}
        onChange={(color) => onChange({
          backgroundGradient: { ...style.backgroundGradient, from: color, to: style.backgroundGradient?.to || '#3b82f6' },
        })}
        label="Start Color"
      />

      <ColorInput
        value={style.backgroundGradient?.to}
        onChange={(color) => onChange({
          backgroundGradient: { ...style.backgroundGradient, from: style.backgroundGradient?.from || '#8b5cf6', to: color },
        })}
        label="End Color"
      />

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Preview
        </label>
        <div
          className="h-16 rounded-lg border border-gray-200 dark:border-gray-600"
          style={{
            background: style.backgroundImage
              ? `url(${resolveImageUrl(style.backgroundImage)}) center/cover`
              : `linear-gradient(to bottom right, ${style.backgroundGradient?.from || '#8b5cf6'}, ${style.backgroundGradient?.to || '#3b82f6'})`,
          }}
        />
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
          Background Image
        </h4>

        {style.backgroundImage ? (
          <div className="space-y-2">
            <div
              className="h-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-cover bg-center"
              style={{ backgroundImage: `url(${resolveImageUrl(style.backgroundImage)})` }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                <Upload size={14} />
                Change
              </button>
              <button
                onClick={() => onChange({ backgroundImage: undefined })}
                className="px-3 py-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 transition-colors"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
            ) : (
              <>
                <Upload size={24} className="text-gray-400" />
                <span className="text-xs text-gray-500">Click to upload</span>
              </>
            )}
          </button>
        )}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Overrides gradient when set
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}

// Text tab
function TextTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: KioskStyle;
  onChange: (updates: Partial<KioskStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="w-64">
          <ColorInput
            value={style.textColor}
            onChange={(color) => onChange({ textColor: color })}
            label="Main Text Color"
            placeholder="#ffffff"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Headings and primary text
          </p>
        </div>
        <div className="w-64">
          <ColorInput
            value={style.textMutedColor}
            onChange={(color) => onChange({ textMutedColor: color })}
            label="Muted Text Color"
            placeholder="rgba(255, 255, 255, 0.8)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Subtitles and hints
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ColorInput
        value={style.textColor}
        onChange={(color) => onChange({ textColor: color })}
        label="Main Text Color"
        placeholder="#ffffff"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
        Headings and primary text
      </p>

      <ColorInput
        value={style.textMutedColor}
        onChange={(color) => onChange({ textMutedColor: color })}
        label="Muted Text Color"
        placeholder="rgba(255, 255, 255, 0.8)"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
        Subtitles and hints
      </p>
    </div>
  );
}

// Buttons tab (replaces Border tab)
function ButtonsTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: KioskStyle;
  onChange: (updates: Partial<KioskStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Number Pad Buttons
          </h4>
          <div className="flex gap-4">
            <div className="flex-1">
              <ColorInput
                value={style.buttonBgColor}
                onChange={(color) => onChange({ buttonBgColor: color })}
                label="Background"
                placeholder="rgba(255, 255, 255, 0.2)"
              />
            </div>
            <div className="flex-1">
              <ColorInput
                value={style.buttonTextColor}
                onChange={(color) => onChange({ buttonTextColor: color })}
                label="Text"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        <div className="w-64 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Enter Button
          </h4>
          <ColorInput
            value={style.accentColor}
            onChange={(color) => onChange({ accentColor: color })}
            label="Accent Color"
            placeholder="#ffffff"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Background of the Enter button
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        Number Pad Buttons
      </h4>

      <ColorInput
        value={style.buttonBgColor}
        onChange={(color) => onChange({ buttonBgColor: color })}
        label="Background"
        placeholder="rgba(255, 255, 255, 0.2)"
      />

      <ColorInput
        value={style.buttonTextColor}
        onChange={(color) => onChange({ buttonTextColor: color })}
        label="Text Color"
        placeholder="#ffffff"
      />

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
          Enter Button
        </h4>

        <ColorInput
          value={style.accentColor}
          onChange={(color) => onChange({ accentColor: color })}
          label="Accent Color"
          placeholder="#ffffff"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Background of the Enter button
        </p>
      </div>
    </div>
  );
}

// Effects tab
function EffectsTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: KioskStyle;
  onChange: (updates: Partial<KioskStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Background Blur
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="20"
              value={style.blur || 0}
              onChange={(e) => onChange({ blur: parseInt(e.target.value) || undefined })}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
              {style.blur || 0}px
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Only applies when using background image
          </p>
        </div>

        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            User Card Border Width
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="8"
              value={style.borderWidth || 2}
              onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) || undefined })}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
              {style.borderWidth || 2}px
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Background Blur
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="20"
            value={style.blur || 0}
            onChange={(e) => onChange({ blur: parseInt(e.target.value) || undefined })}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
            {style.blur || 0}px
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Only applies when using background image
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          User Card Border Width
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="8"
            value={style.borderWidth || 2}
            onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) || undefined })}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
            {style.borderWidth || 2}px
          </span>
        </div>
      </div>
    </div>
  );
}

// Advanced tab
function AdvancedTab({
  style,
  onChange,
  layout = 'vertical',
}: {
  style: KioskStyle;
  onChange: (updates: Partial<KioskStyle>) => void;
  layout?: 'vertical' | 'horizontal';
}) {
  const isHorizontal = layout === 'horizontal';

  if (isHorizontal) {
    return (
      <div className="flex gap-8 items-start">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Custom CSS
          </label>
          <textarea
            value={style.customCSS || ''}
            onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
            placeholder="/* Add custom CSS properties */&#10;box-shadow: 0 0 20px rgba(0,0,0,0.3);"
            className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Advanced: Add custom CSS properties to the kiosk container
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Custom CSS
        </label>
        <textarea
          value={style.customCSS || ''}
          onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
          placeholder="/* Add custom CSS properties */&#10;box-shadow: 0 0 20px rgba(0,0,0,0.3);"
          className="w-full h-40 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Advanced: Add custom CSS properties to the kiosk container
        </p>
      </div>
    </div>
  );
}
