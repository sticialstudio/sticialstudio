"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoard } from '@/contexts/BoardContext';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import SplitView from '@/components/ide/SplitView';

export default function Workspace() {
    const router = useRouter();
    const { codingMode, currentBoard } = useBoard();
    const { projectId, setProjectId } = useProject();
    const { token } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (!codingMode || !currentBoard) {
            router.push('/');
        }
    }, [codingMode, currentBoard, router]);

    useEffect(() => {
        const initProject = async () => {
            try {
                if (!token || projectId) return;

                const res = await apiFetch('/api/projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const projects = await safeJson<any>(res);
                    if (Array.isArray(projects) && projects.length > 0) {
                        const storedProjectId = typeof window !== 'undefined' ? localStorage.getItem('activeProjectId') : null;
                        const preferredProject = storedProjectId
                            ? projects.find((project: { id: string }) => project.id === storedProjectId)
                            : null;

                        setProjectId(preferredProject ? preferredProject.id : projects[0].id);
                        setApiError(null);
                    } else if (Array.isArray(projects)) {
                        const modeForMeta = codingMode || 'block';
                        const createRes = await apiFetch('/api/projects', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                name: 'My First Journey',
                                description: `Board: ${currentBoard} | Mode: ${modeForMeta}`
                            })
                        });

                        if (createRes.ok) {
                            const newProject = await safeJson<any>(createRes);
                            if (newProject?.id) {
                                setProjectId(newProject.id);
                                setApiError(null);
                            } else {
                                setApiError('Unexpected response from the API.');
                            }
                        } else {
                            setApiError(`Failed to create project (status ${createRes.status}).`);
                        }
                    } else {
                        setApiError('Unexpected response from the API.');
                    }
                } else {
                    setApiError(`Failed to load projects (status ${res.status}).`);
                }
            } catch (error) {
                setApiError(`Could not reach the API at ${API_BASE_URL}.`);
                console.error('Failed to initialize project API:', error);
            }
        };

        initProject();
    }, [projectId, setProjectId, token, codingMode, currentBoard]);

    if (!codingMode || !currentBoard) return null;

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
                <div className="min-h-0 flex-1">
                    <SplitView />
                </div>
            </div>
        </MainLayout>
    );
}
