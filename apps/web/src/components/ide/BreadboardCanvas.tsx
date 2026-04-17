"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CircuitBoard, Lightbulb, Monitor, Palette, RotateCw, Trash2, Zap, X } from 'lucide-react';

import type { ComponentData } from '@/contexts/CircuitContext';
import { useCircuitStore } from '@/stores/circuitStore';
import { selectCircuitLabSimulationView, useSimulationStore } from '@/stores/simulationStore';
import { useShallow } from 'zustand/react/shallow';
import { useSplitViewEventBus } from './split-view/SplitViewEventBus';
import { useCircuitComponentRegistry } from '@/hooks/useCircuitComponentRegistry';
import {
  createDefaultComponentState,
  getComponentDefinition,
  getComponentMountClassifications,
  type ComponentCategory,
  type ComponentDefinition,
} from '@/lib/wiring/componentDefinitions';
import type { CircuitComponentCatalogEntry } from '@/lib/wiring/circuitComponentCatalogTypes';
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
import { ComponentContextMenu } from './circuit-lab/ComponentContextMenu';
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

type PaletteCategory = 'All' | ComponentCategory;
type PlacementPreviewSource = 'existing' | 'palette' | 'armed';

function getPlacementRuleText(type: string) {
  const classifications = getComponentMountClassifications(type);

  if (classifications.includes('board')) {
    return 'Place it anywhere on the canvas, then wire it up.';
  }

  if (classifications.includes('freeform-only')) {
    return 'Place it freely on the canvas, then connect it with wires.';
  }

  if (classifications.includes('trench-bridging')) {
    return 'It must bridge the center trench to mount correctly.';
  }

  if (classifications.includes('rail-allowed')) {
    return 'It can mount on the power rails or on the main strips.';
  }

  return 'It mounts on the main breadboard strips, not on the power rails.';
}

function formatPlacementReason(reason: string | undefined, type: string) {
  if (!reason) {
    return getPlacementRuleText(type);
  }

  if (reason.startsWith('Pin ') && reason.includes('not aligned')) {
    return 'Move the part until each leg lines up with a breadboard hole.';
  }

  if (reason.includes('already occupied')) {
    return 'That hole is already in use. Try a different spot.';
  }

  if (reason.includes('share hole')) {
    return 'Each leg needs its own hole here. Move the part to separate the pins.';
  }

  if (reason.includes('span at least')) {
    return 'Spread the part farther so it reaches the required holes.';
  }

  if (reason.includes('must mount across the breadboard trench')) {
    return 'Place it across the center gap instead of on the power rails.';
  }

  if (reason.includes('must bridge the top and bottom strips across the trench')) {
    return 'Move it so one side sits above the center gap and the other side sits below it.';
  }

  if (reason.includes('No valid breadboard mount candidate found') || reason.includes('No valid breadboard holes match this footprint')) {
    return `Try a different row, rotate it, or move it closer to matching holes. ${getPlacementRuleText(type)}`;
  }

  return reason;
}

function describePinTarget(label: string | null | undefined, kind: 'board' | 'breadboard' | 'component' | null | undefined) {
  if (!label) {
    return 'this target';
  }

  if (kind === 'breadboard') {
    return `${label} hole`;
  }

  if (kind === 'board') {
    return `${label} pin`;
  }

  return label;
}

const CATEGORY_META: Record<PaletteCategory, { label: string; icon: React.ReactNode }> = {
  All: { label: 'All', icon: <Palette size={14} /> },
  Boards: { label: 'Boards', icon: <CircuitBoard size={14} /> },
  Basic: { label: 'Basics', icon: <Lightbulb size={14} /> },
  Sensors: { label: 'Sensors', icon: <Activity size={14} /> },
  Actuators: { label: 'Motion', icon: <Zap size={14} /> },
  Displays: { label: 'Displays', icon: <Monitor size={14} /> },
};

