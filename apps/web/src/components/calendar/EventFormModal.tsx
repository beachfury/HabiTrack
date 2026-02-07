// apps/web/src/components/calendar/EventFormModal.tsx
import { X, Trash2 } from 'lucide-react';
import { ColorPicker } from '../common/ColorPicker';
import type { CalendarEvent, CreateEventData, UserOption } from '../../types';

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => onChange({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
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
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">
              All day event
            </label>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start *
              </label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                required
                value={formData.allDay ? formData.start.slice(0, 10) : formData.start}
                onChange={(e) => onChange({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End
              </label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.allDay ? formData.end?.slice(0, 10) || '' : formData.end || ''}
                onChange={(e) => onChange({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => onChange({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              placeholder="Optional location"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-none"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign To
              </label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) =>
                  onChange({ ...formData, assignedTo: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
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

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 flex-shrink-0">
          {isEditing && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
