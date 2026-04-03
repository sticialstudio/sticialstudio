"use client";

import * as React from "react";
import { cn } from "@/lib/ui/cn";

type SurfaceVariant = "panel" | "quiet" | "raised" | "inverse";
type SurfacePadding = "none" | "sm" | "md" | "lg";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  animated?: boolean;
}

const variantClasses: Record<SurfaceVariant, string> = {
  panel: "ui-foundation-panel",
  quiet: "ui-foundation-panel-quiet",
  raised: "ui-floating-panel",
  inverse: "border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.94)_0%,rgba(14,18,28,0.88)_100%)] text-white shadow-[0_24px_60px_-34px_rgba(0,0,0,0.72)] backdrop-blur-xl",
};

const paddingClasses: Record<SurfacePadding, string> = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Surface({
  className,
  variant = "panel",
  padding = "md",
  animated = false,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(variantClasses[variant], paddingClasses[padding], animated && "ui-fade-up", className)}
      {...props}
    >
      {children}
    </div>
  );
}
