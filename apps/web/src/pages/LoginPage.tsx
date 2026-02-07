// apps/web/src/pages/LoginPage.tsx

import { useState, useEffect, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


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
  const { login } = useAuth();
  const navigate = useNavigate();

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative ${
        useDefaultGradient ? 'bg-gradient-to-b from-slate-950 via-purple-800 to-rose-400' : ''
      }`}
      style={backgroundStyle}
    >
      {/* Stars overlay - only show on gradient */}
      {useDefaultGradient && <div className="absolute inset-0 bg-stars pointer-events-none"></div>}

      {/* Dark overlay for image backgrounds */}
      {branding?.loginBackground === 'image' && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      )}

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            {branding?.logoUrl ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${branding.logoUrl}`}
                alt="Logo"
                className="w-16 h-16 mx-auto mb-4 rounded-xl object-cover"
              />
            ) : (
              <div className="text-4xl mb-2">🏠</div>
            )}
            <h1
              className="text-2xl font-bold"
              style={{ color: branding?.brandColor || '#8b5cf6' }}
            >
              {branding?.name || 'HabiTrack'}
            </h1>
            <p className="text-gray-500 mt-1">Welcome back! Sign in to continue.</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: branding?.brandColor || '#8b5cf6' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Kiosk link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Using the family kiosk?{' '}
              <button
                className="font-medium hover:underline"
                style={{ color: branding?.brandColor || '#8b5cf6' }}
              >
                Switch User with PIN
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}