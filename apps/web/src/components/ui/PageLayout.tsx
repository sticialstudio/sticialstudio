"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui/cn";
import { pageFadeSlide } from "./motion";

type PageLayoutWidth = "content" | "wide" | "full";
type PageLayoutTone = "default" | "workspace" | "immersive";

type PageLayoutProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  width?: PageLayoutWidth;
  tone?: PageLayoutTone;
};

const widthClasses: Record<PageLayoutWidth, string> = {
  content: "max-w-6xl",
  wide: "max-w-[1380px]",
  full: "max-w-none",
};

const toneClasses: Record<PageLayoutTone, string> = {
  default: "ui-page-shell",
  workspace: "ui-page-shell ui-page-shell-workspace",
  immersive: "ui-page-shell ui-page-shell-immersive",
};

export function PageLayout({
  children,
  className,
  contentClassName,
  width = "wide",
  tone = "default",
}: PageLayoutProps) {
  return (
    <div className={cn(toneClasses[tone], "min-h-screen", className)}>
      <div className="ui-page-backdrop" aria-hidden="true" />
      <motion.div
        className={cn(
          "relative z-[1] mx-auto flex w-full flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12",
          widthClasses[width],
          contentClassName
        )}
        variants={pageFadeSlide}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </div>
  );
}
