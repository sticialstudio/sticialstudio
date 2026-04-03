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
      className={`ui-foundation-panel overflow-hidden ${compact ? "px-4 py-4" : "px-5 py-5 sm:px-6 sm:py-6"}`}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
              {eyebrow}
            </p>
          ) : null}
          <div className="mt-2 flex items-start gap-3">
            {icon ? (
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center ui-icon-surface rounded-[16px] shadow-[0_18px_36px_-24px_rgba(48,71,166,0.22)]">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ui-color-text)] sm:text-xl">{title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ui-color-text-muted)]">{description}</p>
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center ui-pill-surface rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.tone === "secondary" ? "secondary" : "primary"}
                onClick={action.onClick}
                className="min-h-10 rounded-[16px] px-4 py-2 text-sm"
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}


