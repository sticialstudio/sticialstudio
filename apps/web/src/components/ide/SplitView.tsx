"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Workspace, WorkspaceSvg } from "blockly";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CircuitBoard, Code2, PlayCircle, Save } from "lucide-react";
import TopToolbar, { StudioView } from "./TopToolbar";
import CircuitLabTopBar from "./circuit-lab/TopBar";
import CanvasWorkspace from "./circuit-lab/CanvasWorkspace";
import CodingEnvironmentTopBar from "./coding-environment/TopBar";
import CodingEnvironmentSummary from "./coding-environment/CircuitSummary";
import type { SimulationCanvasControls, SimulationCanvasStatus } from "./SimulationCanvas";
import BlocklyWorkspace from "./BlocklyWorkspace";
import TerminalPanel from "./TerminalPanel";
import FileExplorer from "./FileExplorer";
import WorkspaceGuidance from "./WorkspaceGuidance";
import IdeShellFrame from "./IdeShellFrame";
import IdeActivityBar from "./IdeActivityBar";
import IdeStatusBar from "./IdeStatusBar";
import IdeLeftRail, { IdeLeftRailView } from "./IdeLeftRail";
import IdeRightContextPanel, { IdeRightContextView } from "./IdeRightContextPanel";
import IdeBottomDock from "./IdeBottomDock";
import DeviceFiles from "./DeviceFiles";
import BoardStatusPanel from "./BoardStatusPanel";
import VirtualProjectRail from "./VirtualProjectRail";
import { useWebSerial } from "../../hooks/useWebSerial";
import { useBoard } from "@/contexts/BoardContext";
import { useCircuit } from "@/contexts/CircuitContext";
import { useProject, type FileItem } from "@/contexts/ProjectContext";
import { useStudioPreferences } from "@/contexts/StudioPreferencesContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch, API_BASE_URL, safeJson } from "@/lib/api";
import { BOARD_CONFIG } from "@/lib/boards/boardConfig";

import { useCircuitStore } from "@/stores/circuitStore";
import { serializeCircuit, deserializeCircuit, CIRCUIT_FILE_NAME } from "@/lib/circuit/circuitSerializer";
import { DEFAULT_ARDUINO_CODE, DEFAULT_MICROPYTHON_CODE } from "@/templates/codeTemplates";
import { buildSourceCodeFromBlocklyWorkspace } from "@/lib/blockly/codegen";
import AiChatPanel from "./AiChatPanel";
import LibraryHub from "./LibraryHub";
import PreferencesDialog from "./PreferencesDialog";

const TextEditor = dynamic(() => import("./TextEditor"), { ssr: false });
const SimulationCanvas = dynamic(() => import("./SimulationCanvas"), { ssr: false, loading: () => null });

const DEFAULT_BLOCKLY_XML = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

interface CompileResponse {
  success?: boolean;
  log?: string;
  hex?: string;
}

function getPreferredSourceFileName(language: string | null, generator: string | null) {
  if (language === "python" || generator === "micropython") {
    return "main.py";
  }
  return "main.cpp";
}

function isLikelyBlocklyXml(content: string | null | undefined) {
  if (typeof content !== "string") return false;

  const trimmed = content.trim();
  if (!trimmed) return true;

  const withoutDeclaration = trimmed.replace(/^<\?xml[\s\S]*?\?>\s*/i, "");
  return /^<xml(\s|>)/i.test(withoutDeclaration);
}

