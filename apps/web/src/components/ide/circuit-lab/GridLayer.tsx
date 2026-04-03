"use client";

import React from 'react';

import { GRID_PITCH } from '@/lib/wiring/componentGeometry';

const WORLD_EXTENT = 24000;

function GridLayer({ gridPitch = GRID_PITCH }: { gridPitch?: number }) {
  const visualGridPitch = gridPitch * 1.08;
  const majorGridPitch = visualGridPitch * 6;

  return (
    <>
      <defs>
        <pattern id="world-grid-fine" width={visualGridPitch} height={visualGridPitch} patternUnits="userSpaceOnUse">
          <path
            d={`M ${visualGridPitch} 0 L 0 0 0 ${visualGridPitch}`}
            fill="none"
            stroke="#67e8f9"
            strokeWidth="0.65"
            strokeOpacity="0.05"
          />
        </pattern>
        <pattern id="world-grid-major" width={majorGridPitch} height={majorGridPitch} patternUnits="userSpaceOnUse">
          <rect width={majorGridPitch} height={majorGridPitch} fill="url(#world-grid-fine)" />
          <path
            d={`M ${majorGridPitch} 0 L 0 0 0 ${majorGridPitch}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.95"
            strokeOpacity="0.11"
          />
        </pattern>
        <radialGradient id="world-grid-vignette" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="rgba(15,23,42,0)" />
          <stop offset="100%" stopColor="rgba(2,6,23,0.28)" />
        </radialGradient>
      </defs>
      <rect
        x={-WORLD_EXTENT / 2}
        y={-WORLD_EXTENT / 2}
        width={WORLD_EXTENT}
        height={WORLD_EXTENT}
        fill="url(#world-grid-major)"
        pointerEvents="none"
      />
      <rect
        x={-WORLD_EXTENT / 2}
        y={-WORLD_EXTENT / 2}
        width={WORLD_EXTENT}
        height={WORLD_EXTENT}
        fill="url(#world-grid-vignette)"
        pointerEvents="none"
      />
    </>
  );
}

export default React.memo(GridLayer);
