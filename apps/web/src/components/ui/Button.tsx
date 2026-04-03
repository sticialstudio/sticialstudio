"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui/cn";
import { hoverLift, pressMotion } from "./motion";

type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[linear-gradient(135deg,var(--ui-color-primary)_0%,var(--ui-color-primary-strong)_100%)] text-white shadow-[var(--ui-shadow-button)] hover:brightness-[1.04]",
  secondary:
    "border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-elevated)] text-[var(--ui-color-text)] shadow-[var(--ui-shadow-card)] hover:border-[color:var(--ui-color-primary)]/44 hover:bg-white/95",
  soft:
    "border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] text-[var(--ui-color-text)] shadow-[0_14px_30px_-26px_rgba(15,23,42,0.25)] hover:border-[color:var(--ui-border-strong)] hover:bg-[color:var(--ui-surface-elevated)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ui-color-text-muted)] shadow-none hover:border-[color:var(--ui-border-soft)] hover:bg-[color:var(--ui-surface-quiet)] hover:text-[var(--ui-color-text)]",
  inverse:
    "border border-white/10 bg-white/[0.04] text-white shadow-[0_22px_48px_-30px_rgba(0,0,0,0.55)] hover:border-white/18 hover:bg-white/[0.08]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-[16px] px-3.5 py-2 text-xs",
  md: "min-h-11 rounded-[18px] px-4.5 py-2.5 text-sm",
  lg: "min-h-13 rounded-[22px] px-6 py-3.5 text-[15px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    icon,
    trailingIcon,
    children,
    disabled,
    type = "button",
    fullWidth = false,
    ...props
  },
  ref
) {
  const motionProps = disabled ? {} : variant === "ghost" ? pressMotion : hoverLift;
  const iconOnly = !children && (icon || trailingIcon);

  return (
    <motion.div className={cn("inline-flex", fullWidth && "w-full")} {...motionProps}>
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 border font-semibold tracking-[-0.01em] transition-[border-color,background-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-color-primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-color-surface)] disabled:cursor-not-allowed disabled:opacity-55",
          fullWidth && "w-full",
          iconOnly && "aspect-square px-0",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {icon ? <span className="shrink-0">{icon}</span> : null}
        {children ? <span>{children}</span> : null}
        {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
      </button>
    </motion.div>
  );
});
