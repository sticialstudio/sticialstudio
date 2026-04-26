import type { Point } from '@/lib/wiring/componentGeometry';

export interface AdapterWireRoute {
  id: string;
  points: Point[];
}

interface RouteSegment {
  wireId: string;
  isVertical: boolean;
  start: Point;
  end: Point;
  centerLine: number;
}

const WIRE_SPACING = 8;
const OVERLAP_TOLERANCE = 0.5;

function extractSegments(route: AdapterWireRoute): RouteSegment[] {
  const segments: RouteSegment[] = [];

  for (let index = 0; index < route.points.length - 1; index += 1) {
    const start = route.points[index];
    const end = route.points[index + 1];
    const isVertical = Math.abs(end.x - start.x) < Math.abs(end.y - start.y);
    segments.push({
      wireId: route.id,
      isVertical,
      start,
      end,
      centerLine: isVertical ? start.x : start.y,
    });
  }

  return segments;
}

function segmentsOverlap(left: RouteSegment, right: RouteSegment) {
  if (left.isVertical !== right.isVertical) {
    return false;
  }

  if (Math.abs(left.centerLine - right.centerLine) > OVERLAP_TOLERANCE) {
    return false;
  }

  if (left.isVertical) {
    const leftMin = Math.min(left.start.y, left.end.y);
    const leftMax = Math.max(left.start.y, left.end.y);
    const rightMin = Math.min(right.start.y, right.end.y);
    const rightMax = Math.max(right.start.y, right.end.y);
    return !(leftMax < rightMin || rightMax < leftMin);
  }

  const leftMin = Math.min(left.start.x, left.end.x);
  const leftMax = Math.max(left.start.x, left.end.x);
  const rightMin = Math.min(right.start.x, right.end.x);
  const rightMax = Math.max(right.start.x, right.end.x);
  return !(leftMax < rightMin || rightMax < leftMin);
}

export function calculateWireOffsets(routes: AdapterWireRoute[]) {
  const offsets = new Map<string, number>();
  routes.forEach((route) => offsets.set(route.id, 0));

  const segments = routes.flatMap(extractSegments);
  const processed = new Set<number>();

  for (let index = 0; index < segments.length; index += 1) {
    if (processed.has(index)) {
      continue;
    }

    const group = [segments[index]];
    processed.add(index);

    for (let candidateIndex = index + 1; candidateIndex < segments.length; candidateIndex += 1) {
      if (processed.has(candidateIndex)) {
        continue;
      }

      if (group.some((segment) => segmentsOverlap(segment, segments[candidateIndex]))) {
        group.push(segments[candidateIndex]);
        processed.add(candidateIndex);
      }
    }

    const wireIds = [...new Set(group.map((segment) => segment.wireId))];
    if (wireIds.length <= 1) {
      continue;
    }

    wireIds.forEach((wireId, wireIndex) => {
      const offset = (wireIndex - (wireIds.length - 1) / 2) * WIRE_SPACING;
      const current = offsets.get(wireId) ?? 0;
      if (Math.abs(offset) > Math.abs(current)) {
        offsets.set(wireId, offset);
      }
    });
  }

  return offsets;
}

function simplifyRoute(points: Point[]) {
  const deduped = points.filter((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
  if (deduped.length <= 2) {
    return deduped;
  }

  const simplified: Point[] = [deduped[0]];
  for (let index = 1; index < deduped.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];
    const current = deduped[index];
    const next = deduped[index + 1];
    const sameVertical = previous.x === current.x && current.x === next.x;
    const sameHorizontal = previous.y === current.y && current.y === next.y;
    if (!sameVertical && !sameHorizontal) {
      simplified.push(current);
    }
  }
  simplified.push(deduped[deduped.length - 1]);
  return simplified;
}

export function applyOffsetToRoute(points: Point[], offset: number) {
  if (offset === 0 || points.length < 2) {
    return points;
  }

  const firstSegment = points[1];
  if (!firstSegment) {
    return points;
  }

  const isHorizontalFirst = Math.abs(firstSegment.x - points[0].x) >= Math.abs(firstSegment.y - points[0].y);
  const shiftedInterior = points.slice(1, -1).map((point) => ({
    x: isHorizontalFirst ? point.x : point.x + offset,
    y: isHorizontalFirst ? point.y + offset : point.y,
  }));

  const offsetStart = isHorizontalFirst
    ? { x: points[0].x, y: points[0].y + offset }
    : { x: points[0].x + offset, y: points[0].y };
  const endPoint = points[points.length - 1];
  const offsetEnd = isHorizontalFirst
    ? { x: endPoint.x, y: endPoint.y + offset }
    : { x: endPoint.x + offset, y: endPoint.y };

  const nextPoints: Point[] = [points[0]];
  if (offsetStart.x !== points[0].x || offsetStart.y !== points[0].y) {
    nextPoints.push(offsetStart);
  }
  nextPoints.push(...shiftedInterior);
  if (offsetEnd.x !== endPoint.x || offsetEnd.y !== endPoint.y) {
    nextPoints.push(offsetEnd);
  }
  nextPoints.push(endPoint);

  return simplifyRoute(nextPoints);
}
