import React, { createContext, useContext, type ReactNode } from 'react';
import { useAutoSave, type AutoSaveManagerValue } from './hooks/useAutoSave';
import type { useWebSerial } from '@/hooks/useWebSerial';

const AutoSaveManagerContext = createContext<AutoSaveManagerValue | null>(null);

type WebSerialController = ReturnType<typeof useWebSerial>;

export function AutoSaveManager({ children, webSerial }: { children: ReactNode; webSerial: WebSerialController }) {
  const value = useAutoSave(webSerial);
  return <AutoSaveManagerContext.Provider value={value}>{children}</AutoSaveManagerContext.Provider>;
}

export function useAutoSaveManager() {
  const context = useContext(AutoSaveManagerContext);
  if (!context) {
    throw new Error('useAutoSaveManager must be used within AutoSaveManager');
  }
  return context;
}
