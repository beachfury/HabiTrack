// apps/web/src/components/auth/FirstLoginModal.tsx
// Modal for first-time login password change

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Shield } from 'lucide-react';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface FirstLoginModalProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FirstLoginModal({ token, onSuccess, onCancel }: FirstLoginModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/onboard/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error?.code === 'INVALID_TOKEN') {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(data.error?.message || 'Failed to set password');
        }
        return;
      }

      // Success - session cookie is now set
      onSuccess();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="flex-1 py-2.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="first-login-form"
        disabled={loading}
        className="flex-1 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Setting...
          </>
        ) : (
          <>
            <Shield size={18} />
            Set Password
          </>
        )}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onCancel}
      title="Welcome! Set Your Password"
      size="sm"
      footer={footer}
    >
      <ModalBody>
        <form id="first-login-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Welcome message */}
          <div className="p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
            <div className="flex items-start gap-3">
              <KeyRound className="text-[var(--color-primary)] mt-0.5" size={20} />
              <div>
                <p className="text-sm text-[var(--color-foreground)] font-medium">
                  First Time Login
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                  Please set your own password to secure your account. You'll use this password for future logins.
                </p>
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
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

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm password field */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              placeholder="Re-enter your password"
              required
              disabled={loading}
            />
          </div>

          {/* Password requirements hint */}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Password must be at least 8 characters long.
          </p>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}
