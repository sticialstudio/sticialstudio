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
import { Button } from '@/components/ui/Button';
import { StatusBanner } from '@/components/ui/StatusBanner';

function stashWorkspaceNotice(message: string) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('workspaceNotice', message);
}

function LoadingWorkspaceCard({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
    return (
        <div className="ui-foundation-shell flex h-full min-h-0 flex-col">
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-8">
                <div className="ui-foundation-panel w-full max-w-xl px-8 py-10 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--ui-color-primary)]/55 border-t-transparent" />
                    <h2 className="mt-4 text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--ui-color-text-muted)]">{description}</p>
                    {actionLabel && onAction ? (
                        <div className="mt-5">
                            <Button variant="secondary" onClick={onAction}>
                                {actionLabel}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function Workspace() {
    const router = useRouter();
    const { codingMode, currentBoard, language, generator, environment } = useBoard();
    const { projectId, setProjectId } = useProject();
    const { token } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const createAttemptedRef = useRef(false);
    const apiHealthUrl = `${API_BASE_URL}/api/health`;

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
                <LoadingWorkspaceCard
                    title="Taking you to the right setup step"
                    description="Checking your project, board, and environment so the workspace opens with the right context."
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className={environment === 'virtual' ? 'circuit-lab-page flex h-full min-h-0 flex-col' : 'ui-foundation-shell flex h-full min-h-0 flex-col'}>
                {apiError ? (
                    <div className="px-3 pt-3 sm:px-4 sm:pt-4">
                        <StatusBanner
                            tone="warning"
                            title="We could not finish preparing the workspace"
                            action={
                                <a
                                    href={apiHealthUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-full border border-[color:var(--ui-border-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-color-primary)] transition-colors hover:border-[color:var(--ui-color-primary)]"
                                >
                                    View API health
                                </a>
                            }
                        >
                            {apiError}
                        </StatusBanner>
                    </div>
                ) : null}
                {isCreatingProject ? (
                    <LoadingWorkspaceCard
                        title="Preparing your workspace"
                        description="Loading the right board, editor, and simulator setup so you can start immediately."
                        actionLabel="Back to dashboard"
                        onAction={() => router.push('/dashboard')}
                    />
                ) : (
                    <div className="min-h-0 flex-1">
                        <SplitView />
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
