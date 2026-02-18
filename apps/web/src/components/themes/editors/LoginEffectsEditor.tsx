// apps/web/src/components/themes/editors/LoginEffectsEditor.tsx
// Effects tab for the Login Page Editor.
// Placeholder for future enhancements (blur, animations, transitions).

interface EffectsTabProps {
  layout?: 'vertical' | 'horizontal';
}

export function EffectsTab({ layout = 'vertical' }: EffectsTabProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={isHorizontal ? 'flex gap-8' : 'space-y-4'}>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
          Effects
        </p>
        <p>
          Additional effects like blur, animations, and transitions can be added here in future updates.
        </p>
        <p className="mt-2 text-xs">
          The login page currently uses a clean, simple design to ensure fast loading and broad compatibility.
        </p>
      </div>
    </div>
  );
}
