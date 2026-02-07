// apps/web/src/pages/KioskLoginPage.tsx
// A touch-friendly PIN login for tablets/kiosk displays

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface PinUser {
  id: number;
  displayName: string;
  nickname: string | null;
  color: string | null;
  avatarUrl: string | null;
}

export function KioskLoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth(); // Use refresh instead of login
  const [users, setUsers] = useState<PinUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PinUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getPinUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedUser || pin.length < 4) {
      setError('Please enter your PIN (4-6 digits)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.loginWithPin(selectedUser.id, pin);
      if (result.success) {
        // Refresh auth context to pick up the new session
        await refresh();
        // Navigate to home
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPin('');
    setError('');
  };

  // User selection screen
  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome!</h1>
        <p className="text-xl text-white/80 mb-8">Who's checking in?</p>

        {loading ? (
          <div className="text-white text-xl">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center">
            <p className="text-white/80 text-lg mb-4">No users with PINs set up yet.</p>
            <a href="/login" className="text-white underline">
              Use password login
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/50"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white/50"
                    style={{ backgroundColor: user.color || '#8b5cf6' }}
                  >
                    {(user.nickname || user.displayName).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-white text-xl font-medium">
                  {user.nickname || user.displayName}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Link to password login */}
        <a href="/login" className="mt-8 text-white/60 hover:text-white text-sm underline">
          Use email & password instead
        </a>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col items-center justify-center p-8">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 text-lg"
      >
        ← Back
      </button>

      {/* User avatar */}
      <div className="mb-6">
        {selectedUser.avatarUrl ? (
          <img
            src={selectedUser.avatarUrl}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-4 border-white/50"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-white/50"
            style={{ backgroundColor: selectedUser.color || '#8b5cf6' }}
          >
            {(selectedUser.nickname || selectedUser.displayName).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Hi, {selectedUser.nickname || selectedUser.displayName}!
      </h2>
      <p className="text-white/80 mb-6">Enter your PIN</p>

      {/* PIN dots */}
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length ? 'bg-white scale-110' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && <div className="mb-4 px-4 py-2 bg-red-500/80 text-white rounded-lg">{error}</div>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePinDigit(String(num))}
            disabled={loading}
            className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-3xl font-bold transition-all disabled:opacity-50"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={loading}
          className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-medium transition-all disabled:opacity-50"
        >
          Clear
        </button>
        <button
          onClick={() => handlePinDigit('0')}
          disabled={loading}
          className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-3xl font-bold transition-all disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={loading}
          className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-all disabled:opacity-50"
        >
          ⌫
        </button>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading || pin.length < 4}
        className="px-12 py-4 bg-white text-purple-600 rounded-full text-xl font-bold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Checking...' : 'Enter'}
      </button>
    </div>
  );
}
