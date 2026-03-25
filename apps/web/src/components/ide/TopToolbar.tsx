"use client";

import {
  CheckCircle2,
  ChevronDown,
  Code2,
  Cpu,
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
  Save,
  Sparkles,
} from "lucide-react";

export type StudioView = "code" | "circuit";

interface TopToolbarProps {
  boardName: string;
  codingMode: string | null;
  environment: string;
  isConnected: boolean;
  isCompiling: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  bottomCollapsed: boolean;
  showLeftToggle?: boolean;
  showPanelControls?: boolean;
  showStudioToggle?: boolean;
  activeStudioView?: StudioView;
  onChangeStudioView?: (view: StudioView) => void;
  onVerify: () => void;
  onUpload: () => void;
  onConnectDevice: () => void;
  onSelectBoard: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleBottom: () => void;
  serialError?: string | null;
  saveStatusText?: string | null;
  saveStatusTone?: "neutral" | "success" | "error";
}

const actionButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-xl border border-panel-border bg-background/45 px-3 text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:cursor-not-allowed disabled:opacity-50";

const utilityButtonClass =
  "rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-accent";

export default function TopToolbar({
  boardName,
  codingMode,
  environment,
  isConnected,
  isCompiling,
  isSaving,
  hasUnsavedChanges,
  leftCollapsed,
  rightCollapsed,
  bottomCollapsed,
  showLeftToggle = true,
  showPanelControls = true,
  showStudioToggle = false,
  activeStudioView,
  onChangeStudioView,
  onVerify,
  onUpload,
  onConnectDevice,
  onSelectBoard,
  onSaveProject,
  onOpenProject,
  onToggleLeft,
  onToggleRight,
  onToggleBottom,
  serialError,
  saveStatusText,
  saveStatusTone = "neutral",
}: TopToolbarProps) {
  const saveStatusClass =
    saveStatusTone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : saveStatusTone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-slate-700/70 bg-slate-900/70 text-slate-300";

  const canSwitchStudios = Boolean(showStudioToggle && activeStudioView && onChangeStudioView && environment !== "physical");

  return (
    <header className="ui-fade-up flex min-h-16 flex-col gap-3 rounded-2xl glass-panel px-3 py-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onVerify} disabled={isCompiling} className={actionButtonClass}>
          <CheckCircle2 size={14} />
          <span>{isCompiling ? "Verifying..." : "Verify"}</span>
        </button>
        <button type="button" onClick={onUpload} disabled={isCompiling} className={actionButtonClass}>
          <Rocket size={14} />
          <span>Upload</span>
        </button>
        <button
          type="button"
          onClick={onConnectDevice}
          className={`${actionButtonClass} ${isConnected ? "border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]" : ""}`}
        >
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Link2Off size={14} />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link2 size={14} />
              <span>Connect Device</span>
            </div>
          )}
        </button>
        <button type="button" onClick={onSelectBoard} className={actionButtonClass}>
          <ChevronDown size={14} />
          <span>Select Board</span>
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:justify-center">
        {canSwitchStudios ? (
          <div className="inline-flex items-center gap-1 rounded-2xl border border-panel-border bg-background/50 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button
              type="button"
              onClick={() => onChangeStudioView?.("code")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                activeStudioView === "code"
                  ? "bg-slate-100 text-slate-900 shadow-[0_10px_30px_-16px_rgba(255,255,255,0.9)]"
                  : "text-slate-300 hover:bg-background/70 hover:text-foreground"
              }`}
            >
              <Code2 size={14} />
              <span>Code Studio</span>
            </button>
            <span className="px-1 text-xs text-slate-500" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              onClick={() => onChangeStudioView?.("circuit")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                activeStudioView === "circuit"
                  ? "bg-slate-100 text-slate-900 shadow-[0_10px_30px_-16px_rgba(255,255,255,0.9)]"
                  : "text-slate-300 hover:bg-background/70 hover:text-foreground"
              }`}
            >
              <Cpu size={14} />
              <span>Circuit Lab</span>
            </button>
          </div>
        ) : environment === "physical" ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Physical Device Mode
          </div>
        ) : null}

        <div className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-panel-border bg-background/40 px-3 py-2 text-xs text-slate-300">
          <Sparkles size={13} className="shrink-0 text-cyan-300" />
          <span className="truncate font-semibold text-slate-100">{boardName}</span>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
          {codingMode || "text"}
        </span>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
          {environment}
        </span>
        {saveStatusText ? (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${saveStatusClass}`}>
            {saveStatusText}
          </span>
        ) : null}
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            isConnected ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-700/70 text-slate-400"
          }`}
        >
          {isConnected ? "device linked" : "device idle"}
        </span>

        {serialError && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-300 ring-1 ring-row-error/20 animate-in fade-in slide-in-from-left-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Serial Error: {serialError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 xl:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onSaveProject} disabled={isSaving} className={actionButtonClass}>
            <Save size={14} />
            <span>{isSaving ? "Saving..." : "Save Project"}</span>
            {hasUnsavedChanges ? <span className="h-2 w-2 rounded-full bg-amber-400" /> : null}
          </button>
          <button type="button" onClick={onOpenProject} className={actionButtonClass}>
            <FolderOpen size={14} />
            <span>Open Project</span>
          </button>
        </div>

        {showPanelControls ? (
          <div className="inline-flex items-center gap-1 rounded-xl border border-panel-border bg-background/40 p-1">
            {showLeftToggle ? (
              <button
                type="button"
                onClick={onToggleLeft}
                className={utilityButtonClass}
                title={leftCollapsed ? "Show left panel" : "Hide left panel"}
              >
                {leftCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onToggleRight}
              className={utilityButtonClass}
              title={rightCollapsed ? "Show right panel" : "Hide right panel"}
            >
              {rightCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
            </button>
            <button
              type="button"
              onClick={onToggleBottom}
              className={utilityButtonClass}
              title={bottomCollapsed ? "Show terminal panel" : "Hide terminal panel"}
            >
              {bottomCollapsed ? <PanelBottomOpen size={14} /> : <PanelBottomClose size={14} />}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
