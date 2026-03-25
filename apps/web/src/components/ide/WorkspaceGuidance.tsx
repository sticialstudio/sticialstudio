"use client";

import React from "react";
import type { ReactNode } from "react";

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
    <section className={`rounded-[24px] border border-slate-800/90 bg-slate-950/78 shadow-[0_24px_60px_-44px_rgba(8,47,73,0.95)] backdrop-blur-xl ${compact ? "px-4 py-4" : "px-5 py-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
          ) : null}
          <h3 className="mt-1 text-lg font-semibold text-slate-100">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {icon ? <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/75 text-cyan-300">{icon}</div> : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={action.tone === "secondary"
                ? "rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                : "rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
