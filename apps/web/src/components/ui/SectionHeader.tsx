import * as React from "react";
import { cn } from "@/lib/ui/cn";

type SectionHeaderSize = "section" | "hero";
type SectionHeaderTone = "default" | "inverse";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
  size?: SectionHeaderSize;
  tone?: SectionHeaderTone;
};

const titleClasses: Record<SectionHeaderSize, string> = {
  section: "text-3xl font-semibold tracking-[-0.055em] sm:text-[2.6rem]",
  hero: "text-4xl font-semibold tracking-[-0.07em] sm:text-5xl lg:text-6xl",
};

const subtitleClasses: Record<SectionHeaderSize, string> = {
  section: "max-w-2xl text-[15px] leading-7 sm:text-base",
  hero: "max-w-3xl text-base leading-7 sm:text-lg sm:leading-8",
};

const toneClasses: Record<SectionHeaderTone, { eyebrow: string; title: string; subtitle: string }> = {
  default: {
    eyebrow: "text-[var(--ui-color-text-soft)]",
    title: "text-[var(--ui-color-text)]",
    subtitle: "text-[var(--ui-color-text-muted)]",
  },
  inverse: {
    eyebrow: "text-white/48",
    title: "text-white",
    subtitle: "text-white/64",
  },
};

export function SectionHeader({ title, subtitle, eyebrow, actions, className, size = "section", tone = "default" }: SectionHeaderProps) {
  const palette = toneClasses[tone];

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-4xl space-y-3">
        {eyebrow ? (
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.28em]", palette.eyebrow)}>
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3">
          <h2 className={cn(titleClasses[size], palette.title)}>{title}</h2>
          {subtitle ? <p className={cn(subtitleClasses[size], palette.subtitle)}>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
