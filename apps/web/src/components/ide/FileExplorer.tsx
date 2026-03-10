import React, { useState, useMemo } from 'react';
import { Folder, FileCode, File, ChevronRight, ChevronDown, Plus, MoreVertical } from 'lucide-react';
import { useProject, FileItem } from '@/contexts/ProjectContext';
import { useBoard } from '@/contexts/BoardContext';

export default function FileExplorer() {
    const { files, activeFileId, setActiveFileId, createFile } = useProject();
    const { language, codingMode } = useBoard();
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Compute the nested tree structure from the flat DB file array
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

        // Mutate children bindings into the tree structure
        // Note: For now, React files map is flat, but we set up the algorithm for actual tree processing
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

    const toggleFolder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedFolders(newExpanded);
    };

    // Use an extended type here that maps the generic DB FileItem to have optional children
    type UITreeNode = FileItem & { children?: UITreeNode[] };

    const FileNode = ({ item, depth = 0 }: { item: UITreeNode, depth?: number }) => {
        const isExpanded = expandedFolders.has(item.id);
        const isActive = activeFileId === item.id;
        const paddingLeft = `${depth * 12 + 8}px`;

        if (item.type === 'folder') {
            return (
                <div>
                    <div
                        className="flex items-center py-1.5 px-2 hover:bg-slate-800/40 cursor-pointer text-slate-300 select-none group transition-colors"
                        style={{ paddingLeft }}
                        onClick={(e) => toggleFolder(item.id, e)}
                    >
                        <span className="w-4 h-4 flex items-center justify-center mr-1 text-slate-500 group-hover:text-slate-300 transition-colors">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <Folder size={14} className="mr-2 text-indigo-400" />
                        <span className="text-sm truncate">{item.name}</span>
                    </div>
                    {isExpanded && item.children?.map((child: UITreeNode) => (
                        <FileNode key={child.id} item={child} depth={depth + 1} />
                    ))}
                </div>
            );
        }

        return (
            <div
                className={`flex items-center py-1.5 px-2 cursor-pointer select-none group transition-colors ${isActive ? 'bg-accent/15 text-accent border-r-2 border-accent' : 'hover:bg-slate-800/40 text-slate-400'}`}
                style={{ paddingLeft }}
                onClick={() => setActiveFileId(item.id)}
            >
                <span className="w-4 h-4 mr-1"></span> {/* Spacer for alignment */}
                {item.name.endsWith('.cpp') || item.name.endsWith('.h') ? (
                    <FileCode size={14} className={`mr-2 ${isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'}`} />
                ) : (
                    <File size={14} className={`mr-2 ${isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'}`} />
                )}
                <span className="text-sm truncate">{item.name}</span>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#0f111a] border-r border-panel-border hide-scrollbar overflow-hidden">
            {/* Header */}
            <div className="h-8 flex items-center justify-between px-3 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Explorer</span>
                <div className="flex space-x-1">
                    <button className="p-1 rounded text-slate-500 hover:text-foreground hover:bg-slate-800 transition-colors" title="New File">
                        <Plus size={14} />
                    </button>
                    <button className="p-1 rounded text-slate-500 hover:text-foreground hover:bg-slate-800 transition-colors">
                        <MoreVertical size={14} />
                    </button>
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto py-1">
                {files.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">No files in project...</div>
                ) : (
                    fileTree.map((file) => <FileNode key={file.id} item={file as UITreeNode} />)
                )}
            </div>
        </div>
    );
}
