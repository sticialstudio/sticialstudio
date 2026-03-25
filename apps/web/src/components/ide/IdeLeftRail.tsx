"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

export interface IdeLeftRailView {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface IdeLeftRailProps {
  title: string;
  subtitle: string;
  views: IdeLeftRailView[];
  activeView: string;
  onChangeView: (viewId: string) => void;
}

export default function IdeLeftRail({
  title,
  subtitle,
  views,
  activeView,
  onChangeView,
}: IdeLeftRailProps) {
  const currentView = views.find((view) => view.id === activeView) || views[0];

  return (
    <section className="ui-foundation-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[28px]">
      <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">{title}</p>
            <h3 className="mt-2 text-lg font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">Project files</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--ui-color-text-muted)]">{subtitle}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[color:var(--ui-border-soft)] bg-white/82 text-[var(--ui-color-primary)]">
            <FolderOpen size={18} />
          </div>
        </div>

        {views.length > 1 ? (
          <div className="mt-4 inline-flex rounded-[18px] border border-[color:var(--ui-border-soft)] bg-white/70 p-1.5 shadow-[0_18px_40px_-30px_rgba(26,41,72,0.18)]">
            {views.map((view) => {
              const isActive = currentView.id === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onChangeView(view.id)}
                  className={`rounded-[14px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                    isActive
                      ? "bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]"
                      : "text-[var(--ui-color-text-muted)] hover:bg-white/75 hover:text-[var(--ui-color-text)]"
                  }`}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{currentView?.content}</div>
    </section>
  );
}