type DragPreviewState = {
  source: PlacementPreviewSource;
  componentType: string;
  componentId: string | null;
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

  const components = useCircuitStore((state) => state.components);
  const nets = useCircuitStore((state) => state.nets);
  const netlist = useCircuitStore((state) => state.netlist);
  const resolvedConnections = useCircuitStore((state) => state.resolvedConnections);
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId);
  const addComponent = useCircuitStore((state) => state.addComponent);
  const addNet = useCircuitStore((state) => state.addNet);
  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const removeNet = useCircuitStore((state) => state.removeNet);
  const rotateComponent = useCircuitStore((state) => state.rotateComponent);
  const selectComponent = useCircuitStore((state) => state.selectComponent);
  const updateComponentPosition = useCircuitStore((state) => state.updateComponentPosition);
  const updateComponentState = useCircuitStore((state) => state.updateComponentState);
  const updateNet = useCircuitStore((state) => state.updateNet);
  const simulationView = useSimulationStore(useShallow(selectCircuitLabSimulationView));
  const eventBus = useSplitViewEventBus();
  const componentRegistry = useCircuitComponentRegistry();
  const circuitData = useMemo(() => ({ components, nets }), [components, nets]);

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setDragPreview((current) => {
        if (current?.source === 'armed') {
          event.preventDefault();
          return null;
        }

        return current;
      });
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, []);

  const sceneOptions = useMemo(
    () => ({
      selectedComponentId,
      selectedWireId,
      hoveredComponentId,
      hoveredWireId,
      draggingComponentId: dragPreview?.source === 'existing' ? dragPreview.componentId : null,
      wireWaypointOverrides:
        Object.keys(wireWaypointOverrides).length > 0 ? wireWaypointOverrides : undefined,
      positionOverrides:
        dragPreview?.source === 'existing' && dragPreview.componentId
          ? {
              [dragPreview.componentId]: dragPreview.displayPosition,
            }
          : undefined,
    }),
    [dragPreview, hoveredComponentId, hoveredWireId, selectedComponentId, selectedWireId, wireWaypointOverrides]
  );

  const scene = useMemo(
    () => buildSceneGraph(circuitData, simulationView, netlist, resolvedConnections, sceneOptions),
    [circuitData, simulationView, netlist, resolvedConnections, sceneOptions]
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

  const resolveCanvasPlacement = useCallback(
    (type: string, clientX?: number, clientY?: number) => {
      const definition = getComponentDefinition(type);
      if (!definition) {
        return null;
      }

      const renderedSize = getRenderedSize(definition.size);
      const canvasBounds = canvasContainerRef.current?.getBoundingClientRect();
      const hasPointerPosition = typeof clientX === 'number' && typeof clientY === 'number' && canvasBounds;

      const rawPosition = hasPointerPosition
        ? {
            x: Math.round((clientX - canvasBounds.left - transform.x) / transform.scale - renderedSize.width / 2),
            y: Math.round((clientY - canvasBounds.top - transform.y) / transform.scale - renderedSize.height / 2),
          }
        : {
            x: Math.round((-(transform.x) + ((canvasBounds?.width ?? 640) * 0.56)) / transform.scale - renderedSize.width / 2),
            y: Math.round((-(transform.y) + ((canvasBounds?.height ?? 480) * 0.5)) / transform.scale - renderedSize.height / 2),
          };

      return {
        definition,
        renderedSize,
        rawPosition,
      };
    },
    [canvasContainerRef, transform.scale, transform.x, transform.y]
  );

  const buildPlacementPreview = useCallback(
    (type: string, componentId: string, rawPosition: Point, rotation = 0) => {
      const definition = getComponentDefinition(type);
      if (!definition) {
        return null;
      }

      const preview = getBreadboardMountPreview(
        { id: componentId, type },
        {
          x: rawPosition.x,
          y: rawPosition.y,
          rotation,
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
        rotation,
        matchedAnchors: preview.matchedAnchors,
        groupHighlights: preview.groupHighlights,
        isValid: preview.isValid,
        reason: preview.reason,
        mappedPins: preview.mappedPins,
      } satisfies MountPreviewState;
    },
    [circuitData.components]
  );

  const buildMountPreview = useCallback(
    (componentId: string, rawPosition: Point) => {
      const component = circuitData.components.find((candidate) => candidate.id === componentId);
      if (!component) {
        return null;
      }

      return buildPlacementPreview(component.type, componentId, rawPosition, component.rotation || 0);
    },
    [buildPlacementPreview, circuitData.components]
  );

  const updateDragPreview = useCallback(
    (componentId: string, rawPosition: Point, clientPoint: Point) => {
      const component = circuitData.components.find((candidate) => candidate.id === componentId);
      if (!component) {
        return;
      }

      const mountPreview = buildPlacementPreview(component.type, componentId, rawPosition, component.rotation || 0);
      setDragPreview({
        source: 'existing',
        componentType: component.type,
        componentId,
        rawPosition,
        displayPosition: mountPreview?.isValid ? mountPreview.position : rawPosition,
        mountPreview,
        overTrash: isClientOverTrash(clientPoint),
      });
    },
    [buildPlacementPreview, circuitData.components, isClientOverTrash]
  );

  const updateInsertionPreview = useCallback(
    (source: Exclude<PlacementPreviewSource, 'existing'>, componentType: string, clientX?: number, clientY?: number) => {
      const placement = resolveCanvasPlacement(componentType, clientX, clientY);
      if (!placement) {
        return;
      }

      const previewId = `${source}-preview-${componentType.toLowerCase()}`;
      const mountPreview = buildPlacementPreview(componentType, previewId, placement.rawPosition, 0);
      setDragPreview({
        source,
        componentType,
        componentId: null,
        rawPosition: placement.rawPosition,
        displayPosition: mountPreview?.isValid ? mountPreview.position : placement.rawPosition,
        mountPreview,
        overTrash: false,
      });
    },
    [buildPlacementPreview, resolveCanvasPlacement]
  );

  const updatePaletteDragPreview = useCallback(
    (componentType: string, clientX: number, clientY: number) => {
      updateInsertionPreview('palette', componentType, clientX, clientY);
    },
    [updateInsertionPreview]
  );

  const clearPaletteDragPreview = useCallback(() => {
    setDragPreview((current) => (current?.source === 'palette' ? null : current));
  }, []);

  const clearArmedInsertionPreview = useCallback(() => {
    setDragPreview((current) => (current?.source === 'armed' ? null : current));
  }, []);

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
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
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
    [addNet, circuitData.nets.length, eventBus, resolveNodePoint, selectComponent]
  );

  const interaction = useInteractionManager({
    containerRef: canvasContainerRef,
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
      const preview = dragPreview?.source === 'existing' && dragPreview.componentId === id ? dragPreview : null;
      if (preview?.overTrash || isClientOverTrash(meta.client)) {
        removeComponent(id);
        eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
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

      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
      setDragPreview(null);
    },
    onTapComponent: (id) => {
      const component = circuitData.components.find((candidate) => candidate.id === id);
      const definition = getComponentDefinition(component?.type || '');
      if (!component || definition?.simulation?.type !== 'button' || !(simulationView.running || simulationView.ready)) {
        return;
      }

      updateComponentState(id, (previousState) => ({
        ...previousState,
        pressed: !Boolean(previousState?.pressed),
      }));
    },
    onRotateComponent: (id) => {
      rotateComponent(id);
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
    },
    onDeleteComponent: (id) => {
      removeComponent(id);
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
    },
    onDeleteWire: (id) => {
      removeNet(id);
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
    },
    onAddWire: handleAddWire,
    onRewireWireEndpoint: ({ wireId, endpoint, targetNodeId, targetPinId, targetPoint }) => {
      const wire = scene.wireById[wireId];
      if (!wire) {
        return;
      }

      const nextWaypoints =
        endpoint === 'from'
          ? buildOrthogonalWaypoints(targetPoint, wire.toPoint)
          : buildOrthogonalWaypoints(wire.fromPoint, targetPoint);

      updateNet(
        wireId,
        endpoint === 'from'
          ? {
              from: targetNodeId,
              fromNodeId: targetNodeId,
              fromAnchorId: targetPinId,
              waypoints: nextWaypoints,
            }
          : {
              to: targetNodeId,
              toNodeId: targetNodeId,
              toAnchorId: targetPinId,
              waypoints: nextWaypoints,
            }
      );
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
    },
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
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
    },
    beginPan,
    updatePan,
    endPan,
    zoomAt,
  });

  useEffect(() => {
    if (interaction.mode.type !== 'DRAGGING_COMPONENT') {
      setDragPreview((current) => (current?.source === 'existing' ? null : current));
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

    if (interaction.hoveredHit?.type === 'wire-handle') {
      setHoveredPinId(null);
      setHoveredComponentId(null);
      setHoveredWireId(interaction.hoveredHit.handle.wireId);
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

  const placedSingletonTypes = useMemo(() => {
    const types = new Set<string>();
    components.forEach((component) => {
      const entry = componentRegistry.getEntry(component.type);
      if (entry?.singleton) {
        types.add(entry.id);
      }
    });
    return types;
  }, [componentRegistry, components]);

  const paletteItems = useMemo(() => {
    return componentRegistry
      .getEntries({ placeableOnly: true })
      .map((entry) => {
        const definition = getComponentDefinition(entry.previewSourceKey) ?? getComponentDefinition(entry.id);
        if (!definition) {
          return null;
        }

        return {
          entry,
          definition,
          alreadyPlaced: entry.singleton && placedSingletonTypes.has(entry.id),
        };
      })
      .filter((item): item is { entry: CircuitComponentCatalogEntry; definition: ComponentDefinition; alreadyPlaced: boolean } => Boolean(item));
  }, [componentRegistry, placedSingletonTypes]);

  const groupedPalette = useMemo<Record<ComponentCategory, typeof paletteItems>>(
    () =>
      componentRegistry.getCategories({ placeableOnly: true }).reduce((groups, category) => {
        groups[category] = paletteItems.filter((item) => item.entry.category === category);
        return groups;
      }, { Boards: [], Basic: [], Sensors: [], Actuators: [], Displays: [] } as Record<ComponentCategory, typeof paletteItems>),
    [componentRegistry, paletteItems]
  );
  const categoryTabs = useMemo(
    () => ['All', ...componentRegistry.getCategories({ placeableOnly: true }).filter((category) => groupedPalette[category]?.length > 0)] as PaletteCategory[],
    [componentRegistry, groupedPalette]
  );
  const visiblePaletteItems = useMemo(
    () => (activeCategory === 'All' ? paletteItems : groupedPalette[activeCategory] ?? []),
    [activeCategory, groupedPalette, paletteItems]
  );

  const handleResetView = useCallback(() => {
    setTransform(DEFAULT_VIEWPORT);
  }, [setTransform]);

  const handleZoomFit = useCallback(() => {
    const bounds = canvasContainerRef.current?.getBoundingClientRect();
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
  }, [canvasContainerRef, scene.components, setTransform]);

  const isPlacementPreviewVisible = dragPreview?.source === 'palette' || dragPreview?.source === 'armed';

  const cursor = useMemo(() => {
    if (isPanning) return 'grabbing';
    if (isPlacementPreviewVisible) return dragPreview?.mountPreview && !dragPreview.mountPreview.isValid ? 'not-allowed' : 'copy';
    if (interaction.mode.type === 'DRAWING_WIRE' || interaction.mode.type === 'REWIRING_WIRE_ENDPOINT') return 'crosshair';
    if (interaction.mode.type === 'DRAGGING_COMPONENT') return 'grabbing';
    if (interaction.hoveredHit?.type === 'pin') return 'crosshair';
    if (interaction.hoveredHit?.type === 'component') return 'grab';
    if (interaction.hoveredHit?.type === 'wire-handle') {
      if (interaction.hoveredHit.handle.kind === 'endpoint') {
        return 'crosshair';
      }
      if (interaction.hoveredHit.handle.axis === 'both') {
        return 'move';
      }
      return interaction.hoveredHit.handle.axis === 'x' ? 'ew-resize' : 'ns-resize';
    }
    return 'default';
  }, [dragPreview, interaction.hoveredHit, interaction.mode.type, isPanning, isPlacementPreviewVisible]);

  const highlightedPinIds = useMemo(() => {
    const ids = new Set<string>();
    if (hoveredPinId) {
      ids.add(hoveredPinId);
    }
    if (interaction.mode.type === 'DRAWING_WIRE') {
      ids.add(interaction.mode.fromPinId);
    }
    if (interaction.mode.type === 'REWIRING_WIRE_ENDPOINT') {
      ids.add(interaction.mode.fixedPinId);
    }
    return ids;
  }, [hoveredPinId, interaction.mode]);

  const focusSingletonComponent = useCallback(
    (type: string) => {
      const entry = componentRegistry.getEntry(type);
      if (!entry?.singleton) {
        return false;
      }

      const existing = components.find((component) => componentRegistry.getEntry(component.type)?.id === entry.id);
      if (!existing) {
        return false;
      }

      selectComponent(existing.id);
      setSelectedWireId(null);
      return true;
    },
    [componentRegistry, components, selectComponent]
  );

  const createComponentAtClient = useCallback(
    (type: string, clientX?: number, clientY?: number, snapToBreadboard = true) => {
      if (focusSingletonComponent(type)) {
        return;
      }

      const placement = resolveCanvasPlacement(type, clientX, clientY);
      if (!placement) return;

      const id = `${type.toLowerCase()}-${Date.now()}`;
      const mountPreview = snapToBreadboard
        ? buildPlacementPreview(type, id, placement.rawPosition, 0)
        : null;
      const finalPosition = mountPreview?.isValid ? mountPreview.position : placement.rawPosition;

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
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
      selectComponent(id);
      setSelectedWireId(null);
    },
    [addComponent, buildPlacementPreview, eventBus, focusSingletonComponent, resolveCanvasPlacement, selectComponent]
  );

  const beginComponentInsertion = useCallback(
    (type: string) => {
      if (focusSingletonComponent(type)) {
        clearArmedInsertionPreview();
        return;
      }

      if (dragPreview?.source === 'armed' && dragPreview.componentType === type) {
        clearArmedInsertionPreview();
        return;
      }

      updateInsertionPreview('armed', type);
      selectComponent(null);
      setSelectedWireId(null);
    },
    [clearArmedInsertionPreview, dragPreview, focusSingletonComponent, selectComponent, updateInsertionPreview]
  );

  const handleCanvasPointerMoveCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragPreview?.source !== 'armed') {
        return;
      }

      updateInsertionPreview('armed', dragPreview.componentType, event.clientX, event.clientY);
    },
    [dragPreview, updateInsertionPreview]
  );

  const handleCanvasPointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragPreview?.source !== 'armed' || event.button !== 0) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target?.closest('[data-canvas-root]')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      createComponentAtClient(dragPreview.componentType, event.clientX, event.clientY, true);
      clearArmedInsertionPreview();
    },
    [clearArmedInsertionPreview, createComponentAtClient, dragPreview]
  );

  const handleDragOverCanvas = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const componentType = event.dataTransfer.getData('componentType');
      if (componentType) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        updatePaletteDragPreview(componentType, event.clientX, event.clientY);
      }
    },
    [updatePaletteDragPreview]
  );

  const handleDragLeaveCanvas = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      clearPaletteDragPreview();
    },
    [clearPaletteDragPreview]
  );

  const handleDropOnCanvas = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const componentType = event.dataTransfer.getData('componentType');
      if (!componentType) {
        return;
      }

      event.preventDefault();
      createComponentAtClient(componentType, event.clientX, event.clientY, true);
      clearPaletteDragPreview();
    },
    [clearPaletteDragPreview, createComponentAtClient]
  );

  const handlePaletteDragEnd = useCallback(() => {
    clearPaletteDragPreview();
  }, [clearPaletteDragPreview]);

  const palettePreviewDefinition = useMemo(
    () => (dragPreview?.source === 'palette' || dragPreview?.source === 'armed' ? getComponentDefinition(dragPreview.componentType) : null),
    [dragPreview]
  );

  const palettePreviewTransform = useMemo(
    () => ({
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
      transformOrigin: '0 0',
    }),
    [transform.scale, transform.x, transform.y]
  );

  const selectedComponentNode = useMemo(
    () => (selectedComponentId ? scene.componentById[selectedComponentId] ?? null : null),
    [scene.componentById, selectedComponentId]
  );

  const selectedWire = useMemo(
    () => (selectedWireId ? scene.wireById[selectedWireId] ?? null : null),
    [scene.wireById, selectedWireId]
  );

  const isCanvasEmpty = circuitData.components.length === 0;

  const visiblePinTargetIds = useMemo(() => {
    const ids = new Set<string>();

    const addPin = (pinId: string | null | undefined) => {
      if (pinId) {
        ids.add(pinId);
      }
    };

    if (interaction.mode.type === 'DRAWING_WIRE' || interaction.mode.type === 'REWIRING_WIRE_ENDPOINT') {
      scene.pins.forEach((pin) => {
        if (pin.kind !== 'breadboard') {
          ids.add(pin.id);
        }
      });
    } else {
      scene.pins.forEach((pin) => {
        if (pin.kind === 'breadboard') {
          return;
        }

        if (pin.componentId && (pin.componentId === selectedComponentId || pin.componentId === hoveredComponentId)) {
          ids.add(pin.id);
        }
      });

      addPin(selectedWire?.fromAnchorId);
      addPin(selectedWire?.toAnchorId);
    }

    highlightedPinIds.forEach((pinId) => ids.add(pinId));
    if (hoveredPinId) {
      ids.add(hoveredPinId);
    }

    return ids;
  }, [highlightedPinIds, hoveredComponentId, hoveredPinId, interaction.mode.type, scene.pins, selectedComponentId, selectedWire?.fromAnchorId, selectedWire?.toAnchorId]);

  const interactionMode = useMemo(() => {
    if (isPlacementPreviewVisible && dragPreview) {
      const isValid = dragPreview.mountPreview ? dragPreview.mountPreview.isValid : true;
      return {
        label: 'Placing',
        detail: isValid ? 'Locked' : 'Adjust',
        tone: isValid ? 'placing' as const : 'invalid' as const,
      };
    }

    if (interaction.mode.type === 'DRAWING_WIRE' || interaction.mode.type === 'REWIRING_WIRE_ENDPOINT') {
      const isLocked = interaction.mode.targetLockState === 'locked';
      return {
        label: 'Wiring',
        detail: interaction.mode.hoveredTargetPinId ? (isLocked ? 'Locked' : 'Snap ready') : 'Choose target',
        tone: isLocked ? 'valid' as const : 'wiring' as const,
      };
    }

    if (selectedComponentNode && selectedComponentNode.definition.id !== 'BREADBOARD') {
      return {
        label: selectedComponentNode.definition.name,
        detail: 'Selected',
        tone: 'selection' as const,
      };
    }

    if (selectedWire) {
      return {
        label: 'Wire',
        detail: 'Selected',
        tone: 'selection' as const,
      };
    }

    return null;
  }, [dragPreview, interaction.mode, isPlacementPreviewVisible, selectedComponentNode, selectedWire]);

  const interactionGuide = useMemo(() => {
    if (isPlacementPreviewVisible && dragPreview?.mountPreview && !dragPreview.mountPreview.isValid) {
      return {
        title: 'Try another spot',
        status: 'Invalid placement',
        tone: 'invalid' as const,
        description: formatPlacementReason(dragPreview.mountPreview.reason, dragPreview.componentType),
        action: '',
      };
    }

    return null;
  }, [dragPreview, isPlacementPreviewVisible]);

  const selectionOverlay = useMemo(() => {
    if (isPlacementPreviewVisible || interaction.mode.type === 'DRAWING_WIRE' || interaction.mode.type === 'REWIRING_WIRE_ENDPOINT') {
      return null;
    }
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
  }, [interaction.mode.type, isPlacementPreviewVisible, selectedComponentNode, selectedWire, transform.scale, transform.x, transform.y]);

  const handleApplyWireColor = useCallback(
    (color: string) => {
      if (!selectedWireId) {
        return;
      }

      updateNet(selectedWireId, { color });
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
    },
    [eventBus, selectedWireId, updateNet]
  );

  const handleRotateSelected = useCallback(() => {
    if (!selectedComponentId) {
      return;
    }

    rotateComponent(selectedComponentId);
    eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
  }, [eventBus, rotateComponent, selectedComponentId]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedComponentId && !isPaletteVisible) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, [selectedComponentId, isPaletteVisible]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedWireId) {
      removeNet(selectedWireId);
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
      setSelectedWireId(null);
      return;
    }

    if (selectedComponentId) {
      removeComponent(selectedComponentId);
      eventBus.emit('USER_EDITED', { source: 'circuit', timestamp: Date.now() });
      selectComponent(null);
    }
  }, [eventBus, removeComponent, removeNet, selectComponent, selectedComponentId, selectedWireId]);

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
                  <div className="mt-1 text-[1.05rem] font-semibold text-white/90">{activeCategory === 'All' ? CATEGORY_META.All.label : componentRegistry.getCategoryLabel(activeCategory)}</div>
                  <div className="mt-2 max-w-[220px] text-[11px] leading-4 text-white/46">
                    Drag a part to place it, or click a part and then click exactly where you want it to go.
                  </div>
                  {dragPreview?.source === 'armed' && palettePreviewDefinition ? (
                    <div className="mt-3 inline-flex items-center rounded-full border border-cyan-300/24 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                      Placing {palettePreviewDefinition.name}
                    </div>
                  ) : null}
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
                    key={item.entry.id}
                    data-testid={`palette-item-${item.entry.id}`}
                    data-palette-item={item.entry.id}
                    data-armed={String(Boolean(dragPreview?.source === 'armed' && dragPreview.componentType === item.entry.id))}
                    aria-pressed={dragPreview?.source === 'armed' && dragPreview.componentType === item.entry.id}
                    draggable={!item.alreadyPlaced}
                    onDragStart={(event) => {
                      if (item.alreadyPlaced) {
                        event.preventDefault();
                        return;
                      }

                      clearArmedInsertionPreview();
                      event.dataTransfer.setData('componentType', item.entry.id);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    onDragEnd={handlePaletteDragEnd}
                    onClick={() => {
                      if (item.alreadyPlaced) {
                        focusSingletonComponent(item.entry.id);
                        return;
                      }

                      beginComponentInsertion(item.entry.id);
                    }}
                    className="group flex w-full items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[linear-gradient(180deg,#161d28_0%,#0d131b_100%)] px-3 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-[linear-gradient(180deg,#1a2230_0%,#111824_100%)]"
                  >
                    <div className="flex h-[94px] w-[116px] shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-[radial-gradient(circle_at_50%_35%,rgba(34,47,67,0.96),rgba(14,20,29,0.98)_74%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <ComponentPreview definition={item.definition} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3"><div className="text-[15px] font-semibold text-white/90">{item.entry.name}</div>{dragPreview?.source === 'armed' && dragPreview.componentType === item.entry.id ? (<span className="rounded-full border border-cyan-300/28 bg-cyan-300/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">Placing</span>) : null}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/34">{componentRegistry.getCategoryLabel(item.entry.category)}</div>
                      <div className="mt-1 text-[11px] leading-4 text-white/38">
                        {item.alreadyPlaced ? 'Already on the canvas. Click to select it.' : item.entry.description}
                      </div>
                      <div className="mt-2 text-[11px] font-medium leading-4 text-white/56">
                        {item.alreadyPlaced
                          ? 'This part is limited to one copy.'
                          : dragPreview?.source === 'armed' && dragPreview.componentType === item.entry.id
                            ? 'Click on the canvas to place it.'
                            : 'Drag to place, or click and then click on the canvas.'}
                      </div>
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
        onPointerMoveCapture={handleCanvasPointerMoveCapture}
        onPointerDownCapture={handleCanvasPointerDownCapture}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOverCanvas}
        onDragLeave={handleDragLeaveCanvas}
        onDrop={handleDropOnCanvas}
      >
        <CanvasEngine
          containerRef={canvasContainerRef}
          transform={transform}
          scene={scene}
          recentlyCreatedWireId={recentlyCreatedWireId}
          recentlyConnectedPinId={recentlyConnectedPinId}
          interactionProps={{
            pins: scene.pins,
            visiblePinTargetIds,
            highlightedPinIds,
            validTargetPinId:
              interaction.mode.type === 'DRAWING_WIRE' || interaction.mode.type === 'REWIRING_WIRE_ENDPOINT'
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
                    targetLockState: interaction.mode.targetLockState,
                    crowdedTargets: interaction.mode.crowdedTargets,
                    preferredAxis: interaction.mode.previewAxis,
                    points: buildWireRoutePoints(
                      interaction.mode.fromPoint,
                      interaction.mode.previewPoint,
                      [],
                      interaction.mode.previewAxis
                    ),
                  }
                : interaction.mode.type === 'REWIRING_WIRE_ENDPOINT'
                  ? {
                      fromNodeId: interaction.mode.fixedNodeId,
                      fromPinId: interaction.mode.fixedPinId,
                      fromPoint: interaction.mode.fixedPoint,
                      previewPoint: interaction.mode.previewPoint,
                      hoveredTargetNodeId: interaction.mode.hoveredTargetNodeId,
                      hoveredTargetPinId: interaction.mode.hoveredTargetPinId,
                      targetLockState: interaction.mode.targetLockState,
                      crowdedTargets: interaction.mode.crowdedTargets,
                      preferredAxis: interaction.mode.previewAxis,
                      points: buildWireRoutePoints(
                        interaction.mode.fixedPoint,
                        interaction.mode.previewPoint,
                        [],
                        interaction.mode.previewAxis
                      ),
                    }
                  : null,
          }}
        />

        {contextMenu && selectedComponentId ? (
          <ComponentContextMenu
            componentId={selectedComponentId}
            position={contextMenu}
            onRotate={handleRotateSelected}
            onDelete={handleDeleteSelected}
            onClose={() => setContextMenu(null)}
          />
        ) : null}

        {isPlacementPreviewVisible && dragPreview && palettePreviewDefinition ? (
          <div className="pointer-events-none absolute inset-0 z-[18] overflow-hidden" aria-hidden="true" data-testid="circuit-placement-preview">
            <div style={palettePreviewTransform}>
              <div
                className="absolute opacity-85 drop-shadow-[0_18px_28px_rgba(2,6,23,0.55)]"
                style={{
                  left: dragPreview.displayPosition.x,
                  top: dragPreview.displayPosition.y,
                  width: getRenderedSize(palettePreviewDefinition.size).width,
                  height: getRenderedSize(palettePreviewDefinition.size).height,
                }}
              >
                <div
                  data-testid="circuit-placement-preview-status"
                  className={cn(
                    'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-[0_18px_24px_-20px_rgba(2,6,23,0.95)]',
                    dragPreview.mountPreview && !dragPreview.mountPreview.isValid
                      ? 'border-rose-300/30 bg-rose-500/14 text-rose-100'
                      : 'border-cyan-300/26 bg-cyan-300/12 text-cyan-100'
                  )}
                >
                  {dragPreview.mountPreview
                    ? dragPreview.mountPreview.isValid
                      ? 'Valid placement'
                      : 'Move to a valid spot'
                    : 'Ready to place'}
                </div>
                <ComponentPreview definition={palettePreviewDefinition} className="h-full w-full" />
              </div>
            </div>
          </div>
        ) : null}

        {isCanvasEmpty && !isPlacementPreviewVisible ? (
          <div className="pointer-events-none absolute left-5 top-5 z-[120] max-w-[560px]">
            <div className="pointer-events-auto inline-flex flex-wrap items-center gap-3 rounded-[18px] border border-white/8 bg-[#08101b]/72 px-4 py-3 text-white shadow-[0_18px_48px_-36px_rgba(0,0,0,0.92)] backdrop-blur-lg">
              <div className="pr-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/38">Quick Start</div>
                <div className="mt-1 text-sm font-semibold text-white/88">Place a board and a breadboard.</div>
              </div>
              <button
                type="button"
                onClick={() => beginComponentInsertion('ARDUINO_UNO')}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-all hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-cyan-300/14"
              >
                <CircuitBoard size={14} />
                Add Arduino Uno
              </button>
              <button
                type="button"
                onClick={() => beginComponentInsertion('BREADBOARD')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/84 transition-all hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08]"
              >
                <Palette size={14} />
                Add Breadboard
              </button>
              <button
                type="button"
                onClick={() => beginComponentInsertion('LED')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/84 transition-all hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08]"
              >
                <Lightbulb size={14} />
                Add LED
              </button>
            </div>
          </div>
        ) : null}

        {interactionMode ? (
          <>
            <div
              className={cn(
                'pointer-events-none absolute inset-[10px] z-[14] rounded-[24px] border transition-all duration-150',
                interactionMode.tone === 'placing'
                  ? 'border-cyan-300/16 shadow-[0_0_0_1px_rgba(34,211,238,0.06),0_0_42px_rgba(34,211,238,0.08)]'
                  : interactionMode.tone === 'invalid'
                    ? 'border-rose-300/18 shadow-[0_0_0_1px_rgba(248,113,113,0.06),0_0_42px_rgba(248,113,113,0.08)]'
                    : interactionMode.tone === 'valid'
                      ? 'border-emerald-300/18 shadow-[0_0_0_1px_rgba(52,211,153,0.06),0_0_42px_rgba(52,211,153,0.08)]'
                      : interactionMode.tone === 'wiring'
                        ? 'border-sky-300/14 shadow-[0_0_0_1px_rgba(56,189,248,0.05),0_0_34px_rgba(56,189,248,0.06)]'
                        : 'border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
              )}
              data-testid="circuit-mode-frame"
            />
            <div className="pointer-events-none absolute left-1/2 top-5 z-[250] -translate-x-1/2" data-testid="circuit-mode-badge">
              <div
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-[0_18px_34px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl',
                  interactionMode.tone === 'placing'
                    ? 'border-cyan-300/26 bg-cyan-300/12 text-cyan-100'
                    : interactionMode.tone === 'invalid'
                      ? 'border-rose-300/30 bg-rose-500/14 text-rose-100'
                      : interactionMode.tone === 'valid'
                        ? 'border-emerald-300/28 bg-emerald-500/14 text-emerald-100'
                        : interactionMode.tone === 'wiring'
                          ? 'border-sky-300/24 bg-sky-300/12 text-sky-100'
                          : 'border-white/12 bg-[#08111d]/88 text-white/80'
                )}
              >
                {interactionMode.label} � {interactionMode.detail}
              </div>
            </div>
          </>
        ) : null}

        <InteractionManager
          showPalette={isPaletteVisible}
          onTogglePalette={() => setIsPaletteVisible((current) => !current)}
          onZoomFit={handleZoomFit}
          onResetView={handleResetView}
        />

        {interaction.mode.type === 'DRAWING_WIRE' && (
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              interaction.cancelWireDrawing();
            }}
            className="pointer-events-auto absolute bottom-5 left-1/2 z-[300] -translate-x-1/2 flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-[0_18px_48px_-24px_rgba(225,29,72,0.6)] backdrop-blur-md dark:bg-rose-950/80 dark:text-rose-200"
          >
            <X size={14} /> Cancel Wire
          </button>
        )}

        {interactionGuide ? (
          <div className="pointer-events-none absolute bottom-5 left-5 z-[260] max-w-[360px]" data-testid="circuit-interaction-guide">
            <div
              className={cn(
                'rounded-[18px] border px-4 py-3 shadow-[0_22px_48px_-28px_rgba(2,6,23,0.95)] backdrop-blur-xl',
                interactionGuide.tone === 'invalid'
                  ? 'border-rose-300/28 bg-[#1a0d12]/90 text-rose-50'
                  : 'border-white/10 bg-[#08111d]/90 text-slate-100'
              )}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/46">{interactionGuide.status}</div>
              <div className="mt-1 text-sm font-semibold text-white/94">{interactionGuide.title}</div>
              <div className="mt-2 text-[13px] leading-5 text-white/72">{interactionGuide.description}</div>
              {interactionGuide.action ? <div className="mt-2 text-[12px] font-medium leading-5 text-white/56">{interactionGuide.action}</div> : null}
            </div>
          </div>
        ) : null}

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
                    onClick={handleRotateSelected}
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
            dragPreview?.source === 'existing'
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0',
            dragPreview?.source === 'existing' && dragPreview?.overTrash
              ? 'border-red-400/60 bg-red-500/16 text-red-50 shadow-[0_0_26px_rgba(248,113,113,0.28)]'
              : 'border-white/10 bg-[#0b111b]/88 text-slate-300 shadow-[0_18px_38px_-28px_rgba(2,6,23,0.95)]'
          )}
        >
          <Trash2 className={cn('h-5 w-5', dragPreview?.source === 'existing' && dragPreview?.overTrash ? 'text-red-200' : 'text-slate-300')} />
          <span>{dragPreview?.source === 'existing' && dragPreview?.overTrash ? 'Release to delete' : 'Drag here to delete'}</span>
        </div>
      </div>
    </div>
  );
}














