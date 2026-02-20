// apps/web/src/components/settings/BackupRestoreModal.tsx
// Confirmation modal for database restore — requires typing RESTORE to confirm

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import { ModalFooterButtons } from '../common/ModalFooterButtons';

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
        <ModalFooterButtons
          onCancel={onClose}
          onSubmit={onConfirm}
          submitText="Restore Database"
          submitVariant="danger"
          submitDisabled={!canConfirm}
        />
      }
    >
      <ModalBody>
        <div
          className="p-4 rounded-xl mb-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
            border: '1px solid',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-destructive)' }} size={20} />
            <div>
              <h4 className="font-medium" style={{ color: 'var(--color-destructive)' }}>
                This action is destructive
              </h4>
              <p className="text-sm mt-1" style={{ color: 'var(--color-destructive)', opacity: 0.85 }}>
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
            Type <span className="font-mono font-bold" style={{ color: 'var(--color-destructive)' }}>RESTORE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESTORE"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-destructive)]"
            autoFocus
          />
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
