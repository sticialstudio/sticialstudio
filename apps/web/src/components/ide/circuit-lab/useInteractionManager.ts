import { useCallback, useEffect, useRef, useState } from 'react';

import type { Point } from './types';
import type { HitResult, SceneGraph, WireHandleNode } from './sceneTypes';
import { hitTestScene } from './hitTesting';
import { moveWireHandle } from './wireRouting';
import type { CanvasTransform } from './useCanvasViewport';

export type InteractionMode =
  | { type: 'IDLE' }
  | { type: 'PANNING'; startClient: Point; origin: Point }
  | { type: 'DRAGGING_COMPONENT'; componentId: string; startClient: Point; origin: Point; moved: boolean }
  | {
      type: 'DRAWING_WIRE';
      fromPinId: string;
      fromNodeId: string;
      fromPoint: Point;
      previewPoint: Point;
      hoveredTargetNodeId: string | null;
      hoveredTargetPinId: string | null;
    }
  | {
      type: 'MOVING_WIRE_HANDLE';
      wireId: string;
      handle: Pick<WireHandleNode, 'axis' | 'kind' | 'waypointIndex' | 'segmentIndex'>;
      initialWaypoints: Point[];
    };

export interface WireConnectionRequest {
  fromNodeId: string;
  toNodeId: string;
  fromPinId: string;
  toPinId: string;
}

interface DragMoveMeta {
  client: Point;
  moved: boolean;
}

interface InteractionManagerOptions {
  scene: SceneGraph;
  transform: CanvasTransform;
  selectedComponentId: string | null;
  selectedWireId: string | null;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onMoveComponent: (id: string, position: Point, meta: DragMoveMeta) => void;
  onCommitComponentMove?: (id: string, position: Point, meta: DragMoveMeta) => void;
  onTapComponent?: (id: string) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteWire: (id: string) => void;
  onAddWire: (request: WireConnectionRequest) => void;
  onPreviewWireWaypoints: (id: string, waypoints: Point[] | null) => void;
  onCommitWireWaypoints: (id: string, waypoints: Point[]) => void;
  beginPan: (x: number, y: number) => void;
  updatePan: (x: number, y: number) => void;
  endPan: () => void;
  zoomAt: (delta: number, x: number, y: number, bounds: DOMRect) => void;
}

const DRAG_THRESHOLD = 5;

