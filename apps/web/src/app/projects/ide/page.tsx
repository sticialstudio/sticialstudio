"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoard } from '@/contexts/BoardContext';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import SplitView from '@/components/ide/SplitView';
import { clearPendingProjectIntent, readPendingProjectIntent } from '@/lib/projects/projectFlow';
import { serializeProjectMeta } from '@/lib/projects/projectMeta';

function stashWorkspaceNotice(message: string) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('workspaceNotice', message);
}

export default function Workspace() {
    const router = useRouter();
    const { codingMode, currentBoard, language, generator, environment } = useBoard();
    const { projectId, setProjectId } = useProject();
    const { token } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const createAttemptedRef = useRef(false);

    useEffect(() => {
        if (!projectId && !codingMode) {
            router.replace('/projects/select-mode');
            return;
        }

        if (!projectId && !currentBoard) {
            router.replace('/projects/select-board');
            return;
        }

        if (!projectId && !environment) {
            router.replace('/projects/select-environment');
        }
    }, [codingMode, currentBoard, environment, projectId, router]);

    useEffect(() => {
        const initProject = async () => {
            const pendingIntent = readPendingProjectIntent();

            if (!token || projectId || !codingMode || !currentBoard || !environment || createAttemptedRef.current) {
                return;
            }

            if (!pendingIntent) {
                stashWorkspaceNotice('Start a project from the dashboard or build wizard, then the workspace will open here.');
                router.replace('/dashboard');
                return;
            }

            createAttemptedRef.current = true;
            setIsCreatingProject(true);

            try {
                const projectName = pendingIntent.projectName?.trim() || `${currentBoard} ${codingMode === 'block' ? 'Block' : 'Code'} Project`;
                const createRes = await apiFetch('/api/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: projectName,
                        description: serializeProjectMeta({
                            board: currentBoard,
                            mode: codingMode,
                            language,
                            generator,
                            environment
                        })
                    })
                });

                if (createRes.ok) {
                    const newProject = await safeJson<any>(createRes);
                    if (newProject?.id) {
                        setProjectId(newProject.id);
                        clearPendingProjectIntent();
                        setApiError(null);
                    } else {
                        setApiError('Unexpected response from the API.');
                    }
                } else {
                    setApiError(`Failed to create project (status ${createRes.status}).`);
                }
            } catch (error) {
                setApiError(`Could not reach the API at ${API_BASE_URL}.`);
                console.error('Failed to initialize project API:', error);
            } finally {
                setIsCreatingProject(false);
            }
        };

        void initProject();
    }, [codingMode, currentBoard, environment, generator, language, projectId, router, setProjectId, token]);

    if ((!projectId && !codingMode) || !currentBoard || (!projectId && !environment)) {
        return (
            <MainLayout>
                <div className="flex h-full min-h-0 flex-col bg-background">
                    <div className="flex min-h-0 flex-1 items-center justify-center px-6">
                        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/70 px-8 py-10 text-center shadow-[0_24px_60px_-36px_rgba(8,47,73,0.95)]">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/60 border-t-transparent" />
                            <h2 className="mt-4 text-lg font-semibold text-slate-100">Taking you to the right setup step</h2>
                            <p className="mt-2 text-sm text-slate-400">Checking your project, board, and environment so the workspace opens with the right context.</p>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex h-full min-h-0 flex-col bg-background">
                {apiError ? (
                    <div className="mx-3 mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                        {apiError}
                        <div className="mt-2 text-xs text-rose-300/80">
                            API: <span className="font-mono text-rose-100/80">{API_BASE_URL}</span>
                        </div>
                    </div>
                ) : null}
                {isCreatingProject ? (
                    <div className="flex min-h-0 flex-1 items-center justify-center px-6">
                        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/70 px-8 py-10 text-center shadow-[0_24px_60px_-36px_rgba(8,47,73,0.95)]">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/60 border-t-transparent" />
                            <h2 className="mt-4 text-lg font-semibold text-slate-100">Preparing your workspace</h2>
                            <p className="mt-2 text-sm text-slate-400">Loading the right board, editor, and simulator setup so you can start immediately.</p>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1">
                        <SplitView />
                    </div>
                )}
            </div>
        </MainLayout>
    );
}


