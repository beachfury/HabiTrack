// _registry/WidgetPreviewModal.tsx
// Live preview modal + static card mockup for the Store page

import { Plus, Minus, Loader2, Sun, Users as UsersIcon } from 'lucide-react';
import { ModalPortal, ModalBody } from '../../../common/ModalPortal';
import { WidgetSandbox } from '../../WidgetSandbox';
import { widgetRegistry, getWidgetThemedClass } from './registry';
import { widgetPreviewData } from './previewData';
import { StaticWeatherPreview } from './StaticWeatherPreview';

// ── WidgetPreviewModal ──────────────────────────────────────────────────────

interface WidgetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string | null;
  widgetName: string;
  isOnDashboard: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  onAdd: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
}

export function WidgetPreviewModal({
  isOpen,
  onClose,
  widgetId,
  widgetName,
  isOnDashboard,
  isAdding,
  isRemoving,
  onAdd,
  onRemove,
}: WidgetPreviewModalProps) {
  if (!widgetId) return null;

  const entry = widgetRegistry.get(widgetId);
  const preview = widgetPreviewData[widgetId];
  const themedClass = getWidgetThemedClass(widgetId);

  // Build the widget element
  let widgetElement: React.ReactNode = null;

  if (preview?.useStaticPreview) {
    widgetElement = <StaticWeatherPreview />;
  } else if (entry && preview) {
    const WidgetComponent = entry.component;
    widgetElement = <WidgetComponent {...preview.props} />;
  }

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${widgetName}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[var(--color-muted-foreground)] italic">
            Preview uses sample data
          </span>
          <div className="flex items-center gap-2">
            {isOnDashboard ? (
              <button
                onClick={() => onRemove(widgetId)}
                disabled={isRemoving}
                className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 hover:bg-[var(--color-destructive)]/20 transition-colors disabled:opacity-50"
              >
                {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                Remove from Dashboard
              </button>
            ) : (
              <button
                onClick={() => onAdd(widgetId)}
                disabled={isAdding}
                className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--color-primary-foreground,#fff)] bg-[var(--color-primary)] hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add to Dashboard
              </button>
            )}
          </div>
        </div>
      }
    >
      <ModalBody>
        {widgetElement ? (
          <div className={`${themedClass} rounded-xl overflow-hidden`} style={{ minHeight: 200 }}>
            <div className="p-[var(--card-padding)] h-full">
              {/* Intercept link clicks to prevent navigation away from Store */}
              <div onClick={(e) => {
                const anchor = (e.target as HTMLElement).closest('a');
                if (anchor) e.preventDefault();
              }}>
                <WidgetSandbox widgetId={widgetId} widgetName={widgetName}>
                  {widgetElement}
                </WidgetSandbox>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-[var(--color-muted-foreground)]">
            <p className="text-sm">Preview not available for this widget</p>
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// ── WidgetCardMockup ────────────────────────────────────────────────────────
// Small abstract visual mockup for widget cards in the Store grid

type MockupType = 'stat' | 'list' | 'ranking' | 'people' | 'weather';

const widgetMockupType: Record<string, MockupType> = {
  'welcome': 'stat',
  'quick-stats': 'stat',
  'earnings': 'stat',
  'todays-events': 'list',
  'upcoming-events': 'list',
  'todays-chores': 'list',
  'my-chores': 'list',
  'shopping-list': 'list',
  'paid-chores': 'list',
  'announcements': 'list',
  'upcoming-meals': 'list',
  'chore-leaderboard': 'ranking',
  'family-members': 'people',
  'weather': 'weather',
};

export function WidgetCardMockup({ widgetId }: { widgetId: string }) {
  const mockType = widgetMockupType[widgetId] || 'list';

  const wrapperClass = 'rounded-xl p-3 w-full';
  const wrapperStyle = { backgroundColor: 'var(--color-primary)', opacity: 0.09 };

  if (mockType === 'stat') {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="flex items-end gap-1.5 h-8">
          {[0.6, 0.85, 0.5, 0.75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h * 100}%`,
                backgroundColor: 'var(--color-primary)',
                opacity: 0.7 + i * 0.08,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mockType === 'list') {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="flex flex-col gap-1.5 h-8 justify-center">
          {[0.85, 0.6, 0.7].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: `${w * 100}%`,
                backgroundColor: 'var(--color-primary)',
                opacity: 0.6 - i * 0.1,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mockType === 'ranking') {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="flex flex-col gap-1.5 h-8 justify-center">
          {[1, 0.75, 0.5].map((w, i) => (
            <div
              key={i}
              className="h-2 rounded-full"
              style={{
                width: `${w * 100}%`,
                backgroundColor: 'var(--color-primary)',
                opacity: 0.7 - i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mockType === 'people') {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="flex items-center gap-1.5 h-8 justify-center">
          {['#4f46e5', '#059669', '#d97706', '#ef4444'].map((color, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color, opacity: 0.7 }}
            >
              <UsersIcon size={10} className="text-white" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // weather
  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <div className="flex items-center gap-2 h-8 justify-center">
        <Sun size={18} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
        <span className="text-sm font-bold" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>72°F</span>
      </div>
    </div>
  );
}
