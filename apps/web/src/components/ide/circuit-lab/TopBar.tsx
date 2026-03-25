"use client";

import React from 'react';
import { Code2, Cpu, FolderOpen, Link2, Link2Off, Rocket, Save, Trash2 } from 'lucide-react';

import { useCircuit } from '@/contexts/CircuitContext';

interface CircuitLabTopBarProps {
  projectName: string;
  boardName: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isConnected: boolean;
  onProjectNameChange: (name: string) => void;
  onUpload: () => void;
  onConnectDevice: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onOpenCodingEnvironment: () => void;
  saveStatusText?: string | null;
  saveStatusTone?: "neutral" | "success" | "error";
}

const buttonClass =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-xs font-semibold text-slate-200 transition-all duration-150 hover:border-cyan-400/35 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45';

const modeChipClass =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]';

export default function TopBar({
  projectName,
  boardName,
  hasUnsavedChanges,
  isSaving,
  isConnected,
  onProjectNameChange,
  onUpload,
  onConnectDevice,
  onSaveProject,
  onOpenProject,
  onOpenCodingEnvironment,
  saveStatusText,
  saveStatusTone = "neutral",
}: CircuitLabTopBarProps) {
  const { clearCircuit } = useCircuit();
  const saveStatusClass =
    saveStatusTone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : saveStatusTone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-slate-700/70 bg-slate-900/70 text-slate-300";

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire circuit canvas? You can undo this action.')) {
      clearCircuit();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex min-h-[4rem] flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-800/80 bg-slate-950/80 px-4 py-3 shadow-[0_24px_60px_-42px_rgba(34,211,238,0.1)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Cpu size={12} className="text-cyan-300" />
            Circuit Lab
            <span className={`${modeChipClass} border-cyan-400/25 bg-cyan-400/10 text-cyan-100`}>
              Mode: Circuit
            </span>
            <span className={`${modeChipClass} border-slate-800 bg-slate-900/80 text-slate-400`}>
              Step 1: Build Circuit
            </span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur();
                  onSaveProject();
                }
              }}
              placeholder="Untitled Project"
              className="min-w-[12rem] max-w-[20rem] rounded-xl border-b-2 border-transparent bg-transparent px-2 py-1 text-sm font-bold text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400 focus:bg-slate-900/80 focus:shadow-[0_4px_24px_-8px_rgba(34,211,238,0.5)]"
            />
            <span className="relative flex items-center justify-center">
              {hasUnsavedChanges ? (
                <span
                  className="absolute -left-1.5 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  title="Unsaved changes"
                />
              ) : null}
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 shadow-inner">
                {boardName}
              </span>
            </span>
            {saveStatusText ? (
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${saveStatusClass}`}>
                {saveStatusText}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:inline-flex">
          1. Build components and wiring  2. Open Coding Environment  3. Simulate there
        </span>
        <button
          type="button"
          onClick={onOpenCodingEnvironment}
          className={`${buttonClass} group relative overflow-hidden border-cyan-500/30 bg-cyan-500/5 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]`}
        >
          <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-[100%]" />
          <Code2 size={15} />
          <span>Go to Code -&gt;</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onConnectDevice} className={buttonClass}>
          {isConnected ? <Link2Off size={15} /> : <Link2 size={15} />}
          <span>{isConnected ? 'Disconnect' : 'Connect Board'}</span>
        </button>

        <button type="button" onClick={onUpload} className={buttonClass}>
          <Rocket size={15} />
          <span>Upload</span>
        </button>

        <button type="button" onClick={onSaveProject} disabled={isSaving} className={buttonClass}>
          <Save size={15} />
          <span>{isSaving ? 'Saving...' : 'Save Project'}</span>
        </button>

        <button type="button" onClick={onOpenProject} className={buttonClass}>
          <FolderOpen size={15} />
          <span>My Projects</span>
        </button>

        <div className="ml-2 h-4 w-[1px] bg-slate-800" />
        <button
          type="button"
          onClick={handleClearCanvas}
          className={`${buttonClass} border-transparent text-rose-400 hover:bg-rose-500/10 hover:text-rose-300`}
        >
          <Trash2 size={15} />
          <span>Clear Canvas</span>
        </button>
      </div>
    </header>
  );
}

