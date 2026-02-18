// apps/web/src/components/settings/UpdateModal.tsx
// Modal for confirming and applying updates

import { useState } from 'react';
import { Download, AlertTriangle, CheckCircle, XCircle, Terminal, ExternalLink } from 'lucide-react';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt?: string;
}

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  onClose: () => void;
}

type UpdateStatus = 'confirm' | 'updating' | 'success' | 'error';

export function UpdateModal({ updateInfo, onClose }: UpdateModalProps) {
  const [status, setStatus] = useState<UpdateStatus>('confirm');
  const [error, setError] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);

  const applyUpdate = async () => {
    setStatus('updating');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/updates/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Update failed');
      }

      setInstructions(data.instructions || []);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Failed to apply update');
      setStatus('error');
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Truncate release notes if too long
  const truncatedNotes = updateInfo.releaseNotes
    ? updateInfo.releaseNotes.length > 500
      ? updateInfo.releaseNotes.substring(0, 500) + '...'
      : updateInfo.releaseNotes
    : null;

  const renderContent = () => {
    switch (status) {
      case 'confirm':
        return (
          <>
            {/* Version comparison */}
            <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Current</p>
                  <p className="text-lg font-bold text-[var(--color-foreground)]">
                    v{updateInfo.currentVersion}
                  </p>
                </div>
                <div className="px-4">
                  <span className="text-2xl text-[var(--color-primary)]">&rarr;</span>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Latest</p>
                  <p className="text-lg font-bold text-[var(--color-primary)]">
                    v{updateInfo.latestVersion}
                  </p>
                </div>
              </div>
              {updateInfo.publishedAt && (
                <p className="text-xs text-center text-[var(--color-muted-foreground)] mt-2">
                  Released: {formatDate(updateInfo.publishedAt)}
                </p>
              )}
            </div>

            {/* Release notes preview */}
            {truncatedNotes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-[var(--color-foreground)] mb-2">
                  Release Notes
                </h4>
                <div className="p-3 bg-[var(--color-background)] rounded-lg text-sm text-[var(--color-muted-foreground)] max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {truncatedNotes}
                </div>
                {updateInfo.releaseUrl && (
                  <a
                    href={updateInfo.releaseUrl}
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

            {/* Warning */}
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Important
                  </p>
                  <p className="text-amber-600 dark:text-amber-300 mt-1">
                    After the update downloads, you'll need to restart the containers to apply the changes.
                  </p>
                </div>
              </div>
            </div>
          </>
        );

      case 'updating':
        return (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-muted)]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-[var(--color-foreground)]">
              Downloading Update...
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
              Pulling latest changes from GitHub
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="text-lg font-medium text-[var(--color-foreground)]">
                Update Downloaded!
              </h3>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
                The code has been updated. Follow these steps to complete:
              </p>
            </div>

            {instructions.length > 0 && (
              <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
                <div className="flex items-start gap-2 mb-3">
                  <Terminal size={16} className="text-[var(--color-primary)] mt-0.5" />
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    Next Steps
                  </span>
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

      case 'error':
        return (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="text-red-500" size={32} />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-foreground)]">
              Update Failed
            </h3>
            <p className="text-sm text-[var(--color-destructive)] mt-2">
              {error}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-4">
              You may need to manually update by running:
            </p>
            <code className="block mt-2 p-2 bg-[var(--color-muted)] rounded text-xs font-mono">
              git pull origin main
            </code>
          </div>
        );
    }
  };

  const renderFooter = () => {
    switch (status) {
      case 'confirm':
        return (
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
            <button
              onClick={applyUpdate}
              className="flex-1 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Accept & Update
            </button>
          </div>
        );

      case 'updating':
        return null; // No footer during update

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
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={status === 'updating' ? () => {} : onClose}
      title={
        status === 'confirm'
          ? `Update to ${updateInfo.releaseName || `v${updateInfo.latestVersion}`}`
          : status === 'updating'
          ? 'Updating...'
          : status === 'success'
          ? 'Update Complete'
          : 'Update Failed'
      }
      size="md"
      footer={renderFooter()}
    >
      <ModalBody>{renderContent()}</ModalBody>
    </ModalPortal>
  );
}
