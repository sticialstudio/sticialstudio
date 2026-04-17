import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { API_BASE_URL, apiFetch, safeJson } from '@/lib/api';
import { useEditorOrchestrator } from './EditorOrchestrator';
import { useCircuitOrchestrator } from './CircuitOrchestrator';
import { useSplitViewEventBus } from './SplitViewEventBus';
import { extractCompileFeedback } from '@/lib/simulator/compileFeedback';
import { useSimulationStore } from '@/stores/simulationStore';
import { encodeUtf8AsHex } from './helpers';
import type { useWebSerial } from '@/hooks/useWebSerial';

interface CompileResponse {
  success?: boolean;
  log?: string;
  hex?: string;
  requestId?: string;
  compiledFiles?: number;
}

interface CompileControllerValue {
  isCompiling: boolean;
  supportsDeviceFiles: boolean;
  supportsSimulation: boolean;
  boardSupportNote?: string;
}

const CompileControllerContext = createContext<CompileControllerValue | null>(null);

type WebSerialController = ReturnType<typeof useWebSerial>;

export function useCompileFlow(webSerial: WebSerialController): CompileControllerValue {
  const eventBus = useSplitViewEventBus();
  const {
    boardConfig,
    currentBoard,
    compileStrategy,
    currentGenerator,
    sourceCode,
    isBlockMode,
    syncBlocklySourceCode,
    micropythonProjectDirectories,
    micropythonProjectFiles,
    arduinoProjectFiles,
    arduinoEntryFilePath,
  } = useEditorOrchestrator();
  const { simulationControls, simulationStatus } = useCircuitOrchestrator();
  const setCompileFeedback = useSimulationStore((state) => state.setCompileFeedback);
  const clearCompileFeedback = useSimulationStore((state) => state.clearCompileFeedback);
  const [isCompiling, setIsCompiling] = useState(false);

  const supportsSimulation = compileStrategy === 'arduino-cli' && Boolean(boardConfig?.supportsBrowserSimulation);
  const supportsDeviceFiles = boardConfig?.uploadTransport === 'micropython-raw-repl';
  const boardSupportNote = boardConfig?.supportNote;
  const isSimulationActive = Boolean(simulationStatus && (simulationStatus.isRunning || simulationStatus.isReady));
  const arduinoCompileScopeLabel = arduinoProjectFiles.length > 1 ? `project (${arduinoProjectFiles.length} files)` : 'sketch';

  const reportUnsupportedBoardAction = useCallback(
    (action: string) => {
      const detail = boardSupportNote ? ` ${boardSupportNote}` : '';
      webSerial.addMessage('error', `${action} is not available for ${currentBoard}.${detail}`.trim());
    },
    [boardSupportNote, currentBoard, webSerial],
  );

  const openBlockTerminalTab = useCallback(
    (tab: 'serial' | 'build' | 'connection') => {
      eventBus.emit('layout:block-terminal-request', { tab, open: true });
    },
    [eventBus],
  );

  const buildArduinoCompilePayload = useCallback(
    () => ({
      board: currentBoard,
      sourceCode,
      files: arduinoProjectFiles.length > 0 ? arduinoProjectFiles : undefined,
      entryFilePath: arduinoEntryFilePath ?? undefined,
    }),
    [arduinoEntryFilePath, arduinoProjectFiles, currentBoard, sourceCode],
  );

  const handleVerify = useCallback(async () => {
    openBlockTerminalTab('build');
    clearCompileFeedback();
    if (compileStrategy === 'unsupported') {
      reportUnsupportedBoardAction('Compilation');
      return;
    }

    if (supportsDeviceFiles) {
      webSerial.addMessage('system', 'MicroPython code is validated on device upload. Use Upload.');
      return;
    }

    setIsCompiling(true);
    clearCompileFeedback();
    webSerial.addMessage('system', `Compiling ${arduinoCompileScopeLabel} for ${currentBoard}...`);

    try {
      const res = await apiFetch('/api/compile/arduino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildArduinoCompilePayload()),
      });
      const data = await safeJson<CompileResponse>(res);

      if (res.ok && data?.success) {
        clearCompileFeedback();
        webSerial.addMessage('system', 'Compilation successful.');
        const lines = (data.log || '').split('\n').filter((line) => line.trim().length > 0);
        lines.forEach((line) => webSerial.addMessage('app', line));
      } else {
        const message = res.ok ? 'Compilation failed.' : `Compiler API error (status ${res.status}).`;
        setCompileFeedback(extractCompileFeedback(data?.log || message, message));
        webSerial.addMessage('error', message);
        const lines = (data?.log || '').split('\n').filter((line) => line.trim().length > 0);
        lines.forEach((line) => webSerial.addMessage('error', line));
      }
    } catch (error) {
      const message = `Compiler API offline at ${API_BASE_URL}: ${(error as Error).message}`;
      setCompileFeedback(extractCompileFeedback(message, message));
      webSerial.addMessage('error', message);
    } finally {
      setIsCompiling(false);
    }
  }, [arduinoCompileScopeLabel, buildArduinoCompilePayload, clearCompileFeedback, compileStrategy, currentBoard, openBlockTerminalTab, reportUnsupportedBoardAction, setCompileFeedback, supportsDeviceFiles, webSerial]);

  const syncMicroPythonProjectToDevice = useCallback(async () => {
    if (micropythonProjectFiles.length === 0) {
      throw new Error('No MicroPython files found in this project.');
    }

    if (micropythonProjectDirectories.length > 0) {
      const mkdirScript = `import os\nfor _path in ${JSON.stringify(micropythonProjectDirectories)}:\n try:\n  os.mkdir(_path)\n except OSError:\n  pass\nprint("READY")`;
      await webSerial.runMicroPythonCommand(mkdirScript, 12000);
    }

    for (const file of micropythonProjectFiles) {
      const writeScript = `import binascii\nwith open(${JSON.stringify(file.path)}, "wb") as _target:\n _target.write(binascii.unhexlify(${JSON.stringify(encodeUtf8AsHex(file.content))}))\nprint("OK")`;
      const timeoutMs = Math.max(10000, file.content.length * 8);
      await webSerial.runMicroPythonCommand(writeScript, timeoutMs);
      webSerial.addMessage('system', `Synced ${file.path}`);
    }

    webSerial.addMessage('system', 'Files saved to the MicroPython device.');
    if (sourceCode.trim()) {
      webSerial.addMessage('system', 'Running main.py from the synced project...');
      await webSerial.executeMicroPythonRaw(sourceCode);
    }
  }, [micropythonProjectDirectories, micropythonProjectFiles, sourceCode, webSerial]);

  const handleUploadToBoard = useCallback(async () => {
    openBlockTerminalTab('build');
    clearCompileFeedback();
    if (compileStrategy === 'unsupported' || boardConfig?.uploadTransport === 'unsupported') {
      reportUnsupportedBoardAction('Upload');
      return;
    }

    if (!webSerial.isConnected) {
      webSerial.addMessage('error', 'Device not connected. Click Connect Device first.');
      return;
    }

    if (supportsDeviceFiles) {
      setIsCompiling(true);
      webSerial.addMessage('system', `Syncing ${micropythonProjectFiles.length} MicroPython file(s) to ${currentBoard}...`);
      try {
        await syncMicroPythonProjectToDevice();
      } catch (error) {
        webSerial.addMessage('error', `MicroPython sync failed: ${(error as Error).message}`);
      } finally {
        setIsCompiling(false);
      }
      return;
    }

    setIsCompiling(true);
    clearCompileFeedback();
    webSerial.addMessage('system', `Compiling ${arduinoCompileScopeLabel} for ${currentBoard} before upload...`);

    try {
      const res = await apiFetch('/api/compile/arduino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildArduinoCompilePayload()),
      });
      const data = await safeJson<CompileResponse>(res);

      if (res.ok && data?.success && data?.hex) {
        clearCompileFeedback();
        webSerial.addMessage('system', 'Compilation successful. Starting upload...');
        await webSerial.flashArduino(data.hex);
      } else {
        const message = res.ok ? 'Compilation failed. Upload aborted.' : `Compiler API error (status ${res.status}).`;
        setCompileFeedback(extractCompileFeedback(data?.log || message, message));
        webSerial.addMessage('error', message);
        const lines = (data?.log || '').split('\n').filter((line) => line.trim().length > 0);
        lines.forEach((line) => webSerial.addMessage('error', line));
      }
    } catch (error) {
      const message = `Compiler API offline at ${API_BASE_URL}: ${(error as Error).message}`;
      setCompileFeedback(extractCompileFeedback(message, message));
      webSerial.addMessage('error', message);
    } finally {
      setIsCompiling(false);
    }
  }, [
    arduinoCompileScopeLabel,
    boardConfig?.uploadTransport,
    buildArduinoCompilePayload,
    compileStrategy,
    currentBoard,
    micropythonProjectFiles.length,
    openBlockTerminalTab,
    reportUnsupportedBoardAction,
    supportsDeviceFiles,
    syncMicroPythonProjectToDevice,
    webSerial,
    clearCompileFeedback,
    setCompileFeedback,
  ]);

  const handleConnectDevice = useCallback(() => {
    openBlockTerminalTab('connection');
    if (webSerial.isConnected) {
      webSerial.disconnect();
    } else {
      webSerial.connect(115200);
    }
  }, [openBlockTerminalTab, webSerial]);

  const handleUploadAndSimulate = useCallback(async () => {
    if (!supportsSimulation || !simulationControls) {
      return;
    }

    if (isSimulationActive) {
      simulationControls.stop();
      return;
    }

    let latestSourceCode = sourceCode;
    if (isBlockMode) {
      latestSourceCode = syncBlocklySourceCode();
      if (latestSourceCode !== sourceCode) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    }

    if (!latestSourceCode.trim()) {
      return;
    }

    await simulationControls.start();
  }, [isBlockMode, isSimulationActive, simulationControls, sourceCode, supportsSimulation, syncBlocklySourceCode]);

  useEffect(() => eventBus.on('compile:verify-request', () => { void handleVerify(); }), [eventBus, handleVerify]);
  useEffect(() => eventBus.on('compile:upload-request', () => { void handleUploadToBoard(); }), [eventBus, handleUploadToBoard]);
  useEffect(() => eventBus.on('device:connect-toggle-request', () => { handleConnectDevice(); }), [eventBus, handleConnectDevice]);
  useEffect(() => eventBus.on('simulation:toggle-request', () => { void handleUploadAndSimulate(); }), [eventBus, handleUploadAndSimulate]);

  return useMemo(
    () => ({
      isCompiling,
      supportsDeviceFiles,
      supportsSimulation,
      boardSupportNote,
    }),
    [boardSupportNote, isCompiling, supportsDeviceFiles, supportsSimulation],
  );
}

export function CompileController({ children, webSerial }: { children: ReactNode; webSerial: WebSerialController }) {
  const value = useCompileFlow(webSerial);
  return <CompileControllerContext.Provider value={value}>{children}</CompileControllerContext.Provider>;
}

export function useCompileController() {
  const context = useContext(CompileControllerContext);
  if (!context) {
    throw new Error('useCompileController must be used within CompileController');
  }
  return context;
}

