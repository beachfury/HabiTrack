// apps/web/src/components/family/MemberFormModal.tsx
import { X } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAdd ? 'Add Family Member' : 'Edit Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => onChange({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              placeholder="John Smith"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nickname
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => onChange({ ...formData, nickname: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              placeholder="Johnny"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              placeholder="john@example.com"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    formData.role === role.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => onChange({ ...formData, role: e.target.value as any })}
                    className="mt-0.5 text-purple-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{role.label}</p>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Password (Add mode only) */}
          {isAdd && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => onChange({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                  placeholder="Min 8 characters"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => onChange({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PIN (optional)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) =>
                    onChange({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                  placeholder="4-6 digits"
                  maxLength={6}
                />
              </div>
            </>
          )}
        </form>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
          >
            {isAdd ? 'Add Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
