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
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
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
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
            <DollarSign className="text-[var(--color-success)]" />
            Paid Chores
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            Race to claim chores and earn real money!
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* My Earnings */}
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
            }}
          >
            <p className="text-sm text-[var(--color-success)]">My Earnings</p>
            <p className="text-2xl font-bold text-[var(--color-success)]">
              ${myEarnings.toFixed(2)}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] px-4 py-2 rounded-xl transition-opacity"
            >
              <Plus size={20} />
              Create Paid Chore
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
            color: 'var(--color-success)',
            border: '1px solid',
          }}
        >
          <CheckCircle size={20} />
          {success}
        </div>
      )}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
            color: 'var(--color-destructive)',
            border: '1px solid',
          }}
        >
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-3 border-b-2 transition-colors"
            style={
              activeTab === tab.id
                ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
                : { borderColor: 'transparent', color: 'var(--color-muted-foreground)' }
            }
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : activeTab === 'leaderboard' ? (
        <LeaderboardView leaderboard={leaderboard} currentUserId={user?.id} />
      ) : filteredChores.length === 0 ? (
        <div className="text-center py-12 themed-card rounded-2xl">
          <DollarSign size={48} className="mx-auto mb-4 text-[var(--color-muted-foreground)]" />
          <p className="text-[var(--color-muted-foreground)]">
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
        <ModalPortal
          isOpen={true}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedChore(null);
            setCompletionNotes('');
          }}
          title="Complete Chore"
          size="md"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedChore(null);
                  setCompletionNotes('');
                }}
                className="flex-1 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2 bg-[var(--color-success)] hover:opacity-90 text-white rounded-xl transition-opacity"
              >
                Mark Complete
              </button>
            </div>
          }
        >
          <ModalBody>
            <p className="text-[var(--color-muted-foreground)] mb-4">
              Mark "{selectedChore.title}" as complete?
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                rows={3}
                placeholder="Any notes about how you completed it..."
              />
            </div>
          </ModalBody>
        </ModalPortal>
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

// Helper function for difficulty badge styles
const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return { backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' };
    case 'medium':
      return { backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' };
    case 'hard':
      return { backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)', color: 'var(--color-destructive)' };
    default:
      return { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
  }
};

// Helper function for status badge styles
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'available':
      return { backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' };
    case 'claimed':
      return { backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' };
    case 'completed':
      return { backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' };
    case 'verified':
      return { backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' };
    default:
      return { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
  }
};

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

  return (
    <div className="themed-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--color-foreground)]">{chore.title}</h3>
          {chore.categoryName && (
            <span className="text-sm text-[var(--color-muted-foreground)]">{chore.categoryName}</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--color-success)]">${Number(chore.amount).toFixed(2)}</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={getStatusStyle(chore.status)}
          >
            {chore.status.charAt(0).toUpperCase() + chore.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Description */}
      {chore.description && (
        <p className="text-sm text-[var(--color-muted-foreground)] mb-3">{chore.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={getDifficultyStyle(chore.difficulty)}
        >
          {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)}
        </span>
        {chore.estimatedMinutes && (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center gap-1">
            <Timer size={12} />
            ~{chore.estimatedMinutes} min
          </span>
        )}
        {chore.requirePhoto && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            Photo Required
          </span>
        )}
      </div>

      {/* Claimed info */}
      {chore.claimedBy && (
        <div className="mb-4 p-2 bg-[var(--color-muted)] rounded-lg">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Claimed by{' '}
            <span
              className="font-medium"
              style={{ color: chore.claimerColor || 'var(--color-primary)' }}
            >
              {chore.claimerName}
            </span>
            {isClaimedByMe && ' (You)'}
          </p>
        </div>
      )}

      {/* Completion notes */}
      {chore.completionNotes && chore.status === 'completed' && (
        <div
          className="mb-4 p-2 rounded-lg"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          }}
        >
          <p className="text-sm text-[var(--color-primary)]">
            <strong>Notes:</strong> {chore.completionNotes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {chore.status === 'available' && (
          <button
            onClick={onClaim}
            className="flex-1 py-2 bg-[var(--color-success)] hover:opacity-90 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity"
          >
            <Zap size={18} />
            Claim It!
          </button>
        )}

        {chore.status === 'claimed' && isClaimedByMe && (
          <button
            onClick={onComplete}
            className="flex-1 py-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity"
          >
            <CheckCircle size={18} />
            Mark Complete
          </button>
        )}

        {chore.status === 'completed' && isAdmin && (
          <>
            <button
              onClick={onVerify}
              className="flex-1 py-2 bg-[var(--color-success)] hover:opacity-90 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity"
            >
              <CheckCircle size={18} />
              Verify & Pay
            </button>
            <button
              onClick={() => onReject(true)}
              className="py-2 px-3 bg-[var(--color-warning)] hover:opacity-90 text-white rounded-xl transition-opacity"
              title="Reject and reopen"
            >
              <XCircle size={18} />
            </button>
          </>
        )}

        {chore.status === 'verified' && (
          <div
            className="flex-1 py-2 rounded-xl font-medium text-center flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
              color: 'var(--color-success)',
            }}
          >
            <CheckCircle size={18} />
            Paid!
          </div>
        )}

        {isAdmin && chore.status === 'available' && (
          <button
            onClick={onDelete}
            className="py-2 px-3 rounded-xl transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
              color: 'var(--color-destructive)',
            }}
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
    <div className="themed-card rounded-2xl overflow-hidden">
      <div
        className="p-4"
        style={{
          background: 'linear-gradient(to right, var(--color-warning), color-mix(in srgb, var(--color-warning) 70%, var(--color-destructive)))',
        }}
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy size={24} />
          Earnings Leaderboard
        </h2>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className="p-4 flex items-center gap-4"
            style={
              entry.id === currentUserId
                ? { backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }
                : {}
            }
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
                <span className="text-lg font-bold text-[var(--color-muted-foreground)]">#{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: entry.color || 'var(--color-primary)' }}
            >
              {(entry.nickname || entry.displayName).charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1">
              <p className="font-medium text-[var(--color-foreground)]">
                {entry.displayName}
                {entry.id === currentUserId && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    You
                  </span>
                )}
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {entry.choresCompleted} chores completed
              </p>
            </div>

            {/* Earnings */}
            <div className="text-right">
              <p className="text-xl font-bold text-[var(--color-success)]">${Number(entry.totalEarnings).toFixed(2)}</p>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="p-8 text-center text-[var(--color-muted-foreground)]">
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

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="create-paid-chore-form"
        disabled={saving}
        className="flex-1 py-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-xl disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Creating...' : 'Create Chore'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Create Paid Chore"
      size="lg"
      footer={footer}
    >
      <ModalBody>
        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
              color: 'var(--color-destructive)',
              border: '1px solid',
            }}
          >
            {error}
          </div>
        )}

        <form id="create-paid-chore-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              placeholder="Clean the garage"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              rows={3}
              placeholder="Details about what needs to be done..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={formData.estimatedMinutes}
              onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requirePhoto"
              checked={formData.requirePhoto}
              onChange={(e) => setFormData({ ...formData, requirePhoto: e.target.checked })}
              className="rounded border-[var(--color-border)]"
            />
            <label htmlFor="requirePhoto" className="text-sm text-[var(--color-foreground)]">
              Require photo proof
            </label>
          </div>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}
