// apps/web/src/pages/recipes/ApprovalModal.tsx
// Modal for approving or rejecting a recipe

import { useState } from 'react';
import { ModalPortal, ModalBody } from '../../components/common/ModalPortal';
import type { Recipe } from '../../types/meals';

interface ApprovalModalProps {
  recipe: Recipe;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  onClose: () => void;
}

export function ApprovalModal({ recipe, onApprove, onReject, onClose }: ApprovalModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const footer = showRejectForm ? (
    <div className="flex gap-3">
      <button
        onClick={() => setShowRejectForm(false)}
        className="themed-btn-secondary flex-1"
      >
        Back
      </button>
      <button
        onClick={() => onReject(rejectReason)}
        className="flex-1 py-2 rounded-xl bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)]/90"
      >
        Reject Recipe
      </button>
    </div>
  ) : (
    <div className="flex gap-3">
      <button onClick={onClose} className="themed-btn-secondary flex-1">
        Cancel
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        className="flex-1 py-2 rounded-xl border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
      >
        Reject
      </button>
      <button
        onClick={onApprove}
        className="flex-1 py-2 rounded-xl bg-[var(--color-success)] text-[var(--color-success-foreground)] hover:bg-[var(--color-success)]/90"
      >
        Approve
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Review Recipe"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="mb-4 p-4 bg-[var(--color-muted)] rounded-xl">
          <h3 className="font-medium text-[var(--color-foreground)]">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {recipe.description}
            </p>
          )}
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
            Submitted by {recipe.createdByName}
          </p>
        </div>

        {showRejectForm && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Reason for rejection (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="themed-input w-full"
              placeholder="Enter reason..."
              rows={3}
            />
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}
