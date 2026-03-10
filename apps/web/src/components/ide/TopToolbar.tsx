"use client";

import {
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  Link2,
  Link2Off,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Rocket,
  Save
} from 'lucide-react';

interface TopToolbarProps {
  boardName: string;
  isConnected: boolean;
  isCompiling: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  bottomCollapsed: boolean;
  onVerify: () => void;
  onUpload: () => void;
  onConnectDevice: () => void;
  onSelectBoard: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleBottom: () => void;
}

const actionButtonClass =
  'shrink-0 inline-flex h-9 items-center gap-2 rounded-lg border border-panel-border bg-panel px-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/70 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3';

export default function TopToolbar({
  boardName,
  isConnected,
  isCompiling,
  isSaving,
  hasUnsavedChanges,
  leftCollapsed,
  rightCollapsed,
  bottomCollapsed,
  onVerify,
  onUpload,
  onConnectDevice,
  onSelectBoard,
  onSaveProject,
  onOpenProject,
  onToggleLeft,
  onToggleRight,
  onToggleBottom
}: TopToolbarProps) {
  return (
    <header className="ui-fade-up flex min-h-14 flex-col gap-2 rounded-xl border border-panel-border bg-panel px-2 py-2 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
        <button type="button" onClick={onVerify} disabled={isCompiling} className={actionButtonClass}>
          <CheckCircle2 size={14} />
          <span>{isCompiling ? 'Verifying...' : 'Verify'}</span>
        </button>
        <button type="button" onClick={onUpload} disabled={isCompiling} className={actionButtonClass}>
          <Rocket size={14} />
          <span>Upload</span>
        </button>
        <button type="button" onClick={onConnectDevice} className={actionButtonClass}>
          {isConnected ? <Link2Off size={14} /> : <Link2 size={14} />}
          <span className="hidden sm:inline">Connect Device</span>
          <span className="sm:hidden">Connect</span>
        </button>
        <button type="button" onClick={onSelectBoard} className={actionButtonClass}>
          <ChevronDown size={14} />
          <span className="hidden sm:inline">Select Board</span>
          <span className="sm:hidden">Board</span>
        </button>
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center px-2 lg:flex">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Active Board: <span className="text-accent">{boardName}</span>
        </p>
      </div>

      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1">
        <button type="button" onClick={onSaveProject} disabled={isSaving} className={actionButtonClass}>
          <Save size={14} />
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Project'}</span>
          <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
          {hasUnsavedChanges ? <span className="ml-1 h-2 w-2 rounded-full bg-amber-400" /> : null}
        </button>
        <button type="button" onClick={onOpenProject} className={actionButtonClass}>
          <FolderOpen size={14} />
          <span className="hidden sm:inline">Open Project</span>
          <span className="sm:hidden">Open</span>
        </button>

        <div className="ml-1 flex shrink-0 items-center gap-1 rounded-lg border border-panel-border bg-panel p-1">
          <button
            type="button"
            onClick={onToggleLeft}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
            title={leftCollapsed ? 'Show left panel' : 'Hide left panel'}
          >
            {leftCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
          <button
            type="button"
            onClick={onToggleRight}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
            title={rightCollapsed ? 'Show right panel' : 'Hide right panel'}
          >
            {rightCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
          </button>
          <button
            type="button"
            onClick={onToggleBottom}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
            title={bottomCollapsed ? 'Show terminal panel' : 'Hide terminal panel'}
          >
            {bottomCollapsed ? <PanelBottomOpen size={14} /> : <PanelBottomClose size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
