"use client";

import React from "react";

interface IdeBottomDockProps {
  collapsed: boolean;
  height: number;
  isCompact: boolean;
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

export default function IdeBottomDock({
  collapsed,
  height,
  isCompact,
  onResizeStart,
  children,
}: IdeBottomDockProps) {
  if (collapsed) {
    return <div>{children}</div>;
  }

  return (
    <>
      {!isCompact ? (
        <div className="px-1">
          <div
            className="h-2 cursor-row-resize rounded-full bg-[linear-gradient(90deg,rgba(48,71,166,0.24),rgba(19,131,111,0.2))] transition-transform hover:scale-y-110"
            onMouseDown={onResizeStart}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize terminal panel"
          />
        </div>
      ) : null}
      <div style={{ height }} className="min-h-[160px] transition-[height] duration-200">
        {children}
      </div>
    </>
  );
}
