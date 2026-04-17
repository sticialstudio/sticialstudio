import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  Folder,
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, type FileItem } from '@/stores/editorStore';
import { useSplitViewEventBus } from './split-view/SplitViewEventBus';
import { fadeInUp } from '@/components/ui/motion';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type UITreeNode = FileItem & { children?: UITreeNode[] };

function inferFileType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.cpp') || lower.endsWith('.ino') || lower.endsWith('.h')) return 'cpp';
    if (lower.endsWith('.py')) return 'python';
    if (lower.endsWith('.blockly') || lower.endsWith('.xml')) return 'blockly';
    return 'text';
}

// â”€â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function nodeMatchesQuery(item: UITreeNode, query: string): boolean {
  if (!query) return true;
  if (item.name.toLowerCase().includes(query)) return true;
  return Boolean(item.children?.some((child) => nodeMatchesQuery(child, query)));
}

// â”€â”€â”€ FileNode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface FileNodeProps {
  item: UITreeNode;
  depth: number;
  activeFileId: string | null;
  filteredQuery: string;
  expandedFolders: Set<string>;
  editingId: string | null;
  onSelect: (id: string) => void;
  onToggleFolder: (id: string, e: React.MouseEvent) => void;
  onStartRename: (id: string, e: React.MouseEvent) => void;
  onRenameSubmit: (id: string, newName: string) => void;
  onRenameCancel: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function FileNode({
  item,
  depth,
  activeFileId,
  filteredQuery,
  expandedFolders,
  editingId,
  onSelect,
  onToggleFolder,
  onStartRename,
  onRenameSubmit,
  onRenameCancel,
  onDelete,
}: FileNodeProps) {
  const [localName, setLocalName] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId === item.id;

  useEffect(() => {
    if (isEditing) {
      setLocalName(item.name);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, item.name]);

  if (!nodeMatchesQuery(item, filteredQuery)) return null;

  const isExpanded = expandedFolders.has(item.id) || Boolean(filteredQuery);
  const isActive = activeFileId === item.id;
  const paddingLeft = `${depth * 14 + 10}px`;

  const handleSaveRename = () => {
    const fresh = localName.trim();
    if (fresh && fresh !== item.name) {
      onRenameSubmit(item.id, fresh);
    } else {
      onRenameCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') onRenameCancel();
  };

  if (item.type === 'folder') {
    return (
      <div className="space-y-1">
        <div
          role="button"
          tabIndex={0}
          className="group flex w-full cursor-pointer items-center rounded-[14px] px-2 py-2 text-left text-[var(--ui-color-text-muted)] transition-colors hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]"
          style={{ paddingLeft }}
          onClick={(e) => onToggleFolder(item.id, e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleFolder(item.id, e as unknown as React.MouseEvent);
            }
          }}
        >
          <span className="mr-2 flex h-5 w-5 items-center justify-center text-[var(--ui-color-text-soft)]">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Folder size={15} className="mr-2 text-[var(--ui-color-accent)]" />
          
          {isEditing ? (
            <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                className="ui-input-surface min-w-0 flex-1 rounded px-1.5 py-0.5 text-sm text-white outline-none"
              />
            </div>
          ) : (
            <span className="flex-1 truncate text-sm font-medium text-[var(--ui-color-text)]">{item.name}</span>
          )}

          {!isEditing && (
             <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                <button title="Rename" className="rounded p-1 hover:bg-white/10 hover:text-white" onClick={(e) => onStartRename(item.id, e)}>
                  <Edit2 size={13} />
                </button>
                <button title="Delete" className="rounded p-1 hover:bg-red-500/20 hover:text-red-400" onClick={(e) => onDelete(item.id, e)}>
                  <Trash2 size={13} />
                </button>
             </div>
          )}
        </div>
        {isExpanded &&
          item.children?.map((child) => (
            <FileNode
              key={child.id}
              item={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              filteredQuery={filteredQuery}
              expandedFolders={expandedFolders}
              editingId={editingId}
              onSelect={onSelect}
              onToggleFolder={onToggleFolder}
              onStartRename={onStartRename}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onDelete={onDelete}
            />
          ))}
      </div>
    );
  }

  const isCpp = item.name.endsWith('.cpp') || item.name.endsWith('.h') || item.name.endsWith('.ino');

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group flex w-full cursor-pointer items-center rounded-[14px] px-2 py-2 text-left transition-all ${
        isActive
          ? 'bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]'
          : 'text-[var(--ui-color-text-muted)] hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]'
      }`}
      style={{ paddingLeft }}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item.id);
        }
      }}
    >
      <span className="mr-2 flex h-5 w-5 items-center justify-center" />
      {isCpp ? (
        <FileCode size={15} className={`mr-2 flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--ui-color-primary)]'}`} />
      ) : (
        <File size={15} className={`mr-2 flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--ui-color-text-soft)]'}`} />
      )}
      
      {isEditing ? (
        <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 rounded bg-black/20 px-1.5 py-0.5 text-sm text-white outline-none ring-1 ring-white/30"
          />
        </div>
      ) : (
        <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
      )}

      {!isEditing && item.name !== 'main.blockly' && (
         <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <button title="Rename" className="rounded p-1 hover:bg-white/20 hover:text-white" onClick={(e) => onStartRename(item.id, e)}>
              <Edit2 size={13} />
            </button>
            <button title="Delete" className="rounded p-1 hover:bg-red-500/30 hover:text-red-100" onClick={(e) => onDelete(item.id, e)}>
              <Trash2 size={13} />
            </button>
         </div>
      )}
    </div>
  );
}

