// apps/web/src/components/themes/editors/LoginBrandingTypes.ts
// Shared types, constants, and helpers for the Login Page Editor sub-components.
// These are extracted from LoginPageEditor.tsx to avoid circular dependencies
// and allow each sub-editor to import only what it needs.

// Branding data from household settings
export interface BrandingData {
  name: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  loginBackground: 'gradient' | 'solid' | 'image' | null;
  loginBackgroundValue: string | null;
}

// HabiTrack default colors
export const HABITRACK_GREEN = '#3cb371';
export const HABITRACK_NAVY = '#3d4f5f';

// Default HabiTrack branding (used for reset)
export const HABITRACK_DEFAULT_BRANDING: BrandingData = {
  name: null, // Will show "HabiTrack" when null
  brandColor: HABITRACK_GREEN,
  logoUrl: null, // Will use default HabiTrack logo
  loginBackground: 'gradient',
  loginBackgroundValue: `${HABITRACK_NAVY},#1a2530`, // Navy gradient
};

// Gradient presets for the background editor
export const GRADIENT_PRESETS = [
  { name: 'Navy', from: '#3d4f5f', to: '#1a2530' },
  { name: 'Forest', from: '#1a472a', to: '#0d2818' },
  { name: 'Ocean', from: '#1e3a5f', to: '#0c1929' },
  { name: 'Sunset', from: '#c94b4b', to: '#4b134f' },
  { name: 'Purple', from: '#4c1d95', to: '#1e1b4b' },
  { name: 'Emerald', from: '#065f46', to: '#022c22' },
];

// Helper to get full URL for uploaded assets
export const getAssetUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${apiBase}${path}`;
  }
  return path;
};
