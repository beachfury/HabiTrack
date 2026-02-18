// apps/web/src/pages/KioskLoginPage.tsx
// A touch-friendly PIN login for tablets/kiosk displays
// Uses theme CSS variables for customizable styling

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

// Kiosk styling using CSS variables (customizable via theme editor)
const kioskStyles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, var(--kiosk-bg-gradient-from), var(--kiosk-bg-gradient-to))',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  title: {
    color: 'var(--kiosk-text)',
  },
  subtitle: {
    color: 'var(--kiosk-text-muted)',
  },
  userButton: {
    backgroundColor: 'var(--kiosk-button-bg)',
    backdropFilter: 'blur(8px)',
  },
  userButtonHover: {
    backgroundColor: 'var(--kiosk-button-hover)',
  },
  userButtonActive: {
    backgroundColor: 'var(--kiosk-button-active)',
  },
  pinButton: {
    backgroundColor: 'var(--kiosk-button-bg)',
    color: 'var(--kiosk-text)',
  },
  pinButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--kiosk-text)',
  },
  submitButton: {
    backgroundColor: 'var(--kiosk-accent)',
    color: 'var(--kiosk-bg-gradient-from)',
  },
  error: {
    backgroundColor: 'var(--kiosk-error-bg)',
    color: 'var(--kiosk-error-text)',
  },
  link: {
    color: 'var(--kiosk-text-muted)',
  },
};

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
      <div style={kioskStyles.page}>
        <h1 className="text-4xl font-bold mb-2" style={kioskStyles.title}>
          Welcome!
        </h1>
        <p className="text-xl mb-8" style={kioskStyles.subtitle}>
          Who's checking in?
        </p>

        {loading ? (
          <div className="text-xl" style={kioskStyles.title}>Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center">
            <p className="text-lg mb-4" style={kioskStyles.subtitle}>
              No users with PINs set up yet.
            </p>
            <a href="/login" className="underline" style={kioskStyles.title}>
              Use password login
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95"
                style={kioskStyles.userButton}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: 'var(--kiosk-text-muted)' }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                    style={{
                      backgroundColor: user.color || 'var(--kiosk-bg-gradient-from)',
                      color: 'var(--kiosk-text)',
                      borderWidth: '4px',
                      borderStyle: 'solid',
                      borderColor: 'var(--kiosk-text-muted)',
                    }}
                  >
                    {(user.nickname || user.displayName).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xl font-medium" style={kioskStyles.title}>
                  {user.nickname || user.displayName}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Link to password login */}
        <a
          href="/login"
          className="mt-8 text-sm underline hover:opacity-80 transition-opacity"
          style={kioskStyles.link}
        >
          Use email & password instead
        </a>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div style={kioskStyles.page}>
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-lg hover:opacity-80 transition-opacity"
        style={kioskStyles.subtitle}
      >
        ← Back
      </button>

      {/* User avatar */}
      <div className="mb-6">
        {selectedUser.avatarUrl ? (
          <img
            src={selectedUser.avatarUrl}
            alt=""
            className="w-24 h-24 rounded-full object-cover"
            style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: 'var(--kiosk-text-muted)' }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
            style={{
              backgroundColor: selectedUser.color || 'var(--kiosk-bg-gradient-from)',
              color: 'var(--kiosk-text)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: 'var(--kiosk-text-muted)',
            }}
          >
            {(selectedUser.nickname || selectedUser.displayName).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-2" style={kioskStyles.title}>
        Hi, {selectedUser.nickname || selectedUser.displayName}!
      </h2>
      <p className="mb-6" style={kioskStyles.subtitle}>Enter your PIN</p>

      {/* PIN dots */}
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all"
            style={{
              backgroundColor: i < pin.length ? 'var(--kiosk-text)' : 'var(--kiosk-button-bg)',
              transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg" style={kioskStyles.error}>
          {error}
        </div>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePinDigit(String(num))}
            disabled={loading}
            className="w-20 h-20 rounded-full text-3xl font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={kioskStyles.pinButton}
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={loading}
          className="w-20 h-20 rounded-full text-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
          style={kioskStyles.pinButtonSecondary}
        >
          Clear
        </button>
        <button
          onClick={() => handlePinDigit('0')}
          disabled={loading}
          className="w-20 h-20 rounded-full text-3xl font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={kioskStyles.pinButton}
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={loading}
          className="w-20 h-20 rounded-full text-2xl transition-all hover:opacity-80 disabled:opacity-50"
          style={kioskStyles.pinButtonSecondary}
        >
          ⌫
        </button>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading || pin.length < 4}
        className="px-12 py-4 rounded-full text-xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={kioskStyles.submitButton}
      >
        {loading ? 'Checking...' : 'Enter'}
      </button>
    </div>
  );
}
