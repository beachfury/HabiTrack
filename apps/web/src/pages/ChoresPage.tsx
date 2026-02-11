// apps/web/src/pages/ChoresPage.tsx
// Refactored - uses components from components/chores/

import { useState, useEffect, SetStateAction } from 'react';
import {
  CheckSquare,
  Plus,
  Trophy,
  Users,
  Settings,
  User,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { choresApi, familyApi } from '../api';
import { ManageView } from '../components/chores/ManageView';
import type {
  ChoreInstance,
  ChoreCategory,
  Chore,
  LeaderboardEntry,
  ChoreStats,
  UserOption,
} from '../types';
import { getTodayLocal, normalizeDate } from '../utils';

// Import components
import {
  StatsBar,
  MyChoresView,
  AllChoresView,
  LeaderboardView,
  CompleteChoreModal,
  AdminActionModal,
  AddChoreModal,
} from '../components/chores';
import { CategoryModal } from '../components/chores/modals/CategoryModal';
import { AddTemplateModal } from '../components/chores/modals/AddTemplateModal';

type View = 'my-chores' | 'all-chores' | 'leaderboard' | 'manage' | 'points';

export function ChoresPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Data state
  const [view, setView] = useState<View>('my-chores');
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [categories, setCategories] = useState<ChoreCategory[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<ChoreStats | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

  // UI state
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal state
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<ChoreInstance | null>(null);
  const [showAdminModal, setShowAdminModal] = useState<ChoreInstance | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catData, statsData, userData] = await Promise.all([
        choresApi.getCategories(),
        choresApi.getStats(),
        familyApi.getUsers(),
      ]);

      setCategories(catData.categories);
      setStats(statsData.stats);
      setUsers(userData.users);

      if (view === 'my-chores' || view === 'all-chores') {
        const today = getTodayLocal();
        // Calculate 6 days ahead using local date math
        const todayDate = new Date(today + 'T12:00:00');
        todayDate.setDate(todayDate.getDate() + 6);
        const sixDaysAhead = todayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format

        const instData = await choresApi.getInstances({
          startDate: today,
          endDate: sixDaysAhead,
          mine: view === 'my-chores',
        });
        setInstances(instData.instances);

        // Auto-expand all users in All Chores view
        if (view === 'all-chores') {
          const userIds = new Set(
            instData.instances
              .map((i: { assignedTo: any }) => i.assignedTo)
              .filter(Boolean) as number[],
          );
          setExpandedUsers(userIds);
        }
      }

      if (view === 'leaderboard') {
        const lbData = await choresApi.getLeaderboard('week');
        setLeaderboard(lbData.leaderboard);
      }

      if (view === 'manage') {
        const choreData = await choresApi.getChores();
        setChores(choreData.chores);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Handlers
  const handleComplete = async (instance: ChoreInstance, notes?: string) => {
    try {
      const result = await choresApi.completeChore(instance.id, { notes });
      showSuccessMessage(
        result.pointsAwarded
          ? `Completed! +${result.pointsAwarded} points`
          : 'Completed! Awaiting approval.',
      );
      setShowCompleteModal(null);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete chore';
      setError(message);
    }
  };

  const handleApprove = async (instanceId: number) => {
    try {
      const result = await choresApi.approveChore(instanceId);
      showSuccessMessage(`Approved! Points awarded.`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async (instanceId: number) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await choresApi.rejectChore(instanceId, { reason: reason || undefined });
      showSuccessMessage('Chore sent back for redo.');
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const handleCompleteForUser = async (instance: ChoreInstance, userId: number) => {
    try {
      await choresApi.completeChore(instance.id, { forUserId: userId });
      showSuccessMessage('Completed for user!');
      setShowAdminModal(null);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete for user');
    }
  };

  const handleReassign = async (instanceId: number, userId: number | null) => {
    try {
      await choresApi.reassignChore(instanceId, userId || 0);
      showSuccessMessage(userId ? 'Chore reassigned!' : 'Chore unassigned!');
      setShowAdminModal(null);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reassign');
    }
  };

  const handleSkip = async (instanceId: number) => {
    if (!confirm("Skip this chore instance? It won't award points.")) return;
    try {
      await choresApi.skipChore(instanceId);
      showSuccessMessage('Chore skipped.');
      setShowAdminModal(null);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to skip chore');
    }
  };

  const handleCategoryCreated = () => {
    // Refresh categories after creating a new one
    choresApi
      .getCategories()
      .then((data: { categories: SetStateAction<ChoreCategory[]> }) =>
        setCategories(data.categories),
      );
    showSuccessMessage('Category created!');
  };

  const toggleUserExpanded = (userId: number) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Filter and group instances
  const todayStr = getTodayLocal();
  const pendingInstances = instances.filter((i) => i.status === 'pending');
  const todayChores = pendingInstances.filter((i) => normalizeDate(i.dueDate) === todayStr);
  const upcomingChores = pendingInstances.filter((i) => normalizeDate(i.dueDate) > todayStr);
  const overdueChores = pendingInstances.filter((i) => normalizeDate(i.dueDate) < todayStr);
  const pendingApproval = instances.filter((i) => i.status === 'completed');

  // Group upcoming by date
  const upcomingByDate = upcomingChores.reduce(
    (acc, chore) => {
      const dateKey = normalizeDate(chore.dueDate);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(chore);
      return acc;
    },
    {} as Record<string, ChoreInstance[]>,
  );

  // Group by user for All Chores view
  const choresByUser = users
    .map((u) => {
      const userChores = pendingInstances.filter((i) => i.assignedTo === u.id);
      return {
        user: u,
        overdue: userChores.filter((i) => normalizeDate(i.dueDate) < todayStr),
        today: userChores.filter((i) => normalizeDate(i.dueDate) === todayStr),
        upcoming: userChores.filter((i) => normalizeDate(i.dueDate) > todayStr),
        total: userChores.length,
      };
    })
    .filter((g) => g.total > 0);

  const unassignedChores = pendingInstances.filter((i) => !i.assignedTo);

  const formatDate = (dateStr: string) => {
    const normalized = normalizeDate(dateStr);
    if (!normalized) return dateStr;
    const [year, month, day] = normalized.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    if (date.getTime() === todayDate.getTime()) return 'Today';
    if (date.getTime() === tomorrowDate.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // View tabs
  const views: Array<{ id: View; label: string; icon: any; show: boolean }> = [
    { id: 'my-chores', label: 'My Chores', icon: User, show: true },
    { id: 'all-chores', label: 'All', icon: Users, show: true },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, show: true },
    { id: 'manage', label: 'Manage', icon: Settings, show: isAdmin },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="animate-spin text-[var(--color-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full themed-chores-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
            <CheckSquare className="text-[var(--color-primary)]" />
            Chores
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">Track and complete your tasks</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {/* Add Template Button - only show in Manage view */}
            {view === 'manage' && (
              <button
                onClick={() => setShowAddTemplateModal(true)}
                className="themed-btn-secondary flex items-center gap-2"
              >
                <FileText size={20} />
                <span className="hidden sm:inline">Add Template</span>
              </button>
            )}
            {/* Add Chore Button */}
            <button
              onClick={() => setShowAddChoreModal(true)}
              className="themed-btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Chore</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-[var(--radius-lg)] text-[var(--color-success)] flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-[var(--radius-lg)] text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Bar */}
      {stats && <StatsBar stats={stats} />}

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {views
          .filter((v) => v.show)
          .map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] font-medium whitespace-nowrap transition-colors ${
                view === v.id
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
              }`}
            >
              <v.icon size={18} />
              {v.label}
            </button>
          ))}
      </div>

      {/* Content */}
      {view === 'my-chores' && (
        <MyChoresView
          todayChores={todayChores}
          upcomingByDate={upcomingByDate}
          overdueChores={overdueChores}
          pendingApproval={pendingApproval}
          isAdmin={isAdmin}
          onComplete={(instance) => setShowCompleteModal(instance)}
          onAdminAction={(instance) => setShowAdminModal(instance)}
          onApprove={handleApprove}
          onReject={handleReject}
          formatDate={formatDate}
        />
      )}

      {view === 'all-chores' && (
        <AllChoresView
          choresByUser={choresByUser}
          unassignedChores={unassignedChores}
          pendingApproval={pendingApproval}
          expandedUsers={expandedUsers}
          isAdmin={isAdmin}
          onToggleUser={toggleUserExpanded}
          onComplete={(instance) => setShowCompleteModal(instance)}
          onAdminAction={(instance) => setShowAdminModal(instance)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {view === 'leaderboard' && (
        <LeaderboardView
          leaderboard={leaderboard}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          onRefresh={fetchData}
        />
      )}

      {view === 'manage' && isAdmin && <ManageView categories={categories} onRefresh={fetchData} />}

      {/* Modals */}
      {showCompleteModal && (
        <CompleteChoreModal
          instance={showCompleteModal}
          onComplete={handleComplete}
          onClose={() => setShowCompleteModal(null)}
        />
      )}

      {showAdminModal && (
        <AdminActionModal
          instance={showAdminModal}
          users={users}
          onClose={() => setShowAdminModal(null)}
          onCompleteForUser={handleCompleteForUser}
          onReassign={handleReassign}
          onSkip={handleSkip}
        />
      )}

      {showAddChoreModal && (
        <AddChoreModal
          categories={categories}
          onSuccess={() => {
            fetchData();
            showSuccessMessage('Chore created!');
          }}
          onClose={() => setShowAddChoreModal(false)}
          onShowCategoryModal={() => setShowCategoryModal(true)}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          onSuccess={handleCategoryCreated}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {showAddTemplateModal && (
        <AddTemplateModal
          categories={categories}
          onSuccess={() => {
            fetchData();
            showSuccessMessage('Template created!');
          }}
          onClose={() => setShowAddTemplateModal(false)}
        />
      )}
    </div>
  );
}
