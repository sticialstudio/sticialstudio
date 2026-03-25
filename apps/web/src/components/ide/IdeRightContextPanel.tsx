"use client";

import React from "react";
import { Info } from "lucide-react";

export interface IdeRightContextView {
  id: string;
  label: string;
  tone?: "cyan" | "emerald" | "amber" | "violet" | "slate";
  content: React.ReactNode;
}

interface IdeRightContextPanelProps {
  title: string;
  subtitle: string;
  views: IdeRightContextView[];
  activeView: string;
  onChangeView: (viewId: string) => void;
}

const toneClasses: Record<NonNullable<IdeRightContextView["tone"]>, string> = {
  cyan: "bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]",
  emerald: "bg-[color:var(--ui-color-success)] text-white shadow-[0_20px_36px_-24px_rgba(41,153,93,0.45)]",
  amber: "bg-[color:var(--ui-color-warning)] text-white shadow-[0_20px_36px_-24px_rgba(197,138,28,0.45)]",
  violet: "bg-violet-500 text-white shadow-[0_20px_36px_-24px_rgba(139,92,246,0.45)]",
  slate: "bg-[var(--ui-color-text)] text-white shadow-[0_20px_36px_-24px_rgba(31,41,55,0.35)]",
};

export default function IdeRightContextPanel({
  title,
  subtitle,
  views,
  activeView,
  onChangeView,
}: IdeRightContextPanelProps) {
  const currentView = views.find((view) => view.id === activeView) || views[0];

  return (
    <section className="ui-foundation-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[28px]">
      <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">{title}</p>
            <h3 className="mt-2 text-lg font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">Workspace context</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--ui-color-text-muted)]">{subtitle}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-primary)]">
            <Info size={18} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {views.map((view) => {
            const isActive = currentView.id === view.id;

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => onChangeView(view.id)}
                className={`rounded-[14px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? toneClasses[view.tone || "slate"]
                    : "border border-[color:var(--ui-border-soft)] bg-white/70 text-[var(--ui-color-text-muted)] hover:bg-white/82 hover:text-[var(--ui-color-text)]"
                }`}
              >
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{currentView?.content}</div>
    </section>
  );
}
