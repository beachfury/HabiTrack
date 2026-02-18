// apps/web/src/components/settings/BackupRestoreModal.tsx
// Confirmation modal for database restore — requires typing RESTORE to confirm

import { useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

interface BackupRestoreModalProps {
  filename: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function BackupRestoreModal({ filename, onConfirm, onClose }: BackupRestoreModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const canConfirm = confirmText === 'RESTORE';

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Restore Database"
      size="md"
      footer={
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={18} />
            Restore Database
          </button>
        </div>
      }
    >
      <ModalBody>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-medium text-red-700 dark:text-red-400">
                This action is destructive
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Restoring from a backup will <strong>replace ALL current data</strong> in the database
                with the data from the backup. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-[var(--color-muted-foreground)] mb-1">Restoring from:</p>
          <p className="font-mono text-sm text-[var(--color-foreground)] bg-[var(--color-muted)]/50 p-2 rounded">
            {filename}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            Type <span className="font-mono font-bold text-red-500">RESTORE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESTORE"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            autoFocus
          />
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
