"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useBoard } from './BoardContext';
import { apiFetch, safeJson } from '@/lib/api';

export interface FileItem {
    id: string;
    name: string;
    content: string;
    type: string;
    parentId: string | null;
}

export interface ProjectContextValue {
    projectId: string | null;
    setProjectId: (id: string | null) => void;
    files: FileItem[];
    activeFileId: string | null;
    setActiveFileId: (id: string | null) => void;

    // Actions
    updateFileContent: (id: string, newContent: string) => void;
    refreshProjectFiles: () => Promise<void>;
    createFile: (name: string, type: string, parentId?: string | null, content?: string) => Promise<void>;
    saveProject: () => Promise<void>;

    // Status
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (val: boolean) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

function getPreferredSourceFileName(language: string | null, generator: string | null) {
    if (language === 'python' || generator === 'micropython') {
        return 'main.py';
    }
    return 'main.cpp';
}

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [projectId, setProjectIdState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('activeProjectId');
        }
        return null;
    });
    const [files, setFiles] = useState<FileItem[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const { token } = useAuth();
    const { currentBoard, codingMode, language, generator } = useBoard();

    const setProjectId = useCallback((id: string | null) => {
        setProjectIdState(id);
        if (typeof window !== 'undefined') {
            if (id) {
                localStorage.setItem('activeProjectId', id);
            } else {
                localStorage.removeItem('activeProjectId');
            }
        }
    }, []);

    // Initial Fetch when ProjectId is set
    const refreshProjectFiles = useCallback(async () => {
        if (!projectId || !token) return;
        try {
            const res = await apiFetch(`/api/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await safeJson<any>(res);
                const projectFiles: FileItem[] = Array.isArray(data?.files) ? data.files : [];
                setFiles(projectFiles);

                if (projectFiles.length > 0) {
                    const preferredSourceFileName = getPreferredSourceFileName(language, generator);

                    setActiveFileId((prev) => {
                        if (prev && projectFiles.some((f) => f.id === prev && f.type !== 'folder')) {
                            return prev;
                        }

                        const preferredFile = projectFiles.find((f) => f.name === preferredSourceFileName && f.type !== 'folder');
                        if (preferredFile) {
                            return preferredFile.id;
                        }

                        const firstCodeFile = projectFiles.find((f) => f.type !== 'folder' && f.name !== 'main.blockly');
                        if (firstCodeFile) {
                            return firstCodeFile.id;
                        }

                        const firstFile = projectFiles.find((f) => f.type !== 'folder');
                        return firstFile ? firstFile.id : prev;
                    });
                } else {
                    // Create a virtual file in memory automatically so block engine doesn't break
                    const virtualId = `virtual-${Date.now()}`;
                    setFiles([{ id: virtualId, name: 'main.cpp', type: 'cpp', content: '', parentId: null }]);
                    setActiveFileId(virtualId);
                    setHasUnsavedChanges(true); // Flag the virtual creation
                }
            } else {
                console.error('PROJECT CONTEXT: res != ok. Status:', res.status);
            }
        } catch (e) {
            console.error('Failed to fetch project files:', e);
        }
    }, [projectId, token, language, generator]);

    useEffect(() => {
        queueMicrotask(() => {
            void refreshProjectFiles();
        });
    }, [refreshProjectFiles]);

    // Local state updater - the actual DB save will be triggered separately (e.g. Save button)
    const updateFileContent = useCallback((id: string, newContent: string) => {
        setFiles((prevFiles) => {
            let changed = false;

            const nextFiles = prevFiles.map((file) => {
                if (file.id !== id) {
                    return file;
                }

                if (file.content === newContent) {
                    return file;
                }

                changed = true;
                return { ...file, content: newContent };
            });

            if (changed) {
                setHasUnsavedChanges(true);
                return nextFiles;
            }

            return prevFiles;
        });
    }, []);

    // Helper to create a new file and stage in local state
    const createFile = useCallback(async (name: string, type: string, parentId: string | null = null, content: string = '') => {
        if (!projectId) return;

        try {
            const normalizedName = name.trim();
            if (!normalizedName) return;

            let targetId: string | null = null;

            setFiles((prev) => {
                const existing = prev.find((file) => file.name === normalizedName && file.parentId === parentId);

                if (existing) {
                    targetId = existing.id;
                    return prev.map((file) =>
                        file.id === existing.id
                            ? { ...file, type, content }
                            : file
                    );
                }

                const newFileId = `temp-${Date.now()}`; // Temporary ID until backend syncs
                targetId = newFileId;
                const newFile: FileItem = {
                    id: newFileId,
                    name: normalizedName,
                    content,
                    type,
                    parentId
                };

                return [...prev, newFile];
            });

            if (type !== 'folder' && targetId) {
                setActiveFileId(targetId);
            }
            setHasUnsavedChanges(true);
        } catch (e) {
            console.error('Failed creating file', e);
        }
    }, [projectId]);

    const saveProject = useCallback(async () => {
        if (!projectId || !token) return;

        const metaDescription = codingMode
            ? `Board: ${currentBoard} | Mode: ${codingMode}`
            : undefined;

        try {
            const res = await apiFetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    files,
                    description: metaDescription
                })
            });
            if (res.ok) {
                setHasUnsavedChanges(false);
                await refreshProjectFiles();
            } else {
                console.error('Failed to save project sync to DB.');
            }
        } catch (e) {
            console.error('Save Project exception:', e);
        }
    }, [projectId, files, token, refreshProjectFiles, currentBoard, codingMode]);

    const value: ProjectContextValue = {
        projectId,
        setProjectId,
        files,
        activeFileId,
        setActiveFileId,
        updateFileContent,
        refreshProjectFiles,
        createFile,
        saveProject,
        hasUnsavedChanges,
        setHasUnsavedChanges
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}