// â”€â”€â”€ FileExplorer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function FileExplorer() {
  const files = useEditorStore((state) => state.files);
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const setActiveFileId = useEditorStore((state) => state.setActiveFileId);
  const createFile = useEditorStore((state) => state.createFile);
  const deleteFile = useEditorStore((state) => state.deleteFile);
  const renameFile = useEditorStore((state) => state.renameFile);
  const eventBus = useSplitViewEventBus();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const filteredQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (isCreatingFile) {
      setTimeout(() => newFileInputRef.current?.focus(), 50);
    }
  }, [isCreatingFile]);

  // Build tree structure from flat files array
  const fileTree = useMemo<UITreeNode[]>(() => {
    const tree: UITreeNode[] = [];
    const childrenMap: Record<string, UITreeNode[]> = {};

    files.forEach((file) => {
      if (file.parentId) {
        if (!childrenMap[file.parentId]) childrenMap[file.parentId] = [];
        childrenMap[file.parentId].push({ ...file });
      } else {
        tree.push({ ...file });
      }
    });

    const assembleTree = (nodes: UITreeNode[]) => {
      nodes.forEach((node) => {
        if (childrenMap[node.id]) {
          node.children = childrenMap[node.id];
          assembleTree(node.children);
        }
      });
    };
    assembleTree(tree);
    return tree;
  }, [files]);

  // filteredQuery IS in deps here â€” no stale closure
  const visibleTree = useMemo(
    () => fileTree.filter((file) => nodeMatchesQuery(file, filteredQuery)),
    [fileTree, filteredQuery]
  );

  const handleToggleFolder = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => setActiveFileId(id),
    [setActiveFileId]
  );

  const handleStartRename = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
  }, []);

  const handleRenameSubmit = useCallback((id: string, newName: string) => {
    const trimmedName = newName.trim();
    const targetFile = files.find((file) => file.id === id);
    if (!targetFile) {
      setEditingId(null);
      return;
    }

    if (trimmedName && trimmedName !== targetFile.name) {
      renameFile(id, trimmedName);
      eventBus.emit('USER_EDITED', { source: 'file-tree', timestamp: Date.now() });
    }
    setEditingId(null);
  }, [eventBus, files, renameFile]);

  const handleRenameCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (confirmed) {
      deleteFile(id);
      eventBus.emit('USER_EDITED', { source: 'file-tree', timestamp: Date.now() });
    }
  }, [deleteFile, eventBus]);

  const handleSubmitNewFile = async () => {
    const fresh = newFileName.trim();
    if (fresh) {
      // Create at root for now
      const createdFileId = await createFile(fresh, inferFileType(fresh), null, "");
      if (createdFileId) {
        eventBus.emit('USER_EDITED', { source: 'file-tree', timestamp: Date.now() });
      }
    }
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const handleNewFileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleSubmitNewFile();
    if (e.key === 'Escape') {
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  return (
    <motion.div
      className="flex h-full w-full flex-col overflow-hidden"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
            <FolderOpen size={13} className="text-[var(--ui-color-primary)]" />
            Files
          </div>
          <button 
            title="New File"
            onClick={() => setIsCreatingFile(true)}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/5 text-[var(--ui-color-text-soft)] transition-colors hover:bg-white/10 hover:text-white"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="relative mt-4">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-color-text-soft)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files"
            className="ui-input-surface h-11 w-full rounded-[16px] pl-10 pr-4 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isCreatingFile && (
           <div className="mb-2 flex w-full items-center rounded-[14px] bg-[color:var(--ui-surface-elevated)] px-2 py-2 shadow-sm">
             <span className="mr-2 flex h-5 w-5 items-center justify-center" />
             <File size={15} className="mr-2 text-[var(--ui-color-text-soft)]" />
             <div className="flex w-full items-center gap-2">
                <input
                  ref={newFileInputRef}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onBlur={() => void handleSubmitNewFile()}
                  onKeyDown={handleNewFileKeyDown}
                  placeholder="filename.cpp"
                  className="ui-input-surface w-full flex-1 rounded px-1.5 py-0.5 text-sm text-white outline-none"
                />
             </div>
           </div>
        )}

        {files.length === 0 ? (
          <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
            Files will appear here when the workspace creates or loads them.
          </div>
        ) : visibleTree.length === 0 && !isCreatingFile ? (
          <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
            No files match that search.
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {visibleTree.map((file) => (
              <FileNode
                key={file.id}
                item={file}
                depth={0}
                activeFileId={activeFileId}
                filteredQuery={filteredQuery}
                expandedFolders={expandedFolders}
                editingId={editingId}
                onSelect={handleSelect}
                onToggleFolder={handleToggleFolder}
                onStartRename={handleStartRename}
                onRenameSubmit={handleRenameSubmit}
                onRenameCancel={handleRenameCancel}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

