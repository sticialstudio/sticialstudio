"use client";

import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

interface LanguageCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  subtitle?: string;
  onClick: () => void;
  delayMs?: number;
}

export default function LanguageCard({
  title,
  description,
  icon: Icon,
  subtitle,
  onClick,
  delayMs = 0
}: LanguageCardProps) {
  const animationStyle: CSSProperties = {
    animationDelay: `${delayMs}ms`
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="ui-fade-up group relative w-full overflow-hidden rounded-3xl glass-panel p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-8"
      style={animationStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-panel-border bg-background text-accent sm:h-14 sm:w-14">
          <Icon size={26} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h3>
          {subtitle ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent/90">{subtitle}</p> : null}
        </div>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>
    </button>
  );
}

