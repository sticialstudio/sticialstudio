"use client";

import React from 'react';

import type { WireDraftState, WorldWireNode, WireHandleNode } from './sceneTypes';

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

function renderHandle(handle: WireHandleNode) {
  if (handle.kind === 'segment') {
    return (
      <g key={handle.id} data-wire-id={handle.wireId} data-wire-handle-kind={handle.kind}>
        <circle cx={handle.position.x} cy={handle.position.y} r={10.5} fill="rgba(34,211,238,0.12)" />
        <circle cx={handle.position.x} cy={handle.position.y} r={5} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1.2} />
      </g>
    );
  }

  if (handle.kind === 'endpoint') {
    return (
      <g key={handle.id} data-wire-id={handle.wireId} data-wire-handle-kind={handle.kind} data-wire-handle-endpoint={handle.endpoint}>
        <rect x={handle.position.x - 7.5} y={handle.position.y - 7.5} width={15} height={15} rx={3.2} fill="rgba(34,211,238,0.14)" />
        <rect x={handle.position.x - 4.3} y={handle.position.y - 4.3} width={8.6} height={8.6} rx={2.2} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1.05} />
      </g>
    );
  }

  return (
    <g key={handle.id} data-wire-id={handle.wireId} data-wire-handle-kind={handle.kind}>
      <rect
        x={handle.position.x - 6}
        y={handle.position.y - 6}
        width={12}
        height={12}
        rx={2.5}
        transform={`rotate(45 ${handle.position.x} ${handle.position.y})`}
        fill="rgba(34,211,238,0.12)"
      />
      <rect
        x={handle.position.x - 3.2}
        y={handle.position.y - 3.2}
        width={6.4}
        height={6.4}
        rx={1.4}
        transform={`rotate(45 ${handle.position.x} ${handle.position.y})`}
        fill="#22d3ee"
        stroke="#ecfeff"
        strokeWidth={1}
      />
    </g>
  );
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
        const isSelected = selectedWireId === wire.id || wire.isSelected;
        const isHovered = hoveredWireId === wire.id || wire.isHovered;
        const path = pointsToPath(wire.interactionPoints);
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
              data-wire-id={wire.id}
              data-wire-role="main"
              data-from-anchor-id={wire.fromAnchorId ?? ''}
              data-to-anchor-id={wire.toAnchorId ?? ''}
              stroke={wire.signalState && wire.signalState !== 'FLOAT' ? signalColor : wire.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={wire.isActive ? 1 : isSelected ? 0.98 : 0.92}
              className={isRecentlyCreated ? 'animate-wire-draw' : undefined}
            />

            {isSelected ? wire.bendHandles.map((handle) => renderHandle(handle)) : null}
          </g>
        );
      })}

      {wireDraft ? (
        <g>
          <path d={pointsToPath(wireDraft.points)} stroke="#22d3ee" strokeWidth={wireDraft.targetLockState === 'locked' ? 8.5 : 8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={wireDraft.crowdedTargets ? 0.18 : 0.16} filter="url(#wire-glow-overlay)" />
          <path d={pointsToPath(wireDraft.points)} stroke="#22d3ee" strokeWidth={wireDraft.targetLockState === 'locked' ? 3.7 : 3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 6" opacity={0.98} className="animate-wire-preview" />
          <g>
            <circle cx={wireDraft.fromPoint.x} cy={wireDraft.fromPoint.y} r={9} fill="rgba(34,211,238,0.14)" />
            <circle cx={wireDraft.fromPoint.x} cy={wireDraft.fromPoint.y} r={4.6} fill="#22d3ee" stroke="#ecfeff" strokeWidth={1.1} />
          </g>
          <g>
            {wireDraft.hoveredTargetPinId ? (
              <circle
                cx={wireDraft.previewPoint.x}
                cy={wireDraft.previewPoint.y}
                r={wireDraft.targetLockState === 'locked' ? 13 : 11}
                fill="rgba(34,197,94,0.18)"
                className={wireDraft.targetLockState === 'locked' ? 'animate-ping' : undefined}
              />
            ) : null}
            {wireDraft.hoveredTargetPinId && wireDraft.targetLockState === 'locked' ? (
              <circle cx={wireDraft.previewPoint.x} cy={wireDraft.previewPoint.y} r={8.6} fill="rgba(34,197,94,0.16)" />
            ) : null}
            <circle
              cx={wireDraft.previewPoint.x}
              cy={wireDraft.previewPoint.y}
              r={wireDraft.hoveredTargetPinId ? (wireDraft.targetLockState === 'locked' ? 6.8 : 6) : 5}
              fill={wireDraft.hoveredTargetPinId ? '#22c55e' : '#22d3ee'}
              stroke="#ecfeff"
              strokeWidth={1.1}
              opacity={0.98}
            />
          </g>
        </g>
      ) : null}
    </>
  );
}

export default React.memo(WireEngineImpl);