export function useInteractionManager({
  scene,
  transform,
  selectedComponentId,
  selectedWireId,
  onSelectComponent,
  onSelectWire,
  onMoveComponent,
  onCommitComponentMove,
  onTapComponent,
  onRotateComponent,
  onDeleteComponent,
  onDeleteWire,
  onAddWire,
  onPreviewWireWaypoints,
  onCommitWireWaypoints,
  beginPan,
  updatePan,
  endPan,
  zoomAt,
}: InteractionManagerOptions) {
  const [mode, setMode] = useState<InteractionMode>({ type: 'IDLE' });
  const [hoveredHit, setHoveredHit] = useState<HitResult>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const wireJustStartedRef = useRef(false);
  const dragFrameRef = useRef<number | null>(null);
  const wireFrameRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ id: string; position: Point; meta: DragMoveMeta } | null>(null);
  const pendingWireRef = useRef<{ previewPoint: Point; targetPinId: string | null; targetNodeId: string | null } | null>(null);
  const pendingHandleWaypointsRef = useRef<{ wireId: string; waypoints: Point[] } | null>(null);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const bounds = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - bounds.left - transform.x) / transform.scale,
        y: (clientY - bounds.top - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  const clearScheduledFrames = useCallback(() => {
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    if (wireFrameRef.current !== null) {
      cancelAnimationFrame(wireFrameRef.current);
      wireFrameRef.current = null;
    }
    pendingDragRef.current = null;
    pendingWireRef.current = null;
  }, []);

  const clearHandlePreview = useCallback(
    (wireId: string) => {
      if (pendingHandleWaypointsRef.current?.wireId === wireId) {
        pendingHandleWaypointsRef.current = null;
      }
      onPreviewWireWaypoints(wireId, null);
    },
    [onPreviewWireWaypoints]
  );

  const commitHandlePreview = useCallback(
    (wireId: string, fallbackWaypoints: Point[]) => {
      const preview = pendingHandleWaypointsRef.current;
      const waypoints = preview?.wireId === wireId ? preview.waypoints : fallbackWaypoints;
      pendingHandleWaypointsRef.current = null;
      onCommitWireWaypoints(wireId, waypoints);
    },
    [onCommitWireWaypoints]
  );

  const resetInteraction = useCallback(() => {
    endPan();
    activePointerIdRef.current = null;
    wireJustStartedRef.current = false;
    clearScheduledFrames();
    setMode({ type: 'IDLE' });
  }, [clearScheduledFrames, endPan]);

  const scheduleDragPreview = useCallback(
    (id: string, position: Point, meta: DragMoveMeta) => {
      pendingDragRef.current = { id, position, meta };
      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pending = pendingDragRef.current;
        if (!pending) {
          return;
        }
        onMoveComponent(pending.id, pending.position, pending.meta);
      });
    },
    [onMoveComponent]
  );

  const scheduleWirePreview = useCallback((previewPoint: Point, targetPinId: string | null, targetNodeId: string | null) => {
    pendingWireRef.current = { previewPoint, targetPinId, targetNodeId };
    if (wireFrameRef.current !== null) {
      return;
    }

    wireFrameRef.current = requestAnimationFrame(() => {
      wireFrameRef.current = null;
      const pending = pendingWireRef.current;
      if (!pending) {
        return;
      }

      setMode((previous) =>
        previous.type === 'DRAWING_WIRE'
          ? {
              ...previous,
              previewPoint: pending.previewPoint,
              hoveredTargetPinId: pending.targetPinId,
              hoveredTargetNodeId: pending.targetNodeId,
            }
          : previous
      );
      const targetPin = pending.targetPinId ? scene.pinById[pending.targetPinId] : null;
      setHoveredHit(targetPin ? { type: 'pin', pin: targetPin } : null);
    });
  }, [scene.pinById]);

  const releasePointerCapture = useCallback((target: HTMLDivElement, pointerId: number) => {
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  }, []);

  const resolveWireTarget = useCallback((hit: HitResult, fromNodeId: string) => {
    if (hit?.type !== 'pin' || hit.pin.nodeId === fromNodeId) {
      return null;
    }

    return hit.pin;
  }, []);

  const updateWirePreviewFromClient = useCallback(
    (clientX: number, clientY: number, fromNodeId: string) => {
      const worldPoint = screenToWorld(clientX, clientY);
      const hit = hitTestScene(scene, worldPoint, transform.scale, null, selectedComponentId);
      const targetPin = resolveWireTarget(hit, fromNodeId);
      scheduleWirePreview(targetPin?.position ?? worldPoint, targetPin?.id ?? null, targetPin?.nodeId ?? null);
    },
    [resolveWireTarget, scene, scheduleWirePreview, screenToWorld, transform.scale]
  );

  const completeWire = useCallback(
    (request: WireConnectionRequest, eventTarget?: HTMLDivElement, pointerId?: number) => {
      onAddWire(request);
      setHoveredHit(null);
      if (eventTarget && typeof pointerId === 'number') {
        releasePointerCapture(eventTarget, pointerId);
      }
      resetInteraction();
    },
    [onAddWire, releasePointerCapture, resetInteraction]
  );

  useEffect(() => {
    return () => clearScheduledFrames();
  }, [clearScheduledFrames]);

  const activeWireNodeId = mode.type === 'DRAWING_WIRE' ? mode.fromNodeId : null;

  useEffect(() => {
    if (!activeWireNodeId) {
      return;
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
      updateWirePreviewFromClient(event.clientX, event.clientY, activeWireNodeId);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    return () => window.removeEventListener('pointermove', handleWindowPointerMove);
  }, [activeWireNodeId, updateWirePreviewFromClient]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      activePointerIdRef.current = e.pointerId;
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }

      const worldPoint = screenToWorld(e.clientX, e.clientY);
      const selectedWire = selectedWireId ? scene.wireById[selectedWireId] : null;
      const hit = hitTestScene(scene, worldPoint, transform.scale, selectedWire, selectedComponentId);

      if (mode.type === 'DRAWING_WIRE' && e.button === 0) {
        const targetPin = resolveWireTarget(hit, mode.fromNodeId);
        if (targetPin) {
          completeWire(
            {
              fromNodeId: mode.fromNodeId,
              toNodeId: targetPin.nodeId,
              fromPinId: mode.fromPinId,
              toPinId: targetPin.id,
            },
            e.currentTarget,
            e.pointerId
          );
          return;
        }

        setHoveredHit(null);
        releasePointerCapture(e.currentTarget, e.pointerId);
        resetInteraction();
        return;
      }

      if (e.button === 1) {
        setMode({ type: 'PANNING', startClient: { x: e.clientX, y: e.clientY }, origin: { x: transform.x, y: transform.y } });
        beginPan(e.clientX, e.clientY);
        return;
      }

      if (e.button !== 0) {
        return;
      }

      if (hit?.type === 'wire-handle') {
        const wire = scene.wireById[hit.handle.wireId];
        onSelectWire(hit.handle.wireId);
        onSelectComponent(null);
        pendingHandleWaypointsRef.current = null;
        setMode({
          type: 'MOVING_WIRE_HANDLE',
          wireId: hit.handle.wireId,
          handle: {
            axis: hit.handle.axis,
            kind: hit.handle.kind,
            waypointIndex: hit.handle.waypointIndex,
            segmentIndex: hit.handle.segmentIndex,
          },
          initialWaypoints: wire?.waypoints ?? [],
        });
        return;
      }

      if (hit?.type === 'pin') {
        onSelectComponent(hit.pin.componentId ?? null);
        onSelectWire(null);
        wireJustStartedRef.current = true;
        setHoveredHit(hit);
        setMode({
          type: 'DRAWING_WIRE',
          fromPinId: hit.pin.id,
          fromNodeId: hit.pin.nodeId,
          fromPoint: hit.pin.position,
          previewPoint: hit.pin.position,
          hoveredTargetNodeId: null,
          hoveredTargetPinId: null,
        });
        return;
      }

      if (hit?.type === 'component') {
        onSelectComponent(hit.component.id);
        onSelectWire(null);
        setMode({
          type: 'DRAGGING_COMPONENT',
          componentId: hit.component.id,
          startClient: { x: e.clientX, y: e.clientY },
          origin: { x: hit.component.position.x, y: hit.component.position.y },
          moved: false,
        });
        return;
      }

      if (hit?.type === 'wire-segment') {
        if (selectedWireId === hit.wire.id) {
          const segmentStart = hit.wire.points[hit.segmentIndex];
          const segmentEnd = hit.wire.points[hit.segmentIndex + 1];
          if (segmentStart && segmentEnd) {
            onSelectWire(hit.wire.id);
            onSelectComponent(null);
            pendingHandleWaypointsRef.current = null;
            setMode({
              type: 'MOVING_WIRE_HANDLE',
              wireId: hit.wire.id,
              handle: {
                axis: Math.abs(segmentStart.x - segmentEnd.x) <= 0.5 ? 'x' : 'y',
                kind: 'segment',
                waypointIndex: -1,
                segmentIndex: hit.segmentIndex,
              },
              initialWaypoints: hit.wire.waypoints,
            });
            return;
          }
        }

        onSelectWire(hit.wire.id);
        onSelectComponent(null);
        return;
      }

      if (hit?.type === 'wire') {
        onSelectWire(hit.wire.id);
        onSelectComponent(null);
        return;
      }

      onSelectComponent(null);
      onSelectWire(null);
    },
    [
      beginPan,
      completeWire,
      mode,
      onSelectComponent,
      onSelectWire,
      releasePointerCapture,
      resetInteraction,
      resolveWireTarget,
      scene,
      screenToWorld,
      selectedWireId,
      transform.scale,
      transform.x,
      transform.y,
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const worldPoint = screenToWorld(e.clientX, e.clientY);

      if (mode.type === 'IDLE') {
        const selectedWire = selectedWireId ? scene.wireById[selectedWireId] : null;
        setHoveredHit(hitTestScene(scene, worldPoint, transform.scale, selectedWire, selectedComponentId));
        return;
      }

      if (mode.type === 'PANNING') {
        updatePan(e.clientX, e.clientY);
        return;
      }

      if (mode.type === 'DRAGGING_COMPONENT') {
        const dragDistance = Math.hypot(e.clientX - mode.startClient.x, e.clientY - mode.startClient.y);
        if (!mode.moved && dragDistance <= DRAG_THRESHOLD) {
          return;
        }

        if (!mode.moved) {
          setMode((previous) => (previous.type === 'DRAGGING_COMPONENT' ? { ...previous, moved: true } : previous));
        }

        const dx = (e.clientX - mode.startClient.x) / transform.scale;
        const dy = (e.clientY - mode.startClient.y) / transform.scale;
        scheduleDragPreview(mode.componentId, { x: mode.origin.x + dx, y: mode.origin.y + dy }, {
          client: { x: e.clientX, y: e.clientY },
          moved: true,
        });
        return;
      }

      if (mode.type === 'DRAWING_WIRE') {
        updateWirePreviewFromClient(e.clientX, e.clientY, mode.fromNodeId);
        return;
      }

      if (mode.type === 'MOVING_WIRE_HANDLE') {
        const wire = scene.wireById[mode.wireId];
        if (!wire) return;
        const nextWaypoints = moveWireHandle(
          wire.fromPoint,
          wire.toPoint,
          wire.waypoints,
          mode.handle,
          worldPoint
        );
        pendingHandleWaypointsRef.current = { wireId: mode.wireId, waypoints: nextWaypoints };
        onPreviewWireWaypoints(mode.wireId, nextWaypoints);
      }
    },
    [mode, onPreviewWireWaypoints, scene, scheduleDragPreview, screenToWorld, selectedWireId, transform.scale, updatePan, updateWirePreviewFromClient]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (mode.type === 'DRAGGING_COMPONENT') {
        if (mode.moved) {
          const dx = (e.clientX - mode.startClient.x) / transform.scale;
          const dy = (e.clientY - mode.startClient.y) / transform.scale;
          const finalPosition = { x: mode.origin.x + dx, y: mode.origin.y + dy };
          onCommitComponentMove?.(mode.componentId, finalPosition, {
            client: { x: e.clientX, y: e.clientY },
            moved: true,
          });
        } else {
          onTapComponent?.(mode.componentId);
        }

        releasePointerCapture(e.currentTarget, e.pointerId);
        resetInteraction();
        return;
      }

      if (mode.type === 'DRAWING_WIRE') {
        const worldPoint = screenToWorld(e.clientX, e.clientY);
        const hit = hitTestScene(scene, worldPoint, transform.scale, null, selectedComponentId);
        const targetPin = resolveWireTarget(hit, mode.fromNodeId);

        if (wireJustStartedRef.current) {
          wireJustStartedRef.current = false;
          if (targetPin) {
            completeWire(
              {
                fromNodeId: mode.fromNodeId,
                toNodeId: targetPin.nodeId,
                fromPinId: mode.fromPinId,
                toPinId: targetPin.id,
              },
              e.currentTarget,
              e.pointerId
            );
            return;
          }

          setMode((previous) =>
            previous.type === 'DRAWING_WIRE'
              ? {
                  ...previous,
                  previewPoint: worldPoint,
                  hoveredTargetPinId: null,
                  hoveredTargetNodeId: null,
                }
              : previous
          );
          setHoveredHit(null);
        }

        releasePointerCapture(e.currentTarget, e.pointerId);
        return;
      }

      if (mode.type === 'MOVING_WIRE_HANDLE') {
        commitHandlePreview(mode.wireId, mode.initialWaypoints);
        releasePointerCapture(e.currentTarget, e.pointerId);
        resetInteraction();
        return;
      }

      releasePointerCapture(e.currentTarget, e.pointerId);
      resetInteraction();
    },
    [commitHandlePreview, completeWire, mode, onCommitComponentMove, releasePointerCapture, resetInteraction, resolveWireTarget, scene, screenToWorld, transform.scale]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (mode.type === 'MOVING_WIRE_HANDLE') {
        clearHandlePreview(mode.wireId);
      }
      releasePointerCapture(e.currentTarget, e.pointerId);
      setHoveredHit(null);
      resetInteraction();
    },
    [clearHandlePreview, mode, releasePointerCapture, resetInteraction]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!containerRef.current) return;
      zoomAt(e.deltaY, e.clientX, e.clientY, containerRef.current.getBoundingClientRect());
    },
    [zoomAt]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === 'escape') {
        e.preventDefault();
        if (mode.type === 'MOVING_WIRE_HANDLE') {
          clearHandlePreview(mode.wireId);
          setHoveredHit(null);
          resetInteraction();
          return;
        }

        if (mode.type === 'DRAWING_WIRE' || mode.type === 'DRAGGING_COMPONENT' || mode.type === 'PANNING') {
          setHoveredHit(null);
          resetInteraction();
          return;
        }

        if (selectedWireId) {
          onSelectWire(null);
          setHoveredHit(null);
          return;
        }

        setHoveredHit(null);
        resetInteraction();
        return;
      }
      if (key === 'r' && selectedComponentId) {
        e.preventDefault();
        onRotateComponent(selectedComponentId);
      }
      if (key === 'delete' || key === 'backspace') {
        if (selectedComponentId) {
          e.preventDefault();
          onDeleteComponent(selectedComponentId);
        } else if (selectedWireId) {
          e.preventDefault();
          if (mode.type === 'MOVING_WIRE_HANDLE' && mode.wireId === selectedWireId) {
            clearHandlePreview(selectedWireId);
          }
          onDeleteWire(selectedWireId);
          onSelectWire(null);
          setHoveredHit(null);
          resetInteraction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clearHandlePreview,
    mode,
    onDeleteComponent,
    onDeleteWire,
    onRotateComponent,
    onSelectWire,
    resetInteraction,
    selectedComponentId,
    selectedWireId,
  ]);

  return {
    mode,
    hoveredHit,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleWheel,
  };
}

