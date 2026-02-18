// apps/web/src/components/calendar/EventFormModal.tsx
import { Trash2 } from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker';
import type { CalendarEvent, CreateEventData, UserOption } from '../../types';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

interface EventFormModalProps {
  event: CalendarEvent | null;
  formData: CreateEventData;
  users: UserOption[];
  canAssignToOthers: boolean;
  onClose: () => void;
  onChange: (data: CreateEventData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
}

export function EventFormModal({
  event,
  formData,
  users,
  canAssignToOthers,
  onClose,
  onChange,
  onSubmit,
  onDelete,
}: EventFormModalProps) {
  const isEditing = !!event;

  const footer = (
    <div className="flex gap-2">
      {isEditing && (
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-xl"
        >
          <Trash2 size={20} />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2 bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-xl font-medium hover:opacity-90"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="event-form"
        onClick={onSubmit}
        className="flex-1 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90"
      >
        {isEditing ? 'Save' : 'Create'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Event' : 'New Event'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <form id="event-form" onSubmit={onSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => onChange({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Event title"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => onChange({ ...formData, allDay: e.target.checked })}
              className="w-4 h-4 rounded focus:ring-[var(--color-primary)] accent-[var(--color-primary)]"
            />
            <label htmlFor="allDay" className="text-sm text-[var(--color-foreground)]">
              All day event
            </label>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Start *
              </label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                required
                value={formData.allDay ? formData.start.slice(0, 10) : formData.start}
                onChange={(e) => onChange({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                End
              </label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.allDay ? formData.end?.slice(0, 10) || '' : formData.end || ''}
                onChange={(e) => onChange({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => onChange({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Optional location"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          {/* Color */}
          <ColorPicker
            color={formData.color || '#3b82f6'}
            onChange={(color) => onChange({ ...formData, color })}
            label="Color"
          />

          {/* Assign To (Admin only) */}
          {canAssignToOthers && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Assign To
              </label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) =>
                  onChange({ ...formData, assignedTo: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              >
                <option value="">Everyone</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nickname || u.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </ModalBody>
    </ModalPortal>
  );
}