function buildProjectFilePath(file: FileItem, filesById: Map<string, FileItem>) {
  const segments = [file.name];
  let parentId = file.parentId;

  while (parentId) {
    const parent = filesById.get(parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    parentId = parent.parentId;
  }

  return segments.join('/');
}

function encodeUtf8AsHex(content: string) {
  return Array.from(new TextEncoder().encode(content))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
function getInitialStudioView(environment: string): StudioView {
  return environment === "virtual" ? "circuit" : "code";
}

export default function SplitView() {
  const router = useRouter();
  const webSerial = useWebSerial();
  const { theme, setTheme } = useTheme();
  const {
    autoSave,
    showAdvancedBlocks,
    isPreferencesOpen,
    openPreferences,
    closePreferences,
    setAutoSave,
    setShowAdvancedBlocks,
    resetPreferences,
  } = useStudioPreferences();
  const { clearCircuit, resetSimulationState } = useCircuit();

  const [terminalHeight, setTerminalHeight] = useState(220);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState<string | null>(null);
  const [saveStatusTone, setSaveStatusTone] = useState<"neutral" | "success" | "error">("neutral");
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leftRailView, setLeftRailView] = useState("files");
  const [rightPanelView, setRightPanelView] = useState("status");
  const [selectedBlocklyCategory, setSelectedBlocklyCategory] = useState("Input/Output");
  const [simulationControls, setSimulationControls] = useState<SimulationCanvasControls | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationCanvasStatus | null>(null);
  const blocklyWorkspaceRef = useRef<WorkspaceSvg | null>(null);
  const hasVisitedCodingEnvRef = useRef(false);

  const {
    currentBoard,
    codingMode,
    language: currentLanguage,
    generator: currentGenerator,
    compileStrategy,
    environment: rawEnvironment,
    setCodingMode,
    setLanguage,
    setGenerator,
    setCurrentBoard,
    setEnvironment,
  } = useBoard();

  const environment = rawEnvironment ?? "virtual";
  const boardConfig = BOARD_CONFIG[currentBoard];
  const supportsSimulation = compileStrategy === "arduino-cli" && Boolean(boardConfig?.supportsBrowserSimulation);
  const supportsDeviceFiles = boardConfig?.uploadTransport === "micropython-raw-repl";
  const boardSupportNote = boardConfig?.supportNote;
  const isBlockMode = codingMode === "block";
  const [activeView, setActiveView] = useState<StudioView>(() => getInitialStudioView(environment));

  const syncBoardRuntimeSelection = useCallback(() => {
    if (!boardConfig) {
      return;
    }

    if (currentLanguage !== boardConfig.language) {
      setLanguage(boardConfig.language);
    }

    if (currentGenerator !== boardConfig.generator) {
      setGenerator(boardConfig.generator);
    }
  }, [boardConfig, currentGenerator, currentLanguage, setGenerator, setLanguage]);

  const handleSetActiveView = useCallback((view: StudioView) => {
    if (view === activeView) return;
    if (view === "code") {
      syncBoardRuntimeSelection();
    }
    if (!document.startViewTransition) {
      setActiveView(view);
      return;
    }
    // Smooth transition using the native View Transitions API
    document.startViewTransition(() => {
      // Must use flushSync or just setting state is enough for React 18 in modern browsers,
      // but wrapping it ensures the DOM updates happen inside the transition measurement.
      setActiveView(view);
    });
  }, [activeView, syncBoardRuntimeSelection]);

  useEffect(() => {
    setActiveView(getInitialStudioView(environment));
  }, [environment]);

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Mark that the user has visited the coding environment at least once
  // so we only boot the AVR simulation worker when actually needed.
  useEffect(() => {
    if (activeView === 'code') {
      hasVisitedCodingEnvRef.current = true;
    }
  }, [activeView]);

  const leftPanelWidth = 272;
  const rightPanelWidth = 360;
  const virtualComponentCount = useCircuitStore((state) => state.components.length);
  const virtualNetCount = useCircuitStore((state) => state.nets.length);
  const virtualMappedPinCount = useCircuitStore((state) => state.codingSnapshot.usedSignalPins.length);

  const {
    files,
    projectId,
    projectName,
    setProjectName,
    updateFileContent,
    createFile,
    saveProject,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    activeFileId,
    setActiveFileId,
    setProjectId,
    bootstrapOfflineFiles,
  } = useProject();

  const preferredSourceFileName = useMemo(
    () => getPreferredSourceFileName(currentLanguage, currentGenerator),
    [currentLanguage, currentGenerator]
  );

  const blocklyFile = useMemo(
    () =>
      files.find((file) => file.name === "main.blockly") ||
      files.find((file) => file.type === "blockly") ||
      null,
    [files]
  );

  const entrySourceFile = useMemo(() => {
    const byPreferredName = files.find((file) => file.name === preferredSourceFileName);
    if (byPreferredName) return byPreferredName;

    const byExpectedType = files.find((file) =>
      preferredSourceFileName === "main.py" ? file.type === "python" : file.type === "cpp"
    );
    if (byExpectedType) return byExpectedType;

    return (
      files.find((file) => file.type !== "folder" && file.id !== blocklyFile?.id) ||
      files.find((file) => file.type !== "folder") ||
      null
    );
  }, [files, preferredSourceFileName, blocklyFile?.id]);

  const activeTextFile = useMemo(() => {
    const byActiveId = files.find(
      (file) => file.id === activeFileId && file.type !== "folder" && file.id !== blocklyFile?.id
    );
    if (byActiveId) return byActiveId;

    return entrySourceFile;
  }, [activeFileId, blocklyFile?.id, entrySourceFile, files]);

  const activeEditorFile = isBlockMode ? entrySourceFile : activeTextFile;
  const activeEditorCode = activeEditorFile ? activeEditorFile.content : "";
  const activeEditorLanguage = activeEditorFile
    ? activeEditorFile.type === "python" || activeEditorFile.name.endsWith(".py")
      ? "python"
      : "cpp"
    : currentLanguage || "cpp";
  const activeEditorFileName = activeEditorFile?.name || preferredSourceFileName;
  const sourceCode = entrySourceFile ? entrySourceFile.content : "";
  const rawBlocklyContent = blocklyFile?.content || "";
  const blocklyXmlIsValid = isLikelyBlocklyXml(rawBlocklyContent);
  const blocklyXml =
    blocklyXmlIsValid && rawBlocklyContent.trim().length > 0 ? rawBlocklyContent : DEFAULT_BLOCKLY_XML;
  const hasRunnableSimulationCode = isBlockMode
    ? blocklyXml.trim().length > 0 || sourceCode.trim().length > 0
    : sourceCode.trim().length > 0;
  const isBlocklyWorkspaceEmpty = blocklyXml.trim() === DEFAULT_BLOCKLY_XML && sourceCode.trim().length === 0;
  const showCircuitEmptyGuidance = environment === "virtual" && activeView === "circuit" && virtualComponentCount === 0;
  const showCodeEmptyGuidance = sourceCode.trim().length === 0 && (!isBlockMode || isBlocklyWorkspaceEmpty);
  const shouldShowCodeGuidance = !isBlockMode && (
    (environment === "virtual" ? virtualComponentCount === 0 : showCodeEmptyGuidance)
  );
  const visibleSaveStatusText = saveStatusText ?? (hasUnsavedChanges ? "Unsaved changes" : null);
  const visibleSaveStatusTone = saveStatusText ? saveStatusTone : "neutral";
  const defaultBoard = useMemo(
    () => (("Arduino Uno" in BOARD_CONFIG ? "Arduino Uno" : Object.keys(BOARD_CONFIG)[0]) as keyof typeof BOARD_CONFIG),
    []
  );


  const projectFilesById = useMemo(() => new Map(files.map((file) => [file.id, file])), [files]);
  const micropythonProjectFiles = useMemo(
    () =>
      files
        .filter(
          (file) =>
            file.type !== "folder" &&
            file.id !== blocklyFile?.id &&
            (file.type === "python" || file.name.toLowerCase().endsWith(".py"))
        )
        .map((file) => ({
          path: buildProjectFilePath(file, projectFilesById),
          content: file.content,
        })),
    [blocklyFile?.id, files, projectFilesById]
  );
  const micropythonProjectDirectories = useMemo(() => {
    const directories = new Set<string>();

    micropythonProjectFiles.forEach((file) => {
      const segments = file.path.split('/');
      segments.pop();

      let currentPath = '';
      segments.forEach((segment) => {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        directories.add(currentPath);
      });
    });

    return Array.from(directories).sort((left, right) => left.split('/').length - right.split('/').length);
  }, [micropythonProjectFiles]);
  useEffect(() => {
    const nextActiveFileId = isBlockMode ? entrySourceFile?.id : activeTextFile?.id;
    if (nextActiveFileId && nextActiveFileId !== activeFileId) {
      setActiveFileId(nextActiveFileId);
    }
  }, [activeFileId, activeTextFile?.id, entrySourceFile?.id, isBlockMode, setActiveFileId]);

  const seededFiles = React.useRef<Set<string>>(new Set());

  // Seed empty code files with default language templates upon first open
  useEffect(() => {
    if (isBlockMode) {
      return;
    }

    if (entrySourceFile && entrySourceFile.content.trim() === "" && !seededFiles.current.has(entrySourceFile.id)) {
      seededFiles.current.add(entrySourceFile.id);
      const defaultPython = "import time\n\n# --- Setup Section ---\npass\n\n# --- Loop Section ---\nwhile True:\n    pass\n";
      const defaultCpp = "void setup() {\n  // put your setup code here, to run once:\n\n}\n\nvoid loop() {\n  // put your main code here, to run repeatedly:\n\n}\n";
      
      const isPython = currentLanguage === "python" || entrySourceFile.name.endsWith(".py");
      updateFileContent(entrySourceFile.id, isPython ? defaultPython : defaultCpp);
    }
  }, [isBlockMode, entrySourceFile, currentLanguage, updateFileContent]);

  const bootstrappedRef = React.useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current || files.length > 0) return;
    bootstrappedRef.current = true;
    // Use proper default boilerplate so the editor opens like Arduino IDE, not blank.
    const defaultCode =
      isBlockMode
        ? ""
        : currentLanguage === "python" || currentGenerator === "micropython"
          ? DEFAULT_MICROPYTHON_CODE
          : DEFAULT_ARDUINO_CODE;
    bootstrapOfflineFiles(preferredSourceFileName, currentLanguage || "cpp", defaultCode);
  }, [files.length, preferredSourceFileName, currentLanguage, currentGenerator, isBlockMode, bootstrapOfflineFiles]);

  useEffect(() => {
    if (!blocklyFile?.id || blocklyXmlIsValid) return;

    const legacyContent = blocklyFile.content || "";

    if (entrySourceFile?.id && entrySourceFile.id !== blocklyFile.id && entrySourceFile.content !== legacyContent) {
      updateFileContent(entrySourceFile.id, legacyContent);
    }

    updateFileContent(blocklyFile.id, DEFAULT_BLOCKLY_XML);
  }, [
    blocklyFile?.id,
    blocklyFile?.content,
    blocklyXmlIsValid,
    entrySourceFile?.id,
    entrySourceFile?.content,
    updateFileContent,
  ]);

  // --- Circuit Lab Persistence ---
  const loadedCircuitProjectRef = useRef<string | null>(null);

  // Keep a ref to project context methods so the store subscriber can access
  // them without causing the useEffect to tear down on every render.
  const projectRef = useRef({ files, updateFileContent, createFile });
  useEffect(() => {
    projectRef.current = { files, updateFileContent, createFile };
  }, [files, updateFileContent, createFile]);

  // 1. Restore circuit on load
  useEffect(() => {
    if (!projectId || files.length === 0 || loadedCircuitProjectRef.current === projectId) {
      return;
    }

    const circuitFile = files.find((f) => f.name === CIRCUIT_FILE_NAME);
    if (circuitFile?.content) {
      const restored = deserializeCircuit(circuitFile.content);
      useCircuitStore.getState().setCircuitData(restored, true);
    } else {
      useCircuitStore.getState().clearCircuit();
    }

    loadedCircuitProjectRef.current = projectId;
  }, [projectId, files]);

  // 2. Auto-save circuit on change (debounced)
  useEffect(() => {
    if (!projectId || loadedCircuitProjectRef.current !== projectId) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useCircuitStore.subscribe((state, prevState) => {
      // Only trigger save if components or nets arrays changed reference
      if (state.components === prevState.components && state.nets === prevState.nets) {
        return;
      }

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const { files: currentFiles, updateFileContent: updateFn, createFile: createProjectFile } = projectRef.current;
        const circuitFile = currentFiles.find((f) => f.name === CIRCUIT_FILE_NAME);
        const json = serializeCircuit({ components: state.components, nets: state.nets });

        if (circuitFile) {
          if (circuitFile.content !== json) {
            updateFn(circuitFile.id, json);
          }
        } else {
          void createProjectFile(CIRCUIT_FILE_NAME, "json", null, json);
        }
      }, 1000); // 1s debounce
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId]);

  useEffect(() => {
    const updateViewportMode = () => {
      const compact = window.innerWidth < 1280;
      setIsCompact(compact);

      if (compact) {
        setLeftCollapsed(true);
        setRightCollapsed(true);
        if (window.innerHeight < 820) {
          setBottomCollapsed(true);
        }
      }
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  const handleEntrySourceCodeChange = useCallback(
    (newCode: string) => {
      if (entrySourceFile?.id) {
        updateFileContent(entrySourceFile.id, newCode);
      }
    },
    [entrySourceFile?.id, updateFileContent]
  );

  const handleActiveTextCodeChange = useCallback(
    (newCode: string) => {
      if (activeTextFile?.id) {
        updateFileContent(activeTextFile.id, newCode);
      }
    },
    [activeTextFile?.id, updateFileContent]
  );

  const handleBlocklyXmlChange = useCallback(
    (xml: string) => {
      if (blocklyFile?.id) {
        updateFileContent(blocklyFile.id, xml);
      }
    },
    [blocklyFile?.id, updateFileContent]
  );

  const handleBlocklyWorkspaceReady = useCallback((workspace: WorkspaceSvg | null) => {
    blocklyWorkspaceRef.current = workspace;
  }, []);

  const syncBlocklySourceCode = useCallback(() => {
    if (!isBlockMode || !blocklyWorkspaceRef.current) {
      return sourceCode;
    }

    const nextCode = buildSourceCodeFromBlocklyWorkspace(blocklyWorkspaceRef.current, currentGenerator || "arduino").code;
    if (entrySourceFile?.id && nextCode !== sourceCode) {
      updateFileContent(entrySourceFile.id, nextCode);
    }

    return nextCode;
  }, [currentGenerator, isBlockMode, sourceCode, entrySourceFile?.id, updateFileContent]);

  const handleChangeCodingMode = useCallback(
    (nextMode: Exclude<typeof codingMode, null>) => {
      if (codingMode === nextMode) {
        syncBoardRuntimeSelection();
        return;
      }

      if (codingMode === "block" && nextMode === "text") {
        syncBlocklySourceCode();
      }

      syncBoardRuntimeSelection();
      setCodingMode(nextMode);
    },
    [codingMode, setCodingMode, syncBlocklySourceCode, syncBoardRuntimeSelection]
  );

  const reportUnsupportedBoardAction = useCallback(
    (action: string) => {
      const detail = boardSupportNote ? ` ${boardSupportNote}` : "";
      webSerial.addMessage("error", `${action} is not available for ${currentBoard}.${detail}`.trim());
    },
    [boardSupportNote, currentBoard, webSerial]
  );

  const performProjectSave = useCallback(
    async (origin: "manual" | "auto" = "manual") => {
      if (!projectId) {
        if (origin === "manual") {
          webSerial.addMessage("error", "No active project selected.");
          setSaveStatusText("Open or create a project first");
          setSaveStatusTone("error");
        }
        return false;
      }

      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = null;
      }

      setIsSaving(true);
      try {
        await saveProject();
        const statusText = origin === "auto" ? "Auto-saved" : "Project saved";
        if (origin === "manual") {
          webSerial.addMessage("system", "Project saved.");
        }
        setSaveStatusText(statusText);
        setSaveStatusTone("success");
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatusText(null);
        }, origin === "auto" ? 2200 : 3200);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save the project right now.";
        webSerial.addMessage("error", `${origin === "auto" ? "Auto-save failed" : "Failed to save project"}: ${message}`);
        setSaveStatusText(message);
        setSaveStatusTone("error");
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatusText(null);
        }, 4200);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, saveProject, webSerial]
  );

  const handleSaveProject = useCallback(async () => {
    await performProjectSave("manual");
  }, [performProjectSave]);

  useEffect(() => {
    if (!autoSave || !projectId || !hasUnsavedChanges || isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      return;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      void performProjectSave("auto");
    }, 1200);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [autoSave, hasUnsavedChanges, isSaving, performProjectSave, projectId]);

  const handleResetApp = useCallback(() => {
    const fallbackBoard = defaultBoard;
    const fallbackConfig = BOARD_CONFIG[fallbackBoard];

    resetPreferences();
    setTheme("light");
    setCurrentBoard(fallbackBoard);
    setCodingMode("block");
    setLanguage(fallbackConfig.language ?? null);
    setGenerator(fallbackConfig.generator ?? null);
    setEnvironment("virtual");
    setProjectId(null);
    setHasUnsavedChanges(false);
    setActiveView(getInitialStudioView("virtual"));
    clearCircuit();
    resetSimulationState();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("activeProjectId");
      window.localStorage.removeItem("edtech-theme-mode");
      window.localStorage.removeItem("edtech-board-context");
      window.localStorage.removeItem("edtech-studio-preferences");
      window.sessionStorage.removeItem("workspaceNotice");
    }

    closePreferences();
    webSerial.addMessage("system", "IDE state reset.");
    setSaveStatusText("App reset");
    setSaveStatusTone("success");
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }
    saveStatusTimeoutRef.current = setTimeout(() => {
      setSaveStatusText(null);
    }, 3200);
  }, [
    clearCircuit,
    closePreferences,
    defaultBoard,
    resetPreferences,
    resetSimulationState,
    setCodingMode,
    setCurrentBoard,
    setEnvironment,
    setGenerator,
    setHasUnsavedChanges,
    setLanguage,
    setProjectId,
    setTheme,
    webSerial,
  ]);

  const preferencesDialog = (
    <PreferencesDialog
      open={isPreferencesOpen}
      theme={theme}
      autoSave={autoSave}
      showAdvancedBlocks={showAdvancedBlocks}
      onClose={closePreferences}
      onThemeChange={setTheme}
      onAutoSaveChange={setAutoSave}
      onShowAdvancedBlocksChange={setShowAdvancedBlocks}
      onResetApp={handleResetApp}
    />
  );

  const handleVerify = useCallback(async () => {
    if (compileStrategy === "unsupported") {
      reportUnsupportedBoardAction("Compilation");
      return;
    }

    if (supportsDeviceFiles) {
      webSerial.addMessage("system", "MicroPython code is validated on device upload. Use Upload.");
      return;
    }

    setIsCompiling(true);
    webSerial.addMessage("system", `Compiling sketch for ${currentBoard}...`);

    try {
      const res = await apiFetch("/api/compile/arduino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode, board: currentBoard }),
      });
      const data = await safeJson<CompileResponse>(res);

      if (res.ok && data?.success) {
        webSerial.addMessage("system", "Compilation successful.");
        const lines = (data?.log || "").split("\n").filter((line: string) => line.trim().length > 0);
        lines.forEach((line: string) => webSerial.addMessage("app", line));
      } else {
        const message = res.ok ? "Compilation failed." : `Compiler API error (status ${res.status}).`;
        webSerial.addMessage("error", message);
        const lines = (data?.log || "").split("\n").filter((line: string) => line.trim().length > 0);
        lines.forEach((line: string) => webSerial.addMessage("error", line));
      }
    } catch (error) {
      webSerial.addMessage("error", `Compiler API offline at ${API_BASE_URL}: ${(error as Error).message}`);
    } finally {
      setIsCompiling(false);
    }
  }, [compileStrategy, currentBoard, reportUnsupportedBoardAction, sourceCode, supportsDeviceFiles, webSerial]);

  const syncMicroPythonProjectToDevice = useCallback(async () => {
    if (micropythonProjectFiles.length === 0) {
      throw new Error("No MicroPython files found in this project.");
    }

    if (micropythonProjectDirectories.length > 0) {
      const mkdirScript = `import os
for _path in ${JSON.stringify(micropythonProjectDirectories)}:
 try:
  os.mkdir(_path)
 except OSError:
  pass
print("READY")`;
      await webSerial.runMicroPythonCommand(mkdirScript, 12000);
    }

    for (const file of micropythonProjectFiles) {
      const writeScript = `import binascii
with open(${JSON.stringify(file.path)}, "wb") as _target:
 _target.write(binascii.unhexlify(${JSON.stringify(encodeUtf8AsHex(file.content))}))
print("OK")`;
      const timeoutMs = Math.max(10000, file.content.length * 8);
      await webSerial.runMicroPythonCommand(writeScript, timeoutMs);
      webSerial.addMessage("system", `Synced ${file.path}`);
    }

    webSerial.addMessage("system", "Files saved to the MicroPython device.");
    if (sourceCode.trim()) {
      webSerial.addMessage("system", "Running main.py from the synced project...");
      await webSerial.executeMicroPythonRaw(sourceCode);
    }
  }, [micropythonProjectDirectories, micropythonProjectFiles, sourceCode, webSerial]);
  const handleUploadToBoard = useCallback(async () => {
    if (compileStrategy === "unsupported" || boardConfig?.uploadTransport === "unsupported") {
      reportUnsupportedBoardAction("Upload");
      return;
    }

    if (!webSerial.isConnected) {
      webSerial.addMessage("error", "Device not connected. Click Connect Device first.");
      return;
    }

    if (supportsDeviceFiles) {
      setIsCompiling(true);
      webSerial.addMessage("system", `Syncing ${micropythonProjectFiles.length} MicroPython file(s) to ${currentBoard}...`);

      try {
        await syncMicroPythonProjectToDevice();
      } catch (error) {
        webSerial.addMessage("error", `MicroPython sync failed: ${(error as Error).message}`);
      } finally {
        setIsCompiling(false);
      }
      return;
    }

    setIsCompiling(true);
    webSerial.addMessage("system", `Compiling sketch for ${currentBoard} before upload...`);

    try {
      const res = await apiFetch("/api/compile/arduino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode, board: currentBoard }),
      });
      const data = await safeJson<CompileResponse>(res);

      if (res.ok && data?.success && data?.hex) {
        webSerial.addMessage("system", "Compilation successful. Starting upload...");
        await webSerial.flashArduino(data.hex);
      } else {
        const message = res.ok ? "Compilation failed. Upload aborted." : `Compiler API error (status ${res.status}).`;
        webSerial.addMessage("error", message);
        const lines = (data?.log || "").split("\n").filter((line: string) => line.trim().length > 0);
        lines.forEach((line: string) => webSerial.addMessage("error", line));
      }
    } catch (error) {
      webSerial.addMessage("error", `Compiler API offline at ${API_BASE_URL}: ${(error as Error).message}`);
    } finally {
      setIsCompiling(false);
    }
  }, [boardConfig?.uploadTransport, compileStrategy, currentBoard, micropythonProjectFiles.length, reportUnsupportedBoardAction, supportsDeviceFiles, syncMicroPythonProjectToDevice, webSerial]);

  const handleConnectDevice = useCallback(() => {
    if (webSerial.isConnected) {
      webSerial.disconnect();
    } else {
      webSerial.connect(115200);
    }
  }, [webSerial]);

  const isSimulationActive = Boolean(simulationStatus && (simulationStatus.isRunning || simulationStatus.isReady));

  const handleUploadAndSimulate = useCallback(async () => {
    if (!supportsSimulation || !simulationControls || activeView !== "code") {
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
  }, [activeView, isBlockMode, isSimulationActive, simulationControls, sourceCode, supportsSimulation, syncBlocklySourceCode]);

  const handleTerminalResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = terminalHeight;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      setTerminalHeight(Math.max(160, Math.min(420, startHeight + delta)));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const defaultRightView = useMemo(() => {
    if (supportsDeviceFiles) return "device";
    return "ai-chat";
  }, [supportsDeviceFiles]);

  useEffect(() => {
    if (!isBlockMode) {
      setRightPanelView(defaultRightView);
      if (!isCompact) {
        setBottomCollapsed(environment === "virtual");
      }
    }
  }, [defaultRightView, environment, isBlockMode, isCompact]);

  const leftViews = useMemo<IdeLeftRailView[]>(
    () => [
      { id: "files", label: "Files", content: <FileExplorer /> },
      { id: "libraries", label: "Libraries", content: <LibraryHub /> },
    ],
    []
  );

  const leftSubtitle = "Keep project files close while the editor stays in focus.";

  const textCenterStage = (
    <div className="ui-foundation-panel relative flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-[30px]">
      <TextEditor
        code={activeEditorCode}
        language={activeEditorLanguage}
        fileName={activeEditorFileName}
        runtimeLabel={boardConfig?.runtimeLabel || (currentLanguage === "python" ? "MicroPython" : "Arduino C++")}
        onChange={handleActiveTextCodeChange}
      />
    </div>
  );

  const leftStage = (
    <IdeLeftRail
      title="Project Rail"
      subtitle={leftSubtitle}
      views={leftViews}
      activeView={leftRailView}
      onChangeView={setLeftRailView}
    />
  );

  const bottomStage = (
    <IdeBottomDock
      collapsed={bottomCollapsed}
      height={terminalHeight}
      isCompact={isCompact}
      onResizeStart={handleTerminalResize}
    >
      <TerminalPanel webSerial={webSerial} collapsed={bottomCollapsed} />
    </IdeBottomDock>
  );

  const blockWorkspaceStage = (
    <div className="min-h-0 min-w-0 flex-1">
      <BlocklyWorkspace
        generatorType={currentGenerator || "arduino"}
        initialXml={blocklyXml}
        onCodeChange={handleEntrySourceCodeChange}
        onXmlChange={handleBlocklyXmlChange}
        onWorkspaceReady={handleBlocklyWorkspaceReady}
        selectedCategoryName={selectedBlocklyCategory}
        onSelectCategory={setSelectedBlocklyCategory}
        sourceCode={sourceCode}
      />
    </div>
  );

  const virtualCodingStage = isBlockMode ? (
    <div className="mt-4 flex min-h-0 flex-1">{blockWorkspaceStage}</div>
  ) : (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      {renderCodeGuidanceCard()}
      <div className="min-h-0 flex-1">
        <div className="h-full min-h-0 min-w-0">{textCenterStage}</div>
      </div>
    </div>
  );
  const virtualProjectRail = (
    <VirtualProjectRail
      activeView={activeView === "circuit" ? "circuit" : "code"}
      codingMode={codingMode}
      componentCount={virtualComponentCount}
      netCount={virtualNetCount}
      mappedPinCount={virtualMappedPinCount}
      hasCode={hasRunnableSimulationCode}
      supportsSimulation={supportsSimulation && Boolean(simulationControls)}
      isSimulationActive={isSimulationActive}
      isSimulationBusy={Boolean(simulationStatus?.isCompiling)}
      onOpenCode={() => handleSetActiveView("code")}
      onBackToCircuit={() => handleSetActiveView("circuit")}
    />
  );

  const hiddenCircuitSimulation = supportsSimulation ? (
    <div className="hidden" aria-hidden="true">
      {/* Only mount once the user has visited Coding Environment GÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶ avoids booting
          the AVR worker while the user is still on Circuit Lab. */}
      {hasVisitedCodingEnvRef.current || activeView === 'code' ? (
        <SimulationCanvas
          sourceCode={sourceCode}
          boardName={currentBoard}
          showHeader={false}
          showInternalControls={false}
          onRegisterControls={setSimulationControls}
          onStatusChange={setSimulationStatus}
          showBoard={false}
        />
      ) : null}
    </div>
  ) : null;

  const rightViews = useMemo<IdeRightContextView[]>(() => {
    const views: IdeRightContextView[] = [
      {
        id: "ai-chat",
        label: "AI Chat",
        tone: "violet",
        content: <AiChatPanel />,
      },
      {
        id: "status",
        label: "Status",
        tone: "slate",
        content: (
          <BoardStatusPanel
            boardName={currentBoard}
            codingMode={codingMode}
            environment={environment}
            isConnected={webSerial.isConnected}
          />
        ),
      },
    ];

    if (supportsDeviceFiles) {
      views.unshift({
        id: "device",
        label: "Device",
        tone: "cyan",
        content: <DeviceFiles webSerial={webSerial} />,
      });
    }

    return views;
  }, [codingMode, currentBoard, environment, supportsDeviceFiles, webSerial]);

  useEffect(() => {
    if (!rightViews.some((view) => view.id === rightPanelView)) {
      setRightPanelView(defaultRightView);
    }
  }, [defaultRightView, rightPanelView, rightViews]);

  const rightSubtitle =
    supportsDeviceFiles
      ? "Keep device context and runtime tools one click away."
      : "Use this dock for generated output and board context.";

  function renderCodeGuidanceCard() {
    if (!shouldShowCodeGuidance) {
      return null;
    }

    return (
      <WorkspaceGuidance
        eyebrow="Next Step"
        title={
          environment === "virtual" && virtualComponentCount === 0
            ? "Build the circuit first, then add code"
            : isBlockMode
              ? "Add your first blocks"
              : "Write your first code"
        }
        description={
          environment === "virtual" && virtualComponentCount === 0
            ? "Add a board and a few parts in Circuit Lab first. Then come back here to write code, simulate, and save the project."
            : isBlockMode
              ? "Choose a block category on the left, drag logic into the workspace, and use the generated code panel to follow what is happening."
              : "Start with setup and loop for Arduino C++, or write your MicroPython script before you run or upload it."
        }
        chips={
          environment === "virtual" && virtualComponentCount === 0
            ? ["1. Add parts", "2. Add code", "3. Simulate"]
            : isBlockMode
              ? ["Open blocks", "Generate code", "Save when ready"]
              : ["Write code", "Save project", "Run when ready"]
        }
        icon={environment === "virtual" && virtualComponentCount === 0 ? <CircuitBoard size={18} /> : <Code2 size={18} />}
        compact
        actions={
          environment === "virtual" && virtualComponentCount === 0
            ? [
                { label: "Back to Circuit", onClick: () => handleSetActiveView("circuit") },
                { label: "Try a Course", onClick: () => router.push("/courses"), tone: "secondary" },
              ]
            : []
        }
      />
    );
  }

  // Disabled per user request (too intrusive upon workspace launch)
  const circuitEmptyOverlay = null;

  const circuitReadyBanner = null;


  if (environment === "virtual") {
    return (
      <div className="circuit-lab-shell flex h-[100dvh] w-full flex-col overflow-hidden px-3 py-3">
        {activeView === "circuit" ? (
          <>
            <CircuitLabTopBar
              projectName={projectName}
              boardName={currentBoard}
              codingMode={codingMode}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              isConnected={webSerial.isConnected}

              onProjectNameChange={setProjectName}
              onUpload={handleUploadToBoard}
              onConnectDevice={handleConnectDevice}
              onSaveProject={() => void handleSaveProject()}
              onOpenProject={() => router.push("/dashboard")}
              onOpenPreferences={openPreferences}
              onOpenCodingEnvironment={() => handleSetActiveView("code")}
              saveStatusText={visibleSaveStatusText}
              saveStatusTone={visibleSaveStatusTone}
            />

            {circuitReadyBanner}
            {virtualProjectRail}
            <div className="mt-3 min-h-0 flex-1">
              <div className="relative h-full min-h-0 overflow-hidden">
                <CanvasWorkspace />
                {circuitEmptyOverlay}
              </div>
            </div>
          </>
        ) : (
          <>
            <CodingEnvironmentTopBar
              projectName={projectName}
              boardName={currentBoard}
              codingMode={codingMode}
              isSimulationActive={isSimulationActive}
              isSimulationBusy={Boolean(simulationStatus?.isCompiling)}
              supportsSimulation={supportsSimulation && Boolean(simulationControls)}
              canUploadAndSimulate={hasRunnableSimulationCode}
              canResetSimulation={Boolean(simulationControls)}
              componentCount={virtualComponentCount}
              mappedPinCount={virtualMappedPinCount}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              isCompiling={isCompiling}
              onBackToCircuitLab={() => handleSetActiveView("circuit")}
              onChangeCodingMode={handleChangeCodingMode}
              onUploadAndSimulate={() => void handleUploadAndSimulate()}
              onStopSimulation={() => simulationControls?.stop()}
              onResetSimulation={() => simulationControls?.reset()}
              onSaveProject={() => void handleSaveProject()}
              onOpenPreferences={openPreferences}
              onVerify={handleVerify}
              onUpload={handleUploadToBoard}
              saveStatusText={visibleSaveStatusText}
              saveStatusTone={visibleSaveStatusTone}
            />

            {virtualCodingStage}
          </>
        )}

        {hiddenCircuitSimulation}
        {preferencesDialog}
      </div>
    );
  }
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-[#0b0e14] overflow-hidden">
      <TopToolbar
        projectName={projectName}
        boardName={currentBoard}
        codingMode={codingMode}
        environment={environment}
        isConnected={webSerial.isConnected}
        isCompiling={isCompiling}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        bottomCollapsed={bottomCollapsed}
        showPanelControls={!isBlockMode}
        showStudioToggle={isBlockMode}
        activeStudioView={activeView}
        onChangeStudioView={handleSetActiveView}
        onVerify={handleVerify}
        onUpload={handleUploadToBoard}
        onConnectDevice={handleConnectDevice}
        onSelectBoard={() => router.push("/projects/select-board")}
        onSaveProject={handleSaveProject}
        onOpenProject={() => router.push("/dashboard")}
        onOpenPreferences={openPreferences}
        onToggleLeft={() => setLeftCollapsed((prev) => !prev)}
        onToggleRight={() => setRightCollapsed((prev) => !prev)}
        onToggleBottom={() => setBottomCollapsed((prev) => !prev)}
        saveStatusText={visibleSaveStatusText}
        saveStatusTone={visibleSaveStatusTone}
        variant={!isBlockMode ? "arduino-text" : "default"}
        onChangeCodingMode={handleChangeCodingMode}
      />
      {preferencesDialog}

      {isBlockMode ? (
        <div className="mt-3 flex min-h-0 flex-1 px-3 pb-3">{blockWorkspaceStage}</div>
      ) : (
        <div className="flex flex-1 min-h-0 w-full overflow-hidden">
          <IdeActivityBar
            activeView={leftRailView}
            onChangeView={setLeftRailView}
            isCollapsed={leftCollapsed}
            onToggleCollapsed={() => setLeftCollapsed((prev) => !prev)}
            enabledViewIds={["files", "libraries"]}
          />
          
          <div className="relative flex min-h-0 flex-1 flex-col px-2">
            {shouldShowCodeGuidance ? (
              <div className="absolute left-1/2 top-4 z-40 w-full max-w-xl -translate-x-1/2 shadow-2xl">
                {renderCodeGuidanceCard()}
              </div>
            ) : null}
            
            <IdeShellFrame
              left={leftStage}
              center={textCenterStage}
              right={
                <IdeRightContextPanel
                  title="AI Assistant"
                  subtitle="Ask questions, get code help, and debug faster with AI."
                  views={rightViews}
                  activeView={rightPanelView}
                  onChangeView={setRightPanelView}
                />
              }
              bottom={bottomStage}
              leftCollapsed={leftCollapsed}
              rightCollapsed={rightCollapsed}
              leftWidth={leftPanelWidth}
              rightWidth={rightPanelWidth}
            />
          </div>
        </div>
      )}

      {!isBlockMode && (
        <IdeStatusBar
          boardName={currentBoard}
          isConnected={webSerial.isConnected}
          leftMessage={isSaving ? "Saving..." : isCompiling ? "Compiling..." : "Ready."}
        />
      )}
    </div>
  );
}















































