"use client";

import {
  AlertCircle,
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
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { fadeInUp } from "@/components/ui/motion";
import WorkspaceStageRail from "./WorkspaceStageRail";

export type StudioView = "code" | "circuit";

interface TopToolbarProps {
  projectName?: string;
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

const chipBaseClass =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]";

const utilityButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--ui-border-strong)] hover:text-[var(--ui-color-primary)]";

export default function TopToolbar({
  projectName,
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
      ? "border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]"
      : saveStatusTone === "error"
        ? "border-rose-300 bg-rose-50 text-rose-600"
        : "border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)]";

  const canSwitchStudios = Boolean(showStudioToggle && activeStudioView && onChangeStudioView && environment !== "physical");

  const stageItems = canSwitchStudios
    ? [
        {
          label: "Build",
          active: activeStudioView === "circuit",
          icon: <Cpu size={14} />,
          onClick: () => onChangeStudioView?.("circuit"),
        },
        {
          label: "Code",
          active: activeStudioView === "code",
          icon: <Code2 size={14} />,
          onClick: () => onChangeStudioView?.("code"),
        },
        {
          label: isCompiling ? "Run busy" : "Run ready",
          subtle: true,
          icon: <Rocket size={14} />,
        },
      ]
    : [
        {
          label: environment === "physical" ? "Physical run" : "Code workspace",
          active: true,
          icon: environment === "physical" ? <Rocket size={14} /> : <Code2 size={14} />,
        },
      ];

  return (
    <motion.header
      className="ui-foundation-panel overflow-hidden px-4 py-4 sm:px-5 sm:py-5"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)] xl:items-center">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              <Sparkles size={13} className="text-[var(--ui-color-accent)]" />
              IDE workspace
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {boardName}
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {codingMode || "text"}
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {environment}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-bold tracking-[-0.04em] text-[var(--ui-color-text)] sm:text-[2rem]">
                {projectName || "Untitled Project"}
              </h1>
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-warning)]">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Unsaved
                </span>
              ) : null}
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[var(--ui-color-text-muted)]">
              One calm workspace for building, coding, saving, and running hardware projects on {boardName}.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-center">
          <WorkspaceStageRail items={stageItems} />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`${chipBaseClass} ${
                isConnected
                  ? "border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]"
                  : "border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)]"
              }`}
            >
              {isConnected ? <Link2Off size={13} /> : <Link2 size={13} />}
              {isConnected ? "Board connected" : "Board not connected"}
            </span>
            {saveStatusText ? <span className={`${chipBaseClass} ${saveStatusClass}`}>{saveStatusText}</span> : null}
          </div>
          {serialError ? (
            <div className="inline-flex items-center gap-2 rounded-[18px] border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              <AlertCircle size={14} />
              <span>{serialError}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
            <Button variant="secondary" icon={<CheckCircle2 size={16} />} onClick={onVerify} disabled={isCompiling} className="min-h-10 rounded-[16px] px-4 py-2 text-sm">
              {isCompiling ? "Verifying..." : "Verify"}
            </Button>
            <Button icon={<Rocket size={16} />} onClick={onUpload} disabled={isCompiling} className="min-h-10 rounded-[16px] px-4 py-2 text-sm">
              {isCompiling ? "Working..." : "Upload"}
            </Button>
            <Button
              variant="secondary"
              icon={isConnected ? <Link2Off size={16} /> : <Link2 size={16} />}
              onClick={onConnectDevice}
              className="min-h-10 rounded-[16px] px-4 py-2 text-sm"
            >
              {isConnected ? "Disconnect" : "Connect Board"}
            </Button>
            <Button variant="secondary" icon={<ChevronDown size={16} />} onClick={onSelectBoard} className="min-h-10 rounded-[16px] px-4 py-2 text-sm">
              Change Board
            </Button>
            <Button
              variant="secondary"
              icon={<Save size={16} />}
              onClick={onSaveProject}
              disabled={isSaving}
              className="min-h-10 rounded-[16px] px-4 py-2 text-sm"
            >
              {isSaving ? "Saving..." : "Save Project"}
            </Button>
            <Button variant="secondary" icon={<FolderOpen size={16} />} onClick={onOpenProject} className="min-h-10 rounded-[16px] px-4 py-2 text-sm">
              Open Projects
            </Button>
          </div>

          {showPanelControls ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[color:var(--ui-border-soft)] bg-white/70 p-1.5 shadow-[0_18px_40px_-30px_rgba(26,41,72,0.18)]">
              {showLeftToggle ? (
                <button
                  type="button"
                  onClick={onToggleLeft}
                  className={utilityButtonClass}
                  title={leftCollapsed ? "Show left panel" : "Hide left panel"}
                >
                  {leftCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onToggleRight}
                className={utilityButtonClass}
                title={rightCollapsed ? "Show right panel" : "Hide right panel"}
              >
                {rightCollapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
              </button>
              <button
                type="button"
                onClick={onToggleBottom}
                className={utilityButtonClass}
                title={bottomCollapsed ? "Show terminal panel" : "Hide terminal panel"}
              >
                {bottomCollapsed ? <PanelBottomOpen size={15} /> : <PanelBottomClose size={15} />}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}
