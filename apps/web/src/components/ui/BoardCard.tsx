"use client";

import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

interface BoardCardProps {
  name: string;
  chip: string;
  description: string;
  familyLabel: string;
  icon: LucideIcon;
  selected?: boolean;
  onClick: () => void;
  delayMs?: number;
}

export default function BoardCard({
  name,
  chip,
  description,
  familyLabel,
  icon: Icon,
  selected = false,
  onClick,
  delayMs = 0
}: BoardCardProps) {
  const animationStyle: CSSProperties = {
    animationDelay: `${delayMs}ms`
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ui-fade-up group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        selected
          ? 'border-accent/80 bg-accent/10 shadow-[0_0_0_1px_rgba(251,146,60,0.45),0_18px_30px_-20px_rgba(251,146,60,0.45)]'
          : 'border-panel-border bg-panel hover:-translate-y-0.5 hover:border-accent/60'
      }`}
      style={animationStyle}
      aria-pressed={selected}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-panel-border bg-background text-accent">
            <Icon size={22} />
          </div>
          <span className="rounded-full border border-panel-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {familyLabel}
          </span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{name}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-accent/90">{chip}</p>
        </div>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>
    </button>
  );
}

