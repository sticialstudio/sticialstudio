"use client";

import React from 'react';

import type { WireDraftState, WorldWireNode } from './sceneTypes';

interface WireEngineProps {
  wires: WorldWireNode[];
  selectedWireId: string | null;
  hoveredWireId: string | null;
  wireDraft: WireDraftState | null;
  recentlyCreatedWireId?: string | null;
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return '';
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function getSignalColor(signalState: WorldWireNode['signalState'], fallbackColor: string) {
  if (signalState === 'HIGH') {
    return '#34d399';
  }

  if (signalState === 'LOW') {
    return '#94a3b8';
  }

  return fallbackColor;
}

function WireEngineImpl({
  wires,
  selectedWireId,
  hoveredWireId,
  wireDraft,
  recentlyCreatedWireId,
}: WireEngineProps) {
  return (
    <>
      <defs>
        <filter id="wire-glow-overlay" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {wires.map((wire) => {
        const path = pointsToPath(wire.points);
        const isSelected = selectedWireId === wire.id || wire.isSelected;
        const isHovered = hoveredWireId === wire.id || wire.isHovered;
        const isRecentlyCreated = recentlyCreatedWireId === wire.id;
        const signalColor = getSignalColor(wire.signalState, wire.color);
        const strokeWidth = isSelected ? 4.2 : isHovered ? 3.6 : wire.isActive ? 3.2 : 2.8;

        return (
          <g key={wire.id}>
            {wire.signalState && wire.signalState !== 'FLOAT' ? (
              <path
                d={path}
                stroke={signalColor}
                strokeWidth={isSelected ? 9 : 7}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={wire.signalState === 'HIGH' ? 0.16 : 0.08}
                filter="url(#wire-glow-overlay)"
                className={wire.signalState === 'HIGH' ? 'animate-wire-pulse' : undefined}
                style={wire.signalState === 'HIGH' ? ({ '--wire-color': signalColor } as React.CSSProperties) : undefined}
              />
            ) : null}

            {wire.isActive || isSelected || isHovered || isRecentlyCreated ? (
              <path
                d={path}
                stroke={wire.color}
                strokeWidth={isSelected ? 8.5 : isHovered ? 7.2 : 6.2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isSelected ? 0.22 : isHovered ? 0.12 : isRecentlyCreated ? 0.14 : 0.1}
                filter="url(#wire-glow-overlay)"
                className={wire.isActive ? 'animate-wire-pulse' : undefined}
                style={wire.isActive ? ({ '--wire-color': wire.color } as React.CSSProperties) : undefined}
              />
            ) : null}

            <path
              d={path}
              stroke={wire.signalState && wire.signalState !== 'FLOAT' ? signalColor : wire.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={wire.isActive ? 1 : isSelected ? 0.98 : 0.92}
              className={isRecentlyCreated ? 'animate-wire-draw' : undefined}
            />

            {isSelected ? (
              <>
                <rect x={wire.fromPoint.x - 4} y={wire.fromPoint.y - 4} width={8} height={8} rx={2} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1} />
                <rect x={wire.toPoint.x - 4} y={wire.toPoint.y - 4} width={8} height={8} rx={2} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1} />
              </>
            ) : null}

            {isSelected
              ? wire.bendHandles.map((handle) => (
                  <g key={handle.id}>
                    {handle.kind === 'segment' ? (
                      <>
                        <circle cx={handle.position.x} cy={handle.position.y} r={10} fill="rgba(34,211,238,0.10)" />
                        <circle cx={handle.position.x} cy={handle.position.y} r={4.5} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1.2} />
                      </>
                    ) : (
                      <>
                        <rect x={handle.position.x - 7} y={handle.position.y - 7} width={14} height={14} rx={3} fill="rgba(34,211,238,0.12)" />
                        <rect x={handle.position.x - 3.5} y={handle.position.y - 3.5} width={7} height={7} rx={1.6} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1} />
                      </>
                    )}
                  </g>
                ))
              : null}
          </g>
        );
      })}

      {wireDraft ? (
        <g>
          <path d={pointsToPath(wireDraft.points)} stroke="#22d3ee" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.12} filter="url(#wire-glow-overlay)" />
          <path d={pointsToPath(wireDraft.points)} stroke="#22d3ee" strokeWidth={3.1} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 6" opacity={0.96} className="animate-wire-preview" />
          <rect x={wireDraft.fromPoint.x - 4} y={wireDraft.fromPoint.y - 4} width={8} height={8} rx={2} fill="#22d3ee" opacity={0.98} />
          <rect x={wireDraft.previewPoint.x - 4.8} y={wireDraft.previewPoint.y - 4.8} width={9.6} height={9.6} rx={2} fill={wireDraft.hoveredTargetPinId ? '#22c55e' : '#22d3ee'} opacity={0.98} />
        </g>
      ) : null}
    </>
  );
}

export default React.memo(WireEngineImpl);

