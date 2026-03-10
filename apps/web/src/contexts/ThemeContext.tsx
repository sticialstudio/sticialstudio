"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  isReady: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'edtech-theme-mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(resolveInitialTheme);

  useEffect(() => {
    applyTheme(theme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    isReady: true,
    setTheme,
    toggleTheme
  }), [setTheme, theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
