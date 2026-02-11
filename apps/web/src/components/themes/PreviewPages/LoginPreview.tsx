// apps/web/src/components/themes/PreviewPages/LoginPreview.tsx
// Login page preview replica for theme editor
// - For HabiTrack Classic (system theme): Shows default HabiTrack branding
// - For Household Brand: Fetches and shows household branding settings

import { useState, useEffect } from 'react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

// Helper to get full URL for uploaded assets
const getAssetUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // If it's a relative path starting with /, prepend the API base URL
  if (path.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${apiBase}${path}`;
  }
  return path;
};

// Branding data from household settings (matches /api/branding response)
interface BrandingData {
  name: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  loginBackground: 'gradient' | 'solid' | 'image' | null;
  loginBackgroundValue: string | null;
}

// HabiTrack default branding (used for HabiTrack Classic theme)
const HABITRACK_DEFAULT_BRANDING: BrandingData = {
  name: 'HabiTrack',
  brandColor: '#3cb371', // HabiTrack Green
  logoUrl: null, // Uses default logo
  loginBackground: 'gradient',
  loginBackgroundValue: '#3d4f5f,#1a2530', // Navy gradient
};

interface LoginPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
  brandingVersion?: number; // Increment to trigger refresh
}

export function LoginPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
  brandingVersion = 0,
}: LoginPreviewProps) {
  const isDarkMode = colorMode === 'dark';

  // Check if this is the system theme (HabiTrack Classic)
  const isSystemTheme = theme.isSystemTheme === true || theme.id === 'habitrack-classic';

  // Fetch actual branding from household settings (only for non-system themes)
  const [branding, setBranding] = useState<BrandingData | null>(
    isSystemTheme ? HABITRACK_DEFAULT_BRANDING : null
  );
  const [loading, setLoading] = useState(!isSystemTheme);

  useEffect(() => {
    // For system theme, always use HabiTrack defaults
    if (isSystemTheme) {
      setBranding(HABITRACK_DEFAULT_BRANDING);
      setLoading(false);
      return;
    }
    // For other themes, fetch household branding
    loadBranding();
  }, [brandingVersion, isSystemTheme]);

  // Reload branding when login-page is selected (user may have made changes)
  useEffect(() => {
    if (selectedElement === 'login-page' && !isSystemTheme) {
      loadBranding();
    }
  }, [selectedElement, isSystemTheme]);

  const loadBranding = async () => {
    if (isSystemTheme) return; // Never fetch for system theme

    try {
      const res = await fetch('/api/branding');
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setLoading(false);
    }
  };

  // HabiTrack brand colors
  const navyColor = '#3d4f5f';
  const greenColor = '#3cb371';

  // Dark mode colors (navy-tinted)
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

  // Build background style based on branding settings or defaults
  const backgroundStyle: React.CSSProperties = {
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    position: 'relative',
  };

  // Parse gradient values if it's a gradient background
  let gradientFrom = '#3d4f5f';
  let gradientTo = '#1a2530';
  if (branding?.loginBackground === 'gradient' && branding.loginBackgroundValue) {
    const parts = branding.loginBackgroundValue.split(',');
    if (parts.length === 2) {
      gradientFrom = parts[0].trim();
      gradientTo = parts[1].trim();
    }
  }

  // Determine background based on branding
  if (branding?.loginBackground === 'solid' && branding.loginBackgroundValue) {
    backgroundStyle.backgroundColor = branding.loginBackgroundValue;
  } else if (branding?.loginBackground === 'gradient') {
    backgroundStyle.background = `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`;
  } else if (branding?.loginBackground === 'image' && branding.loginBackgroundValue) {
    const bgImageUrl = getAssetUrl(branding.loginBackgroundValue);
    backgroundStyle.backgroundImage = `url(${bgImageUrl})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
  } else {
    // Default gradient matching actual LoginPage
    if (isDarkMode) {
      backgroundStyle.background = `linear-gradient(to bottom right, ${darkColors.background}, #0f1a24, ${darkColors.background})`;
    } else {
      // For system theme, use the navy gradient; otherwise use light gradient
      if (isSystemTheme) {
        backgroundStyle.background = `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`;
      } else {
        backgroundStyle.background = 'linear-gradient(to bottom right, #f8faf9, #e8f5e9, #c8e6c9)';
      }
    }
  }

  // Get brand color and name from branding or use defaults
  const brandColor = branding?.brandColor || greenColor;
  const brandName = branding?.name || 'HabiTrack';
  const logoUrl = branding?.logoUrl ? getAssetUrl(branding.logoUrl) : null;

  // Show loading state
  if (loading) {
    return (
      <ClickableElement
        element="login-page"
        isSelected={selectedElement === 'login-page'}
        onClick={() => onSelectElement('login-page')}
        className="flex-1"
        style={{
          ...backgroundStyle,
          background: isDarkMode
            ? `linear-gradient(to bottom right, ${darkColors.background}, #0f1a24, ${darkColors.background})`
            : `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </ClickableElement>
    );
  }

  return (
    <ClickableElement
      element="login-page"
      isSelected={selectedElement === 'login-page'}
      onClick={() => onSelectElement('login-page')}
      className="flex-1"
      style={backgroundStyle}
    >
      {/* Subtle pattern overlay for gradient backgrounds */}
      {(!branding?.loginBackground || branding.loginBackground === 'gradient') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.3,
            pointerEvents: 'none',
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main card container */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '320px' }}>
        {/* Card with brand accent */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Brand color accent bar at top */}
          <div
            style={{
              height: '6px',
              background: `linear-gradient(to right, ${navyColor}, ${brandColor})`,
            }}
          />

          <div style={{ padding: '24px' }}>
            {/* Logo and Title */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {/* Logo with glow effect */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: isDarkMode
                    ? `drop-shadow(0 0 15px rgba(79, 214, 147, 0.6)) drop-shadow(0 0 30px rgba(79, 214, 147, 0.35))`
                    : `drop-shadow(0 0 12px rgba(60, 179, 113, 0.45)) drop-shadow(0 0 24px rgba(60, 179, 113, 0.25))`,
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src="/assets/HabiTrack_logo.png"
                    alt="HabiTrack Logo"
                    style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                  />
                )}
              </div>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: titleColor,
                  margin: 0,
                }}
              >
                {brandName}
              </h1>
              <p
                style={{
                  fontSize: '12px',
                  color: subtitleColor,
                  marginTop: '4px',
                }}
              >
                Welcome back! Sign in to continue.
              </p>
            </div>

            {/* Login form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Email input */}
              <ClickableElement
                element="input"
                isSelected={selectedElement === 'input'}
                onClick={() => onSelectElement('input')}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: labelColor,
                      marginBottom: '4px',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${inputBorder}`,
                      backgroundColor: inputBg,
                      color: inputText,
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </ClickableElement>

              {/* Password input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: labelColor,
                    marginBottom: '4px',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${inputBorder}`,
                    backgroundColor: inputBg,
                    color: inputText,
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Sign in button */}
              <ClickableElement
                element="button-primary"
                isSelected={selectedElement === 'button-primary'}
                onClick={() => onSelectElement('button-primary')}
              >
                <button
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: brandColor,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
              </ClickableElement>
            </div>

            {/* Kiosk link section */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${cardBorder}`,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '11px', color: subtitleColor, margin: 0 }}>
                Using the family kiosk?{' '}
                <span style={{ color: brandColor, fontWeight: 500 }}>
                  Switch User with PIN
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '10px',
            color: footerColor,
          }}
        >
          Powered by <span style={{ fontWeight: 600 }}>HabiTrack</span>
        </p>
      </div>
    </ClickableElement>
  );
}
