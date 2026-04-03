"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui/cn";
import { fadeInUp, hoverLift } from "./motion";

type CardVariant = "choice" | "panel" | "quiet" | "immersive";

type CardProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  image?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  choice:
    "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-color-surface)_96%,transparent)_0%,color-mix(in_srgb,var(--ui-color-surface)_88%,transparent)_100%)] shadow-[var(--ui-shadow-card)]",
  panel:
    "bg-[color:var(--ui-surface-elevated)] shadow-[0_18px_38px_-28px_rgba(15,23,42,0.24)]",
  quiet:
    "bg-[color:var(--ui-surface-quiet)] shadow-[0_12px_28px_-24px_rgba(15,23,42,0.16)]",
  immersive:
    "bg-[linear-gradient(180deg,rgba(18,22,36,0.98)_0%,rgba(13,16,28,0.96)_100%)] shadow-[0_28px_72px_-42px_rgba(0,0,0,0.92)] border-white/10",
};

export function Card({
  title,
  description,
  eyebrow,
  icon,
  image,
  selected = false,
  onClick,
  className,
  children,
  footer,
  variant = "choice",
}: CardProps) {
  const interactive = typeof onClick === "function";
  const isImmersive = variant === "immersive";

  const baseClassName = cn(
    "group relative isolate overflow-hidden rounded-[28px] border text-left transition-[border-color,box-shadow,transform,background] duration-200 backdrop-blur-xl",
    image ? "p-0" : "p-6",
    variantClasses[variant],
    interactive &&
      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-color-primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-color-surface)]",
    selected &&
      (isImmersive
        ? "border-sky-300/36 shadow-[0_30px_88px_-38px_rgba(74,115,255,0.34)]"
        : "border-[color:var(--ui-color-primary)]/55 shadow-[var(--ui-shadow-card-hover),0_0_0_1px_color-mix(in_srgb,var(--ui-color-primary)_22%,transparent)]"),
    className
  );

  const innerContentClass = image ? "flex flex-col gap-2.5 px-5 py-4 h-full" : "flex flex-col gap-5 h-full";

  const content = (
    <>
      {image && (
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[color:var(--ui-surface-quiet)]">
          <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 mix-blend-multiply" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[color:var(--ui-color-surface)] to-transparent" />
        </div>
      )}
      <div className={cn(
        "pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-200 group-hover:opacity-100",
        isImmersive
          ? "bg-[radial-gradient(circle_at_top_right,rgba(120,156,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(76,236,199,0.08),transparent_28%)]"
          : "bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--ui-color-primary)_14%,transparent),transparent_34%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--ui-color-accent)_11%,transparent),transparent_30%)]"
      )} />
      <div className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-px opacity-80",
        isImmersive
          ? "bg-[linear-gradient(90deg,transparent,rgba(128,164,255,0.32),transparent)]"
          : "bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ui-color-primary)_28%,transparent),transparent)]"
      )} />
      <div className={cn("relative z-10", innerContentClass)}>
        {(icon || eyebrow) && (
          <div className="flex items-start justify-between gap-4">
            {icon ? (
              <div className={cn(
                "flex items-center justify-center border shadow-[0_16px_34px_-24px_rgba(28,51,118,0.38)]",
                image ? "h-10 w-10 rounded-[14px] -mt-6 bg-black/40 backdrop-blur-xl border-white/20 text-white" : "h-12 w-12 rounded-[18px]",
                !image && isImmersive && "border-white/10 bg-white/[0.04] text-sky-300",
                !image && !isImmersive && "border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] text-[var(--ui-color-primary)]"
              )}>
                {icon}
              </div>
            ) : (
              <span />
            )}
            {eyebrow ? (
              <span className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                isImmersive ? "text-white/52" : "text-[var(--ui-color-text-soft)]",
                image && "mt-1"
              )}>
                {eyebrow}
              </span>
            ) : null}
          </div>
        )}

        {(title || description) && (
          <div className="space-y-1.5">
            {title ? <h3 className={cn("font-semibold tracking-[-0.04em]", image ? "text-[1.15rem]" : "text-[1.35rem]", isImmersive ? "text-white" : "text-[var(--ui-color-text)]")}>{title}</h3> : null}
            {description ? <p className={cn("max-w-[34ch]", image ? "text-xs leading-5 line-clamp-2" : "text-sm leading-6", isImmersive ? "text-white/64" : "text-[var(--ui-color-text-muted)]")}>{description}</p> : null}
          </div>
        )}

        {children ? <div className={cn("flex-1", isImmersive ? "text-white" : "text-[var(--ui-color-text)]")}>{children}</div> : null}
        {footer ? <div className={cn(image ? "mt-auto pt-2" : "mt-auto pt-4", isImmersive ? "text-white/58" : "text-[var(--ui-color-text-muted)]")}>{footer}</div> : null}
      </div>
    </>
  );

  if (interactive) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        className={baseClassName}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        {...hoverLift}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div className={baseClassName} variants={fadeInUp} initial="hidden" animate="visible">
      {content}
    </motion.div>
  );
}
