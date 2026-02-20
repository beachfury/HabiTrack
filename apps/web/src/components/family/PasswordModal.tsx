// apps/web/src/components/family/PasswordModal.tsx
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import { ModalFooterButtons } from '../common/ModalFooterButtons';

interface PasswordModalProps {
  member: FamilyMember;
  error: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export function PasswordModal({ member, error, onClose, onSubmit }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    onSubmit(password);
  };

  const footer = (
    <ModalFooterButtons
      onCancel={onClose}
      formId="password-form"
      submitText="Set Password"
    />
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Set Password"
      size="sm"
      footer={footer}
    >
      <ModalBody>
        <form id="password-form" onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Set a new password for <span className="font-medium">{member.displayName}</span>
          </p>

          {(error || localError) && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                color: 'var(--color-destructive)',
                border: '1px solid',
              }}
            >
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              required
            />
          </div>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}
