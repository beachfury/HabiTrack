// apps/web/src/components/themes/editors/ColorInput.tsx
// Reusable color picker input that uses our custom ColorPickerModal

import { useState } from 'react';
import { ColorPickerModal } from '../../common/ColorPickerModal';

export function ColorInput({
  value,
  onChange,
  placeholder = '#ffffff',
}: {
  value: string | undefined;
  onChange: (color: string) => void;
  placeholder?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
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
          onSelect={onChange}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
