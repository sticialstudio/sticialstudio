// src/lib/wiring/BreadboardSVG.tsx
import React from 'react';

import { WORKSPACE_SCALE } from '@/lib/wiring/componentGeometry';
import { BREADBOARD_CONFIG, generateBreadboardLocalAnchors, type BreadboardAnchor } from '@/lib/wiring/breadboardModel';

import type { ComponentDefinition } from './componentDefinitions';

export { BREADBOARD_CONFIG, generateBreadboardLocalAnchors, type BreadboardAnchor } from '@/lib/wiring/breadboardModel';

export const generateBreadboardAnchors = (bx: number, by: number): Record<string, BreadboardAnchor> => {
  return Object.fromEntries(
    Object.entries(generateBreadboardLocalAnchors()).map(([key, anchor]) => [
      key,
      {
        x: bx + anchor.x * WORKSPACE_SCALE,
        y: by + anchor.y * WORKSPACE_SCALE,
      },
    ])
  );
};

const Hole = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-4" y="-4" width="8" height="8" rx="2" fill="#eef2f7" />
    <circle cx="0" cy="0" r="2.4" fill="#111827" />
    <circle cx="-0.8" cy="-0.8" r="0.67" fill="#ffffff" opacity="0.3" />
  </g>
);

const RailSegment = ({ y, color }: { y: number; color: string }) => {
  const { startX, width } = BREADBOARD_CONFIG;
  const outerPadding = Math.min(startX - 8, 18.2);
  const rightEndX = width - outerPadding;

  return (
    <line x1={outerPadding} y1={y} x2={rightEndX} y2={y} stroke={color} strokeWidth="2" strokeLinecap="round" />
  );
};

