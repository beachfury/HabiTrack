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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
        >
          <span
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner"
            style={{ backgroundColor: color }}
          />
          <span className="flex-1 text-left">
            <span className="font-mono text-sm text-gray-900 dark:text-white uppercase">
              {color}
            </span>
          </span>
          <Palette size={18} className="text-gray-400" />
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
