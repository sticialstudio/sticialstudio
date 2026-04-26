"use client";

import { create } from "zustand";

export interface FileItem {
  id: string;
  name: string;
  content: string;
  type: string;
  parentId: string | null;
}

interface EditorStoreState {
  files: FileItem[];
  activeFileId: string | null;
  hasUnsavedChanges: boolean;
}

interface EditorStoreActions {
  setFiles: (files: FileItem[]) => void;
  resetEditorState: () => void;
  setActiveFileId: (id: string | null) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  updateFileContent: (id: string, newContent: string) => void;
  renameFile: (id: string, newName: string) => void;
  deleteFile: (id: string) => void;
  createFile: (name: string, type: string, parentId?: string | null, content?: string) => string | null;
  initializeWorkspaceFiles: (sourceFileName: string, language: string, defaultCode?: string) => void;
  bootstrapOfflineFiles: (sourceFileName: string, language: string, defaultCode?: string) => void;
}

export type EditorStore = EditorStoreState & EditorStoreActions;

function fileArraysEqual(left: FileItem[], right: FileItem[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((file, index) => {
    const next = right[index];
    return (
      file.id === next.id &&
      file.name === next.name &&
      file.content === next.content &&
      file.type === next.type &&
      file.parentId === next.parentId
    );
  });
}

function normalizeFileName(name: string) {
  return name.trim();
}

function buildDefaultCode(language: string, defaultCode?: string) {
  if (defaultCode) {
    return defaultCode;
  }

  if (language === "python") {
    return "import time\n\n# Setup\n\n# Loop\nwhile True:\n    pass\n";
  }

  return "void setup() {\n  // put your setup code here, to run once:\n\n}\n\nvoid loop() {\n  // put your main code here, to run repeatedly:\n\n}\n";
}

function buildStarterFiles(sourceFileName: string, language: string, defaultCode?: string) {
  const sourceId = `offline-src-${Date.now()}`;
  const blocklyId = `offline-blockly-${Date.now() + 1}`;

  return {
    sourceId,
    files: [
      {
        id: sourceId,
        name: sourceFileName,
        type: language === "python" ? "python" : "cpp",
        content: buildDefaultCode(language, defaultCode),
        parentId: null,
      },
      {
        id: blocklyId,
        name: "main.blockly",
        type: "blockly",
        content: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        parentId: null,
      },
    ] as FileItem[],
  };
}

export const useEditorStore = create<EditorStore>((set) => ({
  files: [],
  activeFileId: null,
  hasUnsavedChanges: false,

  setFiles: (files) =>
    set((state) => {
      if (fileArraysEqual(state.files, files)) {
        return state;
      }

      return { files };
    }),

  resetEditorState: () =>
    set({
      files: [],
      activeFileId: null,
      hasUnsavedChanges: false,
    }),

  setActiveFileId: (id) =>
    set((state) => (state.activeFileId === id ? state : { activeFileId: id })),

  setHasUnsavedChanges: (value) =>
    set((state) => (state.hasUnsavedChanges === value ? state : { hasUnsavedChanges: value })),

  updateFileContent: (id, newContent) =>
    set((state) => {
      let changed = false;
      const files = state.files.map((file) => {
        if (file.id !== id || file.content === newContent) {
          return file;
        }

        changed = true;
        return { ...file, content: newContent };
      });

      if (!changed) {
        return state;
      }

      return {
        files,
        hasUnsavedChanges: true,
      };
    }),

  renameFile: (id, newName) =>
    set((state) => {
      const trimmedName = normalizeFileName(newName);
      if (!trimmedName) {
        return state;
      }

      let changed = false;
      const files = state.files.map((file) => {
        if (file.id !== id || file.name === trimmedName) {
          return file;
        }

        changed = true;
        return { ...file, name: trimmedName };
      });

      if (!changed) {
        return state;
      }

      return {
        files,
        hasUnsavedChanges: true,
      };
    }),

  deleteFile: (id) =>
    set((state) => {
      if (!state.files.some((file) => file.id === id)) {
        return state;
      }

      const toDelete = new Set<string>();
      const collectChildren = (parentId: string) => {
        toDelete.add(parentId);
        state.files.forEach((file) => {
          if (file.parentId === parentId) {
            collectChildren(file.id);
          }
        });
      };
      collectChildren(id);

      const files = state.files.filter((file) => !toDelete.has(file.id));
      const activeFileId =
        state.activeFileId && toDelete.has(state.activeFileId)
          ? files.find((file) => file.type !== "folder" && file.name !== "main.blockly")?.id ?? files[0]?.id ?? null
          : state.activeFileId;

      return {
        files,
        activeFileId,
        hasUnsavedChanges: true,
      };
    }),

  createFile: (name, type, parentId = null, content = "") => {
    const normalizedName = normalizeFileName(name);
    if (!normalizedName) {
      return null;
    }

    let targetId: string | null = null;

    set((state) => {
      const existing = state.files.find((file) => file.name === normalizedName && file.parentId === parentId);

      if (existing) {
        targetId = existing.id;
        return {
          files: state.files.map((file) =>
            file.id === existing.id
              ? {
                  ...file,
                  type,
                  content,
                }
              : file,
          ),
          activeFileId: type !== "folder" ? existing.id : state.activeFileId,
          hasUnsavedChanges: true,
        };
      }

      const newFileId = `temp-${Date.now()}`;
      targetId = newFileId;
      return {
        files: [
          ...state.files,
          {
            id: newFileId,
            name: normalizedName,
            content,
            type,
            parentId,
          },
        ],
        activeFileId: type !== "folder" ? newFileId : state.activeFileId,
        hasUnsavedChanges: true,
      };
    });

    return targetId;
  },

  initializeWorkspaceFiles: (sourceFileName, language, defaultCode) =>
    set(() => {
      const starter = buildStarterFiles(sourceFileName, language, defaultCode);
      return {
        files: starter.files,
        activeFileId: starter.sourceId,
        hasUnsavedChanges: false,
      };
    }),

  bootstrapOfflineFiles: (sourceFileName, language, defaultCode) =>
    set((state) => {
      if (state.files.length > 0) {
        return state;
      }

      const starter = buildStarterFiles(sourceFileName, language, defaultCode);
      return {
        files: starter.files,
        activeFileId: starter.sourceId,
        hasUnsavedChanges: false,
      };
    }),
}));
