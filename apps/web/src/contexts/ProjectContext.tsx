"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useBoard } from "./BoardContext";
import { apiFetch, safeJson } from "@/lib/api";
import { parseProjectMeta, serializeProjectMeta } from "@/lib/projects/projectMeta";

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
  projectName: string;
  setProjectName: (name: string) => void;
  files: FileItem[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  updateFileContent: (id: string, newContent: string) => void;
  refreshProjectFiles: () => Promise<void>;
  createFile: (name: string, type: string, parentId?: string | null, content?: string) => Promise<void>;
  saveProject: () => Promise<void>;
  bootstrapOfflineFiles: (sourceFileName: string, language: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

function getPreferredSourceFileName(language: string | null, generator: string | null) {
  if (language === "python" || generator === "micropython") {
    return "main.py";
  }
  return "main.cpp";
}

function stashWorkspaceNotice(message: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("workspaceNotice", message);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeProjectId");
    }
    return null;
  });
  const [projectNameState, setProjectNameState] = useState("Untitled Project");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { token } = useAuth();
  const {
    currentBoard,
    codingMode,
    language,
    generator,
    environment,
    setCurrentBoard,
    setCodingMode,
    setLanguage,
    setGenerator,
    setEnvironment,
  } = useBoard();

  const setProjectId = useCallback((id: string | null) => {
    setProjectIdState(id);
    if (!id) {
      setProjectNameState("Untitled Project");
      setFiles([]);
      setActiveFileId(null);
    }

    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("activeProjectId", id);
      } else {
        localStorage.removeItem("activeProjectId");
      }
    }
  }, []);

  const setProjectName = useCallback((name: string) => {
    setProjectNameState(name);
    setHasUnsavedChanges(true);
  }, []);

  const refreshProjectFiles = useCallback(async () => {
    if (!projectId || !token) return;

    try {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 401) {
          console.warn(`[ProjectContext] Project ${projectId} not found (${res.status}). Clearing project state.`);
          stashWorkspaceNotice(
            res.status === 401
              ? "Your session ended before this project could load. Sign in again, then reopen your project."
              : "That project is no longer available. Open another project or start a new one."
          );
          setProjectId(null);
        } else {
          console.error("[ProjectContext] Unexpected error fetching project. Status:", res.status);
        }
        return;
      }

      const data = await safeJson<any>(res);
      const projectFiles: FileItem[] = Array.isArray(data?.files) ? data.files : [];
      const incomingProjectName = typeof data?.name === "string" && data.name.trim().length > 0 ? data.name : "Untitled Project";
      const projectMeta = parseProjectMeta(data?.description);
      const resolvedLanguage = projectMeta?.language ?? language;
      const resolvedGenerator = projectMeta?.generator ?? generator;

      if (projectMeta) {
        if (projectMeta.board !== currentBoard) setCurrentBoard(projectMeta.board as any);
        if (projectMeta.mode !== codingMode) setCodingMode(projectMeta.mode);
        if (projectMeta.language !== language) setLanguage(projectMeta.language);
        if (projectMeta.generator !== generator) setGenerator(projectMeta.generator);
        if (projectMeta.environment && projectMeta.environment !== environment) setEnvironment(projectMeta.environment);
      }

      setProjectNameState(incomingProjectName);
      setFiles(projectFiles);

      if (projectFiles.length === 0) {
        const virtualId = `virtual-${Date.now()}`;
        setProjectNameState(incomingProjectName);
        setFiles([{ id: virtualId, name: getPreferredSourceFileName(resolvedLanguage, resolvedGenerator), type: getPreferredSourceFileName(resolvedLanguage, resolvedGenerator) === "main.py" ? "python" : "cpp", content: "", parentId: null }]);
        setActiveFileId(virtualId);
        setHasUnsavedChanges(true);
        return;
      }

      const preferredSourceFileName = getPreferredSourceFileName(resolvedLanguage, resolvedGenerator);

      setActiveFileId((prev) => {
        if (prev && projectFiles.some((file) => file.id === prev && file.type !== "folder")) {
          return prev;
        }

        const preferredFile = projectFiles.find((file) => file.name === preferredSourceFileName && file.type !== "folder");
        if (preferredFile) {
          return preferredFile.id;
        }

        const firstCodeFile = projectFiles.find((file) => file.type !== "folder" && file.name !== "main.blockly");
        if (firstCodeFile) {
          return firstCodeFile.id;
        }

        const firstFile = projectFiles.find((file) => file.type !== "folder");
        return firstFile ? firstFile.id : prev;
      });
    } catch (error) {
      console.error("Failed to fetch project files:", error);
    }
  }, [codingMode, currentBoard, environment, generator, language, projectId, setCodingMode, setCurrentBoard, setEnvironment, setGenerator, setLanguage, setProjectId, token]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshProjectFiles();
    });
  }, [refreshProjectFiles]);

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

      if (!changed) {
        return prevFiles;
      }

      setHasUnsavedChanges(true);
      return nextFiles;
    });
  }, []);

  const createFile = useCallback(async (name: string, type: string, parentId: string | null = null, content = "") => {
    if (!projectId) return;

    try {
      const normalizedName = name.trim();
      if (!normalizedName) return;

      let targetId: string | null = null;

      setFiles((prevFiles) => {
        const existing = prevFiles.find((file) => file.name === normalizedName && file.parentId === parentId);

        if (existing) {
          targetId = existing.id;
          return prevFiles.map((file) =>
            file.id === existing.id ? { ...file, type, content } : file
          );
        }

        const newFileId = `temp-${Date.now()}`;
        targetId = newFileId;
        const nextFile: FileItem = {
          id: newFileId,
          name: normalizedName,
          content,
          type,
          parentId,
        };

        return [...prevFiles, nextFile];
      });

      if (type !== "folder" && targetId) {
        setActiveFileId(targetId);
      }

      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Failed creating file", error);
    }
  }, [projectId]);

  const saveProject = useCallback(async () => {
    if (!projectId) {
      throw new Error("Open or create a project first.");
    }

    if (!token) {
      throw new Error("Your session ended. Sign in again to save this project.");
    }

    const metaDescription = serializeProjectMeta({
      board: currentBoard,
      mode: codingMode ?? "block",
      language,
      generator,
      environment,
    });

    try {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectNameState.trim() || "Untitled Project",
          files,
          description: metaDescription,
        }),
      });

      if (!res.ok) {
        const data = await safeJson<{ error?: string }>(res);
        const defaultMessage =
          res.status === 401
            ? "Your session ended. Sign in again to save this project."
            : res.status === 404
              ? "This project no longer exists. Return to the dashboard and open another project."
              : `Could not save the project right now (status ${res.status}).`;
        throw new Error(data?.error || defaultMessage);
      }

      setHasUnsavedChanges(false);
      await refreshProjectFiles();
    } catch (error) {
      console.error("Save Project exception:", error);
      throw error instanceof Error ? error : new Error("Could not save the project right now.");
    }
  }, [codingMode, currentBoard, environment, files, generator, language, projectId, projectNameState, refreshProjectFiles, token]);

  const bootstrapOfflineFiles = useCallback((sourceFileName: string, languageName: string) => {
    if (files.length > 0) return;

    const sourceId = `offline-src-${Date.now()}`;
    const blocklyId = `offline-blockly-${Date.now() + 1}`;
    const initialCode =
      languageName === "python"
        ? "import time\n\n# Setup\n\n# Loop\nwhile True:\n    pass\n"
        : "void setup() {\n  // Setup logic\n}\n\nvoid loop() {\n  // Loop logic\n}\n";

    setProjectNameState("Untitled Project");
    setFiles([
      { id: sourceId, name: sourceFileName, type: languageName === "python" ? "python" : "cpp", content: initialCode, parentId: null },
      { id: blocklyId, name: "main.blockly", type: "blockly", content: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>', parentId: null },
    ]);
    setActiveFileId(sourceId);
  }, [files.length]);

  const value: ProjectContextValue = {
    projectId,
    setProjectId,
    projectName: projectNameState,
    setProjectName,
    files,
    activeFileId,
    setActiveFileId,
    updateFileContent,
    refreshProjectFiles,
    createFile,
    saveProject,
    bootstrapOfflineFiles,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}