export const BreadboardVisual = ({
  definition,
  onAnchorMouseEnter,
  onAnchorMouseLeave,
  onAnchorMouseDown,
  wirePreview,
  hoveredAnchorId,
}: {
  definition: ComponentDefinition;
  onAnchorMouseEnter?: (id: string) => void;
  onAnchorMouseLeave?: () => void;
  onAnchorMouseDown?: (event: React.MouseEvent<SVGElement>, anchor: any) => void;
  wirePreview?: { targetId?: string | null };
  hoveredAnchorId?: string | null;
}) => {
  const anchors = generateBreadboardLocalAnchors();

  return (
    <div
      style={{
        width: definition.size.width,
        height: definition.size.height,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <svg
        width={definition.size.width}
        height={definition.size.height}
        style={{ position: 'absolute', inset: 0 }}
        viewBox={`0 0 ${BREADBOARD_CONFIG.width} ${BREADBOARD_CONFIG.height}`}
      >
        <BreadboardSVG />
      </svg>

      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
        viewBox={`0 0 ${BREADBOARD_CONFIG.width} ${BREADBOARD_CONFIG.height}`}
      >
        {Object.entries(anchors).map(([id, anchor]) => {
          const anchorId = `BB_${id}`;
          const isHovered = hoveredAnchorId === anchorId;
          const isWireTarget = wirePreview?.targetId === anchorId;
          const accent = isWireTarget ? '#22d3ee' : '#10b981';

          return (
            <g key={anchorId}>
              <rect
                x={anchor.x - 5.1}
                y={anchor.y - 5.1}
                width={10.2}
                height={10.2}
                rx={2.2}
                fill={accent}
                opacity={isHovered || isWireTarget ? 0.16 : 0}
                className="transition-opacity duration-150"
              />
              <rect
                x={anchor.x - 2.4}
                y={anchor.y - 2.4}
                width={4.8}
                height={4.8}
                rx={1.2}
                fill={accent}
                opacity={isHovered || isWireTarget ? 0.98 : 0}
                className="transition-opacity duration-150"
              />
              <rect
                x={anchor.x - 5.5}
                y={anchor.y - 5.5}
                width={11}
                height={11}
                rx={2.5}
                fill="transparent"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onMouseEnter={() => onAnchorMouseEnter?.(anchorId)}
                onMouseLeave={() => onAnchorMouseLeave?.()}
                onMouseDown={(event) =>
                  onAnchorMouseDown?.(event, { ...anchor, id: anchorId, kind: 'breadboard' })
                }
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const BreadboardSVG = ({ x = 0, y = 0 }: { x?: number; y?: number }) => {
  const { width, columns, holeSpacingX, holeSpacingY, startX, startY } = BREADBOARD_CONFIG;

  const renderTerminalColumn = (cx: number, cy: number) => (
    <g>
      {Array.from({ length: 5 }).map((_, index) => (
        <Hole key={index} x={cx} y={cy + index * holeSpacingY} />
      ))}
    </g>
  );

  const railRow = (yPosition: number, color: string, labelOffset: number) => (
    <g>
      {Array.from({ length: columns }).map((_, col) => (
        <Hole key={col} x={startX + col * holeSpacingX} y={yPosition} />
      ))}
      <RailSegment y={yPosition + labelOffset} color={color} />
    </g>
  );


  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id="trench_grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="10%" stopColor="#cbd5e1" />
          <stop offset="90%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={BREADBOARD_CONFIG.width} height={BREADBOARD_CONFIG.height} rx="6" fill="#fefefe" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M 0 35 L 2 40 L 2 111 L 0 116 Z" fill="#f1f5f9" />
      <path d={`M ${width} 35 L ${width - 2} 40 L ${width - 2} 111 L ${width} 116 Z`} fill="#f1f5f9" />

      <text x="12" y={startY + 2.5} fill="#3b82f6" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">-</text>
      <text x="12" y={startY + holeSpacingY + 2.5} fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">+</text>
      <text x={width - 12} y={startY + 2.5} fill="#3b82f6" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">-</text>
      <text x={width - 12} y={startY + holeSpacingY + 2.5} fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">+</text>

      <text x="12" y={startY + 16 * holeSpacingY + 2.5} fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">+</text>
      <text x="12" y={startY + 17 * holeSpacingY + 2.5} fill="#3b82f6" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">-</text>
      <text x={width - 12} y={startY + 16 * holeSpacingY + 2.5} fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">+</text>
      <text x={width - 12} y={startY + 17 * holeSpacingY + 2.5} fill="#3b82f6" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">-</text>

      {railRow(startY, '#3b82f6', -6)}
      {railRow(startY + holeSpacingY, '#ef4444', 6)}

      <g>
        {Array.from({ length: columns }).map((_, col) => {
          const cx = startX + col * holeSpacingX;
          const cy = startY + 3 * holeSpacingY;
          return <g key={`top_${col}`}>{renderTerminalColumn(cx, cy)}</g>;
        })}
      </g>

      <rect
        x={startX - 3.6}
        y={startY + 7.5 * holeSpacingY + 2}
        width={width - startX * 2 + 7.2}
        height="10.4"
        rx="2"
        fill="url(#trench_grad)"
        stroke="#94a3b8"
        strokeWidth="0.5"
      />
      <rect
        x={startX - 3.6}
        y={startY + 7.5 * holeSpacingY + 4}
        width={width - startX * 2 + 7.2}
        height="6.4"
        fill="#cbd5e1"
      />

      <g>
        {Array.from({ length: columns }).map((_, col) => {
          const cx = startX + col * holeSpacingX;
          const cy = startY + 10 * holeSpacingY;
          return <g key={`bottom_${col}`}>{renderTerminalColumn(cx, cy)}</g>;
        })}
      </g>

      {railRow(startY + 16 * holeSpacingY, '#ef4444', -6)}
      {railRow(startY + 17 * holeSpacingY, '#3b82f6', 6)}


      <g fill="#94a3b8" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
        {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((num) => (
          <g key={`num_${num}`}>
            <text x={startX + (num - 1) * holeSpacingX} y={startY + 2.4 * holeSpacingY + 1} textAnchor="middle">
              {num}
            </text>
            <text x={startX + (num - 1) * holeSpacingX} y={startY + 14.8 * holeSpacingY + 1} textAnchor="middle">
              {num}
            </text>
          </g>
        ))}
      </g>

      <g fill="#64748b" fontSize="7" fontFamily="monospace" fontWeight="bold">
        {['a', 'b', 'c', 'd', 'e'].map((letter, index) => (
          <g key={letter}>
            <text x="12" y={startY + 3 * holeSpacingY + index * holeSpacingY + 2.5} textAnchor="middle">
              {letter}
            </text>
            <text x={width - 12} y={startY + 3 * holeSpacingY + index * holeSpacingY + 2.5} textAnchor="middle">
              {letter}
            </text>
          </g>
        ))}
        {['f', 'g', 'h', 'i', 'j'].map((letter, index) => (
          <g key={letter}>
            <text x="12" y={startY + 10 * holeSpacingY + index * holeSpacingY + 2.5} textAnchor="middle">
              {letter}
            </text>
            <text x={width - 12} y={startY + 10 * holeSpacingY + index * holeSpacingY + 2.5} textAnchor="middle">
              {letter}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};
