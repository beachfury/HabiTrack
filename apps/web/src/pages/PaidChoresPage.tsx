// apps/web/src/pages/PaidChoresPage.tsx
// Paid Chores / Chore Race feature page

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Trophy,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  User,
  AlertCircle,
  Timer,
  Star,
  Target,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as paidChoresApi from '../api/paid-chores';
import type { PaidChore, CreatePaidChoreInput, LeaderboardEntry } from '../api/paid-chores';

type TabType = 'available' | 'my-claims' | 'pending-review' | 'leaderboard';

export function PaidChoresPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [chores, setChores] = useState<PaidChore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedChore, setSelectedChore] = useState<PaidChore | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const [myEarnings, setMyEarnings] = useState(0);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'leaderboard') {
        const data = await paidChoresApi.getLeaderboard();
        setLeaderboard(data);
      } else {
        const allChores = await paidChoresApi.listPaidChores();
        setChores(allChores);
      }

      // Always fetch earnings
      const earnings = await paidChoresApi.getEarnings();
      setMyEarnings(earnings.totalEarnings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredChores = chores.filter((chore) => {
    switch (activeTab) {
      case 'available':
        return chore.status === 'available';
      case 'my-claims':
        return chore.claimedBy === user?.id && ['claimed', 'completed', 'verified'].includes(chore.status);
      case 'pending-review':
        return isAdmin && chore.status === 'completed';
      default:
        return true;
    }
  });

  const handleClaim = async (chore: PaidChore) => {
    try {
      setError('');
      const result = await paidChoresApi.claimPaidChore(chore.id);
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to claim chore');
    }
  };

  const handleComplete = async () => {
    if (!selectedChore) return;
    try {
      setError('');
      const result = await paidChoresApi.completePaidChore(selectedChore.id, {
        notes: completionNotes,
      });
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
      setShowCompleteModal(false);
      setSelectedChore(null);
      setCompletionNotes('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete chore');
    }
  };

  const handleVerify = async (chore: PaidChore) => {
    try {
      setError('');
      const result = await paidChoresApi.verifyPaidChore(chore.id);
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify chore');
    }
  };

  const handleReject = async (chore: PaidChore, reopen: boolean) => {
    try {
      setError('');
      const result = await paidChoresApi.rejectPaidChore(chore.id, reopen);
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject chore');
    }
  };

  const handleDelete = async (chore: PaidChore) => {
    if (!confirm('Are you sure you want to delete this chore?')) return;
    try {
      setError('');
      await paidChoresApi.deletePaidChore(chore.id);
      setSuccess('Chore deleted');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete chore');
    }
  };

  const tabs = [
    { id: 'available' as TabType, label: 'Available', icon: Zap },
    { id: 'my-claims' as TabType, label: 'My Claims', icon: User },
    ...(isAdmin ? [{ id: 'pending-review' as TabType, label: 'Pending Review', icon: Clock }] : []),
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <DollarSign className="text-green-600" />
            Paid Chores
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Race to claim chores and earn real money!
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* My Earnings */}
          <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl">
            <p className="text-sm text-green-600 dark:text-green-400">My Earnings</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              ${myEarnings.toFixed(2)}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
              Create Paid Chore
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : activeTab === 'leaderboard' ? (
        <LeaderboardView leaderboard={leaderboard} currentUserId={user?.id} />
      ) : filteredChores.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'available'
              ? 'No chores available right now. Check back soon!'
              : activeTab === 'my-claims'
                ? "You haven't claimed any chores yet."
                : 'No chores pending review.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              onClaim={() => handleClaim(chore)}
              onComplete={() => {
                setSelectedChore(chore);
                setShowCompleteModal(true);
              }}
              onVerify={() => handleVerify(chore)}
              onReject={(reopen) => handleReject(chore, reopen)}
              onDelete={() => handleDelete(chore)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePaidChoreModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedChore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Complete Chore
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Mark "{selectedChore.title}" as complete?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                rows={3}
                placeholder="Any notes about how you completed it..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedChore(null);
                  setCompletionNotes('');
                }}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CHORE CARD COMPONENT
// =============================================================================

interface ChoreCardProps {
  chore: PaidChore;
  isAdmin: boolean;
  currentUserId?: number;
  onClaim: () => void;
  onComplete: () => void;
  onVerify: () => void;
  onReject: (reopen: boolean) => void;
  onDelete: () => void;
}

