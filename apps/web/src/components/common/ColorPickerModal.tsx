// apps/web/src/components/common/ColorPickerModal.tsx
import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, RotateCcw } from 'lucide-react';
import { ModalPortal, ModalBody } from './ModalPortal';

// ============================================
// Types
// ============================================
interface ColorSwatch {
  id: number;
  name: string | null;
  hexColor: string;
  isDefault: boolean;
}

interface ColorPickerModalProps {
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

// ============================================
// Color Conversion Utilities
// ============================================
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ============================================
// Main Component
// ============================================
export function ColorPickerModal({ currentColor, onSelect, onClose }: ColorPickerModalProps) {
  const [mode, setMode] = useState<'swatches' | 'custom'>('swatches');
  const [sliderMode, setSliderMode] = useState<'hsl' | 'rgb'>('hsl');

  // Color state
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [rgb, setRgb] = useState(() => hexToRgb(currentColor));
  const [hsl, setHsl] = useState(() => {
    const { r, g, b } = hexToRgb(currentColor);
    return rgbToHsl(r, g, b);
  });

  // Swatches state
  const [defaultSwatches, setDefaultSwatches] = useState<ColorSwatch[]>([]);
  const [customSwatches, setCustomSwatches] = useState<ColorSwatch[]>([]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Save swatch state
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [swatchName, setSwatchName] = useState('');
  const [saving, setSaving] = useState(false);

  // Load swatches and recent colors
  useEffect(() => {
    loadSwatches();
    loadRecentColors();
  }, []);

  const loadSwatches = async () => {
    try {
      const response = await fetch('/api/colors/swatches', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDefaultSwatches(data.swatches?.filter((s: ColorSwatch) => s.isDefault) || []);
        setCustomSwatches(data.swatches?.filter((s: ColorSwatch) => !s.isDefault) || []);
      } else {
        // Use fallback colors if API fails
        setDefaultSwatches(
          FALLBACK_COLORS.map((c, i) => ({
            id: i,
            name: c.name,
            hexColor: c.value,
            isDefault: true,
          })),
        );
      }
    } catch (err) {
      console.error('Failed to load swatches:', err);
      // Use fallback colors if API fails
      setDefaultSwatches(
        FALLBACK_COLORS.map((c, i) => ({
          id: i,
          name: c.name,
          hexColor: c.value,
          isDefault: true,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRecentColors = async () => {
    try {
      const response = await fetch('/api/colors/recent', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRecentColors(data.colors?.map((c: any) => c.hexColor || c) || []);
      }
    } catch (err) {
      console.error('Failed to load recent colors:', err);
    }
  };

  // Update color from RGB
  const updateFromRgb = useCallback((newRgb: { r: number; g: number; b: number }) => {
    setRgb(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setSelectedColor(hex);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  }, []);

  // Update color from HSL
  const updateFromHsl = useCallback((newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    setSelectedColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, []);

  // Update color from hex input
  const updateFromHex = useCallback((hex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setSelectedColor(hex);
      const newRgb = hexToRgb(hex);
      setRgb(newRgb);
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }
  }, []);

  // Save custom swatch
  const saveCustomSwatch = async () => {
    if (!swatchName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/colors/swatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: swatchName.trim(),
          hexColor: selectedColor,
        }),
      });

      if (response.ok) {
        await loadSwatches();
        setShowSaveInput(false);
        setSwatchName('');
      }
    } catch (err) {
      console.error('Failed to save swatch:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete custom swatch
  const deleteCustomSwatch = async (id: number) => {
    try {
      await fetch(`/api/colors/swatches/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await loadSwatches();
    } catch (err) {
      console.error('Failed to delete swatch:', err);
    }
  };

  // Handle final selection
  const handleSelect = async () => {
    // Save to recent colors (fire and forget)
    fetch('/api/colors/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ hexColor: selectedColor }),
    }).catch((err) => console.error('Failed to save recent color:', err));

    onSelect(selectedColor);
    onClose();
  };

  // Reset to original color
  const handleReset = () => {
    setSelectedColor(currentColor);
    const newRgb = hexToRgb(currentColor);
    setRgb(newRgb);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="flex-1 py-2 px-4 border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      >
        Cancel
      </button>
      <button
        onClick={handleSelect}
        className="flex-1 py-2 px-4 bg-[var(--color-accent)] text-[var(--color-primary-foreground)] rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
      >
        <Check size={18} />
        Select Color
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Choose Color"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('swatches')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                mode === 'swatches'
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              Swatches
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                mode === 'custom'
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-4 p-3 bg-[var(--color-muted)] rounded-xl">
            <div
              className="w-12 h-12 rounded-xl shadow-inner border border-[var(--color-border)]"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-muted-foreground)]">Selected</p>
              <p className="font-mono font-medium text-[var(--color-foreground)] uppercase">
                {selectedColor}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-[var(--color-muted)] rounded-lg text-[var(--color-muted-foreground)]"
              title="Reset to original"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Swatches Mode */}
          {mode === 'swatches' && (
            <div className="space-y-4">
              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Recent
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {recentColors.slice(0, 10).map((color, index) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => {
                          setSelectedColor(color);
                          const newRgb = hexToRgb(color);
                          setRgb(newRgb);
                          setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
                        }}
                        className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-transform border-2 ${
                          selectedColor === color
                            ? 'border-[var(--color-accent)] scale-110 ring-2 ring-[var(--color-accent)]/50'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Default Swatches */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                  Colors
                </label>
                {loading ? (
                  <div className="text-center py-4 text-[var(--color-muted-foreground)]">Loading...</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {defaultSwatches.map((swatch) => (
                      <button
                        key={swatch.id}
                        onClick={() => {
                          setSelectedColor(swatch.hexColor);
                          const newRgb = hexToRgb(swatch.hexColor);
                          setRgb(newRgb);
                          setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
                        }}
                        className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-transform border-2 ${
                          selectedColor === swatch.hexColor
                            ? 'border-[var(--color-accent)] scale-110 ring-2 ring-[var(--color-accent)]/50'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hexColor }}
                        title={swatch.name || swatch.hexColor}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Swatches */}
              {customSwatches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    My Colors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {customSwatches.map((swatch) => (
                      <div key={swatch.id} className="relative group">
                        <button
                          onClick={() => {
                            setSelectedColor(swatch.hexColor);
                            const newRgb = hexToRgb(swatch.hexColor);
                            setRgb(newRgb);
                            setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
                          }}
                          className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-transform border-2 ${
                            selectedColor === swatch.hexColor
                              ? 'border-[var(--color-accent)] scale-110 ring-2 ring-[var(--color-accent)]/50'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hexColor }}
                          title={swatch.name || swatch.hexColor}
                        />
                        <button
                          onClick={() => deleteCustomSwatch(swatch.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Mode */}
          {mode === 'custom' && (
            <div className="space-y-4">
              {/* Slider Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSliderMode('hsl')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    sliderMode === 'hsl'
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  HSL
                </button>
                <button
                  onClick={() => setSliderMode('rgb')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    sliderMode === 'rgb'
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  RGB
                </button>
              </div>

              {/* HSL Sliders */}
              {sliderMode === 'hsl' && (
                <div className="space-y-3">
                  {/* Hue */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-muted-foreground)]">Hue</span>
                      <span className="font-mono text-[var(--color-foreground)]">{hsl.h}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hsl.h}
                      onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value) })}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          hsl(0, ${hsl.s}%, ${hsl.l}%),
                          hsl(60, ${hsl.s}%, ${hsl.l}%),
                          hsl(120, ${hsl.s}%, ${hsl.l}%),
                          hsl(180, ${hsl.s}%, ${hsl.l}%),
                          hsl(240, ${hsl.s}%, ${hsl.l}%),
                          hsl(300, ${hsl.s}%, ${hsl.l}%),
                          hsl(360, ${hsl.s}%, ${hsl.l}%))`,
                      }}
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-muted-foreground)]">Saturation</span>
                      <span className="font-mono text-[var(--color-foreground)]">{hsl.s}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hsl.s}
                      onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value) })}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          hsl(${hsl.h}, 0%, ${hsl.l}%),
                          hsl(${hsl.h}, 100%, ${hsl.l}%))`,
                      }}
                    />
                  </div>

                  {/* Lightness */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-muted-foreground)]">Lightness</span>
                      <span className="font-mono text-[var(--color-foreground)]">{hsl.l}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hsl.l}
                      onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value) })}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          hsl(${hsl.h}, ${hsl.s}%, 0%),
                          hsl(${hsl.h}, ${hsl.s}%, 50%),
                          hsl(${hsl.h}, ${hsl.s}%, 100%))`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* RGB Sliders */}
              {sliderMode === 'rgb' && (
                <div className="space-y-3">
                  {/* Red */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-600 dark:text-red-400">Red</span>
                      <span className="font-mono text-[var(--color-foreground)]">{rgb.r}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgb.r}
                      onChange={(e) => updateFromRgb({ ...rgb, r: parseInt(e.target.value) })}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          rgb(0, ${rgb.g}, ${rgb.b}),
                          rgb(255, ${rgb.g}, ${rgb.b}))`,
                      }}
                    />
                  </div>

                  {/* Green */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600 dark:text-green-400">Green</span>
                      <span className="font-mono text-[var(--color-foreground)]">{rgb.g}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgb.g}
                      onChange={(e) => updateFromRgb({ ...rgb, g: parseInt(e.target.value) })}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          rgb(${rgb.r}, 0, ${rgb.b}),
                          rgb(${rgb.r}, 255, ${rgb.b}))`,
                      }}
                    />
                  </div>

                  {/* Blue */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-600 dark:text-blue-400">Blue</span>
                      <span className="font-mono text-[var(--color-foreground)]">{rgb.b}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgb.b}
                      onChange={(e) => updateFromRgb({ ...rgb, b: parseInt(e.target.value) })}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          rgb(${rgb.r}, ${rgb.g}, 0),
                          rgb(${rgb.r}, ${rgb.g}, 255))`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Hex Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Hex Code
                </label>
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith('#')) value = '#' + value;
                    if (value.length <= 7) {
                      setSelectedColor(value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        updateFromHex(value);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-muted)] text-[var(--color-foreground)] font-mono uppercase"
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>

              {/* Save as Swatch */}
              {!showSaveInput ? (
                <button
                  onClick={() => setShowSaveInput(true)}
                  className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
                >
                  <Plus size={16} />
                  Save as custom color
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={swatchName}
                    onChange={(e) => setSwatchName(e.target.value)}
                    placeholder="Color name..."
                    className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-muted)] text-[var(--color-foreground)] text-sm"
                    autoFocus
                  />
                  <button
                    onClick={saveCustomSwatch}
                    disabled={!swatchName.trim() || saving}
                    className="px-3 py-2 bg-[var(--color-accent)] text-[var(--color-primary-foreground)] rounded-xl text-sm disabled:opacity-50"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveInput(false);
                      setSwatchName('');
                    }}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}

// Fallback colors if API fails
const FALLBACK_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Gray', value: '#6b7280' },
];

export default ColorPickerModal;
