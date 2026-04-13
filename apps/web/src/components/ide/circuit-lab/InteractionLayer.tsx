"use client";

import React from 'react';

import type { CanvasTransform, MountPreviewState, WireDraftState, WorldPinNode } from './sceneTypes';

interface InteractionLayerProps {
  transform: CanvasTransform;
  pins: WorldPinNode[];
  highlightedPinIds: Set<string>;
  validTargetPinId: string | null;
  mountPreview: MountPreviewState | null;
  wireDraft: WireDraftState | null;
  cursor: string;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
}

function AnchorHalo({
  x,
  y,
  color,
  strong = false,
  pulse = false,
}: {
  x: number;
  y: number;
  color: string;
  strong?: boolean;
  pulse?: boolean;
}) {
  const outer = strong ? 30 : 22;
  const middle = strong ? 16 : 12;
  const inner = strong ? 9.4 : 8.4;
  return (
    <g className={pulse ? 'animate-pulse' : undefined}>
      <rect x={x - outer / 2} y={y - outer / 2} width={outer} height={outer} rx={strong ? 7 : 5} fill={color} opacity={strong ? 0.18 : 0.1} />
      <rect x={x - middle / 2} y={y - middle / 2} width={middle} height={middle} rx={strong ? 5 : 3.5} fill={color} opacity={strong ? 0.22 : 0.14} />
      <rect x={x - inner / 2} y={y - inner / 2} width={inner} height={inner} rx={2} fill={color} opacity={0.98} />
    </g>
  );
}

function PreviewNodeMarker({ x, y, snapped }: { x: number; y: number; snapped: boolean }) {
  const color = snapped ? '#22c55e' : '#22d3ee';
  return <AnchorHalo x={x} y={y} color={color} strong={snapped} pulse={snapped} />;
}

function SignalIndicator({ pin }: { pin: WorldPinNode }) {
  if (!pin.signalState || pin.signalState === 'FLOAT' || pin.kind === 'breadboard') {
    return null;
  }

  const isHigh = pin.signalState === 'HIGH';
  const fill = isHigh ? '#34d399' : '#94a3b8';
  const stroke = isHigh ? '#d1fae5' : '#e2e8f0';

  return (
    <g>
      <rect
        x={pin.position.x + 6}
        y={pin.position.y - 12}
        width={8}
        height={8}
        rx={2}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.9}
        opacity={0.95}
      />
      <rect
        x={pin.position.x + 3}
        y={pin.position.y - 15}
        width={14}
        height={14}
        rx={4}
        fill={fill}
        opacity={isHigh ? 0.12 : 0.08}
      />
    </g>
  );
}

function GroupHighlight({ mountPreview }: { mountPreview: MountPreviewState }) {
  const stroke = mountPreview.isValid ? 'rgba(34,211,238,0.68)' : 'rgba(248,113,113,0.82)';
  const fill = mountPreview.isValid ? 'rgba(34,211,238,0.08)' : 'rgba(248,113,113,0.1)';

  return (
    <g>
      {mountPreview.groupHighlights.map((highlight) => (
        <rect
          key={highlight.id}
          x={highlight.bounds.x}
          y={highlight.bounds.y}
          width={highlight.bounds.width}
          height={highlight.bounds.height}
          rx={highlight.kind === 'rail' ? 12 : 8}
          fill={fill}
          stroke={stroke}
          strokeWidth={highlight.kind === 'rail' ? 1.2 : 1.4}
          strokeDasharray={highlight.kind === 'rail' ? '10 10' : '7 7'}
          opacity={highlight.kind === 'rail' ? 0.82 : 0.95}
        />
      ))}
    </g>
  );
}

