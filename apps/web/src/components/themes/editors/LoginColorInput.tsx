// apps/web/src/components/themes/editors/LoginColorInput.tsx
// Reusable color input with picker for the Login Page Editor.
// Shows a color swatch button, hex text input, and an optional ColorPickerModal.

import { ColorPickerModal } from '../../common/ColorPickerModal';

interface ColorInputProps {
  color: string;
  onChange: (color: string) => void;
  showPicker: boolean;
  onTogglePicker: () => void;
  label?: string;
}

export function ColorInput({
  color,
  onChange,
  showPicker,
  onTogglePicker,
  label,
}: ColorInputProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={onTogglePicker}
          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0 transition-colors hover:border-emerald-400"
          style={{ backgroundColor: color }}
          title="Click to open color picker"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3cb371"
          className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <ColorPickerModal
            currentColor={color}
            onSelect={(newColor) => {
              onChange(newColor);
              onTogglePicker();
            }}
            onClose={onTogglePicker}
          />
        </div>
      )}
    </div>
  );
}
