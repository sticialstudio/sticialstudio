"use client";

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconLabel?: string;
  href?: string;
  onClick?: () => void;
  badge?: ReactNode;
  delayMs?: number;
}

export default function DashboardCard({
  title,
  description,
  icon: Icon,
  iconLabel,
  href,
  onClick,
  badge,
  delayMs = 0
}: DashboardCardProps) {
  const animationStyle: CSSProperties = {
    animationDelay: `${delayMs}ms`
  };

  const card = (
    <article
      className="ui-fade-up group relative overflow-hidden rounded-3xl border border-panel-border bg-panel p-6 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-2xl sm:p-8"
      style={animationStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 flex h-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-panel-border bg-background text-accent shadow-inner sm:h-14 sm:w-14"
            aria-label={iconLabel || title}
          >
            <Icon size={26} />
          </div>
          {badge}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h3>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {card}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {card}
    </button>
  );
}


