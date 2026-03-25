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
      <section className="ui-foundation-panel flex h-12 items-center justify-between rounded-[22px] px-4">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text)]">
          <TerminalSquare size={14} className="text-[var(--ui-color-primary)]" />
          Terminal and upload logs
        </span>
        <span className="text-xs text-[var(--ui-color-text-soft)]">Collapsed</span>
      </section>
    );
  }

  return (
    <section className="ui-foundation-panel h-full overflow-hidden rounded-[28px]">
      <ConsolePanel webSerial={webSerial} />
    </section>
  );
}
