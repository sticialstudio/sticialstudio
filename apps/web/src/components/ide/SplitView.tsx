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
import CodeViewer from "./CodeViewer";
import TerminalPanel from "./TerminalPanel";
import FileExplorer from "./FileExplorer";
import WorkspaceSidebar from "./WorkspaceSidebar";
import WorkspaceGuidance from "./WorkspaceGuidance";
import IdeShellFrame from "./IdeShellFrame";
import IdeLeftRail, { IdeLeftRailView } from "./IdeLeftRail";
import IdeRightContextPanel, { IdeRightContextView } from "./IdeRightContextPanel";
import IdeBottomDock from "./IdeBottomDock";
import DeviceFiles from "./DeviceFiles";
import BoardStatusPanel from "./BoardStatusPanel";
import { useWebSerial } from "../../hooks/useWebSerial";
import { useBoard } from "@/contexts/BoardContext";
import { useProject } from "@/contexts/ProjectContext";
import { apiFetch, API_BASE_URL, safeJson } from "@/lib/api";
import { BOARD_CONFIG } from "@/lib/boards/boardConfig";
import { getGenerator } from "@/lib/blockly/generator";
import { useCircuitStore } from "@/stores/circuitStore";
import { serializeCircuit, deserializeCircuit, CIRCUIT_FILE_NAME } from "@/lib/circuit/circuitSerializer";
import { generateArduinoTemplate, generateMicroPythonTemplate } from "@/templates/codeTemplates";

const TextEditor = dynamic(() => import("./TextEditor"), { ssr: false });
const SimulationCanvas = dynamic(() => import("./SimulationCanvas"), { ssr: false, loading: () => null });

const DEFAULT_BLOCKLY_XML = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

interface CompileResponse {
  success?: boolean;
  log?: string;
  hex?: string;
}

interface BlocklyGeneratorLike {
  init: (workspace: Workspace) => void;
  blockToCode?: (block: unknown) => unknown;
  setups_?: Record<string, string | undefined>;
  getImports?: () => string[];
}

