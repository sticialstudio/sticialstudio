"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { Surface } from "@/components/ui/Surface";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  formTitle: string;
  formSubtitle: string;
  helperTitle: string;
  helperDescription: string;
  helperChips: string[];
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthPageShell({
  title,
  subtitle,
  formTitle,
  formSubtitle,
  helperTitle,
  helperDescription,
  helperChips,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <OnboardingShell
      backHref="/"
      backLabel="Back home"
      contentClassName="justify-center py-8 lg:py-12"
      headerActions={
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-[color:var(--ui-color-text)] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[color:var(--ui-border-strong)]"
          >
            <BookOpen size={16} />
            Try a Course
          </Link>
          <Link
            href="/projects/select-mode"
            className="inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-color-primary)] px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:opacity-90"
          >
            Start project
            <ArrowRight size={16} />
          </Link>
        </div>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
        {/* ── Left: Hero copy ─────────────────────────────────────── */}
        <div className="space-y-8 pr-0 lg:pr-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ui-color-accent)]/20 bg-[color:var(--ui-color-accent)]/8 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ui-color-accent)]">
            <Sparkles size={14} />
            {helperTitle}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-[12ch] text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-[color:var(--ui-color-text)] sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="max-w-[52ch] text-base leading-8 text-[color:var(--ui-color-text-muted)] sm:text-lg">{subtitle}</p>
          </div>

          <div className="max-w-[720px] border-t border-[color:var(--ui-border-soft)] pt-6">
            <p className="max-w-[48ch] text-sm leading-7 text-[color:var(--ui-color-text-muted)]">{helperDescription}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {helperChips.map((chip, index) => (
                <div
                  key={chip}
                  className="rounded-[22px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ui-color-text-soft)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-medium tracking-[-0.01em] text-[color:var(--ui-color-text)]">{chip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form card ────────────────────────────────────── */}
        <Surface
          variant="inverse"
          padding="lg"
          className="rounded-[34px] border-[color:var(--ui-border-strong)] shadow-[0_40px_100px_-54px_rgba(0,0,0,0.4)]"
        >
          <div className="space-y-7">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--ui-color-primary)]">{formTitle}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--ui-color-text)]">{formSubtitle}</h2>
              <p className="text-sm leading-7 text-[color:var(--ui-color-text-muted)]">
                Use the same account across lessons, saved projects, and the simulator.
              </p>
            </div>

            {children}

            <div className="border-t border-[color:var(--ui-border-soft)] pt-5 text-sm text-[color:var(--ui-color-text-muted)]">{footer}</div>
          </div>
        </Surface>
      </div>
    </OnboardingShell>
  );
}

