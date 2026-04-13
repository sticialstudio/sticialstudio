"use client";

import ConsolePanel from './ConsolePanel';
import type { useWebSerial } from '../../hooks/useWebSerial';
import { TerminalSquare } from 'lucide-react';

interface TerminalPanelProps {
  webSerial: ReturnType<typeof useWebSerial>;
  collapsed?: boolean;
  tone?: 'default' | 'arduino-focus';
}

export default function TerminalPanel({ webSerial, collapsed = false, tone = 'default' }: TerminalPanelProps) {
  const isArduinoFocus = tone === 'arduino-focus';

  if (collapsed) {
    return (
      <section className={isArduinoFocus ? "flex h-12 items-center justify-between rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,#10131d_0%,#0b0e16_100%)] px-4" : "ui-foundation-panel flex h-12 items-center justify-between rounded-[22px] px-4"}>
        <span className={isArduinoFocus ? "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300" : "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text)]"}>
          <TerminalSquare size={14} className={isArduinoFocus ? "text-sky-300" : "text-[var(--ui-color-primary)]"} />
          Terminal and upload logs
        </span>
        <span className={isArduinoFocus ? "text-xs text-slate-500" : "text-xs text-[var(--ui-color-text-soft)]"}>Collapsed</span>
      </section>
    );
  }

  return (
    <section className={isArduinoFocus ? "overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,#11141d_0%,#0b0e16_100%)] shadow-[0_26px_70px_-46px_rgba(0,0,0,1)]" : "ui-foundation-panel h-full overflow-hidden rounded-[28px]"}>
      <ConsolePanel webSerial={webSerial} />
    </section>
  );
}