function buildSourceCodeFromBlocklyWorkspace(workspace: WorkspaceSvg, generatorType: string) {
  const generator = getGenerator(generatorType) as unknown as BlocklyGeneratorLike;
  generator.init(workspace);

  const rootBlocks = workspace.getBlocksByType('arduino_setup_loop');
  const rootBlock = rootBlocks.length > 0 ? rootBlocks[0] : null;

  if (rootBlock) {
    generator.blockToCode?.(rootBlock);
  }

  const setupsDict = generator.setups_ || {};
  const loopCode = setupsDict['__loop_code__'] || '';
  const manualSetupCode = setupsDict['__setup_code__'] || '';

  const setupEntries: string[] = [];
  const globalEntries: string[] = [];

  if (manualSetupCode.trim()) {
    setupEntries.push(manualSetupCode);
  }

  for (const name in setupsDict) {
    if (name === '__loop_code__' || name === '__setup_code__') continue;

    const snippet = setupsDict[name];
    if (typeof snippet !== 'string' || snippet.trim().length === 0) continue;

    if (generatorType === 'arduino') {
      const trimmed = snippet.trimStart();
      const isGlobalSnippet =
        trimmed.startsWith('#include') ||
        trimmed.startsWith('Servo ') ||
        trimmed.startsWith('Adafruit_') ||
        trimmed.startsWith('long readUltrasonicDistance') ||
        /^[A-Za-z_][\w:<>&*\s]*\([^)]*\)\s*\{/.test(trimmed);

      if (isGlobalSnippet) {
        globalEntries.push(snippet);
      } else {
        setupEntries.push(snippet);
      }
    } else {
      setupEntries.push(snippet);
    }
  }

  const setupCode = setupEntries.join('\n');

  if (generatorType === 'micropython') {
    const indentedLoop = loopCode
      .split('\n')
      .map((line) => (line ? `    ${line}` : line))
      .join('\n');
    const importLines = typeof generator.getImports === 'function' ? generator.getImports() : [];
    return generateMicroPythonTemplate(importLines, setupCode, indentedLoop);
  }

  return generateArduinoTemplate(globalEntries.join('\n'), setupCode, loopCode);
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

function getInitialStudioView(environment: string): StudioView {
  return environment === "virtual" ? "circuit" : "code";
}

export default function SplitView() {
  const router = useRouter();
  const webSerial = useWebSerial();

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
  } = useBoard();

  const environment = rawEnvironment ?? "virtual";
  const boardConfig = BOARD_CONFIG[currentBoard];
  const supportsSimulation = compileStrategy === "arduino-cli" && Boolean(boardConfig?.supportsBrowserSimulation);
  const supportsDeviceFiles = boardConfig?.uploadTransport === "micropython-raw-repl";
  const boardSupportNote = boardConfig?.supportNote;
  const isBlockMode = codingMode === "block";
  const [activeView, setActiveView] = useState<StudioView>(() => getInitialStudioView(environment));

  const handleSetActiveView = useCallback((view: StudioView) => {
    if (view === activeView) return;
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
  }, [activeView]);

  useEffect(() => {
    setActiveView(getInitialStudioView(environment));
  }, [environment]);

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
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
    setActiveFileId,
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

  const sourceFile = useMemo(() => {
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

  const sourceCode = sourceFile ? sourceFile.content : "";
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
  const shouldShowCodeGuidance = showCodeEmptyGuidance || (environment === "virtual" && virtualComponentCount === 0);
  const visibleSaveStatusText = saveStatusText ?? (hasUnsavedChanges ? "Unsaved changes" : null);
  const visibleSaveStatusTone = saveStatusText ? saveStatusTone : "neutral";


  useEffect(() => {
    if (sourceFile?.id) {
      setActiveFileId(sourceFile.id);
    }
  }, [sourceFile?.id, setActiveFileId]);

  const bootstrappedRef = React.useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current || files.length > 0) return;
    bootstrappedRef.current = true;
    bootstrapOfflineFiles(preferredSourceFileName, currentLanguage || "cpp");
  }, [files.length, preferredSourceFileName, currentLanguage, bootstrapOfflineFiles]);

  useEffect(() => {
    if (!blocklyFile?.id || blocklyXmlIsValid) return;

    const legacyContent = blocklyFile.content || "";

    if (sourceFile?.id && sourceFile.id !== blocklyFile.id && sourceFile.content !== legacyContent) {
      updateFileContent(sourceFile.id, legacyContent);
    }

    updateFileContent(blocklyFile.id, DEFAULT_BLOCKLY_XML);
  }, [
    blocklyFile?.id,
    blocklyFile?.content,
    blocklyXmlIsValid,
    sourceFile?.id,
    sourceFile?.content,
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

  const handleSourceCodeChange = useCallback(
    (newCode: string) => {
      if (sourceFile?.id) {
        updateFileContent(sourceFile.id, newCode);
      }
    },
    [sourceFile?.id, updateFileContent]
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

    const nextCode = buildSourceCodeFromBlocklyWorkspace(blocklyWorkspaceRef.current, currentGenerator || "arduino");
    if (sourceFile?.id && nextCode !== sourceCode) {
      updateFileContent(sourceFile.id, nextCode);
    }

    return nextCode;
  }, [currentGenerator, isBlockMode, sourceCode, sourceFile?.id, updateFileContent]);

  const reportUnsupportedBoardAction = useCallback(
    (action: string) => {
      const detail = boardSupportNote ? ` ${boardSupportNote}` : "";
      webSerial.addMessage("error", `${action} is not available for ${currentBoard}.${detail}`.trim());
    },
    [boardSupportNote, currentBoard, webSerial]
  );

  const handleSaveProject = useCallback(async () => {
    if (!projectId) {
      webSerial.addMessage("error", "No active project selected.");
      setSaveStatusText("Open or create a project first");
      setSaveStatusTone("error");
      return;
    }

    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
      saveStatusTimeoutRef.current = null;
    }

    setIsSaving(true);
    try {
      await saveProject();
      webSerial.addMessage("system", "Project saved.");
      setSaveStatusText("Project saved");
      setSaveStatusTone("success");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatusText(null);
      }, 3200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the project right now.";
      webSerial.addMessage("error", `Failed to save project: ${message}`);
      setSaveStatusText(message);
      setSaveStatusTone("error");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatusText(null);
      }, 4200);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, saveProject, webSerial]);

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
      webSerial.executeMicroPythonRaw(sourceCode);
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
  }, [boardConfig?.uploadTransport, compileStrategy, currentBoard, reportUnsupportedBoardAction, sourceCode, supportsDeviceFiles, webSerial]);

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
    return "status";
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
    () => [{ id: "files", label: "Files", content: <FileExplorer /> }],
    []
  );

  const leftSubtitle = "Keep project files close while the editor stays in focus.";

  const textCenterStage = (
    <div className="ui-foundation-panel relative flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-[30px]">
      <TextEditor code={sourceCode} language={currentLanguage || "cpp"} onChange={handleSourceCodeChange} />
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

  const codeStudioStage = (
    <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_400px]">
      <aside className="min-h-0 overflow-hidden">
        <WorkspaceSidebar
          codingMode="block"
          selectedBlocklyCategory={selectedBlocklyCategory}
          onSelectCategory={setSelectedBlocklyCategory}
        />
      </aside>
      <div className="min-h-0 min-w-0">
        <BlocklyWorkspace
          generatorType={currentGenerator || "arduino"}
          initialXml={blocklyXml}
          onCodeChange={handleSourceCodeChange}
          onXmlChange={handleBlocklyXmlChange}
          onWorkspaceReady={handleBlocklyWorkspaceReady}
          selectedCategoryName={selectedBlocklyCategory}
        />
      </div>
      <aside className="min-h-[280px] min-w-0 overflow-hidden xl:min-h-0">
        <CodeViewer code={sourceCode} language={currentLanguage || "cpp"} />
      </aside>
    </div>
  );

  const virtualCodingStage = (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      {renderCodeGuidanceCard()}
      <CodingEnvironmentSummary
        simulationError={simulationStatus?.errorText ?? null}
        onBackToCircuitLab={() => handleSetActiveView("circuit")}
      />
      <div className="min-h-0 flex-1">
        {isBlockMode ? (
          <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_400px]">
            <aside className="min-h-0 overflow-hidden">
              <WorkspaceSidebar
                codingMode="block"
                selectedBlocklyCategory={selectedBlocklyCategory}
                onSelectCategory={setSelectedBlocklyCategory}
              />
            </aside>
            <div className="min-h-0 min-w-0">
              <BlocklyWorkspace
                generatorType={currentGenerator || "arduino"}
                initialXml={blocklyXml}
                onCodeChange={handleSourceCodeChange}
                onXmlChange={handleBlocklyXmlChange}
                onWorkspaceReady={handleBlocklyWorkspaceReady}
                selectedCategoryName={selectedBlocklyCategory}
              />
            </div>
            <aside className="min-h-[260px] min-w-0 overflow-hidden xl:min-h-0">
              <CodeViewer code={sourceCode} language={currentLanguage || "cpp"} />
            </aside>
          </div>
        ) : (
          <div className="h-full min-h-0 min-w-0">{textCenterStage}</div>
        )}
      </div>
    </div>
  );
  const hiddenCircuitSimulation = supportsSimulation ? (
    <div className="hidden" aria-hidden="true">
      {/* Only mount once the user has visited Coding Environment GÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã‚Â¶ avoids booting
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

  const circuitEmptyOverlay = showCircuitEmptyGuidance ? (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5 sm:p-8">
      <div className="pointer-events-auto max-w-xl">
        <WorkspaceGuidance
          eyebrow="Start Project"
          title="Start with a board and a few parts"
          description="Add an Arduino, a breadboard, and your first parts to the canvas. Then wire them, open Code Studio, and run the project."
          chips={["Add parts", "Wire them", "Then open code"]}
          icon={<PlayCircle size={18} />}
          actions={[
            { label: "Try a Course", onClick: () => router.push("/courses") },
            { label: "Open Code Anyway", onClick: () => handleSetActiveView("code"), tone: "secondary" },
          ]}
        />
      </div>
    </div>
  ) : null;

  if (environment === "virtual") {
    return (
      <div className="ui-foundation-shell flex h-full min-h-0 flex-col p-3 sm:p-4">
        {activeView === "circuit" ? (
          <>
            <CircuitLabTopBar
              projectName={projectName}
              boardName={currentBoard}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              isConnected={webSerial.isConnected}

              onProjectNameChange={setProjectName}
              onUpload={handleUploadToBoard}
              onConnectDevice={handleConnectDevice}
              onSaveProject={() => void handleSaveProject()}
              onOpenProject={() => router.push("/dashboard")}
              onOpenCodingEnvironment={() => handleSetActiveView("code")}
              saveStatusText={visibleSaveStatusText}
              saveStatusTone={visibleSaveStatusTone}
            />

            <div className="mt-3 min-h-0 flex-1">
              <div className="ui-foundation-panel relative h-full min-h-0 overflow-hidden rounded-[32px] p-1">
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
              onBackToCircuitLab={() => handleSetActiveView("circuit")}
              onChangeCodingMode={setCodingMode}
              onUploadAndSimulate={() => void handleUploadAndSimulate()}
              onStopSimulation={() => simulationControls?.stop()}
              onResetSimulation={() => simulationControls?.reset()}
              onSaveProject={() => void handleSaveProject()}
              saveStatusText={visibleSaveStatusText}
              saveStatusTone={visibleSaveStatusTone}
            />

            {virtualCodingStage}
          </>
        )}

        {hiddenCircuitSimulation}
      </div>
    );
  }
  const blockModeStage = codeStudioStage;

  return (
    <div className="ui-foundation-shell flex h-full min-h-0 flex-col p-3 sm:p-4">
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
        onToggleLeft={() => setLeftCollapsed((prev) => !prev)}
        onToggleRight={() => setRightCollapsed((prev) => !prev)}
        onToggleBottom={() => setBottomCollapsed((prev) => !prev)}
        saveStatusText={visibleSaveStatusText}
        saveStatusTone={visibleSaveStatusTone}

      />

      {isBlockMode ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {renderCodeGuidanceCard()}
          <div className="min-h-0 flex-1">{blockModeStage}</div>
          <div className="shrink-0 px-0.5">{bottomStage}</div>
        </div>
      ) : (
        <>
          {shouldShowCodeGuidance ? <div className="mt-3">{renderCodeGuidanceCard()}</div> : null}
          <IdeShellFrame
            left={leftStage}
            center={textCenterStage}
            right={
            <IdeRightContextPanel
              title="Context"
              subtitle={rightSubtitle}
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
        </>
      )}
    </div>
  );
}























