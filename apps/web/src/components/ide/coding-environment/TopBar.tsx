"use client";

import React from "react";
import { ArrowLeft, Blocks, Code2, Cpu, Play, RotateCcw, Save, Square } from "lucide-react";
import type { CodingMode } from "@/contexts/BoardContext";

interface CodingEnvironmentTopBarProps {
  projectName: string;
  boardName: string;
  codingMode: CodingMode;
  isSimulationActive: boolean;
  isSimulationBusy: boolean;
  supportsSimulation: boolean;
  canUploadAndSimulate: boolean;
  canResetSimulation: boolean;
  componentCount: number;
  mappedPinCount: number;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onBackToCircuitLab: () => void;
  onChangeCodingMode: (mode: Exclude<CodingMode, null>) => void;
  onUploadAndSimulate: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onSaveProject: () => void;
  saveStatusText?: string | null;
  saveStatusTone?: "neutral" | "success" | "error";
}

const buttonClass =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-xs font-semibold text-slate-200 transition-all duration-150 hover:border-cyan-400/35 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45";

const modeChipClass =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]";

export default function CodingEnvironmentTopBar({
  projectName,
  boardName,
  codingMode,
  isSimulationActive,
  isSimulationBusy,
  supportsSimulation,
  canUploadAndSimulate,
  canResetSimulation,
  componentCount,
  mappedPinCount,
  hasUnsavedChanges,
  isSaving,
  onBackToCircuitLab,
  onChangeCodingMode,
  onUploadAndSimulate,
  onStopSimulation,
  onResetSimulation,
  onSaveProject,
  saveStatusText,
  saveStatusTone = "neutral",
}: CodingEnvironmentTopBarProps) {
  const activeMode = codingMode === "text" ? "text" : "block";
  const simulationDisabled = !supportsSimulation || isSimulationBusy || (!isSimulationActive && !canUploadAndSimulate);
  const saveStatusClass =
    saveStatusTone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : saveStatusTone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-slate-800 bg-slate-900/80 text-slate-400";

  return (
    <header className="sticky top-0 z-20 flex min-h-[4rem] flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-800 bg-slate-950/88 px-4 py-3 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.95)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onBackToCircuitLab} className={buttonClass}>
          <ArrowLeft size={15} />
          <span>Back to Circuit Lab</span>
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Code2 size={12} className="text-cyan-300" />
            Coding Environment
            <span className={`${modeChipClass} border-emerald-400/25 bg-emerald-400/10 text-emerald-100`}>
              Mode: Coding
            </span>
            <span className={`${modeChipClass} border-slate-800 bg-slate-900/80 text-slate-400`}>
              Step 2: Code and Simulate
            </span>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="truncate">{projectName || "Untitled Project"}</span>
            <span className="relative flex items-center justify-center">
              {hasUnsavedChanges && (
                <span className="absolute -left-1.5 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" title="Unsaved changes" />
              )}
              {isSimulationActive && (
                <span className="absolute -right-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Simulation active" />
              )}
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 shadow-inner">
                {boardName}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100">
          <Cpu size={14} />
          Virtual Simulator
        </span>
        <span className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {componentCount} components loaded
        </span>
        <span className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {mappedPinCount} pins mapped
        </span>
        {!canUploadAndSimulate && !isSimulationActive ? (
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
            Add code before simulating
          </span>
        ) : null}
        {saveStatusText ? (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${saveStatusClass}`}>
            {saveStatusText}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/75 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <button
            type="button"
            onClick={() => onChangeCodingMode("block")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              activeMode === "block"
                ? "bg-slate-100 text-slate-950 shadow-[0_12px_24px_-18px_rgba(255,255,255,0.95)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            <Blocks size={14} />
            Blocks
          </button>
          <button
            type="button"
            onClick={() => onChangeCodingMode("text")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              activeMode === "text"
                ? "bg-slate-100 text-slate-950 shadow-[0_12px_24px_-18px_rgba(255,255,255,0.95)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            <Code2 size={14} />
            Text
          </button>
        </div>

        <button type="button" onClick={onSaveProject} disabled={isSaving} className={`${buttonClass} hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]`}>
          <Save size={15} />
          <span>{isSaving ? "Saving..." : "Save Project"}</span>
        </button>

        <button
          type="button"
          onClick={onResetSimulation}
          disabled={!canResetSimulation}
          className={`${buttonClass} hover:border-slate-500/50 hover:bg-slate-800/60 hover:shadow-[0_0_15px_rgba(148,163,184,0.14)]`}
        >
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isSimulationActive) {
              onStopSimulation();
            } else {
              onUploadAndSimulate();
            }
          }}
          disabled={simulationDisabled}
          className={`group relative overflow-hidden ${buttonClass} ${
            isSimulationActive
              ? "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          }`}
        >
          {!isSimulationActive && <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-[100%]" />}
          <div className="relative z-10 flex items-center gap-2">
            {isSimulationActive ? <Square size={15} strokeWidth={2.5} /> : <Play size={15} strokeWidth={2.5} />}
            <span>
              {isSimulationBusy && !isSimulationActive
                ? "Uploading..."
                : isSimulationActive
                  ? "Stop Simulation"
                  : "Upload & Simulate"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}

