// apps/web/src/components/themes/hooks/useThemeHistory.ts
// Undo/redo history management for theme editor

import { useState, useCallback, useRef } from 'react';
import type {
  ThemeColors,
  ThemeLayout,
  ThemeTypography,
  ThemeSidebar,
  ThemePageBackground,
  ThemeUI,
  ThemeIcons,
  ThemeableElement,
  ElementStyle,
  LoginPageStyle,
  LcarsMode,
  KioskStyle,
} from '../../../types/theme';

export interface ThemeHistoryState {
  colorsLight: ThemeColors;
  colorsDark: ThemeColors;
  layout: ThemeLayout;
  typography: ThemeTypography;
  sidebar: ThemeSidebar;
  pageBackground: ThemePageBackground;
  ui: ThemeUI;
  icons: ThemeIcons;
  elementStyles: Partial<Record<ThemeableElement, ElementStyle>>;
  loginPage?: LoginPageStyle;
  lcarsMode?: LcarsMode;
  kioskStyle?: KioskStyle;
}

export const MAX_HISTORY_SIZE = 30; // Allow up to 30 undo steps

export function useThemeHistory(initialState: ThemeHistoryState) {
  const [history, setHistory] = useState<ThemeHistoryState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  const currentState = history[historyIndex];

  const pushState = useCallback((newState: ThemeHistoryState) => {
    // Don't push if this is from an undo/redo operation
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add the new state
      newHistory.push(newState);
      // Trim if exceeding max size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev - 1);
      return history[historyIndex - 1];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev + 1);
      return history[historyIndex + 1];
    }
    return null;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    historyLength: history.length,
  };
}
