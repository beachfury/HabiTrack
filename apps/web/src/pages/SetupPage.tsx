import { useState, useEffect } from 'react';
import { api } from '../api';

interface SetupPageProps {
  onComplete: () => void;
}

// HabiTrack brand colors
const navyColor = '#3d4f5f';
const greenColor = '#3cb371';

// Dark mode colors
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

export function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Fetch app version
  useEffect(() => {
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

  // Step 1: Household info
  const [householdName, setHouseholdName] = useState('');

  // Step 2: Admin account
  const [adminForm, setAdminForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (adminForm.password !== adminForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (adminForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.bootstrap({
        householdName: householdName || 'My Family',
        adminName: adminForm.displayName,
        adminEmail: adminForm.email,
        adminPassword: adminForm.password,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware colors
  const colors = {
    bg: isDarkMode
      ? `linear-gradient(to bottom right, ${darkColors.background}, #0f1a24, ${darkColors.background})`
      : 'linear-gradient(to bottom right, #f8faf9, #e8f5e9, #c8e6c9)',
    card: isDarkMode ? darkColors.card : '#ffffff',
    cardBorder: isDarkMode ? darkColors.cardBorder : 'transparent',
    text: isDarkMode ? darkColors.text : navyColor,
    mutedText: isDarkMode ? darkColors.mutedText : '#6b7280',
    inputBg: isDarkMode ? darkColors.inputBg : '#ffffff',
    inputBorder: isDarkMode ? darkColors.inputBorder : '#e5e7eb',
    inputText: isDarkMode ? darkColors.text : navyColor,
    green: isDarkMode ? darkColors.green : greenColor,
    errorBg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    errorBorder: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
    errorText: isDarkMode ? '#fca5a5' : '#dc2626',
    buttonBorder: isDarkMode ? darkColors.cardBorder : '#d1d5db',
    buttonText: isDarkMode ? darkColors.text : '#374151',
    buttonHover: isDarkMode ? darkColors.card : '#f9fafb',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: colors.bg }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: isDarkMode
            ? `radial-gradient(circle at 25% 25%, ${darkColors.green}10 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, ${navyColor}15 0%, transparent 50%)`
            : `radial-gradient(circle at 25% 25%, ${greenColor}15 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, ${navyColor}10 0%, transparent 50%)`
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: colors.card,
            border: isDarkMode ? `1px solid ${colors.cardBorder}` : 'none',
          }}
        >
          {/* Brand accent bar */}
          <div
            className="h-2"
            style={{ background: `linear-gradient(to right, ${navyColor}, ${colors.green})` }}
          />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Large prominent logo with glow effect */}
              <div
                className="w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-6 flex items-center justify-center relative"
                style={{
                  filter: isDarkMode
                    ? `drop-shadow(0 0 25px rgba(79, 214, 147, 0.6)) drop-shadow(0 0 50px rgba(79, 214, 147, 0.35))`
                    : `drop-shadow(0 0 20px rgba(60, 179, 113, 0.45)) drop-shadow(0 0 40px rgba(60, 179, 113, 0.25))`,
                }}
              >
                <img
                  src="/assets/HabiTrack_logo.png"
                  alt="HabiTrack Logo"
                  className="w-28 h-28 sm:w-44 sm:h-44 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                Welcome to HabiTrack
              </h1>
              <p style={{ color: colors.mutedText }} className="mt-2 text-base">Let's set up your household</p>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: step >= 1 ? colors.green : (isDarkMode ? '#4b5563' : '#d1d5db') }}
              />
              <div
                className="w-12 h-1"
                style={{ backgroundColor: step >= 2 ? colors.green : (isDarkMode ? '#4b5563' : '#d1d5db') }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: step >= 2 ? colors.green : (isDarkMode ? '#4b5563' : '#d1d5db') }}
              />
            </div>

            {error && (
              <div
                className="mb-6 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: colors.errorBg,
                  border: `1px solid ${colors.errorBorder}`,
                  color: colors.errorText,
                }}
              >
                {error}
              </div>
            )}

            {/* Step 1: Household Name */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Household Name
                  </label>
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.green;
                      e.target.style.boxShadow = `0 0 0 3px ${colors.green}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="The Smith Family"
                  />
                  <p className="text-sm mt-1" style={{ color: colors.mutedText }}>
                    This will be displayed on the login screen
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02]"
                  style={{ backgroundColor: colors.green }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {step === 2 && (
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={adminForm.displayName}
                    onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.green;
                      e.target.style.boxShadow = `0 0 0 3px ${colors.green}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.green;
                      e.target.style.boxShadow = `0 0 0 3px ${colors.green}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.green;
                      e.target.style.boxShadow = `0 0 0 3px ${colors.green}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.green;
                      e.target.style.boxShadow = `0 0 0 3px ${colors.green}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border rounded-xl font-medium transition-colors"
                    style={{
                      borderColor: colors.buttonBorder,
                      color: colors.buttonText,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.buttonHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                    style={{ backgroundColor: colors.green }}
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-center mt-6 text-sm" style={{ color: isDarkMode ? colors.mutedText : navyColor }}>
          Powered by <span className="font-semibold">HabiTrack</span>
          {appVersion && (
            <span className="opacity-60 ml-1">v{appVersion}</span>
          )}
        </p>
      </div>
    </div>
  );
}
