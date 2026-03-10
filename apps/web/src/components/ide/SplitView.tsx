"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import TopToolbar from './TopToolbar';
import BlocklyWorkspace from './BlocklyWorkspace';
import CodeViewer from './CodeViewer';
import TerminalPanel from './TerminalPanel';
import { useWebSerial } from '../../hooks/useWebSerial';
import { useBoard } from '@/contexts/BoardContext';
import { useProject } from '@/contexts/ProjectContext';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';

const TextEditor = dynamic(() => import('./TextEditor'), { ssr: false });

const BLOCK_CATEGORIES = [
    'Basic',
    'Digital I/O',
    'Analog I/O',
    'Timing',
    'Communication',
    'Sensors',
    'Displays',
    'Lights',
    'Motors',
    'Logic',
    'Loops',
    'Math',
    'Text'
];

const SENSOR_GROUP_CATEGORIES = [
    { id: 'Sensors: Motion & Presence', label: 'Motion & Presence' },
    { id: 'Sensors: Water, Soil & Rain', label: 'Water / Soil / Rain' },
    { id: 'Sensors: Environment', label: 'Environment' },
    { id: 'Sensors: IR & Keypad', label: 'IR & Keypad' },
    { id: 'Sensors: Actuators', label: 'Actuators' }
];

const DEFAULT_BLOCKLY_XML = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

function getPreferredSourceFileName(language: string | null, generator: string | null) {
    if (language === 'python' || generator === 'micropython') {
        return 'main.py';
    }
    return 'main.cpp';
}

function isLikelyBlocklyXml(content: string | null | undefined) {
    if (typeof content !== 'string') return false;

    const trimmed = content.trim();
    if (!trimmed) return true;

    const withoutDeclaration = trimmed.replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
    return /^<xml(\s|>)/i.test(withoutDeclaration);
}

