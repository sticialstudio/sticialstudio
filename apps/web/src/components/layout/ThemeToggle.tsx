"use client";

import { Flame, MoonStar, SunMedium } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const themeMeta = {
  light: {
    label: "Light",
    icon: SunMedium,
    chip: "bg-amber-100 text-amber-700 border-amber-200/80",
  },
  dark: {
    label: "Dark",
    icon: MoonStar,
    chip: "bg-sky-400/12 text-sky-200 border-sky-400/18",
  },
  magma: {
    label: "Magma",
    icon: Flame,
    chip: "bg-orange-400/12 text-orange-200 border-orange-400/18",
  },
} as const;

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isReady } = useTheme();

  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "magma" : "light";
  const ariaLabel = isReady ? `Switch to ${nextTheme} theme` : "Switch theme";
  const meta = themeMeta[theme];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-[18px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-elevated)] px-3 text-sm font-medium text-[var(--ui-color-text)] shadow-[0_18px_36px_-30px_rgba(15,23,42,0.28)] transition-[transform,border-color,background-color,color] duration-150 hover:-translate-y-0.5 hover:border-[color:var(--ui-border-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-color-primary)]/35",
        className
      )}
    >
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-[12px] border", meta.chip)}>
        <Icon size={14} />
      </span>
      {showLabel ? (
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">Theme</span>
          <span className="mt-1 text-sm font-medium text-[var(--ui-color-text)]">{meta.label}</span>
        </span>
      ) : null}
    </button>
  );
}
