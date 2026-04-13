"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface StudioPreferencesState {
  autoSave: boolean;
  showAdvancedBlocks: boolean;
}

interface StudioPreferencesContextValue extends StudioPreferencesState {
  isReady: boolean;
  isPreferencesOpen: boolean;
  setAutoSave: (value: boolean) => void;
  setShowAdvancedBlocks: (value: boolean) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  resetPreferences: () => void;
}

const STORAGE_KEY = "edtech-studio-preferences";
const DEFAULT_PREFERENCES: StudioPreferencesState = {
  autoSave: false,
  showAdvancedBlocks: true,
};

const StudioPreferencesContext = createContext<StudioPreferencesContextValue | undefined>(undefined);

function readStoredPreferences(): StudioPreferencesState {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<StudioPreferencesState>;
    return {
      autoSave: typeof parsed.autoSave === "boolean" ? parsed.autoSave : DEFAULT_PREFERENCES.autoSave,
      showAdvancedBlocks:
        typeof parsed.showAdvancedBlocks === "boolean"
          ? parsed.showAdvancedBlocks
          : DEFAULT_PREFERENCES.showAdvancedBlocks,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function StudioPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<StudioPreferencesState>(readStoredPreferences);
  const [isReady, setIsReady] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    setPreferences(readStoredPreferences());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [isReady, preferences]);

  const setAutoSave = useCallback((value: boolean) => {
    setPreferences((current) => ({ ...current, autoSave: value }));
  }, []);

  const setShowAdvancedBlocks = useCallback((value: boolean) => {
    setPreferences((current) => ({ ...current, showAdvancedBlocks: value }));
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo<StudioPreferencesContextValue>(
    () => ({
      ...preferences,
      isReady,
      isPreferencesOpen,
      setAutoSave,
      setShowAdvancedBlocks,
      openPreferences,
      closePreferences,
      resetPreferences,
    }),
    [closePreferences, isPreferencesOpen, isReady, openPreferences, preferences, resetPreferences, setAutoSave, setShowAdvancedBlocks]
  );

  return <StudioPreferencesContext.Provider value={value}>{children}</StudioPreferencesContext.Provider>;
}

export function useStudioPreferences() {
  const context = useContext(StudioPreferencesContext);

  if (!context) {
    throw new Error("useStudioPreferences must be used within a StudioPreferencesProvider");
  }

  return context;
}
