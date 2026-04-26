"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Blocks, CircuitBoard, Code2, FolderOpen, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fadeInUp } from '@/components/ui/motion';
import { useCircuitStore } from '@/stores/circuitStore';
import { SimulationWarningBar } from './SimulationWarningBar';

interface CircuitLabTopBarProps {
  projectName: string;
  boardName: string;
  codingMode: 'block' | 'text' | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isConnected: boolean;
  onProjectNameChange: (name: string) => void;
  onUpload: () => void;
  onConnectDevice: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onNewSketch: () => void;
  onOpenPreferences: () => void;
  onOpenCodingEnvironment: () => void;
  saveStatusText?: string | null;
  saveStatusTone?: 'neutral' | 'success' | 'error';
}

function getStatusToneClass(tone: 'neutral' | 'success' | 'error') {
  switch (tone) {
    case 'success':
      return 'text-emerald-300';
    case 'error':
      return 'text-rose-300';
    default:
      return 'text-slate-400';
  }
}

export default function TopBar({
  projectName,
  boardName,
  codingMode,
  hasUnsavedChanges,
  isSaving,
  isConnected,
  onProjectNameChange,
  onUpload,
  onConnectDevice,
  onSaveProject,
  onOpenProject,
  onNewSketch,
  onOpenPreferences,
  onOpenCodingEnvironment,
  saveStatusText,
  saveStatusTone = 'neutral',
}: CircuitLabTopBarProps) {
  const clearCircuit = useCircuitStore((state) => state.clearCircuit);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const nextWorkspaceLabel = useMemo(() => (codingMode === 'block' ? 'Open Blocks' : 'Open Code'), [codingMode]);
  const nextWorkspaceIcon = codingMode === 'block' ? <Blocks size={15} /> : <Code2 size={15} />;
  const saveStatusClass = getStatusToneClass(saveStatusTone);

  void onUpload;
  void onConnectDevice;

  return (
    <>
      <motion.header
        className="overflow-hidden rounded-[22px] border border-white/6 bg-[#0a1017] shadow-[0_24px_54px_-42px_rgba(0,0,0,0.95)]"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-white/[0.04] text-slate-200">
                <CircuitBoard size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-slate-300">Circuit Lab</span>
                  <span>{boardName}</span>
                  <span className="text-slate-600">&middot;</span>
                  <span className={isConnected ? 'text-emerald-300' : 'text-slate-500'}>
                    {isConnected ? 'Device connected' : 'Virtual build stage'}
                  </span>
                  {hasUnsavedChanges ? (
                    <>
                      <span className="text-slate-600">&middot;</span>
                      <span className="text-amber-300">Unsaved</span>
                    </>
                  ) : null}
                  {saveStatusText ? (
                    <>
                      <span className="text-slate-600">&middot;</span>
                      <span className={saveStatusClass}>{saveStatusText}</span>
                    </>
                  ) : null}
                </div>
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
                  className="mt-2 w-full bg-transparent text-[1.05rem] font-semibold tracking-[-0.04em] text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Button
              icon={nextWorkspaceIcon}
              onClick={onOpenCodingEnvironment}
              className="min-h-10 rounded-full border border-cyan-300/16 bg-[linear-gradient(180deg,#4257c7_0%,#3446a4_100%)] px-4 text-sm text-white shadow-[0_16px_32px_-24px_rgba(66,87,199,0.82)] hover:bg-[linear-gradient(180deg,#4c62d6_0%,#3b50bc_100%)]"
            >
              {nextWorkspaceLabel}
            </Button>
            <Button
              variant="inverse"
              icon={<Save size={15} />}
              onClick={onSaveProject}
              disabled={isSaving}
              className="min-h-10 rounded-full px-4 text-sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              icon={<FolderOpen size={15} />}
              onClick={onOpenProject}
              className="min-h-10 rounded-full border border-white/8 bg-white/[0.03] px-4 text-sm text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
            >
              Projects
            </Button>
            <Button
              variant="ghost"
              icon={<Plus size={15} />}
              onClick={onNewSketch}
              className="min-h-10 rounded-full border border-white/8 bg-white/[0.03] px-4 text-sm text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
            >
              New Sketch
            </Button>
            <Button
              variant="ghost"
              icon={<Settings2 size={15} />}
              onClick={onOpenPreferences}
              className="min-h-10 rounded-full border border-white/8 bg-white/[0.03] px-4 text-sm text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
            >
              Preferences
            </Button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-400/16 bg-rose-400/8 px-4 py-2 text-sm font-semibold text-rose-100 transition-all hover:-translate-y-0.5 hover:border-rose-300/26 hover:bg-rose-400/12"
            >
              <Trash2 size={15} />
              Clear
            </button>
          </div>
        </div>
      </motion.header>

      <div className="mt-2">
        <SimulationWarningBar />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear the whole circuit?"
        description="This removes all placed parts and wires from the current circuit canvas."
        confirmLabel="Clear circuit"
        confirmTone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          clearCircuit();
          setConfirmOpen(false);
        }}
      />
    </>
  );
}


