'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CircuitBoard, Code2 } from 'lucide-react';
import type { useWebSerial } from '@/hooks/useWebSerial';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudioPreferences } from '@/contexts/StudioPreferencesContext';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorStore } from '@/stores/editorStore';
import { useBlocklyStore } from '@/stores/blocklyStore';
import { useCircuitStore } from '@/stores/circuitStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { CIRCUIT_FILE_NAME, deserializeCircuit } from '@/lib/circuit/circuitSerializer';
import TopToolbar from '../TopToolbar';
import CircuitLabTopBar from '../circuit-lab/TopBar';
import CanvasWorkspace from '../circuit-lab/CanvasWorkspace';
import CodingEnvironmentTopBar from '../coding-environment/TopBar';
import BlocklyWorkspace from '../BlocklyWorkspace';
import TerminalPanel from '../TerminalPanel';
import BlockTerminalShell from '../BlockTerminalShell';
import FileExplorer from '../FileExplorer';
import WorkspaceGuidance from '../WorkspaceGuidance';
import IdeShellFrame from '../IdeShellFrame';
import IdeActivityBar from '../IdeActivityBar';
import IdeStatusBar from '../IdeStatusBar';
import IdeLeftRail from '../IdeLeftRail';
import IdeRightContextPanel, { type IdeRightContextView } from '../IdeRightContextPanel';
import IdeBottomDock from '../IdeBottomDock';
import DeviceFiles from '../DeviceFiles';
import BoardStatusPanel from '../BoardStatusPanel';
import VirtualProjectRail from '../VirtualProjectRail';
import AiChatPanel from '../AiChatPanel';
import LibraryHub from '../LibraryHub';
import PreferencesDialog from '../PreferencesDialog';
import { IDEErrorBoundary } from '../ErrorBoundary';
import SaveProjectModal from './SaveProjectModal';
import { LEFT_PANEL_WIDTH, RIGHT_PANEL_WIDTH } from './constants';
import { useSplitViewEventBus } from './SplitViewEventBus';
import { useEditorOrchestrator } from './EditorOrchestrator';
import { useCircuitOrchestrator } from './CircuitOrchestrator';
import { useCompileController } from './CompileController';
import { useAutoSaveManager } from './AutoSaveManager';
import { useIDELayoutState } from './hooks/useIDELayoutState';

const TextEditor = dynamic(() => import('../TextEditor'), { ssr: false });
const SimulationCanvas = dynamic(() => import('../SimulationCanvas'), { ssr: false, loading: () => null });

type WebSerialController = ReturnType<typeof useWebSerial>;

function CodeGuidanceCard({
  environment,
  virtualComponentCount,
  isBlockMode,
  router,
  onBackToCircuit,
}: {
  environment: string;
  virtualComponentCount: number;
  isBlockMode: boolean;
  router: ReturnType<typeof useRouter>;
  onBackToCircuit: () => void;
}) {
  return (
    <WorkspaceGuidance
      eyebrow="Next Step"
      title={
        environment === 'virtual' && virtualComponentCount === 0
          ? 'Build the circuit first, then add code'
          : isBlockMode
            ? 'Add your first blocks'
            : 'Write your first code'
      }
      description={
        environment === 'virtual' && virtualComponentCount === 0
          ? 'Add a board and a few parts in Circuit Lab first. Then come back here to write code, simulate, and save the project.'
          : isBlockMode
            ? 'Choose a block category on the left, drag logic into the workspace, and use the generated code panel to follow what is happening.'
            : 'Start with setup and loop for Arduino C++, or write your MicroPython script before you run or upload it.'
      }
      chips={
        environment === 'virtual' && virtualComponentCount === 0
          ? ['1. Add parts', '2. Add code', '3. Simulate']
          : isBlockMode
            ? ['Open blocks', 'Generate code', 'Save when ready']
            : ['Write code', 'Save project', 'Run when ready']
      }
      icon={environment === 'virtual' && virtualComponentCount === 0 ? <CircuitBoard size={18} /> : <Code2 size={18} />}
      compact
      actions={
        environment === 'virtual' && virtualComponentCount === 0
          ? [
              { label: 'Back to Circuit', onClick: onBackToCircuit },
              { label: 'Try a Course', onClick: () => router.push('/courses'), tone: 'secondary' },
            ]
          : []
      }
    />
  );
}

