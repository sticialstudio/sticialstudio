"use client";

import ConsolePanel from './ConsolePanel';
import type { useWebSerial } from '../../hooks/useWebSerial';
import { TerminalSquare } from 'lucide-react';

interface TerminalPanelProps {
  webSerial: ReturnType<typeof useWebSerial>;
  collapsed?: boolean;
}

export default function TerminalPanel({ webSerial, collapsed = false }: TerminalPanelProps) {
  if (collapsed) {
    return (
      <section className="flex h-11 items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/75 px-4">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          <TerminalSquare size={14} className="text-cyan-300" />
          Terminal & Upload Logs
        </span>
        <span className="text-xs text-slate-500">Collapsed</span>
      </section>
    );
  }

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70">
      <ConsolePanel webSerial={webSerial} />
    </section>
  );
}

