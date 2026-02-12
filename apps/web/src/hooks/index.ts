// apps/web/src/hooks/index.ts
// Central export for all hooks

export * from './useDebounce';
export * from './useLocalStorage';
export * from './useClickOutside';
export * from './useKioskIdleTimeout';

// Re-export context hooks for convenience
export { useAuth } from '../context/AuthContext';
export { useTheme } from '../context/ThemeContext';
