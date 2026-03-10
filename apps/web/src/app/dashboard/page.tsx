"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useBoard, BoardKey, CodingMode } from '@/contexts/BoardContext';
import { BOARD_CONFIG } from '@/lib/boards/boardConfig';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import {
    CalendarClock,
    Edit2,
    FolderOpen,
    Layers3,
    Plus,
    Trash2,
    X
} from 'lucide-react';

interface ProjectData {
    id: string;
    name: string;
    description: string;
    updatedAt: string;
}

function parseProjectMeta(description: string): { board: BoardKey; mode: CodingMode } {
    let board: BoardKey = 'Arduino Uno';
    let mode: CodingMode = 'block';

    const boardMatch = description?.match(/Board: (.*?) \|/);
    const modeMatch = description?.match(/Mode: (.*?)$/);

    if (boardMatch && boardMatch[1]) {
        const matchedBoard = boardMatch[1] === 'Raspberry Pi 2W'
            ? 'Raspberry Pi Pico 2W'
            : boardMatch[1];

        if (Object.keys(BOARD_CONFIG).includes(matchedBoard)) {
            board = matchedBoard as BoardKey;
        }
    }

    if (modeMatch && (modeMatch[1] === 'block' || modeMatch[1] === 'text')) {
        mode = modeMatch[1] as CodingMode;
    }

    return { board, mode };
}

export default function DashboardPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const { setProjectId } = useProject();
    const { setCodingMode, setLanguage, setCurrentBoard, setGenerator } = useBoard();

    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('Untitled Project');
    const [newProjectMode, setNewProjectMode] = useState<CodingMode>('block');
    const [newProjectBoard, setNewProjectBoard] = useState<BoardKey>('Arduino Uno');

    const sortedBoards = useMemo(() => Object.keys(BOARD_CONFIG) as BoardKey[], []);

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

        fetchProjects();
    }, [token, router]);

    const handleOpenCreateModal = () => {
        setNewProjectName('Untitled Project');
        setNewProjectMode('block');
        setNewProjectBoard('Arduino Uno');
        setShowCreateModal(true);
    };

    const handleCreateSubmit = async () => {
        if (!newProjectName.trim() || !token) return;

        try {
            const res = await apiFetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newProjectName.trim(),
                    description: `Board: ${newProjectBoard} | Mode: ${newProjectMode}`
                })
            });
            const newProject = await safeJson<any>(res);

            if (res.ok && newProject) {
                const boardConfig = BOARD_CONFIG[newProjectBoard];

                setCodingMode(newProjectMode);
                setLanguage(boardConfig.language);
                setGenerator(boardConfig.generator);
                setCurrentBoard(newProjectBoard);

                setProjectId(newProject.id);
                setApiError(null);
                router.push('/projects/ide');
            } else {
                setApiError(newProject?.error || `Failed to create project (status ${res.status}).`);
            }
        } catch (error) {
            setApiError(`Could not reach the API at ${API_BASE_URL}.`);
            console.error('Create project error:', error);
        }
    };

    const handleOpenProject = (project: ProjectData) => {
        const parsed = parseProjectMeta(project.description);
        const boardConfig = BOARD_CONFIG[parsed.board];

        setCodingMode(parsed.mode);
        setLanguage(boardConfig.language);
        setGenerator(boardConfig.generator);
        setCurrentBoard(parsed.board);

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
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Project Workspace</p>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                                    Welcome back, {user?.name || 'Builder'}
                                </h1>
                                <p className="text-sm text-slate-400">Create, open, rename, and manage your embedded projects.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                            >
                                <Plus size={16} />
                                Create Project
                            </button>
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


                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-10 text-center text-slate-400">Loading projects...</div>
                    ) : projects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center">
                            <p className="text-lg font-semibold text-slate-100">No projects yet</p>
                            <p className="mt-2 text-sm text-slate-400">Start with your first project and choose your hardware target.</p>
                            <button
                                type="button"
                                onClick={handleOpenCreateModal}
                                className="mt-5 rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                            >
                                Create First Project
                            </button>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {projects.map((project, index) => {
                                const meta = parseProjectMeta(project.description);
                                return (
                                    <article
                                        key={project.id}
                                        onClick={() => handleOpenProject(project)}
                                        className="ui-fade-up group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60"
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
                                                        className="w-full rounded-lg border border-cyan-400/60 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none"
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
                                                    {meta.board}
                                                </p>
                                                <p className="line-clamp-2 text-sm text-slate-500">{project.description || 'No description provided.'}</p>
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
                        </section>
                    )}
                </div>

                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                                <h2 className="text-lg font-semibold text-slate-100">Create Project</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4 px-5 py-5">
                                <label className="block space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Project Name</span>
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-cyan-400/70 focus:outline-none"
                                    />
                                </label>

                                <label className="block space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Board</span>
                                    <select
                                        value={newProjectBoard}
                                        onChange={(e) => setNewProjectBoard(e.target.value as BoardKey)}
                                        className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 focus:border-cyan-400/70 focus:outline-none"
                                    >
                                        {sortedBoards.map((boardName) => (
                                            <option key={boardName} value={boardName}>
                                                {boardName}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Coding Mode</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewProjectMode('block')}
                                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                newProjectMode === 'block'
                                                    ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-200'
                                                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                                            }`}
                                        >
                                            Block Coding
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewProjectMode('text')}
                                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                newProjectMode === 'text'
                                                    ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-200'
                                                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                                            }`}
                                        >
                                            Text Coding
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-700 bg-slate-950/60 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateSubmit}
                                    disabled={!newProjectName.trim()}
                                    className="rounded-lg border border-cyan-400/70 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Create & Open
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}


