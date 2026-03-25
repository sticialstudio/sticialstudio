"use client";

import React from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { fadeInUp } from "@/components/ui/motion";

interface WorkspaceGuidanceAction {
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary";
}

interface WorkspaceGuidanceProps {
  eyebrow?: string;
  title: string;
  description: string;
  chips?: string[];
  icon?: ReactNode;
  actions?: WorkspaceGuidanceAction[];
  compact?: boolean;
}

export default function WorkspaceGuidance({
  eyebrow,
  title,
  description,
  chips = [],
  icon,
  actions = [],
  compact = false,
}: WorkspaceGuidanceProps) {
  return (
    <motion.section
      className={`ui-foundation-panel ${compact ? 'px-4 py-4' : 'px-5 py-5 sm:px-6 sm:py-6'}`}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">{eyebrow}</p>
          ) : null}
          <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ui-color-text-muted)]">{description}</p>
        </div>
        {icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-primary)]">
            {icon}
          </div>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[color:var(--ui-border-soft)] bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.tone === 'secondary' ? 'secondary' : 'primary'}
              onClick={action.onClick}
              className="min-h-10 rounded-[16px] px-4 py-2 text-sm"
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