function ContinuityTargetHighlights({ pins, validTargetPinId, highlightedPinIds }: { pins: WorldPinNode[]; validTargetPinId: string | null; highlightedPinIds: Set<string> }) {
  const seen = new Set<string>();
  const targetPins = pins.filter(
    (pin) => pin.kind === 'breadboard' && pin.continuityBounds && (pin.id === validTargetPinId || highlightedPinIds.has(pin.id))
  );

  return (
    <g>
      {targetPins.map((pin) => {
        if (!pin.continuityGroupId || !pin.continuityBounds || seen.has(pin.continuityGroupId)) {
          return null;
        }
        seen.add(pin.continuityGroupId);
        const isTarget = pin.id === validTargetPinId;
        return (
          <rect
            key={`continuity-${pin.continuityGroupId}`}
            x={pin.continuityBounds.x}
            y={pin.continuityBounds.y}
            width={pin.continuityBounds.width}
            height={pin.continuityBounds.height}
            rx={pin.continuityKind === 'rail' ? 12 : 8}
            fill={isTarget ? 'rgba(34,197,94,0.08)' : 'rgba(34,211,238,0.06)'}
            stroke={isTarget ? 'rgba(34,197,94,0.82)' : 'rgba(34,211,238,0.5)'}
            strokeWidth={pin.continuityKind === 'rail' ? 1.2 : 1.35}
            strokeDasharray={pin.continuityKind === 'rail' ? '10 10' : '7 7'}
            opacity={isTarget ? 0.95 : 0.78}
          />
        );
      })}
    </g>
  );
}

function InteractionLayerImpl({
  transform,
  pins,
  highlightedPinIds,
  validTargetPinId,
  mountPreview,
  wireDraft,
  cursor,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onWheel,
}: InteractionLayerProps) {
  return (
    <div
      className="absolute inset-0 touch-none"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
      data-canvas-interaction="true"
      data-wire-preview={wireDraft ? 'active' : 'idle'}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" width="100%" height="100%" aria-hidden="true">
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {pins.map((pin) => (
            <SignalIndicator key={`${pin.id}-signal`} pin={pin} />
          ))}

          <ContinuityTargetHighlights pins={pins} validTargetPinId={validTargetPinId} highlightedPinIds={highlightedPinIds} />

          {mountPreview ? (
            <g>
              {mountPreview.groupHighlights.length > 0 ? <GroupHighlight mountPreview={mountPreview} /> : null}

              <g
                transform={`translate(${mountPreview.position.x} ${mountPreview.position.y}) rotate(${mountPreview.rotation} ${mountPreview.size.width / 2} ${mountPreview.size.height / 2})`}
                opacity={0.98}
              >
                <rect
                  x={-6}
                  y={-6}
                  width={mountPreview.size.width + 12}
                  height={mountPreview.size.height + 12}
                  rx={18}
                  fill={mountPreview.isValid ? 'rgba(34,211,238,0.08)' : 'rgba(248,113,113,0.09)'}
                  stroke={mountPreview.isValid ? 'rgba(34,211,238,0.9)' : 'rgba(248,113,113,0.95)'}
                  strokeWidth={1.6}
                  strokeDasharray={mountPreview.isValid ? '12 9' : '8 8'}
                />
              </g>

              {mountPreview.matchedAnchors.map((anchor, index) => (
                <AnchorHalo
                  key={`${mountPreview.componentId}-anchor-${index}-${anchor.x}-${anchor.y}`}
                  x={anchor.x}
                  y={anchor.y}
                  color={mountPreview.isValid ? '#22d3ee' : '#f87171'}
                  strong={mountPreview.isValid}
                />
              ))}
            </g>
          ) : null}

          {wireDraft ? (
            <g>
              <AnchorHalo x={wireDraft.fromPoint.x} y={wireDraft.fromPoint.y} color="#22d3ee" strong pulse />
              <PreviewNodeMarker x={wireDraft.previewPoint.x} y={wireDraft.previewPoint.y} snapped={Boolean(wireDraft.hoveredTargetPinId)} />
            </g>
          ) : null}

          {pins
            .filter((pin) => highlightedPinIds.has(pin.id) || validTargetPinId === pin.id)
            .map((pin) => {
              const isTarget = validTargetPinId === pin.id;
              const color = isTarget ? '#22c55e' : '#22d3ee';
              return <AnchorHalo key={pin.id} x={pin.position.x} y={pin.position.y} color={color} strong={isTarget} pulse={isTarget} />;
            })}
        </g>
      </svg>
    </div>
  );
}

export default React.memo(InteractionLayerImpl);
