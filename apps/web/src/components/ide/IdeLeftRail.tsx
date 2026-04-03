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
            <FolderOpen size={16} />
          </div>
        </div>

        {views.length > 1 ? (
          <div className="ui-quiet-surface mt-4 inline-flex rounded-[16px] p-1">
            {views.map((view) => {
              const isActive = currentView.id === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onChangeView(view.id)}
                  className={`rounded-[12px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                    isActive
                      ? "bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]"
                      : "text-[var(--ui-color-text-muted)] hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]"
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
