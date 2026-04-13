"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui/cn";
import { fadeInUp } from "./motion";

type JourneyStep = {
  label: string;
};

type JourneyProgressProps = {
  steps: JourneyStep[];
  activeIndex: number;
  className?: string;
  tone?: "default" | "immersive";
};

export function JourneyProgress({ steps, activeIndex, className, tone = "default" }: JourneyProgressProps) {
  const immersive = tone === "immersive";

  return (
    <motion.div
      className={cn("flex flex-wrap items-center gap-3", className)}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;

        return (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]",
                immersive
                  ? isActive
                    ? "border-sky-300/28 bg-sky-400/14 text-white shadow-[0_18px_42px_-28px_rgba(74,115,255,0.45)]"
                    : isComplete
                      ? "border-emerald-300/18 bg-emerald-400/12 text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-white/48"
                  : isActive
                    ? "border-[color:var(--ui-color-primary)] bg-[color:var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]"
                    : isComplete
                      ? "border-[color:var(--ui-color-accent)]/25 bg-[color:var(--ui-color-accent)]/10 text-[var(--ui-color-accent)]"
                      : "border-[color:var(--ui-border-soft)] bg-white/72 text-[var(--ui-color-text-soft)]"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  immersive
                    ? isActive
                      ? "bg-white/10 text-white"
                      : isComplete
                        ? "bg-emerald-300/14 text-emerald-200"
                        : "bg-white/[0.05] text-white/56"
                    : isActive
                      ? "bg-white/18 text-white"
                      : isComplete
                        ? "bg-[color:var(--ui-color-accent)]/14 text-[var(--ui-color-accent)]"
                        : "bg-[color:var(--ui-color-background)] text-[var(--ui-color-text-soft)]"
                )}
              >
                {index + 1}
              </span>
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 ? <span className={cn("text-sm", immersive ? "text-white/24" : "text-[var(--ui-color-text-soft)]")}>/</span> : null}
          </div>
        );
      })}
    </motion.div>
  );
}
