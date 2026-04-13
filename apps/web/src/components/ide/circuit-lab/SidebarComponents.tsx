"use client";

import React from "react";
import { PanelLeftOpen } from "lucide-react";
import ComponentManagerPanel from "../ComponentManagerPanel";

interface SidebarComponentsProps {
  collapsed?: boolean;
  onExpand?: () => void;
}

export default function SidebarComponents({ collapsed = false, onExpand }: SidebarComponentsProps) {
  if (collapsed) {
    return (
      <aside className="flex min-h-0 items-start justify-center rounded-[24px] border border-slate-800 bg-slate-950/82 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <button
          type="button"
          onClick={onExpand}
          className="flex h-full min-h-[8rem] w-full flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-slate-700 bg-slate-900/60 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
        >
          <PanelLeftOpen size={16} />
          <span>Parts</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="min-h-0 overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <ComponentManagerPanel />
    </aside>
  );
}