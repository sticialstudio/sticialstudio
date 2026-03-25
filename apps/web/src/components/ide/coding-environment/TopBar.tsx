"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Blocks, Code2, Play, RotateCcw, Rocket, Save, Square } from 'lucide-react';
import type { CodingMode } from '@/contexts/BoardContext';
import { Button } from '@/components/ui/Button';
import { fadeInUp } from '@/components/ui/motion';
import WorkspaceStageRail from '../WorkspaceStageRail';

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
  saveStatusTone?: 'neutral' | 'success' | 'error';
}

const chipBaseClass =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]';

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
  saveStatusTone = 'neutral',
}: CodingEnvironmentTopBarProps) {
  const activeMode = codingMode === 'text' ? 'text' : 'block';
  const simulationDisabled = !supportsSimulation || isSimulationBusy || (!isSimulationActive && !canUploadAndSimulate);
  const saveStatusClass =
    saveStatusTone === 'success'
      ? 'border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]'
      : saveStatusTone === 'error'
        ? 'border-rose-300 bg-rose-50 text-rose-600'
        : 'border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)]';

  return (
    <motion.header
      className='ui-foundation-panel overflow-hidden px-4 py-4 sm:px-5 sm:py-5'
      variants={fadeInUp}
      initial='hidden'
      animate='visible'
    >
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)] xl:items-center'>
        <div className='min-w-0 space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              Code Studio
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {boardName}
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {componentCount} parts
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {mappedPinCount} linked pins
            </span>
          </div>

          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-3'>
              <h1 className='truncate text-2xl font-bold tracking-[-0.04em] text-[var(--ui-color-text)] sm:text-[2rem]'>
                {projectName || 'Untitled Project'}
              </h1>
              {hasUnsavedChanges ? (
                <span className='inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-warning)]'>
                  <span className='h-2 w-2 rounded-full bg-amber-400' />
                  Unsaved
                </span>
              ) : null}
            </div>
            <p className='max-w-2xl text-sm leading-6 text-[var(--ui-color-text-muted)]'>
              Write blocks or text, then run the current circuit in simulation without leaving the workspace.
            </p>
          </div>
        </div>

        <div className='flex flex-col items-start gap-3 xl:items-center'>
          <WorkspaceStageRail
            items={[
              { label: 'Build', icon: <ArrowLeft size={14} />, onClick: onBackToCircuitLab },
              { label: 'Code', active: true, icon: <Code2 size={14} /> },
              { label: isSimulationActive ? 'Run live' : 'Run ready', subtle: !isSimulationActive, active: isSimulationActive, icon: <Rocket size={14} /> },
            ]}
          />
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={`${chipBaseClass} ${
                isSimulationActive
                  ? 'border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]'
                  : 'border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)]'
              }`}
            >
              {isSimulationActive ? 'Simulation live' : supportsSimulation ? 'Simulation ready' : 'Simulation unavailable'}
            </span>
            {saveStatusText ? <span className={`${chipBaseClass} ${saveStatusClass}`}>{saveStatusText}</span> : null}
          </div>
        </div>

        <div className='flex flex-col gap-3 xl:items-end'>
          <div className='inline-flex items-center gap-1 rounded-[20px] border border-[color:var(--ui-border-soft)] bg-white/70 p-1.5 shadow-[0_18px_40px_-30px_rgba(26,41,72,0.18)]'>
            <button
              type='button'
              onClick={() => onChangeCodingMode('block')}
              className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                activeMode === 'block'
                  ? 'bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]'
                  : 'text-[var(--ui-color-text-muted)] hover:bg-white/75 hover:text-[var(--ui-color-text)]'
              }`}
            >
              <Blocks size={14} />
              Blocks
            </button>
            <button
              type='button'
              onClick={() => onChangeCodingMode('text')}
              className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                activeMode === 'text'
                  ? 'bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]'
                  : 'text-[var(--ui-color-text-muted)] hover:bg-white/75 hover:text-[var(--ui-color-text)]'
              }`}
            >
              <Code2 size={14} />
              Text
            </button>
          </div>

          <div className='flex flex-wrap items-center justify-start gap-2 xl:justify-end'>
            <Button variant='secondary' icon={<Save size={16} />} onClick={onSaveProject} disabled={isSaving} className='min-h-10 rounded-[16px] px-4 py-2 text-sm'>
              {isSaving ? 'Saving...' : 'Save Project'}
            </Button>
            <Button variant='secondary' icon={<RotateCcw size={16} />} onClick={onResetSimulation} disabled={!canResetSimulation} className='min-h-10 rounded-[16px] px-4 py-2 text-sm'>
              Reset
            </Button>
            <Button
              icon={isSimulationActive ? <Square size={16} /> : <Play size={16} />}
              onClick={() => {
                if (isSimulationActive) {
                  onStopSimulation();
                } else {
                  onUploadAndSimulate();
                }
              }}
              disabled={simulationDisabled}
              className={`min-h-10 rounded-[16px] px-4 py-2 text-sm ${
                isSimulationActive ? 'bg-rose-500 hover:bg-rose-600' : ''
              }`}
            >
              {isSimulationBusy && !isSimulationActive
                ? 'Preparing...'
                : isSimulationActive
                  ? 'Stop Simulation'
                  : 'Upload & Simulate'}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
