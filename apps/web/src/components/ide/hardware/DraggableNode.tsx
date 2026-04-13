'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useCircuitStore } from '@/stores/circuitStore';

interface Position {
  x: number;
  y: number;
}

interface DraggableNodeProps {
  id: string;
  initialX: number;
  initialY: number;
  children: React.ReactNode;
  disabled?: boolean;
  scale?: number;
  className?: string;
  resolveDropPosition?: (x: number, y: number) => Position;
  onDragStart?: () => void;
  onDragMove?: (clientX: number, clientY: number) => void;
  onDragEnd?: (clientX: number, clientY: number) => boolean | void;
}

const DRAG_START_THRESHOLD = 4;

export default function DraggableNode({
  id,
  initialX,
  initialY,
  children,
  disabled = false,
  scale = 1,
  className,
  resolveDropPosition,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableNodeProps) {
  const updateComponentPosition = useCircuitStore((state) => state.updateComponentPosition);
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);

  const livePositionRef = useRef<Position>({ x: initialX, y: initialY });
  const pendingPositionRef = useRef<Position | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const flushPendingPosition = () => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      const pendingPosition = pendingPositionRef.current;
      if (!pendingPosition) {
        return;
      }

      livePositionRef.current = pendingPosition;
      setPosition(pendingPosition);
    });
  };

  const resetDragSession = () => {
    dragStateRef.current = null;
    pendingPositionRef.current = null;
    setIsDragging(false);
  };

  const commitDrag = (pointerId?: number, clientX?: number, clientY?: number) => {
    const dragState = dragStateRef.current;
    if (!dragState || !dragState.isActive || (pointerId !== undefined && dragState.pointerId !== pointerId)) {
      return;
    }

    resetDragSession();

    const shouldCommitPosition =
      clientX !== undefined && clientY !== undefined ? onDragEnd?.(clientX, clientY) !== false : true;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const currentPosition = pendingPositionRef.current ?? livePositionRef.current;
    pendingPositionRef.current = null;

    if (!shouldCommitPosition) {
      return;
    }

    const resolvedPosition = resolveDropPosition?.(currentPosition.x, currentPosition.y) ?? currentPosition;
    livePositionRef.current = resolvedPosition;
    setPosition(resolvedPosition);

    if (resolvedPosition.x !== initialX || resolvedPosition.y !== initialY) {
      updateComponentPosition(id, resolvedPosition.x, resolvedPosition.y);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('input[type="range"], [data-no-drag="true"]')) {
      return;
    }

    const startPosition = { x: initialX, y: initialY };
    livePositionRef.current = startPosition;
    pendingPositionRef.current = null;
    setPosition(startPosition);

    event.stopPropagation();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: startPosition.x,
      startY: startPosition.y,
      isActive: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startClientX;
    const deltaY = event.clientY - dragState.startClientY;

    if (!dragState.isActive) {
      if (Math.hypot(deltaX, deltaY) < DRAG_START_THRESHOLD) {
        return;
      }

      dragState.isActive = true;
      setIsDragging(true);
      onDragStart?.();
    }

    event.stopPropagation();
    const safeScale = Math.max(scale, 0.001);
    pendingPositionRef.current = {
      x: dragState.startX + deltaX / safeScale,
      y: dragState.startY + deltaY / safeScale,
    };
    onDragMove?.(event.clientX, event.clientY);
    flushPendingPosition();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!dragState.isActive) {
      resetDragSession();
      return;
    }

    commitDrag(event.pointerId, event.clientX, event.clientY);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!dragState.isActive) {
      resetDragSession();
      return;
    }

    commitDrag(event.pointerId);
  };

  const displayedPosition = isDragging ? position : { x: initialX, y: initialY };

  return (
    <div
      className={`absolute touch-none select-none ${disabled ? '' : isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className ?? ''}`}
      style={{ left: displayedPosition.x, top: displayedPosition.y }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      data-draggable-node-id={id}
    >
      {children}
    </div>
  );
}

