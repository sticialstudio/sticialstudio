"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CircuitBoard, Lightbulb, Monitor, Palette, RotateCw, Trash2, Zap } from 'lucide-react';

import { useCircuit, ComponentData } from '@/contexts/CircuitContext';
import {
  createDefaultComponentState,
  getComponentDefinition,
  getPlaceableComponents,
  type ComponentCategory,
  type ComponentDefinition,
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
import { useInteractionManager, type WireConnectionRequest } from './circuit-lab/useInteractionManager';
import { buildOrthogonalWaypoints, buildWireRoutePoints } from './circuit-lab/wireRouting';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const WIRE_COLORS = ['#ef4444', '#f8fafc', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const DEFAULT_VIEWPORT = { x: -72, y: -28, scale: 0.98 };
const CATEGORY_ORDER: ComponentCategory[] = ['Boards', 'Basic', 'Sensors', 'Actuators', 'Displays'];

type PaletteCategory = 'All' | ComponentCategory;

const CATEGORY_META: Record<PaletteCategory, { label: string; icon: React.ReactNode }> = {
  All: { label: 'All', icon: <Palette size={14} /> },
  Boards: { label: 'Boards', icon: <CircuitBoard size={14} /> },
  Basic: { label: 'Basics', icon: <Lightbulb size={14} /> },
  Sensors: { label: 'Sensors', icon: <Activity size={14} /> },
  Actuators: { label: 'Motion', icon: <Zap size={14} /> },
  Displays: { label: 'Displays', icon: <Monitor size={14} /> },
};

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
    updateComponentState,
    updateNet,
  } = useCircuit();

  const { transform, isPanning, beginPan, updatePan, endPan, zoomAt, setTransform } = useCanvasViewport(
    DEFAULT_VIEWPORT
  );

  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [wireWaypointOverrides, setWireWaypointOverrides] = useState<Record<string, Point[]>>({});
  const [isPaletteVisible, setIsPaletteVisible] = useState(showPalette);
  const [activeCategory, setActiveCategory] = useState<PaletteCategory>('All');
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
    if (selectedWireId && !circuitData.nets.some((net) => net.id === selectedWireId)) {
      setSelectedWireId(null);
    }

    setWireWaypointOverrides((current) => {
      const activeIds = new Set(circuitData.nets.map((net) => net.id));
      let changed = false;
      const next = Object.fromEntries(
        Object.entries(current).filter(([wireId]) => {
          const keep = activeIds.has(wireId);
          if (!keep) {
            changed = true;
          }
          return keep;
        })
      ) as Record<string, Point[]>;

      return changed ? next : current;
    });
  }, [circuitData.nets, selectedWireId]);

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
      wireWaypointOverrides:
        Object.keys(wireWaypointOverrides).length > 0 ? wireWaypointOverrides : undefined,
      positionOverrides: dragPreview
        ? {
            [dragPreview.componentId]: dragPreview.displayPosition,
          }
        : undefined,
    }),
    [dragPreview, hoveredComponentId, hoveredWireId, selectedComponentId, selectedWireId, wireWaypointOverrides]
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
        groupHighlights: preview.groupHighlights,
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

  const resolveNodePoint = useCallback(
    (nodeId: string, preferredPinId?: string | null) => {
      const preferredPin = preferredPinId ? scene.pinById[preferredPinId] : null;
      if (preferredPin?.nodeId === nodeId) {
        return preferredPin.position;
      }

      const fallbackPin = scene.pinsByNodeId[nodeId]?.[0] ?? null;
      return fallbackPin?.position ?? null;
    },
    [scene.pinById, scene.pinsByNodeId]
  );

  const handleAddWire = useCallback(
    ({ fromNodeId, toNodeId, fromPinId, toPinId }: WireConnectionRequest) => {
      if (fromNodeId === toNodeId) {
        return;
      }

      const fromPoint = resolveNodePoint(fromNodeId, fromPinId);
      const toPoint = resolveNodePoint(toNodeId, toPinId);
      if (!fromPoint || !toPoint) {
        return;
      }

      const wireId = `net-${Date.now()}`;
      addNet({
        id: wireId,
        from: fromNodeId,
        to: toNodeId,
        fromNodeId,
        toNodeId,
        fromAnchorId: fromPinId,
        toAnchorId: toPinId,
        color: WIRE_COLORS[circuitData.nets.length % WIRE_COLORS.length],
        waypoints: buildOrthogonalWaypoints(fromPoint, toPoint),
      });
      setSelectedWireId(wireId);
      setRecentlyCreatedWireId(wireId);
      setRecentlyConnectedPinId(toPinId);
      selectComponent(null);

      if (recentWireTimeoutRef.current !== null) {
        window.clearTimeout(recentWireTimeoutRef.current);
      }
      if (recentPinTimeoutRef.current !== null) {
        window.clearTimeout(recentPinTimeoutRef.current);
      }

      recentWireTimeoutRef.current = window.setTimeout(() => setRecentlyCreatedWireId(null), 650);
      recentPinTimeoutRef.current = window.setTimeout(() => setRecentlyConnectedPinId(null), 900);
    },
    [addNet, circuitData.nets.length, resolveNodePoint, selectComponent]
  );

  const interaction = useInteractionManager({
    scene,
    transform,
    selectedComponentId,
    selectedWireId,
    onSelectComponent: (id) => {
      selectComponent(id);
      if (id) {
        setSelectedWireId(null);
      }
    },
    onSelectWire: (id) => {
      setSelectedWireId(id);
      if (id) {
        selectComponent(null);
      }
    },
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
    onTapComponent: (id) => {
      const component = circuitData.components.find((candidate) => candidate.id === id);
      const definition = getComponentDefinition(component?.type || '');
      if (!component || definition?.simulation?.type !== 'button' || !(simulationState.running || simulationState.ready)) {
        return;
      }

      updateComponentState(id, (previousState) => ({
        ...previousState,
        pressed: !Boolean(previousState?.pressed),
      }));
    },
    onRotateComponent: rotateComponent,
    onDeleteComponent: removeComponent,
    onDeleteWire: removeNet,
    onAddWire: handleAddWire,
    onPreviewWireWaypoints: (id, waypoints) => {
      setWireWaypointOverrides((current) => {
        if (waypoints === null) {
          if (!(id in current)) {
            return current;
          }

          const next = { ...current };
          delete next[id];
          return next;
        }

        return {
          ...current,
          [id]: waypoints,
        };
      });
    },
    onCommitWireWaypoints: (id, waypoints) => {
      setWireWaypointOverrides((current) => {
        if (!(id in current)) {
          return current;
        }

        const next = { ...current };
        delete next[id];
        return next;
      });
      updateNet(id, { waypoints });
    },
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
  const groupedPalette = useMemo<Record<ComponentCategory, ComponentDefinition[]>>(
    () => ({
      Boards: paletteItems.filter((item) => item.category === 'Boards'),
      Basic: paletteItems.filter((item) => item.category === 'Basic'),
      Sensors: paletteItems.filter((item) => item.category === 'Sensors'),
      Actuators: paletteItems.filter((item) => item.category === 'Actuators'),
      Displays: paletteItems.filter((item) => item.category === 'Displays'),
    }),
    [paletteItems]
  );
  const categoryTabs = useMemo(
    () => ['All', ...CATEGORY_ORDER.filter((category) => groupedPalette[category].length > 0)] as PaletteCategory[],
    [groupedPalette]
  );
  const visiblePaletteItems = useMemo(
    () => (activeCategory === 'All' ? paletteItems : groupedPalette[activeCategory]),
    [activeCategory, groupedPalette, paletteItems]
  );

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
      if (interaction.hoveredHit.handle.axis === 'both') {
        return 'move';
      }
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

  const selectedComponentNode = useMemo(
    () => (selectedComponentId ? scene.componentById[selectedComponentId] ?? null : null),
    [scene.componentById, selectedComponentId]
  );

  const selectedWire = useMemo(
    () => (selectedWireId ? scene.wireById[selectedWireId] ?? null : null),
    [scene.wireById, selectedWireId]
  );

  const selectionOverlay = useMemo(() => {
    if (selectedComponentNode && selectedComponentNode.definition.id !== 'BREADBOARD') {
      const centerX = ((selectedComponentNode.bounds.minX + selectedComponentNode.bounds.maxX) / 2) * transform.scale + transform.x;
      const topY = selectedComponentNode.bounds.minY * transform.scale + transform.y;
      return {
        type: 'component' as const,
        left: centerX,
        top: topY - 16,
        label: selectedComponentNode.definition.name,
      };
    }

    if (selectedWire) {
      const midIndex = Math.max(0, Math.floor((selectedWire.points.length - 1) / 2));
      const startPoint = selectedWire.points[midIndex];
      const endPoint = selectedWire.points[Math.min(midIndex + 1, selectedWire.points.length - 1)] ?? startPoint;
      const midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2,
      };

      return {
        type: 'wire' as const,
        left: midPoint.x * transform.scale + transform.x,
        top: midPoint.y * transform.scale + transform.y - 20,
        label: 'Signal wire',
      };
    }

    return null;
  }, [selectedComponentNode, selectedWire, transform.scale, transform.x, transform.y]);

  const handleApplyWireColor = useCallback(
    (color: string) => {
      if (!selectedWireId) {
        return;
      }

      updateNet(selectedWireId, { color });
    },
    [selectedWireId, updateNet]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedWireId) {
      removeNet(selectedWireId);
      setSelectedWireId(null);
      return;
    }

    if (selectedComponentId) {
      removeComponent(selectedComponentId);
      selectComponent(null);
    }
  }, [removeComponent, removeNet, selectComponent, selectedComponentId, selectedWireId]);

  const isCanvasEmpty = circuitData.components.length === 0;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-[24px] bg-[#050913] font-sans selection:bg-cyan-400/20">
      <aside
        className={cn(
          'relative z-[200] flex h-full shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,#10161f_0%,#0a0f16_100%)] transition-[width,opacity] duration-200 ease-out',
          isPaletteVisible ? 'w-[320px] opacity-100' : 'pointer-events-none w-0 border-r-0 opacity-0'
        )}
      >
        <div className="flex h-full min-h-0 w-full">
          <div className="flex w-[60px] shrink-0 flex-col items-center gap-2 border-r border-white/8 bg-[#0b1016] px-2 py-3">
            {categoryTabs.map((category) => {
              const meta = CATEGORY_META[category];
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  title={meta.label}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-[16px] border transition-all duration-150',
                    isActive
                      ? 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100 shadow-[0_14px_28px_-22px_rgba(34,211,238,0.7)]'
                      : 'border-white/8 bg-white/[0.02] text-white/55 hover:border-white/14 hover:bg-white/[0.05] hover:text-white/82'
                  )}
                >
                  {meta.icon}
                </button>
              );
            })}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/36">Parts Drawer</div>
                  <div className="mt-1 text-[1.05rem] font-semibold text-white/90">{CATEGORY_META[activeCategory].label}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {visiblePaletteItems.length}
                </div>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-3 py-3">
              <div className="space-y-2.5">
                {visiblePaletteItems.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('componentType', item.id);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => handleAddComponent(item.id)}
                    className="group flex w-full items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[linear-gradient(180deg,#161d28_0%,#0d131b_100%)] px-3 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-[linear-gradient(180deg,#1a2230_0%,#111824_100%)]"
                  >
                    <div className="flex h-[94px] w-[116px] shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-[radial-gradient(circle_at_50%_35%,rgba(34,47,67,0.96),rgba(14,20,29,0.98)_74%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <ComponentPreview definition={item} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-white/90">{item.name}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/34">{CATEGORY_META[item.category].label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className="relative min-w-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,#060b13_0%,#04070e_100%)]"
        onDragOver={handleDragOverCanvas}
        onDrop={handleDropOnCanvas}
      >
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
              interaction.mode.type === 'DRAWING_WIRE'
                ? interaction.mode.hoveredTargetPinId
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
                    fromNodeId: interaction.mode.fromNodeId,
                    fromPinId: interaction.mode.fromPinId,
                    fromPoint: interaction.mode.fromPoint,
                    previewPoint: interaction.mode.previewPoint,
                    hoveredTargetNodeId: interaction.mode.hoveredTargetNodeId,
                    hoveredTargetPinId: interaction.mode.hoveredTargetPinId,
                    points: buildWireRoutePoints(
                      interaction.mode.fromPoint,
                      interaction.mode.previewPoint
                    ),
                  }
                : null,
          }}
        />

        {isCanvasEmpty ? (
          <div className="pointer-events-none absolute left-5 top-5 z-[120] max-w-[560px]">
            <div className="pointer-events-auto inline-flex flex-wrap items-center gap-3 rounded-[18px] border border-white/8 bg-[#08101b]/72 px-4 py-3 text-white shadow-[0_18px_48px_-36px_rgba(0,0,0,0.92)] backdrop-blur-lg">
              <div className="pr-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/38">Quick Start</div>
                <div className="mt-1 text-sm font-semibold text-white/88">Place a board and a breadboard.</div>
              </div>
              <button
                type="button"
                onClick={() => handleAddComponent('ARDUINO_UNO')}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-all hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-cyan-300/14"
              >
                <CircuitBoard size={14} />
                Add Arduino Uno
              </button>
              <button
                type="button"
                onClick={() => handleAddComponent('BREADBOARD')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/84 transition-all hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08]"
              >
                <Palette size={14} />
                Add Breadboard
              </button>
              <button
                type="button"
                onClick={() => handleAddComponent('LED')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/84 transition-all hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08]"
              >
                <Lightbulb size={14} />
                Add LED
              </button>
            </div>
          </div>
        ) : null}

        <InteractionManager
          showPalette={isPaletteVisible}
          onTogglePalette={() => setIsPaletteVisible((current) => !current)}
          onZoomFit={handleZoomFit}
          onResetView={handleResetView}
        />

        {selectionOverlay ? (
          <div
            className="absolute z-[320]"
            style={{
              left: `clamp(24px, ${selectionOverlay.left}px, calc(100% - 24px))`,
              top: `clamp(24px, ${selectionOverlay.top}px, calc(100% - 24px))`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#08111d]/94 px-2 py-2 shadow-[0_22px_48px_-26px_rgba(2,6,23,0.95)] backdrop-blur-xl">
              <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                {selectionOverlay.label}
              </div>
              {selectionOverlay.type === 'component' ? (
                <>
                  <button
                    type="button"
                    onClick={() => selectedComponentId && rotateComponent(selectedComponentId)}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white/84 transition-all hover:border-white/18 hover:bg-white/[0.08]"
                  >
                    <RotateCw size={14} />
                    Rotate
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition-all hover:border-rose-300/30 hover:bg-rose-400/14"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 px-1">
                    {WIRE_COLORS.map((color) => {
                      const isActive = selectedWire?.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleApplyWireColor(color)}
                          aria-label={`Set wire color ${color}`}
                          className={cn(
                            'h-7 w-7 rounded-full border transition-all duration-150',
                            isActive
                              ? 'scale-110 border-white/85 shadow-[0_0_0_2px_rgba(255,255,255,0.14)]'
                              : 'border-white/10 hover:scale-105 hover:border-white/28'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition-all hover:border-rose-300/30 hover:bg-rose-400/14"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div
          ref={trashRef}
          className={cn(
            'pointer-events-none absolute bottom-5 right-5 z-[320] flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium transition-all duration-150',
            dragPreview
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0',
            dragPreview?.overTrash
              ? 'border-red-400/60 bg-red-500/16 text-red-50 shadow-[0_0_26px_rgba(248,113,113,0.28)]'
              : 'border-white/10 bg-[#0b111b]/88 text-slate-300 shadow-[0_18px_38px_-28px_rgba(2,6,23,0.95)]'
          )}
        >
          <Trash2 className={cn('h-5 w-5', dragPreview?.overTrash ? 'text-red-200' : 'text-slate-300')} />
          <span>{dragPreview?.overTrash ? 'Release to delete' : 'Drag here to delete'}</span>
        </div>
      </div>
    </div>
  );
}
