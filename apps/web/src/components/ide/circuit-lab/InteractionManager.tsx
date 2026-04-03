"use client";

import React from 'react';
import { LayoutGrid, Maximize, RefreshCcw } from 'lucide-react';

interface InteractionManagerProps {
  showPalette?: boolean;
  onTogglePalette?: () => void;
  onZoomFit?: () => void;
  onResetView?: () => void;
}

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function ToolbarButton({ label, icon, isActive = false, disabled = false, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex h-10 min-w-10 items-center justify-center rounded-full border px-3 transition-all duration-150 ${
        disabled
          ? 'cursor-not-allowed border-white/6 bg-white/[0.03] text-white/25'
          : isActive
            ? 'border-cyan-300/36 bg-cyan-300/12 text-cyan-100 shadow-[0_12px_30px_-22px_rgba(34,211,238,0.75)]'
            : 'border-white/8 bg-[#09111d]/80 text-slate-300 hover:border-white/14 hover:bg-[#10192a] hover:text-white'
      }`}
    >
      {icon}
      <span className="pointer-events-none absolute -bottom-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#08101b]/95 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

export default function InteractionManager({
  showPalette,
  onTogglePalette,
  onZoomFit,
  onResetView,
}: InteractionManagerProps) {
  return (
    <div className="absolute right-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-white/8 bg-[#07101c]/78 p-1.5 shadow-[0_22px_44px_-28px_rgba(2,6,23,0.95)] backdrop-blur-xl">
      <ToolbarButton
        label={showPalette ? 'Hide parts' : 'Show parts'}
        icon={<LayoutGrid size={15} />}
        isActive={Boolean(showPalette)}
        onClick={onTogglePalette}
        disabled={!onTogglePalette}
      />
      <ToolbarButton label="Fit" icon={<Maximize size={15} />} onClick={onZoomFit} disabled={!onZoomFit} />
      <ToolbarButton label="Reset" icon={<RefreshCcw size={15} />} onClick={onResetView} disabled={!onResetView} />
    </div>
  );
}