function ChoreCard({
  chore,
  isAdmin,
  currentUserId,
  onClaim,
  onComplete,
  onVerify,
  onReject,
  onDelete,
}: ChoreCardProps) {
  const isClaimedByMe = chore.claimedBy === currentUserId;

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusColors = {
    available: 'bg-blue-100 text-blue-700',
    claimed: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-purple-100 text-purple-700',
    verified: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{chore.title}</h3>
          {chore.categoryName && (
            <span className="text-sm text-gray-500">{chore.categoryName}</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">${Number(chore.amount).toFixed(2)}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[chore.status]}`}>
            {chore.status.charAt(0).toUpperCase() + chore.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Description */}
      {chore.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{chore.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[chore.difficulty]}`}>
          {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)}
        </span>
        {chore.estimatedMinutes && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Timer size={12} />
            ~{chore.estimatedMinutes} min
          </span>
        )}
        {chore.requirePhoto && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
            Photo Required
          </span>
        )}
      </div>

      {/* Claimed info */}
      {chore.claimedBy && (
        <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Claimed by{' '}
            <span
              className="font-medium"
              style={{ color: chore.claimerColor || '#8b5cf6' }}
            >
              {chore.claimerName}
            </span>
            {isClaimedByMe && ' (You)'}
          </p>
        </div>
      )}

      {/* Completion notes */}
      {chore.completionNotes && chore.status === 'completed' && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Notes:</strong> {chore.completionNotes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {chore.status === 'available' && (
          <button
            onClick={onClaim}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Zap size={18} />
            Claim It!
          </button>
        )}

        {chore.status === 'claimed' && isClaimedByMe && (
          <button
            onClick={onComplete}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle size={18} />
            Mark Complete
          </button>
        )}

        {chore.status === 'completed' && isAdmin && (
          <>
            <button
              onClick={onVerify}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle size={18} />
              Verify & Pay
            </button>
            <button
              onClick={() => onReject(true)}
              className="py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors"
              title="Reject and reopen"
            >
              <XCircle size={18} />
            </button>
          </>
        )}

        {chore.status === 'verified' && (
          <div className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium text-center flex items-center justify-center gap-2">
            <CheckCircle size={18} />
            Paid!
          </div>
        )}

        {isAdmin && chore.status === 'available' && (
          <button
            onClick={onDelete}
            className="py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-xl transition-colors"
            title="Delete"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LEADERBOARD VIEW
// =============================================================================

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: number;
}

function LeaderboardView({ leaderboard, currentUserId }: LeaderboardViewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy size={24} />
          Earnings Leaderboard
        </h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className={`p-4 flex items-center gap-4 ${
              entry.id === currentUserId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
            }`}
          >
            {/* Rank */}
            <div className="w-10 text-center">
              {index === 0 ? (
                <span className="text-2xl">🥇</span>
              ) : index === 1 ? (
                <span className="text-2xl">🥈</span>
              ) : index === 2 ? (
                <span className="text-2xl">🥉</span>
              ) : (
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: entry.color || '#8b5cf6' }}
            >
              {(entry.nickname || entry.displayName).charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {entry.displayName}
                {entry.id === currentUserId && (
                  <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {entry.choresCompleted} chores completed
              </p>
            </div>

            {/* Earnings */}
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">${Number(entry.totalEarnings).toFixed(2)}</p>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p>No earnings yet. Be the first to complete a paid chore!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CREATE PAID CHORE MODAL
// =============================================================================

interface CreatePaidChoreModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreatePaidChoreModal({ onClose, onCreated }: CreatePaidChoreModalProps) {
  const [formData, setFormData] = useState<CreatePaidChoreInput>({
    title: '',
    description: '',
    amount: 5,
    difficulty: 'medium',
    estimatedMinutes: 30,
    requirePhoto: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0) {
      setError('Title and positive amount are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await paidChoresApi.createPaidChore(formData);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create paid chore');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create Paid Chore
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              placeholder="Clean the garage"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              rows={3}
              placeholder="Details about what needs to be done..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={formData.estimatedMinutes}
              onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requirePhoto"
              checked={formData.requirePhoto}
              onChange={(e) => setFormData({ ...formData, requirePhoto: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="requirePhoto" className="text-sm text-gray-700 dark:text-gray-300">
              Require photo proof
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
