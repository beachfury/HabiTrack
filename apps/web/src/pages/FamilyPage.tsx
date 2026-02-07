import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Key, Hash, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { api, type FamilyMember } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to everything' },
  { value: 'member', label: 'Member', description: 'Can manage events and lists' },
  { value: 'kid', label: 'Kid', description: 'Limited access, own events only' },
];

type ModalType = 'add' | 'edit' | 'password' | 'pin' | null;

export function FamilyPage() {
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-purple-600" />
            Family Members
          </h1>
          <p className="text-gray-500 mt-1">Manage your household members and their access</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div
              key={member.id}
              className={`p-6 flex items-center gap-4 ${!member.active ? 'opacity-50 bg-gray-50' : ''}`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: member.color || '#8b5cf6' }}
              >
                {(member.nickname || member.displayName).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{member.displayName}</h3>
                  {member.nickname && (
                    <span className="text-sm text-gray-500">({member.nickname})</span>
                  )}
                  {member.id === user?.id && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                  {!member.active && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full ${
                      member.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : member.role === 'member'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  {member.email && <span className="text-sm text-gray-500">{member.email}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`text-xs flex items-center gap-1 ${member.hasPassword ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <Key size={12} />
                    {member.hasPassword ? 'Password set' : 'No password'}
                  </span>
                  <span
                    className={`text-xs flex items-center gap-1 ${member.hasPin ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <Hash size={12} />
                    {member.hasPin ? 'PIN set' : 'No PIN'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {member.active && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit member"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => openPasswordModal(member)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Set password"
                  >
                    <Key size={18} />
                  </button>
                  <button
                    onClick={() => openPinModal(member)}
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Set PIN"
                  >
                    <Hash size={18} />
                  </button>
                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deactivate member"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No family members yet. Add your first member to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalType === 'add' ? 'Add Family Member' : 'Edit Family Member'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form
              onSubmit={modalType === 'add' ? handleAddMember : handleUpdateMember}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Short name for calendar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="For login and notifications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'admin' | 'member' | 'kid' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Login Credentials (Optional)
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Password (8+ characters)
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Leave blank to set later"
                        />
                      </div>

                      {formData.password && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="For quick kiosk login"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  {modalType === 'add' ? 'Add Member' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {modalType === 'password' && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Set Password for {selectedMember.nickname || selectedMember.displayName}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {modalType === 'pin' && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Set PIN for {selectedMember.nickname || selectedMember.displayName}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSetPin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kiosk PIN (4-6 digits)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to clear existing PIN. PINs must be unique across all family members.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  {formData.pin ? 'Set PIN' : 'Clear PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
