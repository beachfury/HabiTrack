// apps/web/src/components/common/ColorPicker.tsx
import { useState } from 'react';
import { Palette } from 'lucide-react';
import ColorPickerModal from './ColorPickerModal';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

/**
 * ColorPicker - A button that shows the current color and opens
 * the ColorPickerModal when clicked.
 *
 * Usage:
 * <ColorPicker
 *   color={form.color}
 *   onChange={(color) => setForm({ ...form, color })}
 *   label="Category Color"
 * />
 */
export function ColorPicker({ color, onChange, label, className = '' }: ColorPickerProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-muted)] transition-colors w-full"
        >
          <span
            className="w-8 h-8 rounded-lg border border-[var(--color-border)] shadow-inner"
            style={{ backgroundColor: color }}
          />
          <span className="flex-1 text-left">
            <span className="font-mono text-sm text-[var(--color-foreground)] uppercase">
              {color}
            </span>
          </span>
          <Palette size={18} className="text-[var(--color-muted-foreground)]" />
        </button>
      </div>

      {showModal && (
        <ColorPickerModal
          currentColor={color}
          onSelect={onChange}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default ColorPicker;