export default function IDELayoutContainer({ webSerial }: { webSerial: WebSerialController }) {
  const router = useRouter();
  const eventBus = useSplitViewEventBus();
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
  const { projectName, setProjectName, projectId, refreshProjectFiles } = useProject();
  const hasUnsavedChanges = useEditorStore((state) => state.hasUnsavedChanges);
  const editor = useEditorOrchestrator();
  const circuit = useCircuitOrchestrator();
  const compile = useCompileController();
  const autoSaveManager = useAutoSaveManager();

  const layout = useIDELayoutState({
    environment: editor.environment,
    isBlockMode: editor.isBlockMode,
    supportsDeviceFiles: compile.supportsDeviceFiles,
  });

  const shouldShowCodeGuidance = !editor.isBlockMode && (
    editor.environment === 'virtual' ? circuit.virtualComponentCount === 0 : editor.sourceCode.trim().length === 0
  );


  const rightViews = useMemo<IdeRightContextView[]>(() => {
    const views: IdeRightContextView[] = [
      {
        id: 'ai-chat',
        label: 'AI Chat',
        tone: 'violet',
        content: <AiChatPanel />,
      },
      {
        id: 'status',
        label: 'Status',
        tone: 'slate',
        content: (
          <BoardStatusPanel
            boardName={editor.currentBoard}
            codingMode={editor.codingMode}
            environment={editor.environment}
            isConnected={webSerial.isConnected}
          />
        ),
      },
    ];

    if (compile.supportsDeviceFiles) {
      views.unshift({
        id: 'device',
        label: 'Device',
        tone: 'cyan',
        content: <DeviceFiles webSerial={webSerial} />,
      });
    }

    return views;
  }, [compile.supportsDeviceFiles, editor.codingMode, editor.currentBoard, editor.environment, webSerial]);

  React.useEffect(() => {
    if (!rightViews.some((view) => view.id === layout.rightPanelView)) {
      layout.setRightPanelView(layout.defaultRightView);
    }
  }, [layout, rightViews]);

  const runtimeLabel = editor.boardConfig?.runtimeLabel || (editor.currentLanguage === 'python' ? 'MicroPython' : 'Arduino C++');

  const handleResetEditorZone = React.useCallback(async () => {
    useBlocklyStore.getState().resetBlocklyState();

    if (projectId) {
      await refreshProjectFiles();
    }
  }, [projectId, refreshProjectFiles]);

  const handleResetFileExplorerZone = React.useCallback(async () => {
    if (projectId) {
      await refreshProjectFiles();
    }
  }, [projectId, refreshProjectFiles]);

  const handleResetCircuitZone = React.useCallback(() => {
    useSimulationStore.getState().resetSimulationStore();

    if (projectId) {
      const circuitFile = useEditorStore.getState().files.find((file) => file.name === CIRCUIT_FILE_NAME);
      if (circuitFile?.content) {
        try {
          useCircuitStore.getState().setCircuitData(deserializeCircuit(circuitFile.content), true);
          return;
        } catch (error) {
          console.error('[IDELayoutContainer] Failed to restore circuit from project data after a circuit boundary reset.', error);
        }
      }
    }

    useCircuitStore.getState().clearCircuit();
  }, [projectId]);

  const handleResetTerminalZone = React.useCallback(() => {
    webSerial.clearMessages();
  }, [webSerial]);

  const handleProjectNameChange = React.useCallback(
    (name: string) => {
      setProjectName(name);
      eventBus.emit('USER_EDITED', { source: 'project-meta', timestamp: Date.now() });
    },
    [eventBus, setProjectName],
  );

  const leftViews = useMemo(
    () => [
      {
        id: 'files',
        label: 'Files',
        content: (
          <IDEErrorBoundary
            zone="File Explorer"
            compact
            title="File Explorer hit a problem"
            description="The project file tree crashed. You can reload just the explorer or refresh its state without leaving the IDE."
            onResetState={handleResetFileExplorerZone}
          >
            <FileExplorer />
          </IDEErrorBoundary>
        ),
      },
      { id: 'libraries', label: 'Libraries', content: <LibraryHub /> },
    ],
    [handleResetFileExplorerZone],
  );

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
      onResetApp={() => {
        resetPreferences();
        setTheme('light');
        eventBus.emit('app:reset-request', undefined);
        closePreferences();
      }}
    />
  );

  const textCenterStage = (
    <div className="ui-foundation-panel relative flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-[30px]">
      <IDEErrorBoundary
        zone="Text Editor"
        title="The text editor hit a problem"
        description="Monaco or the text editor shell crashed. Reload this editor panel or reset its state while keeping the rest of the IDE open."
        onResetState={handleResetEditorZone}
      >
        <TextEditor
          code={editor.activeEditorCode}
          language={editor.activeEditorLanguage}
          fileName={editor.activeEditorFileName}
          runtimeLabel={runtimeLabel}
          workspaceLabel={editor.textEditorWorkspaceLabel}
          saveHint={editor.textEditorSaveHint}
          onChange={editor.handleActiveTextCodeChange}
          onSave={() => eventBus.emit('project:save-request', { origin: 'manual' })}
        />
      </IDEErrorBoundary>
    </div>
  );

  const leftStage = (
    <IdeLeftRail
      title="Project Rail"
      subtitle="Keep project files close while the editor stays in focus."
      views={leftViews}
      activeView={layout.leftRailView}
      onChangeView={layout.setLeftRailView}
    />
  );

  const bottomStage = (
    <IdeBottomDock
      collapsed={layout.bottomCollapsed}
      height={layout.terminalHeight}
      isCompact={layout.isCompact}
      onResizeStart={layout.handleTerminalResize}
    >
      <IDEErrorBoundary
        zone="Terminal"
        compact={layout.bottomCollapsed}
        title="The terminal hit a problem"
        description="Serial logs or the terminal UI crashed. Reload this panel or reset the terminal state without leaving the editor."
        onResetState={handleResetTerminalZone}
      >
        <TerminalPanel webSerial={webSerial} collapsed={layout.bottomCollapsed} />
      </IDEErrorBoundary>
    </IdeBottomDock>
  );

  const blockBottomStage = (
    <IdeBottomDock
      collapsed={layout.bottomCollapsed}
      height={layout.effectiveBlockTerminalHeight}
      isCompact={layout.isCompact}
      onResizeStart={layout.handleTerminalResize}
    >
      <IDEErrorBoundary
        zone="Terminal"
        compact={layout.bottomCollapsed}
        title="The block terminal hit a problem"
        description="Serial, build, or connection feedback for the block environment crashed. Reload this dock or reset its state without losing the rest of the workspace."
        onResetState={handleResetTerminalZone}
      >
        <BlockTerminalShell
          webSerial={webSerial}
          collapsed={layout.bottomCollapsed}
          requestedTab={layout.blockTerminalTab}
          onToggleCollapsed={() => layout.setBottomCollapsed((prev) => !prev)}
          onTabChange={layout.setBlockTerminalTab}
        />
      </IDEErrorBoundary>
    </IdeBottomDock>
  );

  const blockWorkspaceStage = (
    <div className="min-h-0 min-w-0 flex-1">
      <IDEErrorBoundary
        zone="Blockly Editor"
        title="The block editor hit a problem"
        description="Blockly or the generated-code panel crashed. Reload this editor or reset its local state while keeping your project open."
        onResetState={handleResetEditorZone}
      >
        <BlocklyWorkspace
          generatorType={editor.currentGenerator || 'arduino'}
          initialXml={editor.blocklyXml}
          onCodeChange={editor.handleEntrySourceCodeChange}
          onXmlChange={editor.handleBlocklyXmlChange}
          onWorkspaceReady={editor.handleBlocklyWorkspaceReady}
          selectedCategoryName={editor.selectedBlocklyCategory}
          onSelectCategory={editor.setSelectedBlocklyCategory}
          sourceCode={editor.sourceCode}
          isCompact={layout.isCompact}
        />
      </IDEErrorBoundary>
    </div>
  );

  const blockModeStage = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {blockWorkspaceStage}
      {blockBottomStage}
    </div>
  );

  const virtualCodingStage = editor.isBlockMode ? (
    <div className="mt-4 flex min-h-0 flex-1">{blockModeStage}</div>
  ) : (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      {shouldShowCodeGuidance ? (
        <CodeGuidanceCard
          environment={editor.environment}
          virtualComponentCount={circuit.virtualComponentCount}
          isBlockMode={editor.isBlockMode}
          router={router}
          onBackToCircuit={() => layout.setStudioView('circuit')}
        />
      ) : null}
      <div className="min-h-0 flex-1">
        <div className="h-full min-h-0 min-w-0">{textCenterStage}</div>
      </div>
    </div>
  );

  const virtualProjectRail = (
    <VirtualProjectRail
      activeView={layout.activeView === 'circuit' ? 'circuit' : 'code'}
      codingMode={editor.codingMode}
      componentCount={circuit.virtualComponentCount}
      netCount={circuit.virtualNetCount}
      mappedPinCount={circuit.virtualMappedPinCount}
      hasCode={editor.hasRunnableSimulationCode}
      supportsSimulation={compile.supportsSimulation && Boolean(circuit.simulationControls)}
      isSimulationActive={circuit.isSimulationActive}
      isSimulationBusy={Boolean(circuit.simulationStatus?.isCompiling)}
      onOpenCode={() => layout.setStudioView('code')}
      onBackToCircuit={() => layout.setStudioView('circuit')}
    />
  );

  const hiddenCircuitSimulation = compile.supportsSimulation ? (
    <div className="hidden" aria-hidden="true">
      {circuit.hasVisitedCodingEnvironment || layout.activeView === 'code' ? (
        <SimulationCanvas
          sourceCode={editor.sourceCode}
          boardName={editor.currentBoard}
          showHeader={false}
          showInternalControls={false}
          onRegisterControls={circuit.setSimulationControls}
          onStatusChange={circuit.setSimulationStatus}
          showBoard={false}
        />
      ) : null}
    </div>
  ) : null;

  if (editor.environment === 'virtual') {
    return (
      <div className="circuit-lab-shell flex h-[100dvh] w-full flex-col overflow-hidden px-3 py-3">
        {layout.activeView === 'circuit' ? (
          <>
            <CircuitLabTopBar
              projectName={projectName}
              boardName={editor.currentBoard}
              codingMode={editor.codingMode}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={autoSaveManager.isSaving}
              isConnected={webSerial.isConnected}
              onProjectNameChange={handleProjectNameChange}
              onUpload={() => eventBus.emit('compile:upload-request', undefined)}
              onConnectDevice={() => eventBus.emit('device:connect-toggle-request', undefined)}
              onSaveProject={() => eventBus.emit('project:save-request', { origin: 'manual' })}
              onOpenProject={() => router.push('/dashboard')}
              onOpenPreferences={openPreferences}
              onOpenCodingEnvironment={() => layout.setStudioView('code')}
              saveStatusText={autoSaveManager.visibleSaveStatusText}
              saveStatusTone={autoSaveManager.visibleSaveStatusTone}
            />
            {virtualProjectRail}
            <div className="mt-3 min-h-0 flex-1">
              <div className="relative h-full min-h-0 overflow-hidden">
                <IDEErrorBoundary
                  zone="Circuit Lab"
                  title="Circuit Lab hit a problem"
                  description="The circuit canvas crashed. Reload this canvas or restore its state without closing the rest of the IDE."
                  onResetState={handleResetCircuitZone}
                >
                  <CanvasWorkspace />
                </IDEErrorBoundary>
              </div>
            </div>
          </>
        ) : (
          <>
            <CodingEnvironmentTopBar
              projectName={projectName}
              boardName={editor.currentBoard}
              codingMode={editor.codingMode}
              isSimulationActive={circuit.isSimulationActive}
              isSimulationBusy={Boolean(circuit.simulationStatus?.isCompiling)}
              supportsSimulation={compile.supportsSimulation && Boolean(circuit.simulationControls)}
              canUploadAndSimulate={editor.hasRunnableSimulationCode}
              canResetSimulation={Boolean(circuit.simulationControls)}
              componentCount={circuit.virtualComponentCount}
              mappedPinCount={circuit.virtualMappedPinCount}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={autoSaveManager.isSaving}
              isCompiling={compile.isCompiling}
              onBackToCircuitLab={() => layout.setStudioView('circuit')}
              onChangeCodingMode={(mode) => eventBus.emit('editor:coding-mode-request', { mode })}
              onUploadAndSimulate={() => eventBus.emit('simulation:toggle-request', undefined)}
              onStopSimulation={() => circuit.simulationControls?.stop()}
              onResetSimulation={() => circuit.simulationControls?.reset()}
              onSaveProject={() => eventBus.emit('project:save-request', { origin: 'manual' })}
              onOpenPreferences={openPreferences}
              onVerify={() => eventBus.emit('compile:verify-request', undefined)}
              onUpload={() => eventBus.emit('compile:upload-request', undefined)}
              saveStatusText={autoSaveManager.visibleSaveStatusText}
              saveStatusTone={autoSaveManager.visibleSaveStatusTone}
            />
            {virtualCodingStage}
          </>
        )}

        {hiddenCircuitSimulation}
        {preferencesDialog}
        <SaveProjectModal
          open={autoSaveManager.isSaveModalOpen}
          isSaving={autoSaveManager.isSaving}
          newProjectName={autoSaveManager.newProjectName}
          currentBoard={editor.currentBoard}
          runtimeLabel={runtimeLabel}
          onNameChange={autoSaveManager.setNewProjectName}
          onClose={autoSaveManager.closeSaveModal}
          onSubmit={() => void autoSaveManager.submitSaveModal()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0b0e14]">
      <TopToolbar
        projectName={projectName}
        boardName={editor.currentBoard}
        codingMode={editor.codingMode}
        environment={editor.environment}
        isConnected={webSerial.isConnected}
        isCompiling={compile.isCompiling}
        isSaving={autoSaveManager.isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        leftCollapsed={layout.leftCollapsed}
        rightCollapsed={layout.rightCollapsed}
        bottomCollapsed={layout.bottomCollapsed}
        showPanelControls={!editor.isBlockMode}
        showStudioToggle={editor.isBlockMode}
        activeStudioView={layout.activeView}
        onChangeStudioView={layout.setStudioView}
        onVerify={() => eventBus.emit('compile:verify-request', undefined)}
        onUpload={() => eventBus.emit('compile:upload-request', undefined)}
        onConnectDevice={() => eventBus.emit('device:connect-toggle-request', undefined)}
        onSelectBoard={() => router.push('/projects/select-board')}
        onSaveProject={() => eventBus.emit('project:save-request', { origin: 'manual' })}
        onOpenProject={() => router.push('/dashboard')}
        onOpenPreferences={openPreferences}
        onToggleLeft={() => layout.setLeftCollapsed((prev) => !prev)}
        onToggleRight={() => layout.setRightCollapsed((prev) => !prev)}
        onToggleBottom={() => layout.setBottomCollapsed((prev) => !prev)}
        saveStatusText={autoSaveManager.visibleSaveStatusText}
        saveStatusTone={autoSaveManager.visibleSaveStatusTone}
        variant={!editor.isBlockMode ? 'arduino-text' : 'default'}
        onChangeCodingMode={(mode) => eventBus.emit('editor:coding-mode-request', { mode })}
      />
      {preferencesDialog}

      {editor.isBlockMode ? (
        <div className="mt-3 flex min-h-0 flex-1 px-3 pb-3">{blockModeStage}</div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          <IdeActivityBar
            activeView={layout.leftRailView}
            onChangeView={layout.setLeftRailView}
            isCollapsed={layout.leftCollapsed}
            onToggleCollapsed={() => layout.setLeftCollapsed((prev) => !prev)}
            enabledViewIds={['files', 'libraries']}
          />

          <div className="relative flex min-h-0 flex-1 flex-col px-2">
            {shouldShowCodeGuidance ? (
              <div className="absolute left-1/2 top-4 z-40 w-full max-w-xl -translate-x-1/2 shadow-2xl">
                <CodeGuidanceCard
                  environment={editor.environment}
                  virtualComponentCount={circuit.virtualComponentCount}
                  isBlockMode={editor.isBlockMode}
                  router={router}
                  onBackToCircuit={() => layout.setStudioView('circuit')}
                />
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
                  activeView={layout.rightPanelView}
                  onChangeView={layout.setRightPanelView}
                />
              }
              bottom={bottomStage}
              leftCollapsed={layout.leftCollapsed}
              rightCollapsed={layout.rightCollapsed}
              leftWidth={LEFT_PANEL_WIDTH}
              rightWidth={RIGHT_PANEL_WIDTH}
            />
          </div>
        </div>
      )}

      {!editor.isBlockMode ? (
        <IdeStatusBar
          boardName={editor.currentBoard}
          isConnected={webSerial.isConnected}
          leftMessage={autoSaveManager.isSaving ? 'Saving...' : compile.isCompiling ? 'Compiling...' : 'Ready.'}
        />
      ) : null}

      <SaveProjectModal
        open={autoSaveManager.isSaveModalOpen}
        isSaving={autoSaveManager.isSaving}
        newProjectName={autoSaveManager.newProjectName}
        currentBoard={editor.currentBoard}
        runtimeLabel={runtimeLabel}
        onNameChange={autoSaveManager.setNewProjectName}
        onClose={autoSaveManager.closeSaveModal}
        onSubmit={() => void autoSaveManager.submitSaveModal()}
      />
    </div>
  );
}
