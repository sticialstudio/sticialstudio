"use client";

import React from "react";
import { AlertTriangle, Cpu, Layers3, RadioTower, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { BOARD_CONFIG } from "@/lib/boards/boardConfig";
import type { BoardKey, CodingMode, HardwareEnvironment } from "@/contexts/BoardContext";
import { fadeInUp } from "@/components/ui/motion";

interface BoardStatusPanelProps {
  boardName: BoardKey;
  codingMode: CodingMode;
  environment: HardwareEnvironment;
  isConnected: boolean;
}

const tileClass = "ui-elevated-surface rounded-[18px] px-4 py-4";

export default function BoardStatusPanel({
  boardName,
  codingMode,
  environment,
  isConnected,
}: BoardStatusPanelProps) {
  const config = BOARD_CONFIG[boardName];

  return (
    <motion.section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-transparent"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
          Board status
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ui-color-text)]">{boardName}</h3>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={tileClass}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]">
              <Cpu size={14} className="text-[var(--ui-color-primary)]" />
              Chip
            </div>
            <p className="mt-3 text-base font-semibold text-[var(--ui-color-text-on-surface)]">{config?.chip}</p>
          </div>

          <div className={tileClass}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]">
              <RadioTower size={14} className={isConnected ? "text-[var(--ui-color-success)]" : "text-[var(--ui-color-text-soft)]"} />
              Device
            </div>
            <p className={`mt-3 text-base font-semibold ${isConnected ? "text-[color:var(--ui-color-success)]" : "text-[var(--ui-color-text-on-surface)]"}`}>
              {isConnected ? "Connected" : "Not connected"}
            </p>
          </div>
        </div>

        <div className={tileClass}>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]">
            <Layers3 size={14} className="text-[var(--ui-color-accent)]" />
            Workspace
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="ui-quiet-surface rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-color-text-on-surface)]">
              {codingMode || "text"}
            </span>
            <span className="ui-quiet-surface rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-color-text-on-surface)]">
              {environment}
            </span>
            <span className="ui-quiet-surface rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-color-text-on-surface)]">
              {config?.runtimeLabel}
            </span>
          </div>
        </div>

        {config?.summary ? (
          <div className={tileClass}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]">
              <Sparkles size={14} className="text-[var(--ui-color-warning)]" />
              Summary
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--ui-color-text-on-surface-soft)]">{config.summary}</p>
          </div>
        ) : null}

        {config?.supportNote ? (
          <div className="rounded-[18px] border border-[color:var(--ui-color-warning)]/20 bg-[color:var(--ui-color-warning)]/10 px-4 py-4 text-sm text-[var(--ui-color-text)]">
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
    </motion.section>
  );
}
