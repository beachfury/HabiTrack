// apps/web/src/components/settings/UpdateModal.tsx
// Version picker modal — browse all releases, upgrade or rollback with backup reminder

import { useState, useEffect } from 'react';
import {
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Terminal,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Shield,
  Loader2,
  Tag,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface Release {
  version: string;
  tag: string;
  name: string;
  notes: string;
  url: string;
  date: string;
  prerelease: boolean;
  isCurrent: boolean;
  isNewer: boolean;
  isOlder: boolean;
}

interface UpdateModalProps {
  onClose: () => void;
}

type ModalView = 'picker' | 'confirm' | 'backup' | 'updating' | 'success' | 'error';

export function UpdateModal({ onClose }: UpdateModalProps) {
  const [view, setView] = useState<ModalView>('picker');
  const [releases, setReleases] = useState<Release[]>([]);
  const [currentVersion, setCurrentVersion] = useState('');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupDone, setBackupDone] = useState(false);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/updates/releases`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch releases');
      const data = await res.json();
      setReleases(data.releases || []);
      setCurrentVersion(data.currentVersion || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectVersion = (release: Release) => {
    setSelectedRelease(release);
    setView('confirm');
  };

  const createBackup = async () => {
    setBackupInProgress(true);
    try {
      const res = await fetch(`${API_BASE}/api/backups/create`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Backup failed');
      setBackupDone(true);
      setBackupInProgress(false);
    } catch (err: any) {
      setError(err.message);
      setBackupInProgress(false);
    }
  };

  const applyUpdate = async () => {
    if (!selectedRelease) return;
    setView('updating');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/updates/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: selectedRelease.tag }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Update failed');

      setInstructions(data.instructions || []);
      setView('success');
    } catch (err: any) {
      setError(err.message || 'Failed to apply update');
      setView('error');
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderPicker = () => {
    if (loading) {
      return (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">Loading releases...</p>
        </div>
      );
    }

    if (releases.length === 0) {
      return (
        <div className="py-8 text-center text-[var(--color-muted-foreground)]">
          No releases found on GitHub.
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {releases.map((release) => (
          <button
            key={release.tag}
            onClick={() => !release.isCurrent && selectVersion(release)}
            disabled={release.isCurrent}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${
              release.isCurrent
                ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 cursor-default'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-muted)]/50 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={14} className={release.isCurrent ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'} />
                <span className="font-medium text-[var(--color-foreground)]">
                  v{release.version}
                </span>
                {release.prerelease && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 rounded">
                    Pre-release
                  </span>
                )}
                {release.isCurrent && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded">
                    Current
                  </span>
                )}
                {release.isNewer && (
                  <ArrowUp size={14} className="text-green-500" />
                )}
                {release.isOlder && (
                  <ArrowDown size={14} className="text-amber-500" />
                )}
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {formatDate(release.date)}
              </span>
            </div>
            {release.name !== release.tag && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1 truncate">
                {release.name}
              </p>
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderConfirm = () => {
    if (!selectedRelease) return null;
    const isDowngrade = selectedRelease.isOlder;
    const truncatedNotes = selectedRelease.notes
      ? selectedRelease.notes.length > 500
        ? selectedRelease.notes.substring(0, 500) + '...'
        : selectedRelease.notes
      : null;

    return (
      <>
        {/* Version comparison */}
        <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <div className="flex items-center justify-between flex-wrap">
            <div className="text-center flex-1">
              <p className="text-sm text-[var(--color-muted-foreground)]">Current</p>
              <p className="text-lg font-bold text-[var(--color-foreground)]">v{currentVersion}</p>
            </div>
            <div className="px-4">
              <span className={`text-2xl ${isDowngrade ? 'text-amber-500' : 'text-[var(--color-primary)]'}`}>
                &rarr;
              </span>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {isDowngrade ? 'Rollback to' : 'Upgrade to'}
              </p>
              <p className={`text-lg font-bold ${isDowngrade ? 'text-amber-500' : 'text-[var(--color-primary)]'}`}>
                v{selectedRelease.version}
              </p>
            </div>
          </div>
        </div>

        {/* Release notes */}
        {truncatedNotes && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[var(--color-foreground)] mb-2">Release Notes</h4>
            <div className="p-3 bg-[var(--color-background)] rounded-lg text-sm text-[var(--color-muted-foreground)] max-h-32 overflow-y-auto whitespace-pre-wrap">
              {truncatedNotes}
            </div>
            {selectedRelease.url && (
              <a
                href={selectedRelease.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline mt-2"
              >
                <ExternalLink size={14} />
                View full release notes
              </a>
            )}
          </div>
        )}

        {/* Backup reminder */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <Shield className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-sm flex-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Backup Recommended
              </p>
              <p className="text-amber-600 dark:text-amber-300 mt-1">
                We recommend creating a database backup before changing versions, especially when rolling back.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={createBackup}
                  disabled={backupInProgress || backupDone}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {backupInProgress ? (
                    <><Loader2 size={12} className="animate-spin" /> Creating...</>
                  ) : backupDone ? (
                    <><CheckCircle size={12} /> Backup Created</>
                  ) : (
                    <><Shield size={12} /> Create Backup Now</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isDowngrade && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm text-red-600 dark:text-red-300">
                <strong>Downgrade warning:</strong> Rolling back may cause issues if database migrations
                from newer versions have already been applied. A backup is strongly recommended.
              </p>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderUpdating = () => (
    <div className="py-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 relative">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-muted)]"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
      </div>
      <h3 className="text-lg font-medium text-[var(--color-foreground)]">
        {selectedRelease?.isOlder ? 'Rolling back...' : 'Downloading Update...'}
      </h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
        Switching to v{selectedRelease?.version}
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-500" size={32} />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-foreground)]">
          Version Changed!
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
          Follow these steps to complete:
        </p>
      </div>

      {instructions.length > 0 && (
        <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <div className="flex items-start gap-2 mb-3">
            <Terminal size={16} className="text-[var(--color-primary)] mt-0.5" />
            <span className="text-sm font-medium text-[var(--color-foreground)]">Next Steps</span>
          </div>
          <ol className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
            {instructions.map((instruction, i) => (
              <li key={i} className={instruction.startsWith('   ') ? 'ml-4 font-mono text-xs bg-[var(--color-background)] p-2 rounded' : ''}>
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-sm text-amber-600 dark:text-amber-300">
            The application will be temporarily unavailable during the restart.
          </p>
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="py-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
        <XCircle className="text-red-500" size={32} />
      </div>
      <h3 className="text-lg font-medium text-[var(--color-foreground)]">Update Failed</h3>
      <p className="text-sm text-[var(--color-destructive)] mt-2">{error}</p>
      <p className="text-sm text-[var(--color-muted-foreground)] mt-4">
        You may need to manually switch versions:
      </p>
      <code className="block mt-2 p-2 bg-[var(--color-muted)] rounded text-xs font-mono">
        git checkout {selectedRelease?.tag || 'v1.1.1'}
      </code>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'picker': return renderPicker();
      case 'confirm': return renderConfirm();
      case 'updating': return renderUpdating();
      case 'success': return renderSuccess();
      case 'error': return renderError();
      default: return null;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'picker': return 'Version Manager';
      case 'confirm': return selectedRelease?.isOlder
        ? `Rollback to v${selectedRelease.version}`
        : `Update to v${selectedRelease?.version}`;
      case 'updating': return selectedRelease?.isOlder ? 'Rolling back...' : 'Updating...';
      case 'success': return 'Version Changed';
      case 'error': return 'Update Failed';
      default: return 'Version Manager';
    }
  };

  const renderFooter = () => {
    switch (view) {
      case 'picker':
        return (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
          >
            Close
          </button>
        );
      case 'confirm':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => { setView('picker'); setSelectedRelease(null); setBackupDone(false); }}
              className="flex-1 py-2.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Back
            </button>
            <button
              onClick={applyUpdate}
              className={`flex-1 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-white ${
                selectedRelease?.isOlder ? 'bg-amber-500' : 'bg-[var(--color-primary)]'
              }`}
            >
              <Download size={18} />
              {selectedRelease?.isOlder ? 'Rollback' : 'Update'}
            </button>
          </div>
        );
      case 'updating':
        return null;
      case 'success':
      case 'error':
        return (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={view === 'updating' ? () => {} : onClose}
      title={getTitle()}
      size="md"
      footer={renderFooter()}
    >
      <ModalBody>
        {error && view === 'picker' && (
          <div className="mb-4 p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg text-[var(--color-destructive)] text-sm">
            {error}
          </div>
        )}
        {renderContent()}
      </ModalBody>
    </ModalPortal>
  );
}
