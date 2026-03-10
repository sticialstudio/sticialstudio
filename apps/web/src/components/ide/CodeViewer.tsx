"use client";

import TextEditor from './TextEditor';
import { Code2 } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language: string;
}

export default function CodeViewer({ code, language }: CodeViewerProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70">
      <div className="flex h-10 items-center justify-between border-b border-slate-700 px-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          <Code2 size={14} className="text-cyan-300" />
          Generated Code
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Read Only
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <TextEditor code={code} language={language} readOnly hideHeader />
      </div>
    </section>
  );
}
