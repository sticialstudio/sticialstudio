"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type EditorWordWrapMode = "off" | "on";
export type EditorReadabilityMode = "auto" | "always";

export const MIN_EDITOR_FONT_SIZE = 10;
export const DEFAULT_EDITOR_FONT_SIZE = 14;
export const MAX_EDITOR_FONT_SIZE = 32;

interface StudioPreferencesState {
  autoSave: boolean;
  showAdvancedBlocks: boolean;
  editorFontSize: number;
  editorWordWrap: EditorWordWrapMode;
  editorReadabilityMode: EditorReadabilityMode;
}

interface StudioPreferencesContextValue extends StudioPreferencesState {
  isReady: boolean;
  isPreferencesOpen: boolean;
  setAutoSave: (value: boolean) => void;
  setShowAdvancedBlocks: (value: boolean) => void;
  setEditorFontSize: (value: number) => void;
  setEditorWordWrap: (value: EditorWordWrapMode) => void;
  setEditorReadabilityMode: (value: EditorReadabilityMode) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  resetPreferences: () => void;
}

const STORAGE_KEY = "edtech-studio-preferences";
const LEGACY_EDITOR_FONT_SIZE_KEY = "__sticial_editor_font_size";

const DEFAULT_PREFERENCES: StudioPreferencesState = {
  autoSave: false,
  showAdvancedBlocks: false,
  editorFontSize: DEFAULT_EDITOR_FONT_SIZE,
  editorWordWrap: "off",
  editorReadabilityMode: "auto",
};

const StudioPreferencesContext = createContext<StudioPreferencesContextValue | undefined>(undefined);

export function clampEditorFontSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_EDITOR_FONT_SIZE;
  }

  return Math.min(MAX_EDITOR_FONT_SIZE, Math.max(MIN_EDITOR_FONT_SIZE, Math.round(value)));
}

function parseEditorWordWrap(value: unknown): EditorWordWrapMode {
  return value === "on" ? "on" : DEFAULT_PREFERENCES.editorWordWrap;
}

function parseEditorReadabilityMode(value: unknown): EditorReadabilityMode {
  return value === "always" ? "always" : DEFAULT_PREFERENCES.editorReadabilityMode;
}

function readLegacyEditorFontSize(): number {
  if (typeof window === "undefined") {
    return DEFAULT_EDITOR_FONT_SIZE;
  }

  const raw = window.localStorage.getItem(LEGACY_EDITOR_FONT_SIZE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) ? DEFAULT_EDITOR_FONT_SIZE : clampEditorFontSize(parsed);
}

function readStoredPreferences(): StudioPreferencesState {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_PREFERENCES,
        editorFontSize: readLegacyEditorFontSize(),
      };
    }

    const parsed = JSON.parse(raw) as Partial<StudioPreferencesState>;
    return {
      autoSave: typeof parsed.autoSave === "boolean" ? parsed.autoSave : DEFAULT_PREFERENCES.autoSave,
      showAdvancedBlocks:
        typeof parsed.showAdvancedBlocks === "boolean"
          ? parsed.showAdvancedBlocks
          : DEFAULT_PREFERENCES.showAdvancedBlocks,
      editorFontSize:
        typeof parsed.editorFontSize === "number"
          ? clampEditorFontSize(parsed.editorFontSize)
          : readLegacyEditorFontSize(),
      editorWordWrap: parseEditorWordWrap(parsed.editorWordWrap),
      editorReadabilityMode: parseEditorReadabilityMode(parsed.editorReadabilityMode),
    };
  } catch {
    return {
      ...DEFAULT_PREFERENCES,
      editorFontSize: readLegacyEditorFontSize(),
    };
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
    window.localStorage.removeItem(LEGACY_EDITOR_FONT_SIZE_KEY);
  }, [isReady, preferences]);

  const setAutoSave = useCallback((value: boolean) => {
    setPreferences((current) => ({ ...current, autoSave: value }));
  }, []);

  const setShowAdvancedBlocks = useCallback((value: boolean) => {
    setPreferences((current) => ({ ...current, showAdvancedBlocks: value }));
  }, []);

  const setEditorFontSize = useCallback((value: number) => {
    setPreferences((current) => ({ ...current, editorFontSize: clampEditorFontSize(value) }));
  }, []);

  const setEditorWordWrap = useCallback((value: EditorWordWrapMode) => {
    setPreferences((current) => ({ ...current, editorWordWrap: value }));
  }, []);

  const setEditorReadabilityMode = useCallback((value: EditorReadabilityMode) => {
    setPreferences((current) => ({ ...current, editorReadabilityMode: value }));
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
      setEditorFontSize,
      setEditorWordWrap,
      setEditorReadabilityMode,
      openPreferences,
      closePreferences,
      resetPreferences,
    }),
    [
      closePreferences,
      isPreferencesOpen,
      isReady,
      openPreferences,
      preferences,
      resetPreferences,
      setAutoSave,
      setEditorFontSize,
      setEditorReadabilityMode,
      setEditorWordWrap,
      setShowAdvancedBlocks,
    ]
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
