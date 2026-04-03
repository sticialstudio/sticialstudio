"use client";

import { ChevronLeft, ChevronRight, Code2 } from 'lucide-react';

import TextEditor from './TextEditor';

interface CodeViewerProps {
  code: string;
  language: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function CodeViewer({
  code,
  language,
  collapsed = false,
  onToggleCollapsed,
}: CodeViewerProps) {
  const lineCount = code.length === 0 ? 0 : code.split('\n').length;

  if (collapsed) {
    return (
      <section className='flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,#10131f_0%,#090c16_100%)] p-5 xl:min-h-0'>
        <div>
          <div className='flex items-center justify-between gap-3'>
            <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
              <Code2 size={13} className='text-cyan-300' />
              Code preview
            </span>
            {onToggleCollapsed ? (
              <button
                type='button'
                onClick={onToggleCollapsed}
                className='inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08] hover:text-white'
                aria-label='Open generated code preview'
              >
                <ChevronLeft size={16} />
              </button>
            ) : null}
          </div>

          <div className='mt-5 flex flex-wrap gap-2'>
            <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>{language}</span>
            <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>{lineCount} lines</span>
          </div>
        </div>

        {onToggleCollapsed ? (
          <button
            type='button'
            onClick={onToggleCollapsed}
            className='inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-indigo-300/24 bg-[linear-gradient(180deg,#656cf8_0%,#4f56e8_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-24px_rgba(101,108,248,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#7278ff_0%,#5a61ef_100%)]'
          >
            Open preview
            <ChevronLeft size={15} />
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className='flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,#10131f_0%,#090c16_100%)] shadow-[0_22px_56px_-40px_rgba(0,0,0,1)]'>
      <div className='flex min-h-[72px] items-center justify-between gap-3 border-b border-white/8 px-5 py-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
            <Code2 size={13} className='text-cyan-300' />
            Generated code
          </span>
          <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200'>
            {language}
          </span>
          <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
            {lineCount} lines
          </span>
        </div>

        {onToggleCollapsed ? (
          <button
            type='button'
            onClick={onToggleCollapsed}
            className='inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08] hover:text-white'
            aria-label='Collapse generated code preview'
          >
            <ChevronRight size={16} />
          </button>
        ) : null}
      </div>
      <div className='min-h-0 flex-1 overflow-hidden'>
        <TextEditor code={code} language={language} readOnly hideHeader />
      </div>
    </section>
  );
}
