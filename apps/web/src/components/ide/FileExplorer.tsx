import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, File, FileCode, Folder, FolderOpen, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProject, FileItem } from '@/contexts/ProjectContext';
import { fadeInUp } from '@/components/ui/motion';

export default function FileExplorer() {
    const { files, activeFileId, setActiveFileId } = useProject();
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState('');

    const fileTree = useMemo(() => {
        const tree: FileItem[] = [];
        const childrenMap: Record<string, FileItem[]> = {};

        files.forEach(file => {
            if (file.parentId) {
                if (!childrenMap[file.parentId]) childrenMap[file.parentId] = [];
                childrenMap[file.parentId].push(file);
            } else {
                tree.push(file);
            }
        });

        const assembleTree = (nodes: FileItem[]) => {
            nodes.forEach(node => {
                if (childrenMap[node.id]) {
                    (node as any).children = childrenMap[node.id];
                    assembleTree((node as any).children);
                }
            });
        };
        assembleTree(tree);

        return tree;
    }, [files]);

    const filteredQuery = query.trim().toLowerCase();

    const toggleFolder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedFolders);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedFolders(next);
    };

    type UITreeNode = FileItem & { children?: UITreeNode[] };

    const nodeMatchesQuery = (item: UITreeNode): boolean => {
        if (!filteredQuery) return true;
        if (item.name.toLowerCase().includes(filteredQuery)) return true;
        return Boolean(item.children?.some(nodeMatchesQuery));
    };

    const visibleTree = useMemo(
        () => fileTree.filter((file) => nodeMatchesQuery(file as UITreeNode)),
        [fileTree, filteredQuery]
    );

    const FileNode = ({ item, depth = 0 }: { item: UITreeNode, depth?: number }) => {
        if (!nodeMatchesQuery(item)) return null;

        const isExpanded = expandedFolders.has(item.id) || Boolean(filteredQuery);
        const isActive = activeFileId === item.id;
        const paddingLeft = `${depth * 14 + 10}px`;

        if (item.type === 'folder') {
            return (
                <div className="space-y-1">
                    <button
                        type="button"
                        className="flex w-full items-center rounded-[14px] px-2 py-2 text-left text-[var(--ui-color-text-muted)] transition-colors hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]"
                        style={{ paddingLeft }}
                        onClick={(e) => toggleFolder(item.id, e)}
                    >
                        <span className="mr-2 flex h-5 w-5 items-center justify-center text-[var(--ui-color-text-soft)]">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <Folder size={15} className="mr-2 text-[var(--ui-color-accent)]" />
                        <span className="truncate text-sm font-medium text-[var(--ui-color-text)]">{item.name}</span>
                    </button>
                    {isExpanded && item.children?.map((child: UITreeNode) => (
                        <FileNode key={child.id} item={child} depth={depth + 1} />
                    ))}
                </div>
            );
        }

        return (
            <button
                type="button"
                className={`flex w-full items-center rounded-[14px] px-2 py-2 text-left transition-all ${isActive ? 'bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]' : 'text-[var(--ui-color-text-muted)] hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]'}`}
                style={{ paddingLeft }}
                onClick={() => setActiveFileId(item.id)}
            >
                <span className="mr-2 flex h-5 w-5 items-center justify-center" />
                {item.name.endsWith('.cpp') || item.name.endsWith('.h') ? (
                    <FileCode size={15} className={`mr-2 ${isActive ? 'text-white' : 'text-[var(--ui-color-primary)]'}`} />
                ) : (
                    <File size={15} className={`mr-2 ${isActive ? 'text-white' : 'text-[var(--ui-color-text-soft)]'}`} />
                )}
                <span className="truncate text-sm font-medium">{item.name}</span>
            </button>
        );
    };

    return (
        <motion.div className="flex h-full w-full flex-col overflow-hidden" variants={fadeInUp} initial="hidden" animate="visible">
            <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
                    <FolderOpen size={13} className="text-[var(--ui-color-primary)]" />
                    Files
                </div>
                <div className="relative mt-4">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-color-text-soft)]" />
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search files"
                        className="ui-input-surface h-11 w-full rounded-[16px] pl-10 pr-4 text-sm outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
                {files.length === 0 ? (
                    <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
                        Files will appear here when the workspace creates or loads them.
                    </div>
                ) : visibleTree.length === 0 ? (
                    <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
                        No files match that search.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {visibleTree.map((file) => <FileNode key={file.id} item={file as UITreeNode} />)}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
