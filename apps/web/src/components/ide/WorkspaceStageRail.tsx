"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui/cn";
import { fadeInUp } from "@/components/ui/motion";

type WorkspaceStageItem = {
  label: string;
  active?: boolean;
  subtle?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
};

interface WorkspaceStageRailProps {
  items: WorkspaceStageItem[];
  className?: string;
}

export default function WorkspaceStageRail({ items, className }: WorkspaceStageRailProps) {
  return (
    <motion.div
      className={cn(
        "inline-flex flex-wrap items-center gap-2 rounded-[20px] border border-[color:var(--ui-border-soft)] bg-white/70 p-1.5 shadow-[0_18px_40px_-30px_rgba(26,41,72,0.18)]",
        className
      )}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => {
        const interactive = typeof item.onClick === "function";
        const sharedClassName = cn(
          "inline-flex items-center gap-2 rounded-[16px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all",
          item.active
            ? "bg-[var(--ui-color-primary)] text-white shadow-[var(--ui-shadow-button)]"
            : item.subtle
              ? "border border-[color:var(--ui-border-soft)] bg-white/55 text-[var(--ui-color-text-soft)]"
              : "text-[var(--ui-color-text-muted)] hover:bg-white/75 hover:text-[var(--ui-color-text)]",
          interactive && "cursor-pointer"
        );

        if (interactive) {
          return (
            <button key={item.label} type="button" onClick={item.onClick} className={sharedClassName}>
              {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <div key={item.label} className={sharedClassName}>
            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
            <span>{item.label}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
