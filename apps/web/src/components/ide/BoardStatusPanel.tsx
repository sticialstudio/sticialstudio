"use client";

import React from "react";
import { AlertTriangle, Cpu, Layers3, RadioTower, Sparkles } from "lucide-react";
import { BOARD_CONFIG } from "@/lib/boards/boardConfig";
import type { BoardKey, CodingMode, HardwareEnvironment } from "@/contexts/BoardContext";

interface BoardStatusPanelProps {
  boardName: BoardKey;
  codingMode: CodingMode;
  environment: HardwareEnvironment;
  isConnected: boolean;
}

const detailRowClass =
  "flex items-center justify-between gap-3 rounded-[18px] border border-[color:var(--ui-border-soft)] bg-white/72 px-4 py-3";

export default function BoardStatusPanel({
  boardName,
  codingMode,
  environment,
  isConnected,
}: BoardStatusPanelProps) {
  const config = BOARD_CONFIG[boardName];

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-transparent">
      <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">Board status</p>
        <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">{boardName}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--ui-color-text-muted)]">{config?.summary}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className={detailRowClass}>
          <span className="inline-flex items-center gap-2 text-sm text-[var(--ui-color-text-muted)]">
            <Cpu size={14} className="text-[var(--ui-color-primary)]" />
            Target
          </span>
          <span className="text-sm font-semibold text-[var(--ui-color-text)]">{config?.chip}</span>
        </div>

        <div className={detailRowClass}>
          <span className="inline-flex items-center gap-2 text-sm text-[var(--ui-color-text-muted)]">
            <Layers3 size={14} className="text-[var(--ui-color-accent)]" />
            Workspace
          </span>
          <span className="text-sm font-semibold capitalize text-[var(--ui-color-text)]">
            {codingMode || "text"} + {environment}
          </span>
        </div>

        <div className={detailRowClass}>
          <span className="inline-flex items-center gap-2 text-sm text-[var(--ui-color-text-muted)]">
            <Sparkles size={14} className="text-[var(--ui-color-warning)]" />
            Runtime
          </span>
          <span className="text-sm font-semibold text-[var(--ui-color-text)]">{config?.runtimeLabel}</span>
        </div>

        <div className={detailRowClass}>
          <span className="inline-flex items-center gap-2 text-sm text-[var(--ui-color-text-muted)]">
            <RadioTower size={14} className="text-[var(--ui-color-success)]" />
            Device
          </span>
          <span className={`text-sm font-semibold ${isConnected ? 'text-[color:var(--ui-color-success)]' : 'text-[var(--ui-color-text-soft)]'}`}>
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {config?.supportNote ? (
          <div className="rounded-[20px] border border-[color:var(--ui-color-warning)]/20 bg-[color:var(--ui-color-warning)]/10 px-4 py-4 text-sm text-[var(--ui-color-text)]">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--ui-color-warning)]" />
              <div>
                <p className="font-semibold text-[var(--ui-color-text)]">Support note</p>
                <p className="mt-1 leading-6 text-[var(--ui-color-text-muted)]">{config.supportNote}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
