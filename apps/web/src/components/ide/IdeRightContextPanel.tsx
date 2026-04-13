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
  cyan: "bg-[var(--ui-color-primary)] text-white",
  emerald: "bg-emerald-500 text-white",
  amber: "bg-amber-500 text-slate-950",
  violet: "bg-[var(--ui-color-primary)] text-white",
  slate: "bg-[var(--ui-color-text)] text-[var(--ui-color-background)]",
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
    <section className="ui-foundation-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[26px]">
      <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
              {title}
            </p>
            <p className="mt-2 text-sm text-[var(--ui-color-text-muted)]">{subtitle}</p>
          </div>
          <div className="ui-icon-surface flex h-10 w-10 items-center justify-center rounded-[16px]">
            <Info size={16} />
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
                className={`rounded-[12px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? toneClasses[view.tone || "slate"]
                    : "ui-pill-surface text-[var(--ui-color-text-muted)] hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]"
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
