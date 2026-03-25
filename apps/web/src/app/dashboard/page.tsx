"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useBoard } from '@/contexts/BoardContext';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import { getProjectMetaSummary, parseProjectMeta } from '@/lib/projects/projectMeta';
import {
    ArrowRight,
    BookOpen,
    CalendarClock,
    Edit2,
    FolderOpen,
    Layers3,
    Plus,
    Trash2
} from 'lucide-react';

interface ProjectData {
    id: string;
    name: string;
    description: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const { setProjectId } = useProject();
    const { setCodingMode, setLanguage, setCurrentBoard, setGenerator, setEnvironment } = useBoard();

    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const recentProjects = useMemo(() => projects.slice(0, 6), [projects]);

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchProjects = async () => {
            try {
                const res = await apiFetch('/api/projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await safeJson<any>(res);
                    if (Array.isArray(data)) {
                        setProjects(data);
                        setApiError(null);
                    } else {
                        setApiError('Unexpected response from the API.');
                    }
                } else {
                    setApiError(`Failed to load projects (status ${res.status}).`);
                }
            } catch (error) {
                setApiError(`Could not reach the API at ${API_BASE_URL}.`);
                console.error('Failed to fetch dashboard projects:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchProjects();
    }, [token, router]);

    const handleStartBuild = () => {
        setProjectId(null);
        router.push('/projects/select-mode');
    };

    const handleOpenProject = (project: ProjectData) => {
        const meta = parseProjectMeta(project.description);

        if (meta) {
            setCodingMode(meta.mode);
            setLanguage(meta.language);
            setGenerator(meta.generator);
            setCurrentBoard(meta.board as any);
            if (meta.environment) {
                setEnvironment(meta.environment);
            }
        }

        setProjectId(project.id);
        router.push('/projects/ide');
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!token) return;
        if (!confirm('Delete this project permanently?')) return;

        try {
            const res = await apiFetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setProjects((prev) => prev.filter((p) => p.id !== id));
                setApiError(null);
            } else {
                setApiError(`Failed to delete project (status ${res.status}).`);
            }
        } catch (error) {
            setApiError(`Could not reach the API at ${API_BASE_URL}.`);
            console.error('Delete error:', error);
        }
    };

    const handleStartRename = (e: React.MouseEvent, project: ProjectData) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setEditName(project.name);
    };

    const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, id: string) => {
        e.stopPropagation();
        if (!token) return;
        if (!editName.trim()) {
            setEditingProjectId(null);
            return;
        }

        try {
            const res = await apiFetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: editName.trim() })
            });

            if (res.ok) {
                setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: editName.trim() } : p)));
                setApiError(null);
            } else {
                setApiError(`Failed to rename project (status ${res.status}).`);
            }
        } catch (error) {
            setApiError(`Could not reach the API at ${API_BASE_URL}.`);
            console.error('Rename error:', error);
        } finally {
            setEditingProjectId(null);
        }
    };

    return (
        <MainLayout>
            <div className="min-h-full overflow-y-auto app-canvas px-4 py-6 text-foreground sm:px-6 sm:py-8">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <header className="ui-fade-up rounded-3xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.95)] sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Workspace Home</p>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                                    Welcome back, {user?.name || 'Builder'}
                                </h1>
                                <p className="max-w-2xl text-sm text-slate-400">
                                    Pick up a saved project, start a new build, or jump into a guided course. If you are unsure where to start, choose Build Project for a fresh workflow or Study Course for step-by-step help.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.push('/courses')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-950/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                                >
                                    <BookOpen size={16} />
                                    Study Course
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStartBuild}
                                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                                >
                                    <Plus size={16} />
                                    Build Project
                                </button>
                            </div>
                        </div>
                    </header>

                    {apiError ? (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                            {apiError}
                            <div className="mt-2 text-xs text-rose-300/80">
                                API: <span className="font-mono text-rose-100/80">{API_BASE_URL}</span>
                            </div>
                        </div>
                    ) : null}

                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
                        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Projects</p>
                                    <h2 className="mt-1 text-xl font-semibold text-slate-100">Recent work</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleStartBuild}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-200"
                                >
                                    New Build <ArrowRight size={15} />
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-10 text-center text-slate-400">Loading projects...</div>
                            ) : recentProjects.length === 0 ? (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center">
                                    <p className="text-lg font-semibold text-slate-100">No saved projects yet</p>
                                    <p className="mt-2 text-sm text-slate-400">Start with the guided build flow and your workspace will be ready to save and reopen later.</p>
                                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleStartBuild}
                                            className="rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                                        >
                                            Start First Build
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.push('/courses')}
                                            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                                        >
                                            Try a Guided Course
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {recentProjects.map((project, index) => {
                                        const meta = parseProjectMeta(project.description);
                                        return (
                                            <article
                                                key={project.id}
                                                onClick={() => handleOpenProject(project)}
                                                className="ui-fade-up group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60"
                                                style={{ animationDelay: `${60 + index * 28}ms` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                                <div className="relative z-10 space-y-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        {editingProjectId === project.id ? (
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                onBlur={(e) => handleSaveRename(e, project.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveRename(e, project.id);
                                                                    if (e.key === 'Escape') setEditingProjectId(null);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full rounded-lg border border-cyan-400/60 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none"
                                                            />
                                                        ) : (
                                                            <h3 className="line-clamp-2 text-lg font-semibold text-slate-100">{project.name}</h3>
                                                        )}

                                                        <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleStartRename(e, project)}
                                                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-200"
                                                                title="Rename"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-300"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-sm text-slate-400">
                                                        <p className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                                                            <Layers3 size={13} className="text-cyan-300" />
                                                            {meta?.board || 'Project Setup'}
                                                        </p>
                                                        <p className="line-clamp-2 text-sm text-slate-400">{getProjectMetaSummary(meta)}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-slate-700/70 pt-3 text-xs text-slate-500">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CalendarClock size={13} />
                                                            {new Date(project.updatedAt).toLocaleDateString()}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 text-cyan-300">
                                                            <FolderOpen size={13} />
                                                            Open
                                                        </span>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <aside className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next Steps</p>
                            <h2 className="mt-1 text-xl font-semibold text-slate-100">Keep momentum</h2>
                            <div className="mt-5 space-y-4 text-sm text-slate-300">
                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                    <p className="font-semibold text-slate-100">Start here if you want a quick win</p>
                                    <p className="mt-1 text-slate-400">Use Build Project, choose a virtual Arduino, place a few parts, then move straight into code and simulation.</p>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                    <p className="font-semibold text-slate-100">Try a guided lesson if you want structure</p>
                                    <p className="mt-1 text-slate-400">Open Study Course to follow CODER, AIDER, or ROVA lessons and launch matching builds from there.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleStartBuild}
                                        className="rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                                    >
                                        Start Project
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/courses')}
                                        className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                                    >
                                        Open Courses
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}


