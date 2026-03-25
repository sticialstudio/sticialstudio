"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, FolderOpen, Link2, Link2Off, Rocket, Save, Sparkles, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeInUp } from '@/components/ui/motion';
import WorkspaceStageRail from '../WorkspaceStageRail';
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
  saveStatusTone?: 'neutral' | 'success' | 'error';
}

const chipBaseClass =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]';

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
  saveStatusTone = 'neutral',
}: CircuitLabTopBarProps) {
  const { clearCircuit } = useCircuit();

  const saveStatusClass =
    saveStatusTone === 'success'
      ? 'border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]'
      : saveStatusTone === 'error'
        ? 'border-rose-300 bg-rose-50 text-rose-600'
        : 'border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)]';

  const handleClearCanvas = () => {
    if (window.confirm('Clear the whole circuit? You can undo this after it happens.')) {
      clearCircuit();
    }
  };

  return (
    <motion.header
      className='ui-foundation-panel overflow-hidden px-4 py-4 sm:px-5 sm:py-5'
      variants={fadeInUp}
      initial='hidden'
      animate='visible'
    >
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] xl:items-center'>
        <div className='min-w-0 space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              <Sparkles size={13} className='text-[var(--ui-color-accent)]' />
              Circuit Lab
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              {boardName}
            </span>
            <span className={`${chipBaseClass} border-[color:var(--ui-border-soft)] bg-white/80 text-[var(--ui-color-text-soft)]`}>
              Build mode
            </span>
          </div>

          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-3'>
              <input
                type='text'
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                    onSaveProject();
                  }
                }}
                placeholder='Untitled Project'
                className='min-w-[14rem] max-w-[24rem] rounded-[18px] border border-transparent bg-white/65 px-4 py-3 text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)] outline-none transition-all placeholder:text-[var(--ui-color-text-soft)] focus:border-[color:var(--ui-border-strong)] focus:bg-white'
              />
              {hasUnsavedChanges ? (
                <span className='inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-warning)]'>
                  <span className='h-2 w-2 rounded-full bg-amber-400' />
                  Unsaved
                </span>
              ) : null}
            </div>
            <p className='max-w-2xl text-sm leading-6 text-[var(--ui-color-text-muted)]'>
              Build the circuit visually first, then move into code when the board and wiring are ready.
            </p>
          </div>
        </div>

        <div className='flex flex-col items-start gap-3 xl:items-center'>
          <WorkspaceStageRail
            items={[
              { label: 'Build', active: true, icon: <Wrench size={14} /> },
              { label: 'Code', icon: <Code2 size={14} />, onClick: onOpenCodingEnvironment },
              { label: 'Run ready', subtle: true, icon: <Rocket size={14} /> },
            ]}
          />
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={`${chipBaseClass} ${
                isConnected
                  ? 'border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]'
                  : 'border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-text-soft)]'
              }`}
            >
              {isConnected ? <Link2Off size={13} /> : <Link2 size={13} />}
              {isConnected ? 'Board connected' : 'Board not connected'}
            </span>
            {saveStatusText ? <span className={`${chipBaseClass} ${saveStatusClass}`}>{saveStatusText}</span> : null}
          </div>
        </div>

        <div className='flex flex-col gap-3 xl:items-end'>
          <div className='flex flex-wrap items-center justify-start gap-2 xl:justify-end'>
            <Button icon={<Code2 size={16} />} onClick={onOpenCodingEnvironment} className='min-h-10 rounded-[16px] px-4 py-2 text-sm'>
              Open Code
            </Button>
            <Button
              variant='secondary'
              icon={isConnected ? <Link2Off size={16} /> : <Link2 size={16} />}
              onClick={onConnectDevice}
              className='min-h-10 rounded-[16px] px-4 py-2 text-sm'
            >
              {isConnected ? 'Disconnect' : 'Connect Board'}
            </Button>
            <Button variant='secondary' icon={<Rocket size={16} />} onClick={onUpload} className='min-h-10 rounded-[16px] px-4 py-2 text-sm'>
              Upload
            </Button>
            <Button variant='secondary' icon={<Save size={16} />} onClick={onSaveProject} disabled={isSaving} className='min-h-10 rounded-[16px] px-4 py-2 text-sm'>
              {isSaving ? 'Saving...' : 'Save Project'}
            </Button>
            <Button variant='secondary' icon={<FolderOpen size={16} />} onClick={onOpenProject} className='min-h-10 rounded-[16px] px-4 py-2 text-sm'>
              Open Projects
            </Button>
            <Button
              variant='secondary'
              icon={<Trash2 size={16} />}
              onClick={handleClearCanvas}
              className='min-h-10 rounded-[16px] border-rose-200 px-4 py-2 text-sm text-rose-600 hover:border-rose-300 hover:text-rose-700'
            >
              Clear Circuit
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
