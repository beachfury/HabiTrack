// apps/web/src/components/themes/editors/SliderWithInput.tsx
// Reusable slider with number input for fine control

export interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function SliderWithInput({ label, value, min, max, step = 1, unit = '', onChange, className = '' }: SliderWithInputProps) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-emerald-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              onChange(Math.min(max, Math.max(min, val)));
            }
          }}
          className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white text-right"
        />
        {unit && <span className="text-xs text-gray-500 w-6">{unit}</span>}
      </div>
    </div>
  );
}
