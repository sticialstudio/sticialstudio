"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { useCircuit, ComponentData } from '@/contexts/CircuitContext';
import {
  createDefaultComponentState,
  getComponentDefinition,
  getPlaceableComponents,
} from '@/lib/wiring/componentDefinitions';
import {
  getRenderedSize,
  type Point,
} from '@/lib/wiring/componentGeometry';
import {
  createMountedPlacement,
  getBreadboardMountPreview,
} from '@/lib/wiring/breadboardMounting';

import CanvasEngine from './circuit-lab/CanvasEngine';
import ComponentPreview from './circuit-lab/ComponentPreview';
import InteractionManager from './circuit-lab/InteractionManager';
import { buildSceneGraph } from './circuit-lab/sceneModel';
import type { MountPreviewState } from './circuit-lab/sceneTypes';
import { useCanvasViewport } from './circuit-lab/useCanvasViewport';
import { useInteractionManager } from './circuit-lab/useInteractionManager';
import { buildOrthogonalWaypoints, buildWireRoutePoints } from './circuit-lab/wireRouting';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const WIRE_COLORS = ['#ef4444', '#171717', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const DEFAULT_VIEWPORT = { x: -72, y: -28, scale: 0.98 };

type DragPreviewState = {
  componentId: string;
  rawPosition: Point;
  displayPosition: Point;
  mountPreview: MountPreviewState | null;
  overTrash: boolean;
};

export default function BreadboardCanvas({
  showPalette = true,
}: {
  showPalette?: boolean;
}) {
  useEffect(() => {
    import('@wokwi/elements').catch(console.error);
  }, []);

  const {
    circuitData,
    netlist,
    resolvedConnections,
    simulationState,
    addComponent,
    addNet,
    removeComponent,
    removeNet,
    rotateComponent,
    selectedComponentId,
    selectComponent,
    updateComponentPosition,
    updateNet,
  } = useCircuit();

  const { transform, isPanning, beginPan, updatePan, endPan, zoomAt, setTransform } = useCanvasViewport(
    DEFAULT_VIEWPORT
  );

  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [isPaletteVisible, setIsPaletteVisible] = useState(showPalette);
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [recentlyCreatedWireId, setRecentlyCreatedWireId] = useState<string | null>(null);
  const [recentlyConnectedPinId, setRecentlyConnectedPinId] = useState<string | null>(null);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const recentWireTimeoutRef = useRef<number | null>(null);
  const recentPinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPaletteVisible(showPalette);
  }, [showPalette]);

  useEffect(() => {
    return () => {
      if (recentWireTimeoutRef.current !== null) {
        window.clearTimeout(recentWireTimeoutRef.current);
      }
      if (recentPinTimeoutRef.current !== null) {
        window.clearTimeout(recentPinTimeoutRef.current);
      }
    };
  }, []);

  const sceneOptions = useMemo(
    () => ({
      selectedComponentId,
      selectedWireId,
      hoveredComponentId,
      hoveredWireId,
      draggingComponentId: dragPreview?.componentId ?? null,
      positionOverrides: dragPreview
        ? {
            [dragPreview.componentId]: dragPreview.displayPosition,
          }
        : undefined,
    }),
    [dragPreview, hoveredComponentId, hoveredWireId, selectedComponentId, selectedWireId]
  );

  const scene = useMemo(
    () => buildSceneGraph(circuitData, simulationState, netlist, resolvedConnections, sceneOptions),
    [circuitData, simulationState, netlist, resolvedConnections, sceneOptions]
  );

  const isClientOverTrash = useCallback((clientPoint: Point) => {
    const bounds = trashRef.current?.getBoundingClientRect();
    if (!bounds) {
      return false;
    }

    return (
      clientPoint.x >= bounds.left &&
      clientPoint.x <= bounds.right &&
      clientPoint.y >= bounds.top &&
      clientPoint.y <= bounds.bottom
    );
  }, []);

  const buildMountPreview = useCallback(
    (componentId: string, rawPosition: Point) => {
      const component = circuitData.components.find((candidate) => candidate.id === componentId);
      const definition = getComponentDefinition(component?.type || '');
      if (!component || !definition) {
        return null;
      }

      const preview = getBreadboardMountPreview(
        component,
        {
          x: rawPosition.x,
          y: rawPosition.y,
          rotation: component.rotation || 0,
        },
        circuitData.components
      );

      if (!preview) {
        return null;
      }

      return {
        componentId,
        footprintClass: preview.footprintClass,
        position: preview.position,
        rawPosition,
        size: getRenderedSize(definition.size),
        rotation: component.rotation || 0,
        matchedAnchors: preview.matchedAnchors,
        isValid: preview.isValid,
        reason: preview.reason,
        mappedPins: preview.mappedPins,
      } satisfies MountPreviewState;
    },
    [circuitData.components]
  );

  const updateDragPreview = useCallback(
    (componentId: string, rawPosition: Point, clientPoint: Point) => {
      const mountPreview = buildMountPreview(componentId, rawPosition);
      setDragPreview({
        componentId,
        rawPosition,
        displayPosition: mountPreview?.isValid ? mountPreview.position : rawPosition,
        mountPreview,
        overTrash: isClientOverTrash(clientPoint),
      });
    },
    [buildMountPreview, isClientOverTrash]
  );

  const handleAddWire = useCallback(
    (from: string, to: string) => {
      const wireId = `net-${Date.now()}`;
      addNet({
        id: wireId,
        from,
        to,
        color: WIRE_COLORS[circuitData.nets.length % WIRE_COLORS.length],
        waypoints: buildOrthogonalWaypoints(scene.pinById[from].position, scene.pinById[to].position),
      });
      setSelectedWireId(wireId);
      setRecentlyCreatedWireId(wireId);
      setRecentlyConnectedPinId(to);

      if (recentWireTimeoutRef.current !== null) {
        window.clearTimeout(recentWireTimeoutRef.current);
      }
      if (recentPinTimeoutRef.current !== null) {
        window.clearTimeout(recentPinTimeoutRef.current);
      }

      recentWireTimeoutRef.current = window.setTimeout(() => setRecentlyCreatedWireId(null), 650);
      recentPinTimeoutRef.current = window.setTimeout(() => setRecentlyConnectedPinId(null), 900);
    },
    [addNet, circuitData.nets.length, scene.pinById]
  );

  const interaction = useInteractionManager({
    scene,
    transform,
    selectedComponentId,
    selectedWireId,
    onSelectComponent: selectComponent,
    onSelectWire: setSelectedWireId,
    onMoveComponent: (id, pos, meta) => {
      updateDragPreview(id, pos, meta.client);
    },
    onCommitComponentMove: (id, pos, meta) => {
      const preview = dragPreview?.componentId === id ? dragPreview : null;
      if (preview?.overTrash || isClientOverTrash(meta.client)) {
        removeComponent(id);
        selectComponent(null);
        setSelectedWireId(null);
        setDragPreview(null);
        return;
      }

      const component = circuitData.components.find((candidate) => candidate.id === id);
      const definition = getComponentDefinition(component?.type || '');
      if (component && definition) {
        const mountedPreview = preview?.mountPreview ?? buildMountPreview(id, pos);
        if (mountedPreview?.isValid) {
          updateComponentPosition(
            id,
            mountedPreview.position.x,
            mountedPreview.position.y,
            createMountedPlacement(id, component.rotation || 0, mountedPreview)
          );
        } else {
          updateComponentPosition(id, pos.x, pos.y, null);
        }
      } else {
        updateComponentPosition(id, pos.x, pos.y, null);
      }

      setDragPreview(null);
    },
    onRotateComponent: rotateComponent,
    onDeleteComponent: removeComponent,
    onDeleteWire: removeNet,
    onAddWire: handleAddWire,
    onUpdateWireWaypoints: (id, waypoints) => updateNet(id, { waypoints }),
    beginPan,
    updatePan,
    endPan,
    zoomAt,
  });

  useEffect(() => {
    if (interaction.mode.type !== 'DRAGGING_COMPONENT') {
      setDragPreview((current) => (current ? null : current));
    }
  }, [interaction.mode.type]);

  useEffect(() => {
    if (interaction.hoveredHit?.type === 'pin') {
      setHoveredPinId(interaction.hoveredHit.pin.id);
      setHoveredComponentId(interaction.hoveredHit.pin.componentId ?? null);
      setHoveredWireId(null);
      return;
    }

    if (interaction.hoveredHit?.type === 'component') {
      setHoveredPinId(null);
      setHoveredComponentId(interaction.hoveredHit.component.id);
      setHoveredWireId(null);
      return;
    }

    if (interaction.hoveredHit?.type === 'wire-segment' || interaction.hoveredHit?.type === 'wire') {
      setHoveredPinId(null);
      setHoveredComponentId(null);
      setHoveredWireId(interaction.hoveredHit.wire.id);
      return;
    }

    setHoveredPinId(null);
    setHoveredComponentId(null);
    setHoveredWireId(null);
  }, [interaction.hoveredHit]);

  const paletteItems = useMemo(() => getPlaceableComponents(), []);

  const handleResetView = useCallback(() => {
    setTransform(DEFAULT_VIEWPORT);
  }, [setTransform]);

  const handleZoomFit = useCallback(() => {
    const bounds = interaction.containerRef.current?.getBoundingClientRect();
    if (!bounds || scene.components.length === 0) {
      setTransform(DEFAULT_VIEWPORT);
      return;
    }

    const worldBounds = scene.components.reduce(
      (accumulator, component) => ({
        minX: Math.min(accumulator.minX, component.bounds.minX),
        minY: Math.min(accumulator.minY, component.bounds.minY),
        maxX: Math.max(accumulator.maxX, component.bounds.maxX),
        maxY: Math.max(accumulator.maxY, component.bounds.maxY),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );

    const padding = 72;
    const width = Math.max(worldBounds.maxX - worldBounds.minX, 120);
    const height = Math.max(worldBounds.maxY - worldBounds.minY, 120);
    const scale = Math.max(
      0.4,
      Math.min(
        1.8,
        Math.min((bounds.width - padding * 2) / width, (bounds.height - padding * 2) / height)
      )
    );

    setTransform({
      scale,
      x: bounds.width / 2 - ((worldBounds.minX + worldBounds.maxX) / 2) * scale,
      y: bounds.height / 2 - ((worldBounds.minY + worldBounds.maxY) / 2) * scale,
    });
  }, [interaction.containerRef, scene.components, setTransform]);

  const cursor = useMemo(() => {
    if (isPanning) return 'grabbing';
    if (interaction.mode.type === 'DRAWING_WIRE') return 'crosshair';
    if (interaction.mode.type === 'DRAGGING_COMPONENT') return 'grabbing';
    if (interaction.hoveredHit?.type === 'pin') return 'crosshair';
    if (interaction.hoveredHit?.type === 'component') return 'grab';
    if (interaction.hoveredHit?.type === 'wire-handle') {
      return interaction.hoveredHit.handle.axis === 'x' ? 'ew-resize' : 'ns-resize';
    }
    return 'default';
  }, [interaction.hoveredHit, interaction.mode.type, isPanning]);

  const highlightedPinIds = useMemo(() => {
    const ids = new Set<string>();
    if (hoveredPinId) {
      ids.add(hoveredPinId);
    }
    if (interaction.mode.type === 'DRAWING_WIRE') {
      ids.add(interaction.mode.fromPinId);
    }
    return ids;
  }, [hoveredPinId, interaction.mode]);

  const createComponentAtClient = useCallback(
    (type: string, clientX?: number, clientY?: number, snapToBreadboard = false) => {
      const definition = getComponentDefinition(type);
      if (!definition) return;

      const renderedSize = getRenderedSize(definition.size);
      const canvasBounds = interaction.containerRef.current?.getBoundingClientRect();
      const hasPointerPosition = typeof clientX === 'number' && typeof clientY === 'number' && canvasBounds;

      const viewportPosition = hasPointerPosition
        ? {
            x: Math.round((clientX - canvasBounds.left - transform.x) / transform.scale - renderedSize.width / 2),
            y: Math.round((clientY - canvasBounds.top - transform.y) / transform.scale - renderedSize.height / 2),
          }
        : {
            x: Math.round((-(transform.x) + ((canvasBounds?.width ?? 640) * 0.56)) / transform.scale - renderedSize.width / 2),
            y: Math.round((-(transform.y) + ((canvasBounds?.height ?? 480) * 0.5)) / transform.scale - renderedSize.height / 2),
          };

      const id = `${type.toLowerCase()}-${Date.now()}`;
      const mountPreview = snapToBreadboard
        ? getBreadboardMountPreview(
            { id, type },
            { x: viewportPosition.x, y: viewportPosition.y, rotation: 0 },
            circuitData.components
          )
        : null;
      const finalPosition = mountPreview?.isValid ? mountPreview.position : viewportPosition;

      const component: ComponentData = {
        id,
        type,
        x: finalPosition.x,
        y: finalPosition.y,
        rotation: 0,
        state: createDefaultComponentState(type),
        mountedPlacement: createMountedPlacement(id, 0, mountPreview ?? { isValid: false, footprintClass: 'freeform' }),
      };
      addComponent(component);
      selectComponent(id);
      setSelectedWireId(null);
    },
    [addComponent, circuitData.components, interaction.containerRef, selectComponent, transform.scale, transform.x, transform.y]
  );

  const handleAddComponent = useCallback(
    (type: string) => {
      createComponentAtClient(type);
    },
    [createComponentAtClient]
  );

  const handleDragOverCanvas = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('componentType')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDropOnCanvas = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const componentType = event.dataTransfer.getData('componentType');
      if (!componentType) {
        return;
      }

      event.preventDefault();
      createComponentAtClient(componentType, event.clientX, event.clientY, true);
    },
    [createComponentAtClient]
  );

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#121214] font-sans selection:bg-blue-500/30">
      <aside
        className={cn(
          'relative z-[200] flex h-full shrink-0 flex-col border-r border-[#ffffff0a] bg-[#121214] transition-[width,opacity] duration-200 ease-out',
          isPaletteVisible ? 'w-[224px] opacity-100' : 'pointer-events-none w-0 opacity-0'
        )}
      >
        <div className="flex h-12 items-center justify-between border-b border-[#ffffff0a] px-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ffffff40]">Components</div>
            <div className="mt-1 text-[11px] text-[#ffffff55]">Drag in or click to add</div>
          </div>
          <div className="rounded-full border border-[#ffffff10] px-2 py-1 text-[10px] font-semibold text-[#ffffff55]">
            {paletteItems.length}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            {paletteItems.map((item) => (
              <button
                key={item.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('componentType', item.id);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-[#ffffff08] bg-[#ffffff04] p-3 transition-all duration-150 hover:border-cyan-400/30 hover:bg-[#ffffff0c]"
                onClick={() => handleAddComponent(item.id)}
              >
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl border border-[#ffffff10] bg-[#0f172acc] p-1.5 transition-transform duration-150 group-hover:scale-[1.03]">
                  <ComponentPreview definition={item} className="h-full w-full" />
                </div>
                <span className="line-clamp-2 text-center text-[10px] font-medium text-[#ffffff90]">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="relative flex-1 overflow-hidden bg-[#070c15]" onDragOver={handleDragOverCanvas} onDrop={handleDropOnCanvas}>
        <CanvasEngine
          containerRef={interaction.containerRef}
          transform={transform}
          scene={scene}
          recentlyCreatedWireId={recentlyCreatedWireId}
          recentlyConnectedPinId={recentlyConnectedPinId}
          interactionProps={{
            pins: scene.pins,
            highlightedPinIds,
            validTargetPinId:
              interaction.mode.type === 'DRAWING_WIRE' && interaction.hoveredHit?.type === 'pin'
                ? interaction.hoveredHit.pin.id
                : null,
            mountPreview: dragPreview?.mountPreview ?? null,
            cursor,
            onPointerDown: interaction.handlePointerDown,
            onPointerMove: interaction.handlePointerMove,
            onPointerUp: interaction.handlePointerUp,
            onPointerCancel: interaction.handlePointerCancel,
            onWheel: interaction.handleWheel,
            wireDraft:
              interaction.mode.type === 'DRAWING_WIRE'
                ? {
                    fromPinId: interaction.mode.fromPinId,
                    start: scene.pinById[interaction.mode.fromPinId].position,
                    current: interaction.mode.current,
                    targetPinId:
                      interaction.hoveredHit?.type === 'pin' && interaction.hoveredHit.pin.id !== interaction.mode.fromPinId
                        ? interaction.hoveredHit.pin.id
                        : null,
                    points: buildWireRoutePoints(
                      scene.pinById[interaction.mode.fromPinId].position,
                      interaction.mode.current
                    ),
                  }
                : null,
          }}
        />

        <InteractionManager
          showPalette={isPaletteVisible}
          onTogglePalette={() => setIsPaletteVisible((current) => !current)}
          onZoomFit={handleZoomFit}
          onResetView={handleResetView}
        />

        <div
          ref={trashRef}
          className={cn(
            'pointer-events-none absolute bottom-4 right-4 z-[320] flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-150',
            dragPreview
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0',
            dragPreview?.overTrash
              ? 'border-red-400/60 bg-red-500/16 text-red-50 shadow-[0_0_26px_rgba(248,113,113,0.28)]'
              : 'border-slate-700/80 bg-slate-950/82 text-slate-300 shadow-[0_18px_38px_-28px_rgba(2,6,23,0.95)]'
          )}
        >
          <Trash2 className={cn('h-5 w-5', dragPreview?.overTrash ? 'text-red-200' : 'text-slate-300')} />
          <span>{dragPreview?.overTrash ? 'Release to delete' : 'Drag here to delete'}</span>
        </div>
      </div>
    </div>
  );
}

