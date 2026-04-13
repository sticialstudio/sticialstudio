"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { fadeInUp } from "./motion";

type StatusTone = "info" | "success" | "warning" | "error";
type StatusAppearance = "default" | "immersive";

interface StatusBannerProps {
  tone?: StatusTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  appearance?: StatusAppearance;
}

const toneMap: Record<StatusAppearance, Record<StatusTone, { wrapper: string; iconWrap: string; icon: React.ReactNode; title: string; body: string }>> = {
  default: {
    info: {
      wrapper: "border-[color:var(--ui-color-accent)]/20 bg-[color:var(--ui-color-accent)]/8",
      iconWrap: "text-[var(--ui-color-accent)]",
      icon: <Info size={16} />,
      title: "text-[var(--ui-color-text)]",
      body: "text-[var(--ui-color-text-muted)]",
    },
    success: {
      wrapper: "border-[color:var(--ui-color-success)]/22 bg-[color:var(--ui-color-success)]/10",
      iconWrap: "text-[var(--ui-color-success)]",
      icon: <CheckCircle2 size={16} />,
      title: "text-[var(--ui-color-text)]",
      body: "text-[var(--ui-color-text-muted)]",
    },
    warning: {
      wrapper: "border-[color:var(--ui-color-warning)]/24 bg-[color:var(--ui-color-warning)]/10",
      iconWrap: "text-[var(--ui-color-warning)]",
      icon: <TriangleAlert size={16} />,
      title: "text-[var(--ui-color-text)]",
      body: "text-[var(--ui-color-text-muted)]",
    },
    error: {
      wrapper: "border-rose-300 bg-rose-50",
      iconWrap: "text-rose-500",
      icon: <AlertCircle size={16} />,
      title: "text-rose-700",
      body: "text-rose-600",
    },
  },
  immersive: {
    info: {
      wrapper: "border-sky-300/16 bg-sky-400/10",
      iconWrap: "text-sky-200",
      icon: <Info size={16} />,
      title: "text-white",
      body: "text-white/68",
    },
    success: {
      wrapper: "border-emerald-300/16 bg-emerald-400/10",
      iconWrap: "text-emerald-200",
      icon: <CheckCircle2 size={16} />,
      title: "text-white",
      body: "text-white/68",
    },
    warning: {
      wrapper: "border-amber-300/18 bg-amber-400/10",
      iconWrap: "text-amber-200",
      icon: <TriangleAlert size={16} />,
      title: "text-white",
      body: "text-white/68",
    },
    error: {
      wrapper: "border-rose-300/18 bg-rose-400/10",
      iconWrap: "text-rose-200",
      icon: <AlertCircle size={16} />,
      title: "text-white",
      body: "text-white/72",
    },
  },
};

export function StatusBanner({ tone = "info", title, children, action, className, appearance = "default" }: StatusBannerProps) {
  const toneConfig = toneMap[appearance][tone];

  return (
    <motion.div
      className={cn(
        appearance === "immersive"
          ? "overflow-hidden rounded-[20px] border px-4 py-4 shadow-[0_20px_42px_-28px_rgba(0,0,0,0.5)]"
          : "ui-foundation-panel px-4 py-4",
        toneConfig.wrapper,
        className
      )}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 shrink-0", toneConfig.iconWrap)}>{toneConfig.icon}</div>
          <div className="space-y-1">
            {title ? <p className={cn("text-sm font-semibold", toneConfig.title)}>{title}</p> : null}
            <div className={cn("text-sm leading-6", toneConfig.body)}>{children}</div>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </motion.div>
  );
}
