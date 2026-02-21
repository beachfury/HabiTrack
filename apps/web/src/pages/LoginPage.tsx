// apps/web/src/pages/LoginPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FirstLoginModal } from '../components/auth/FirstLoginModal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface Branding {
  name: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  loginBackground: string | null;
  loginBackgroundValue: string | null;
}

type LoginView = 'login' | 'forgot' | 'reset-code';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // First login flow state
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [onboardToken, setOnboardToken] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  // Forgot password flow
  const [view, setView] = useState<LoginView>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const { login, refresh } = useAuth();
  const navigate = useNavigate();

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Fetch public branding — no auth required
    (async () => {
      try {
        const res = await fetch('/api/branding');
        if (!res.ok) {
          throw new Error(`Failed to fetch branding: ${res.status}`);
        }
        const data = await res.json();
        setBranding(data as Branding);
      } catch (err) {
        console.error(err);
      }
    })();

    // Fetch app version — no auth required
    (async () => {
      try {
        const res = await fetch('/api/version');
        if (res.ok) {
          const data = await res.json();
          setAppVersion(data.version);
        }
      } catch (err) {
        console.error('Failed to fetch version:', err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, try the direct API call to check for first login requirement
      const res = await fetch(`${API_BASE}/api/auth/creds/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, secret: password }),
      });

      if (res.status === 428) {
        // First login required - show password change modal
        const data = await res.json();
        if (data.onboardToken) {
          setOnboardToken(data.onboardToken);
          setShowFirstLoginModal(true);
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Login failed. Please try again.');
      }

      // Normal login success - refresh auth context and navigate
      await refresh();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful first login password set
  const handleFirstLoginSuccess = async () => {
    setShowFirstLoginModal(false);
    setOnboardToken(null);
    // Session cookie was set by the backend, just refresh and navigate
    await refresh();
    navigate('/');
  };

  // Handle first login modal cancel
  const handleFirstLoginCancel = () => {
    setShowFirstLoginModal(false);
    setOnboardToken(null);
    setError('You must set a new password to continue.');
  };

  // Forgot password: send reset code
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/creds/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to send reset code');
      }

      setSuccessMsg('If that email exists, a reset code has been sent. Check your inbox.');
      setView('reset-code');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Reset password with code
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/creds/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: forgotEmail, code: resetCode, newSecret: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.code === 'INVALID_OR_EXPIRED_CODE'
          ? 'Invalid or expired code. Please try again.'
          : data.error?.message || 'Failed to reset password');
      }

      // Success — session cookie set by backend, refresh and navigate
      await refresh();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setView('login');
    setError('');
    setSuccessMsg('');
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Determine background style
  const getBackgroundStyle = () => {
    if (!branding) {
      return {}; // Default gradient is in className
    }

    if (branding.loginBackground === 'image' && branding.loginBackgroundValue) {
      return {
        backgroundImage: `url(${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${branding.loginBackgroundValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    if (branding.loginBackground === 'solid' && branding.loginBackgroundValue) {
      return {
        background: branding.loginBackgroundValue,
      };
    }

    return {}; // Use default gradient
  };

  const backgroundStyle = getBackgroundStyle();
  const useDefaultGradient = !branding || branding.loginBackground === 'gradient';

  // HabiTrack brand colors
  const navyColor = '#3d4f5f';
  const defaultGreen = '#3cb371';
  // Use branding color if set, otherwise default green
  const brandColor = branding?.brandColor || defaultGreen;

  // Dark mode colors (navy-tinted to match SetupPage)
  const darkColors = {
    background: '#1a2530',
    card: '#243340',
    cardBorder: '#3d4f5f',
    text: '#f9fafb',
    mutedText: '#9ca3af',
    inputBg: '#1a2530',
    inputBorder: '#3d4f5f',
    green: '#4fd693',
  };

  // Theme-aware colors
  const cardBg = isDarkMode ? darkColors.card : '#ffffff';
  const cardBorder = isDarkMode ? darkColors.cardBorder : '#e5e7eb';
  const inputBg = isDarkMode ? darkColors.inputBg : '#ffffff';
  const inputBorder = isDarkMode ? darkColors.inputBorder : '#e5e7eb';
  const inputText = isDarkMode ? darkColors.text : navyColor;
  const labelColor = isDarkMode ? '#d1d5db' : navyColor;
  const subtitleColor = isDarkMode ? darkColors.mutedText : '#6b7280';
  const titleColor = isDarkMode ? darkColors.text : navyColor;
  const footerColor = isDarkMode ? darkColors.mutedText : navyColor;

  // Default gradient for light/dark (navy-tinted)
  const defaultGradientClass = isDarkMode
    ? ''
    : 'bg-gradient-to-br from-[#f8faf9] via-[#e8f5e9] to-[#c8e6c9]';

  // Dark mode background style
  const darkBgStyle = isDarkMode && useDefaultGradient
    ? { background: `linear-gradient(to bottom right, ${darkColors.background}, #0f1a24, ${darkColors.background})` }
    : {};

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative ${
        useDefaultGradient ? defaultGradientClass : ''
      }`}
      style={{ ...backgroundStyle, ...darkBgStyle }}
    >
      {/* Subtle pattern overlay for default gradient */}
      {useDefaultGradient && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: isDarkMode
              ? `radial-gradient(circle at 25% 25%, ${darkColors.green}10 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, ${navyColor}15 0%, transparent 50%)`
              : `radial-gradient(circle at 25% 25%, ${brandColor}15 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, ${navyColor}10 0%, transparent 50%)`
          }}
        />
      )}

      {/* Dark overlay for image backgrounds */}
      {branding?.loginBackground === 'image' && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      )}

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card with brand accent */}
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: cardBg }}
        >
          {/* Brand color accent bar at top */}
          <div
            className="h-2"
            style={{ background: `linear-gradient(to right, ${navyColor}, ${brandColor})` }}
          />

          <div className="p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div
                className="w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-6 flex items-center justify-center"
                style={{
                  filter: isDarkMode
                    ? `drop-shadow(0 0 25px rgba(79, 214, 147, 0.6)) drop-shadow(0 0 50px rgba(79, 214, 147, 0.35))`
                    : `drop-shadow(0 0 20px rgba(60, 179, 113, 0.45)) drop-shadow(0 0 40px rgba(60, 179, 113, 0.25))`,
                }}
              >
                <img
                  src={branding?.logoUrl
                    ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${branding.logoUrl}`
                    : '/assets/HabiTrack_logo.png'
                  }
                  alt="HabiTrack Logo"
                  className="w-28 h-28 sm:w-44 sm:h-44 object-contain"
                />
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: titleColor }}
              >
                {branding?.name || 'HabiTrack'}
              </h1>
              <p style={{ color: subtitleColor }} className="mt-1">
                {view === 'login' && 'Welcome back! Sign in to continue.'}
                {view === 'forgot' && 'Forgot your password?'}
                {view === 'reset-code' && 'Reset your password'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mb-6 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  borderColor: isDarkMode ? '#991b1b' : '#fecaca',
                  borderWidth: 1,
                  color: isDarkMode ? '#fca5a5' : '#dc2626',
                }}
              >
                {error}
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div
                className="mb-6 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
                  borderColor: isDarkMode ? '#166534' : '#bbf7d0',
                  borderWidth: 1,
                  color: isDarkMode ? '#86efac' : '#16a34a',
                }}
              >
                {successMsg}
              </div>
            )}

            {/* ============ LOGIN VIEW ============ */}
            {view === 'login' && (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: inputBorder,
                        color: inputText,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColor;
                        e.target.style.boxShadow = `0 0 0 3px ${brandColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = inputBorder;
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium" style={{ color: labelColor }}>Password</label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); setForgotEmail(email); }}
                        className="text-xs font-medium hover:underline"
                        style={{ color: brandColor }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: inputBorder,
                        color: inputText,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColor;
                        e.target.style.boxShadow = `0 0 0 3px ${brandColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = inputBorder;
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                    style={{ backgroundColor: brandColor }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                {/* Kiosk link */}
                <div
                  className="mt-6 pt-6 text-center"
                  style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: cardBorder }}
                >
                  <p className="text-sm" style={{ color: subtitleColor }}>
                    Using the family kiosk?{' '}
                    <button
                      className="font-medium hover:underline"
                      style={{ color: brandColor }}
                    >
                      Switch User with PIN
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* ============ FORGOT PASSWORD VIEW ============ */}
            {view === 'forgot' && (
              <>
                <p className="text-sm mb-4" style={{ color: subtitleColor }}>
                  Enter your email address and we'll send you a 6-digit code to reset your password.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: inputBorder,
                        color: inputText,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColor;
                        e.target.style.boxShadow = `0 0 0 3px ${brandColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = inputBorder;
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                    style={{ backgroundColor: brandColor }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={backToLogin}
                    className="text-sm font-medium hover:underline"
                    style={{ color: brandColor }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}

            {/* ============ RESET CODE VIEW ============ */}
            {view === 'reset-code' && (
              <>
                <p className="text-sm mb-4" style={{ color: subtitleColor }}>
                  Enter the 6-digit code sent to <strong>{forgotEmail}</strong> and your new password.
                </p>
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>Reset Code</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all text-center text-2xl tracking-widest font-mono"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: inputBorder,
                        color: inputText,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColor;
                        e.target.style.boxShadow = `0 0 0 3px ${brandColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = inputBorder;
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: inputBorder,
                        color: inputText,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColor;
                        e.target.style.boxShadow = `0 0 0 3px ${brandColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = inputBorder;
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: inputBorder,
                        color: inputText,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = brandColor;
                        e.target.style.boxShadow = `0 0 0 3px ${brandColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = inputBorder;
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                    style={{ backgroundColor: brandColor }}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={backToLogin}
                    className="text-sm font-medium hover:underline"
                    style={{ color: brandColor }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-center mt-6 text-sm" style={{ color: footerColor }}>
          Powered by <span className="font-semibold">HabiTrack</span>
          {appVersion && (
            <span className="opacity-60 ml-1">v{appVersion}</span>
          )}
        </p>
      </div>

      {/* First Login Modal */}
      {showFirstLoginModal && onboardToken && (
        <FirstLoginModal
          token={onboardToken}
          onSuccess={handleFirstLoginSuccess}
          onCancel={handleFirstLoginCancel}
        />
      )}
    </div>
  );
}