export default function SplitView() {
    const router = useRouter();
    const webSerial = useWebSerial();

    const [leftPanelWidth, setLeftPanelWidth] = useState(224);
    const [rightPanelWidth, setRightPanelWidth] = useState(380);
    const [terminalHeight, setTerminalHeight] = useState(220);

    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [bottomCollapsed, setBottomCollapsed] = useState(false);
    const [isCompact, setIsCompact] = useState(false);

    const [isCompiling, setIsCompiling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBlocklyCategory, setSelectedBlocklyCategory] = useState(BLOCK_CATEGORIES[0]);
    const [selectedSensorGroup, setSelectedSensorGroup] = useState<string | null>(null);

    const {
        currentBoard,
        codingMode,
        language: currentLanguage,
        generator: currentGenerator,
        compileStrategy
    } = useBoard();

    const {
        files,
        updateFileContent,
        projectId,
        saveProject,
        hasUnsavedChanges,
        setActiveFileId
    } = useProject();

    const preferredSourceFileName = useMemo(
        () => getPreferredSourceFileName(currentLanguage, currentGenerator),
        [currentLanguage, currentGenerator]
    );

    const blocklyFile = useMemo(
        () =>
            files.find((file) => file.name === 'main.blockly') ||
            files.find((file) => file.type === 'blockly') ||
            null,
        [files]
    );

    const sourceFile = useMemo(() => {
        const byPreferredName = files.find((file) => file.name === preferredSourceFileName);
        if (byPreferredName) return byPreferredName;

        const byExpectedType = files.find((file) =>
            preferredSourceFileName === 'main.py' ? file.type === 'python' : file.type === 'cpp'
        );
        if (byExpectedType) return byExpectedType;

        return (
            files.find((file) => file.type !== 'folder' && file.id !== blocklyFile?.id) ||
            files.find((file) => file.type !== 'folder') ||
            null
        );
    }, [files, preferredSourceFileName, blocklyFile?.id]);

    const sourceCode = sourceFile ? sourceFile.content : '';
    const rawBlocklyContent = blocklyFile?.content || '';
    const blocklyXmlIsValid = isLikelyBlocklyXml(rawBlocklyContent);
    const blocklyXml = blocklyXmlIsValid && rawBlocklyContent.trim().length > 0
        ? rawBlocklyContent
        : DEFAULT_BLOCKLY_XML;
    const effectiveBlocklyCategory =
        selectedBlocklyCategory === 'Sensors' && selectedSensorGroup
            ? selectedSensorGroup
            : selectedBlocklyCategory;

    useEffect(() => {
        if (sourceFile?.id) {
            setActiveFileId(sourceFile.id);
        }
    }, [sourceFile?.id, setActiveFileId]);

    useEffect(() => {
        if (!blocklyFile?.id || blocklyXmlIsValid) return;

        const legacyContent = blocklyFile.content || '';

        // Recover projects affected by old save behavior where generated code was written into main.blockly.
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
        updateFileContent
    ]);

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
        window.addEventListener('resize', updateViewportMode);
        return () => window.removeEventListener('resize', updateViewportMode);
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

    const handleSaveProject = useCallback(async () => {
        if (!projectId) {
            webSerial.addMessage('error', 'No active project selected.');
            return;
        }

        setIsSaving(true);
        try {
            await saveProject();
            webSerial.addMessage('system', 'Project saved.');
        } catch (error) {
            webSerial.addMessage('error', `Failed to save project: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    }, [projectId, saveProject, webSerial]);

    const handleVerify = useCallback(async () => {
        if (compileStrategy === 'micropython-flash') {
            webSerial.addMessage('system', 'MicroPython code is validated on device upload. Use Upload.');
            return;
        }

        setIsCompiling(true);
        webSerial.addMessage('system', `Compiling sketch for ${currentBoard}...`);

        try {
            const res = await apiFetch('/api/compile/arduino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCode })
            });
            const data = await safeJson<any>(res);

            if (res.ok && data?.success) {
                webSerial.addMessage('system', 'Compilation successful.');
                const lines = (data?.log || '').split('\n').filter((line: string) => line.trim().length > 0);
                lines.forEach((line: string) => webSerial.addMessage('app', line));
            } else {
                const message = res.ok ? 'Compilation failed.' : `Compiler API error (status ${res.status}).`;
                webSerial.addMessage('error', message);
                const lines = (data?.log || '').split('\n').filter((line: string) => line.trim().length > 0);
                lines.forEach((line: string) => webSerial.addMessage('error', line));
            }
        } catch (error) {
            webSerial.addMessage('error', `Compiler API offline at ${API_BASE_URL}: ${(error as Error).message}`);
        } finally {
            setIsCompiling(false);
        }
    }, [compileStrategy, currentBoard, sourceCode, webSerial]);

    const handleUploadToBoard = useCallback(async () => {
        if (!webSerial.isConnected) {
            webSerial.addMessage('error', 'Device not connected. Click Connect Device first.');
            return;
        }

        if (compileStrategy === 'micropython-flash') {
            webSerial.executeMicroPythonRaw(sourceCode);
            return;
        }

        setIsCompiling(true);
        webSerial.addMessage('system', `Compiling sketch for ${currentBoard} before upload...`);

        try {
            const res = await apiFetch('/api/compile/arduino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCode })
            });
            const data = await safeJson<any>(res);

            if (res.ok && data?.success && data?.hex) {
                webSerial.addMessage('system', 'Compilation successful. Starting upload...');
                await webSerial.flashArduino(data.hex);
            } else {
                const message = res.ok ? 'Compilation failed. Upload aborted.' : `Compiler API error (status ${res.status}).`;
                webSerial.addMessage('error', message);
                const lines = (data?.log || '').split('\n').filter((line: string) => line.trim().length > 0);
                lines.forEach((line: string) => webSerial.addMessage('error', line));
            }
        } catch (error) {
            webSerial.addMessage('error', `Compiler API offline at ${API_BASE_URL}: ${(error as Error).message}`);
        } finally {
            setIsCompiling(false);
        }
    }, [compileStrategy, currentBoard, sourceCode, webSerial]);

    const handleConnectDevice = useCallback(() => {
        if (webSerial.isConnected) {
            webSerial.disconnect();
        } else {
            webSerial.connect(115200);
        }
    }, [webSerial]);

    const handleLeftResize = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = leftPanelWidth;

        const onMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            setLeftPanelWidth(Math.max(180, Math.min(360, startWidth + delta)));
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const handleRightResize = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = rightPanelWidth;

        const onMove = (moveEvent: MouseEvent) => {
            const delta = startX - moveEvent.clientX;
            setRightPanelWidth(Math.max(280, Math.min(620, startWidth + delta)));
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const handleTerminalResize = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        const startY = event.clientY;
        const startHeight = terminalHeight;

        const onMove = (moveEvent: MouseEvent) => {
            const delta = startY - moveEvent.clientY;
            setTerminalHeight(Math.max(140, Math.min(420, startHeight + delta)));
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const showCodeViewer = codingMode === 'block' && !rightCollapsed;

    const leftPanelContent = useMemo(() => {
        if (codingMode !== 'block') {
            return (
                <div className="space-y-4 p-4 text-sm text-muted">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Workspace</h3>
                    <p className="rounded-xl border border-panel-border bg-panel p-3 leading-6 text-muted">
                        Text coding mode is active. Use the center editor to write code and the terminal panel for upload logs.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Blockly Categories</h3>
                <ul className="space-y-2">
                    {BLOCK_CATEGORIES.map((category, index) => {
                        const isActive = selectedBlocklyCategory === category;
                        return (
                            <li key={category}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedBlocklyCategory(category);
                                        if (category !== 'Sensors') {
                                            setSelectedSensorGroup(null);
                                        }
                                    }}
                                    className={`ui-fade-up w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-200'
                                            : 'border-panel-border bg-panel text-muted hover:border-cyan-400/40 hover:text-foreground'
                                    }`}
                                    style={{ animationDelay: `${80 + index * 24}ms` }}
                                    aria-pressed={isActive}
                                >
                                    {category}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                {selectedBlocklyCategory === 'Sensors' ? (
                    <div className="space-y-2 rounded-xl border border-panel-border bg-panel p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Sensor Groups</p>
                        <ul className="space-y-2">
                            {SENSOR_GROUP_CATEGORIES.map((group) => {
                                const isGroupActive = selectedSensorGroup === group.id;
                                return (
                                    <li key={group.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSensorGroup(group.id)}
                                            className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                                                isGroupActive
                                                    ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-200'
                                                    : 'border-panel-border bg-slate-900/50 text-muted hover:border-emerald-400/40 hover:text-foreground'
                                            }`}
                                            aria-pressed={isGroupActive}
                                        >
                                            {group.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}
            </div>
        );
    }, [codingMode, selectedBlocklyCategory, selectedSensorGroup]);

    return (
        <div className="flex h-full min-h-0 flex-col bg-background p-2 sm:p-3">
            <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
                <TopToolbar
                    boardName={currentBoard}
                    isConnected={webSerial.isConnected}
                    isCompiling={isCompiling}
                    isSaving={isSaving}
                    hasUnsavedChanges={hasUnsavedChanges}
                    leftCollapsed={leftCollapsed}
                    rightCollapsed={rightCollapsed}
                    bottomCollapsed={bottomCollapsed}
                    onVerify={handleVerify}
                    onUpload={handleUploadToBoard}
                    onConnectDevice={handleConnectDevice}
                    onSelectBoard={() => router.push('/projects/select-board')}
                    onSaveProject={handleSaveProject}
                    onOpenProject={() => router.push('/dashboard')}
                    onToggleLeft={() => setLeftCollapsed((prev) => !prev)}
                    onToggleRight={() => setRightCollapsed((prev) => !prev)}
                    onToggleBottom={() => setBottomCollapsed((prev) => !prev)}
                />

                <div className="flex min-h-0 flex-1 gap-2">
                    {!leftCollapsed ? (
                        <>
                            <aside
                                style={{ width: leftPanelWidth }}
                                className="min-h-0 overflow-y-auto rounded-2xl border border-panel-border bg-panel transition-[width,opacity] duration-200"
                            >
                                {leftPanelContent}
                            </aside>
                            {!isCompact ? (
                                <div
                                    className="w-1.5 cursor-col-resize rounded-full bg-panel-border transition-colors hover:bg-cyan-400"
                                    onMouseDown={handleLeftResize}
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="Resize left panel"
                                />
                            ) : null}
                        </>
                    ) : null}

                    <section className="min-w-0 flex-1 transition-all duration-200">
                        {codingMode === 'block' ? (
                            <BlocklyWorkspace
                                generatorType={currentGenerator || 'arduino'}
                                initialXml={blocklyXml}
                                onCodeChange={handleSourceCodeChange}
                                onXmlChange={handleBlocklyXmlChange}
                                selectedCategoryName={effectiveBlocklyCategory}
                            />
                        ) : (
                            <section className="h-full overflow-hidden rounded-2xl border border-panel-border bg-panel">
                                <TextEditor code={sourceCode} language={currentLanguage || 'cpp'} onChange={handleSourceCodeChange} />
                            </section>
                        )}
                    </section>

                    {showCodeViewer ? (
                        <>
                            {!isCompact ? (
                                <div
                                    className="w-1.5 cursor-col-resize rounded-full bg-panel-border transition-colors hover:bg-cyan-400"
                                    onMouseDown={handleRightResize}
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="Resize right panel"
                                />
                            ) : null}
                            <aside style={{ width: rightPanelWidth }} className="min-h-0 transition-[width,opacity] duration-200">
                                <CodeViewer code={sourceCode} language={currentLanguage || 'cpp'} />
                            </aside>
                        </>
                    ) : null}
                </div>

                {!bottomCollapsed ? (
                    <>
                        {!isCompact ? (
                            <div
                                className="h-1.5 cursor-row-resize rounded-full bg-panel-border transition-colors hover:bg-cyan-400"
                                onMouseDown={handleTerminalResize}
                                role="separator"
                                aria-orientation="horizontal"
                                aria-label="Resize terminal panel"
                            />
                        ) : null}
                        <div style={{ height: terminalHeight }} className="min-h-[140px] transition-[height] duration-200">
                            <TerminalPanel webSerial={webSerial} />
                        </div>
                    </>
                ) : (
                    <TerminalPanel webSerial={webSerial} collapsed />
                )}
            </div>
        </div>
    );
}










