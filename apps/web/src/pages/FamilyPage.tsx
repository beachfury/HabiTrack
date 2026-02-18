import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Key, Hash, Trash2, X, Check, AlertCircle, UserCheck, UserX } from 'lucide-react';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
import { api, type FamilyMember } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to everything' },
  { value: 'member', label: 'Member', description: 'Can manage events and lists' },
  { value: 'kid', label: 'Kid', description: 'Limited access, own events only' },
];

// Helper function for role badge styles
const getRoleStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return { backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' };
    case 'member':
      return { backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)', color: 'var(--color-info)' };
    case 'kid':
      return { backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' };
    default:
      return { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
  }
};

type ModalType = 'add' | 'edit' | 'password' | 'pin' | null;

export function FamilyPage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const animationClasses = getPageAnimationClasses('family-background');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    nickname: '',
    email: '',
    role: 'member' as 'admin' | 'member' | 'kid',
    color: '#3b82f6', // Default blue
    password: '',
    confirmPassword: '',
    pin: '',
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await api.getFamilyMembers();
      setMembers(data.members);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedMember(null);
    setFormData({
      displayName: '',
      nickname: '',
      email: '',
      role: 'member',
      color: '#3b82f6',
      password: '',
      confirmPassword: '',
      pin: '',
    });
    setError('');
    setModalType('add');
  };

  const openEditModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormData({
      displayName: member.displayName,
      nickname: member.nickname || '',
      email: member.email || '',
      role: member.role,
      color: member.color || '#3b82f6',
      password: '',
      confirmPassword: '',
      pin: '',
    });
    setError('');
    setModalType('edit');
  };

  const openPasswordModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormData({ ...formData, password: '', confirmPassword: '' });
    setError('');
    setModalType('password');
  };

  const openPinModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormData({ ...formData, pin: '' });
    setError('');
    setModalType('pin');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedMember(null);
    setError('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.pin && !/^\d{4,6}$/.test(formData.pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    try {
      await api.createFamilyMember({
        displayName: formData.displayName,
        nickname: formData.nickname || undefined,
        email: formData.email || undefined,
        role: formData.role,
        color: formData.color,
        password: formData.password || undefined,
        pin: formData.pin || undefined,
      });
      setSuccess('Family member added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setError('');

    try {
      await api.updateFamilyMember(selectedMember.id, {
        displayName: formData.displayName,
        nickname: formData.nickname || undefined,
        email: formData.email || undefined,
        role: formData.role,
        color: formData.color,
      });
      setSuccess('Member updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to update member');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await api.setMemberPassword(selectedMember.id, formData.password);
      setSuccess('Password set successfully!');
      setTimeout(() => setSuccess(''), 3000);
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setError('');

    if (formData.pin && !/^\d{4,6}$/.test(formData.pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    try {
      await api.setMemberPin(selectedMember.id, formData.pin || null);
      setSuccess(formData.pin ? 'PIN set successfully!' : 'PIN cleared successfully!');
      setTimeout(() => setSuccess(''), 3000);
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN');
    }
  };

  const handleDeleteMember = async (member: FamilyMember) => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${member.displayName}? They will no longer be able to log in.`,
      )
    ) {
      return;
    }

    try {
      await api.deleteFamilyMember(member.id);
      setSuccess('Member deactivated successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
    }
  };

  const handleReactivateMember = async (member: FamilyMember) => {
    if (!confirm(`Reactivate ${member.displayName}? They will be able to log in again.`)) {
      return;
    }

    try {
      await api.reactivateFamilyMember(member.id);
      setSuccess(`${member.displayName} has been reactivated`);
      setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate member');
    }
  };

  const handleHardDeleteMember = async (member: FamilyMember) => {
    if (
      !confirm(
        `⚠️ PERMANENTLY DELETE ${member.displayName}?\n\nThis will remove their account and ALL associated data (chores, points, messages, etc.).\n\nThis action CANNOT be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.hardDeleteFamilyMember(member.id);
      setSuccess(`${member.displayName} has been permanently deleted`);
      setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete member');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen themed-family-bg ${animationClasses}`}>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
            <Users className="text-[var(--color-primary)]" />
            Family Members
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">Manage your household members and their access</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] px-4 py-2 rounded-xl transition-opacity"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Success message */}
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
          <Check size={20} />
          {success}
        </div>
      )}

      {/* Members list */}
      <div className="themed-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-[var(--color-border)]">
          {members.map((member) => (
            <div
              key={member.id}
              className={`p-6 flex items-center gap-4 ${!member.active ? 'opacity-50 bg-[var(--color-muted)]' : ''}`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: member.color || 'var(--color-primary)' }}
              >
                {(member.nickname || member.displayName).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--color-foreground)]">{member.displayName}</h3>
                  {member.nickname && (
                    <span className="text-sm text-[var(--color-muted-foreground)]">({member.nickname})</span>
                  )}
                  {member.id === user?.id && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      You
                    </span>
                  )}
                  {!member.active && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
                        color: 'var(--color-destructive)',
                      }}
                    >
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={getRoleStyle(member.role)}
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  {member.email && <span className="text-sm text-[var(--color-muted-foreground)]">{member.email}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: member.hasPassword ? 'var(--color-success)' : 'var(--color-muted-foreground)' }}
                  >
                    <Key size={12} />
                    {member.hasPassword ? 'Password set' : 'No password'}
                  </span>
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: member.hasPin ? 'var(--color-success)' : 'var(--color-muted-foreground)' }}
                  >
                    <Hash size={12} />
                    {member.hasPin ? 'PIN set' : 'No PIN'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {member.active ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                    title="Edit member"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => openPasswordModal(member)}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-lg transition-colors"
                    title="Set password"
                  >
                    <Key size={18} />
                  </button>
                  <button
                    onClick={() => openPinModal(member)}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 rounded-lg transition-colors"
                    title="Set PIN"
                  >
                    <Hash size={18} />
                  </button>
                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg transition-colors"
                      title="Deactivate member"
                    >
                      <UserX size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReactivateMember(member)}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-lg transition-colors"
                    title="Reactivate member"
                  >
                    <UserCheck size={18} />
                  </button>
                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleHardDeleteMember(member)}
                      className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg transition-colors"
                      title="Permanently delete member"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-12 text-center text-[var(--color-muted-foreground)]">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No family members yet. Add your first member to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <ModalPortal
          isOpen={true}
          onClose={closeModal}
          title={modalType === 'add' ? 'Add Family Member' : 'Edit Family Member'}
          size="lg"
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:opacity-80 rounded-xl transition-opacity"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="member-form"
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-xl transition-opacity"
              >
                {modalType === 'add' ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          }
        >
          <ModalBody>
            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                  color: 'var(--color-destructive)',
                  border: '1px solid',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form
              id="member-form"
              onSubmit={modalType === 'add' ? handleAddMember : handleUpdateMember}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nickname</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Short name for calendar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="For login and notifications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'admin' | 'member' | 'kid' })
                  }
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              {modalType === 'add' && (
                <>
                  <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                    <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-3">
                      Login Credentials (Optional)
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-[var(--color-muted-foreground)] mb-1">
                          Password (8+ characters)
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                          placeholder="Leave blank to set later"
                        />
                      </div>

                      {formData.password && (
                        <div>
                          <label className="block text-sm text-[var(--color-muted-foreground)] mb-1">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-[var(--color-muted-foreground)] mb-1">
                          Kiosk PIN (4-6 digits)
                        </label>
                        <input
                          type="text"
                          value={formData.pin}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                            })
                          }
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                          placeholder="For quick kiosk login"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </ModalBody>
        </ModalPortal>
      )}

      {/* Password Modal */}
      {modalType === 'password' && selectedMember && (
        <ModalPortal
          isOpen={true}
          onClose={closeModal}
          title={`Set Password for ${selectedMember.nickname || selectedMember.displayName}`}
          size="md"
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:opacity-80 rounded-xl transition-opacity"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="password-form"
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-xl transition-opacity"
              >
                Set Password
              </button>
            </div>
          }
        >
          <ModalBody>
            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                  color: 'var(--color-destructive)',
                  border: '1px solid',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form id="password-form" onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="At least 8 characters"
                  required
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
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
            </form>
          </ModalBody>
        </ModalPortal>
      )}

      {/* PIN Modal */}
      {modalType === 'pin' && selectedMember && (
        <ModalPortal
          isOpen={true}
          onClose={closeModal}
          title={`Set PIN for ${selectedMember.nickname || selectedMember.displayName}`}
          size="md"
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:opacity-80 rounded-xl transition-opacity"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="pin-form"
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-xl transition-opacity"
              >
                {formData.pin ? 'Set PIN' : 'Clear PIN'}
              </button>
            </div>
          }
        >
          <ModalBody>
            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                  color: 'var(--color-destructive)',
                  border: '1px solid',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form id="pin-form" onSubmit={handleSetPin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Kiosk PIN (4-6 digits)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] text-center text-2xl tracking-widest focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="••••"
                  maxLength={6}
                />
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Leave blank to clear existing PIN. PINs must be unique across all family members.
                </p>
              </div>
            </form>
          </ModalBody>
        </ModalPortal>
      )}
      </div>
    </div>
  );
}
