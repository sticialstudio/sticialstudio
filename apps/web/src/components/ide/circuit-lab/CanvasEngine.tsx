"use client";

import React from 'react';

import ComponentRenderer from './ComponentRenderer';
import GridLayer from './GridLayer';
import InteractionLayer from './InteractionLayer';
import type { CanvasTransform, MountPreviewState, SceneGraph, WireDraftState, WorldPinNode } from './sceneTypes';
import WireEngine from './WireEngine';

interface CanvasInteractionProps {
  pins: WorldPinNode[];
  visiblePinTargetIds: Set<string>;
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

interface CanvasEngineProps {
  scene: SceneGraph;
  transform: CanvasTransform;
  interactionProps: CanvasInteractionProps;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  recentlyCreatedWireId?: string | null;
  recentlyConnectedPinId?: string | null;
}

export default function CanvasEngine({
  scene,
  transform,
  interactionProps,
  containerRef,
  recentlyCreatedWireId,
  recentlyConnectedPinId,
}: CanvasEngineProps) {
  const connectedComponentIds = new Set<string>();
  scene.wires.forEach((wire) => {
    const fromPin = wire.fromAnchorId ? scene.pinById[wire.fromAnchorId] : null;
    const toPin = wire.toAnchorId ? scene.pinById[wire.toAnchorId] : null;
    if (fromPin?.componentId) connectedComponentIds.add(fromPin.componentId);
    if (toPin?.componentId) connectedComponentIds.add(toPin.componentId);
  });

  const selectedWireId = scene.wires.find((wire) => wire.isSelected)?.id ?? null;
  const hoveredWireId = scene.wires.find((wire) => wire.isHovered)?.id ?? null;
  const svgTransform = `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`;
  const htmlTransform = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    transformOrigin: '0 0',
  } as const;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-[20px] bg-[#050a12] ring-1 ring-white/5"
      data-canvas-root="true"
      data-testid="circuit-canvas-root"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            wokwi-arduino-uno, wokwi-led, wokwi-servo, wokwi-hc-sr04, wokwi-dht22, wokwi-ssd1306, wokwi-pushbutton, wokwi-potentiometer, wokwi-lcd1602, wokwi-resistor {
              display: block;
              width: 100%;
              height: 100%;
            }
            @keyframes wire-pulse {
              0%   { filter: drop-shadow(0 0 4px var(--wire-color)); opacity: 0.16; }
              50%  { filter: drop-shadow(0 0 12px var(--wire-color)) drop-shadow(0 0 24px var(--wire-color)); opacity: 0.55; }
              100% { filter: drop-shadow(0 0 4px var(--wire-color)); opacity: 0.16; }
            }
            @keyframes wire-draw {
              from { stroke-dashoffset: 1000; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes wire-preview-flow {
              from { stroke-dashoffset: 0; }
              to   { stroke-dashoffset: -40; }
            }
            @keyframes led-glow {
              0%   { filter: drop-shadow(0 0 10px var(--led-color)); box-shadow: inset 0 0 10px var(--led-color); opacity: 0.7; }
              50%  { filter: drop-shadow(0 0 25px var(--led-color)); box-shadow: inset 0 0 20px var(--led-color); opacity: 1; }
              100% { filter: drop-shadow(0 0 10px var(--led-color)); box-shadow: inset 0 0 10px var(--led-color); opacity: 0.7; }
            }
            @keyframes component-selected-glow {
              0%   { filter: drop-shadow(0 0 6px rgba(34,211,238,0.35)); }
              50%  { filter: drop-shadow(0 0 14px rgba(34,211,238,0.72)); }
              100% { filter: drop-shadow(0 0 6px rgba(34,211,238,0.35)); }
            }
            .animate-wire-draw { stroke-dasharray: 1000; animation: wire-draw 400ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
            .animate-wire-preview { animation: wire-preview-flow 1s linear infinite; }
            .animate-wire-pulse { animation: wire-pulse 2s ease-in-out infinite; }
            .animate-led-glow { animation: led-glow 1.5s ease-in-out infinite; }
            .animate-component-selected { animation: component-selected-glow 2s ease-in-out infinite; }
          `,
        }}
      />

      <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(10,16,26,0.96)_0%,rgba(4,8,14,1)_100%)]" aria-hidden="true" />

      <div className="absolute inset-0 z-[5]" aria-hidden="true">
        <svg className="h-full w-full" width="100%" height="100%">
          <g transform={svgTransform}>
            <GridLayer />
          </g>
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        <div style={htmlTransform}>
          {scene.components.map((node) => (
            <ComponentRenderer
              key={node.id}
              node={node}
              isSelected={node.isSelected}
              isHovered={node.isHovered}
              isConnected={node.definition.pins.length === 0 || connectedComponentIds.has(node.id)}
              isDragging={node.isDragging}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
        <svg className="h-full w-full overflow-visible" width="100%" height="100%">
          <g transform={svgTransform}>
            <WireEngine
              wires={scene.wires}
              selectedWireId={selectedWireId}
              hoveredWireId={hoveredWireId}
              wireDraft={interactionProps.wireDraft}
              recentlyCreatedWireId={recentlyCreatedWireId}
            />
            {recentlyConnectedPinId && scene.pinById[recentlyConnectedPinId] ? (
              <g>
                <circle cx={scene.pinById[recentlyConnectedPinId].position.x} cy={scene.pinById[recentlyConnectedPinId].position.y} r={16} fill="rgba(16,185,129,0.16)" className="animate-ping" />
                <circle cx={scene.pinById[recentlyConnectedPinId].position.x} cy={scene.pinById[recentlyConnectedPinId].position.y} r={9} fill="rgba(16,185,129,0.18)" />
                <circle cx={scene.pinById[recentlyConnectedPinId].position.x} cy={scene.pinById[recentlyConnectedPinId].position.y} r={4.8} fill="#10b981" stroke="rgba(240,253,250,0.9)" strokeWidth={1.2} />
              </g>
            ) : null}
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 z-30">
        <InteractionLayer transform={transform} {...interactionProps} />
      </div>
    </div>
  );
}





