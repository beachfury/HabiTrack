// apps/web/src/components/chores/AssignmentsTab.tsx
// Tab for managing assigned chore instances - view, filter, and delete

import { useState, useEffect } from 'react';
import {
  Trash2,
  Calendar,
  User,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { choresApi } from '../../api';

interface AssignedChore {
  id: number;
  choreId: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  dueDate: string;
  dueTime: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  status: 'pending' | 'completed' | 'skipped' | 'pending_approval';
  recurrenceRule: string | null;
}

interface FilterOptions {
  chores: Array<{ id: number; title: string }>;
  users: Array<{ id: number; displayName: string }>;
}

interface AssignmentsTabProps {
  onRefresh?: () => void;
}

// Status styles using CSS variables
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
        icon: CheckCircle,
      };
    case 'skipped':
      return {
        backgroundColor: 'var(--color-muted)',
        color: 'var(--color-muted-foreground)',
        icon: X,
      };
    case 'pending_approval':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
        color: 'var(--color-info)',
        icon: AlertCircle,
      };
    default: // pending
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
        icon: Clock,
      };
  }
};

export function AssignmentsTab({ onRefresh }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssignedChore[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ chores: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [selectedChoreId, setSelectedChoreId] = useState<number | ''>('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [futureOnly, setFutureOnly] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [selectedChoreId, selectedUserId, selectedStatus, futureOnly]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedChoreId) params.choreId = String(selectedChoreId);
      if (selectedUserId) params.assignedTo = String(selectedUserId);
      if (selectedStatus) params.status = selectedStatus;
      if (futureOnly) params.futureOnly = 'true';

      const data = await choresApi.getAssignments(params);
      setAssignments(data.assignments || []);
      setFilterOptions(data.filters || { chores: [], users: [] });
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (instanceId: number) => {
    if (!confirm('Delete this chore assignment?')) return;

    try {
      await choresApi.deleteAssignment(instanceId);
      setSuccess('Assignment deleted');
      setTimeout(() => setSuccess(''), 3000);
      loadAssignments();
      onRefresh?.();
    } catch (err) {
      setError('Failed to delete assignment');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      const result = await choresApi.bulkDeleteAssignments({
        instanceIds: Array.from(selectedIds),
      });
      setSuccess(result.message || `Deleted ${result.deletedCount} assignments`);
      setTimeout(() => setSuccess(''), 3000);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      loadAssignments();
      onRefresh?.();
    } catch (err) {
      setError('Failed to delete assignments');
    }
  };

  const handleDeleteAllForChore = async () => {
    if (!selectedChoreId) return;

    const choreName =
      filterOptions.chores.find((c) => c.id === selectedChoreId)?.title || 'this chore';
    if (
      !confirm(`Delete ALL future pending assignments for "${choreName}"? This cannot be undone.`)
    )
      return;

    try {
      const result = await choresApi.bulkDeleteAssignments({
        choreId: selectedChoreId,
        futureOnly: true,
        statusFilter: 'pending',
      });
      setSuccess(result.message || `Deleted ${result.deletedCount} assignments`);
      setTimeout(() => setSuccess(''), 3000);
      loadAssignments();
      onRefresh?.();
    } catch (err) {
      setError('Failed to delete assignments');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === assignments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assignments.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with filters toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--color-foreground)]">Assigned Chores</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showFilters
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
          }`}
        >
          <Filter size={16} />
          Filters
          <ChevronDown
            size={16}
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-[var(--color-muted)] rounded-xl space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Chore Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Chore
              </label>
              <select
                value={selectedChoreId}
                onChange={(e) => setSelectedChoreId(e.target.value ? Number(e.target.value) : '')}
                className="themed-input w-full text-sm"
              >
                <option value="">All Chores</option>
                {filterOptions.chores.map((chore) => (
                  <option key={chore.id} value={chore.id}>
                    {chore.title}
                  </option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Assigned To
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                className="themed-input w-full text-sm"
              >
                <option value="">All Users</option>
                {filterOptions.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="themed-input w-full text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </div>

            {/* Future Only Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={futureOnly}
                  onChange={(e) => setFutureOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-foreground)]">Future only</span>
              </label>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedChoreId && (
            <div className="pt-3 border-t border-[var(--color-border)]">
              <button
                onClick={handleDeleteAllForChore}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-lg hover:opacity-90 text-sm font-medium"
              >
                <Trash2 size={16} />
                Delete All Future Pending for This Chore
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selection Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[var(--color-primary)]/10 rounded-lg">
          <span className="text-sm font-medium text-[var(--color-primary)]">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-lg hover:opacity-90 text-sm font-medium"
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-8 text-[var(--color-muted-foreground)]">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-muted)] rounded-xl">
          <Calendar size={48} className="mx-auto text-[var(--color-muted-foreground)] opacity-50 mb-3" />
          <p className="text-[var(--color-muted-foreground)]">No assignments found</p>
          <p className="text-sm text-[var(--color-muted-foreground)] opacity-70 mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="themed-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-4 p-3 bg-[var(--color-muted)] border-b border-[var(--color-border)] text-sm font-medium text-[var(--color-muted-foreground)]">
            <div>
              <input
                type="checkbox"
                checked={selectedIds.size === assignments.length && assignments.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>Chore</div>
            <div>Assigned To</div>
            <div>Due Date</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--color-border)]">
            {assignments.map((assignment) => {
              const statusStyle = getStatusStyle(assignment.status);
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={assignment.id}
                  className={`grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-4 p-3 items-center hover:bg-[var(--color-muted)] ${
                    selectedIds.has(assignment.id) ? 'bg-[var(--color-primary)]/5' : ''
                  }`}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(assignment.id)}
                      onChange={() => toggleSelect(assignment.id)}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {assignment.categoryColor && (
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: assignment.categoryColor }}
                        />
                      )}
                      <span className="font-medium text-[var(--color-foreground)] truncate">
                        {assignment.title}
                      </span>
                    </div>
                    {assignment.categoryName && (
                      <span className="text-xs text-[var(--color-muted-foreground)]">{assignment.categoryName}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                    <User size={14} />
                    {assignment.assignedToName || 'Unassigned'}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                    <Calendar size={14} />
                    {formatDate(assignment.dueDate)}
                    {assignment.dueTime && (
                      <span className="text-xs opacity-70">
                        @ {assignment.dueTime.slice(0, 5)}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: statusStyle.backgroundColor,
                        color: statusStyle.color,
                      }}
                    >
                      <StatusIcon size={12} />
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <button
                      onClick={() => handleDeleteSingle(assignment.id)}
                      className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg transition-colors"
                      title="Delete this assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="themed-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="themed-modal p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">
              Delete {selectedIds.size} Assignment{selectedIds.size !== 1 ? 's' : ''}?
            </h3>
            <p className="text-[var(--color-muted-foreground)] mb-4">
              This action cannot be undone. The selected chore assignments will be permanently
              removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="themed-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-lg hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
