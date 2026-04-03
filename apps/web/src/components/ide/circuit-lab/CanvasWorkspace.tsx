"use client";

import React from "react";
import BreadboardCanvas from "../BreadboardCanvas";

export default function CanvasWorkspace() {
  return (
    <section className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-[26px] bg-[#050913] shadow-[0_26px_72px_-56px_rgba(0,0,0,1)] ring-1 ring-white/5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(19,27,39,0.24)_0%,rgba(7,10,17,0.04)_45%,transparent_100%)]" />
      <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-[26px]">
        <BreadboardCanvas showPalette />
      </div>
    </section>
  );
}
