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

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // First login flow state
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [onboardToken, setOnboardToken] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
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
              <p style={{ color: subtitleColor }} className="mt-1">Welcome back! Sign in to continue.</p>
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

            {/* Login form */}
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
                <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>Password</label>
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
