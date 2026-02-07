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

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: Clock,
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle,
  },
  skipped: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    icon: X,
  },
  pending_approval: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: AlertCircle,
  },
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
          <h3 className="font-semibold text-gray-900 dark:text-white">Assigned Chores</h3>
          <p className="text-sm text-gray-500">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showFilters
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
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
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Chore Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chore
              </label>
              <select
                value={selectedChoreId}
                onChange={(e) => setSelectedChoreId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned To
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Future only</span>
              </label>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedChoreId && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDeleteAllForChore}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
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
        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No assignments found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
            <div>
              <input
                type="checkbox"
                checked={selectedIds.size === assignments.length && assignments.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
            <div>Chore</div>
            <div>Assigned To</div>
            <div>Due Date</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {assignments.map((assignment) => {
              const statusStyle = STATUS_STYLES[assignment.status] || STATUS_STYLES.pending;
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={assignment.id}
                  className={`grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-4 p-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                    selectedIds.has(assignment.id) ? 'bg-purple-50 dark:bg-purple-900/10' : ''
                  }`}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(assignment.id)}
                      onChange={() => toggleSelect(assignment.id)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {assignment.title}
                      </span>
                    </div>
                    {assignment.categoryName && (
                      <span className="text-xs text-gray-500">{assignment.categoryName}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User size={14} />
                    {assignment.assignedToName || 'Unassigned'}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={14} />
                    {formatDate(assignment.dueDate)}
                    {assignment.dueTime && (
                      <span className="text-xs text-gray-400">
                        @ {assignment.dueTime.slice(0, 5)}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <StatusIcon size={12} />
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <button
                      onClick={() => handleDeleteSingle(assignment.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete {selectedIds.size} Assignment{selectedIds.size !== 1 ? 's' : ''}?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone. The selected chore assignments will be permanently
              removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
