// apps/web/src/components/themes/editors/LoginAdvancedEditor.tsx
// Advanced tab for the Login Page Editor.
// Placeholder for custom CSS support (coming in a future update).

interface AdvancedTabProps {
  layout?: 'vertical' | 'horizontal';
}

export function AdvancedTab({ layout = 'vertical' }: AdvancedTabProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={isHorizontal ? 'flex gap-8' : 'space-y-4'}>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom CSS
        </label>
        <textarea
          disabled
          placeholder="Custom CSS support coming soon..."
          className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Advanced styling options will be available in a future update.
        </p>
      </div>
    </div>
  );
}
