"use client";

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isReady } = useTheme();

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const ariaLabel = isReady ? `Switch to ${nextTheme} theme` : 'Switch theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border border-panel-border bg-panel px-3 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${className}`}
    >
      {theme === 'dark' ? <MoonStar size={14} className="text-accent" /> : <SunMedium size={14} className="text-accent" />}
      {showLabel ? <span>{theme === 'dark' ? 'Dark' : 'Light'}</span> : null}
    </button>
  );
}
