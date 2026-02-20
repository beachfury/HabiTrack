// apps/web/src/components/family/MemberFormModal.tsx
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import { ModalFooterButtons } from '../common/ModalFooterButtons';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to everything' },
  { value: 'member', label: 'Member', description: 'Can manage events and lists' },
  { value: 'kid', label: 'Kid', description: 'Limited access, own events only' },
];

interface MemberFormData {
  displayName: string;
  nickname: string;
  email: string;
  role: 'admin' | 'member' | 'kid';
  color: string;
  password: string;
  confirmPassword: string;
  pin: string;
}

interface MemberFormModalProps {
  mode: 'add' | 'edit';
  formData: MemberFormData;
  error: string;
  onClose: () => void;
  onChange: (data: MemberFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MemberFormModal({
  mode,
  formData,
  error,
  onClose,
  onChange,
  onSubmit,
}: MemberFormModalProps) {
  const isAdd = mode === 'add';

  const footer = (
    <ModalFooterButtons
      onCancel={onClose}
      formId="member-form"
      submitText={isAdd ? 'Add Member' : 'Save Changes'}
    />
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={isAdd ? 'Add Family Member' : 'Edit Member'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <form id="member-form" onSubmit={onSubmit} className="space-y-4">
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

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => onChange({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              placeholder="John Smith"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Nickname
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => onChange({ ...formData, nickname: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              placeholder="Johnny"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              placeholder="john@example.com"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Role
            </label>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={
                    formData.role === role.value
                      ? {
                          borderColor: 'var(--color-primary)',
                          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                        }
                      : {
                          borderColor: 'var(--color-border)',
                        }
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => onChange({ ...formData, role: e.target.value as any })}
                    className="mt-0.5"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{role.label}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Password (Add mode only) */}
          {isAdd && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => onChange({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                  placeholder="Min 8 characters"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => onChange({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  PIN (optional)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) =>
                    onChange({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                  placeholder="4-6 digits"
                  maxLength={6}
                />
              </div>
            </>
          )}
        </form>
      </ModalBody>
    </ModalPortal>
  );
}
