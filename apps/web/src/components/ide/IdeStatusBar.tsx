"use client";

import React from "react";
import { Cpu, Wifi, WifiOff } from "lucide-react";

interface IdeStatusBarProps {
  boardName: string;
  isConnected: boolean;
  leftMessage?: string;
}

export default function IdeStatusBar({
  boardName,
  isConnected,
  leftMessage = "Ready.",
}: IdeStatusBarProps) {
  return (
    <div className="flex h-7 w-full items-center justify-between border-t border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)]/95 px-4 text-[11px] font-medium tracking-wide text-[var(--ui-color-text-muted)] shadow-inner">
      <div className="flex items-center gap-4">
        <span>{leftMessage}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu size={12} className="text-[var(--ui-color-text-soft)]" />
          <span>{boardName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Wifi size={12} className="text-emerald-400" />
              <span className="text-emerald-300">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-rose-400" />
              <span className="text-rose-300">Disconnected</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
