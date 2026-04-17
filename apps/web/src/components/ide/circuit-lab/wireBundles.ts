import type { Point } from '@/lib/wiring/componentGeometry';
import { applyOffsetToRoute, calculateWireOffsets, type AdapterWireRoute } from '@/vendor/velxio-adapter';

interface RouteWire extends AdapterWireRoute {
  points: Point[];
}

export function calculateRenderedWirePoints(wires: RouteWire[]) {
  const offsets = calculateWireOffsets(wires);
  const renderedPoints = new Map<string, Point[]>();

  wires.forEach((wire) => {
    renderedPoints.set(wire.id, applyOffsetToRoute(wire.points, offsets.get(wire.id) ?? 0));
  });

  return renderedPoints;
}
