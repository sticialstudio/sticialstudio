import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point } from './types';

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

interface PanSession {
  clientStart: Point;
  origin: Point;
}

export function useCanvasViewport(initialTransform: CanvasTransform = { x: 0, y: 0, scale: 0.85 }) {
  const [transform, setTransform] = useState<CanvasTransform>(initialTransform);
  const [isPanning, setIsPanning] = useState(false);

  const frameRef = useRef<number | null>(null);
  const pendingTransformRef = useRef<CanvasTransform>(initialTransform);
  const panSessionRef = useRef<PanSession | null>(null);

  useEffect(() => {
    pendingTransformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const commitTransform = useCallback((nextTransform: CanvasTransform) => {
    pendingTransformRef.current = nextTransform;
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setTransform(pendingTransformRef.current);
    });
  }, []);

  const beginPan = useCallback((clientX: number, clientY: number) => {
    panSessionRef.current = {
      clientStart: { x: clientX, y: clientY },
      origin: { x: pendingTransformRef.current.x, y: pendingTransformRef.current.y },
    };
    setIsPanning(true);
  }, []);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!panSessionRef.current) {
      return;
    }

    const { clientStart, origin } = panSessionRef.current;
    commitTransform({
      ...pendingTransformRef.current,
      x: origin.x + (clientX - clientStart.x),
      y: origin.y + (clientY - clientStart.y),
    });
  }, [commitTransform]);

  const endPan = useCallback(() => {
    panSessionRef.current = null;
    setIsPanning(false);
  }, []);

  const zoomAt = useCallback(
    (deltaY: number, clientX: number, clientY: number, bounds: DOMRect) => {
      const current = pendingTransformRef.current;
      const scaleFactor = deltaY > 0 ? 0.92 : 1.08;
      const nextScale = Math.max(0.35, Math.min(2.4, current.scale * scaleFactor));
      const pointerX = clientX - bounds.left;
      const pointerY = clientY - bounds.top;
      const worldX = (pointerX - current.x) / current.scale;
      const worldY = (pointerY - current.y) / current.scale;

      commitTransform({
        scale: nextScale,
        x: pointerX - worldX * nextScale,
        y: pointerY - worldY * nextScale,
      });
    },
    [commitTransform]
  );

  return {
    transform,
    isPanning,
    setTransform,
    beginPan,
    updatePan,
    endPan,
    zoomAt,
  };
}
