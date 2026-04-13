import { GRID_PITCH, type Point } from '@/lib/wiring/componentGeometry';

import type { WireHandleNode } from './sceneTypes';

type EditableWireHandle = Pick<WireHandleNode, 'axis' | 'kind' | 'waypointIndex' | 'segmentIndex'>;

function snap(value: number) {
  return Math.round(value / GRID_PITCH) * GRID_PITCH;
}

function snapPoint(point: Point): Point {
  return {
    x: snap(point.x),
    y: snap(point.y),
  };
}

function nearlyEqual(left: number, right: number, tolerance = 0.5) {
  return Math.abs(left - right) <= tolerance;
}

function pointsEqual(a: Point, b: Point) {
  return nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y);
}

function simplifyRoutePoints(points: Point[]) {
  if (points.length <= 2) {
    return points;
  }

  const deduped: Point[] = [];
  points.forEach((point) => {
    if (deduped.length === 0 || !pointsEqual(deduped[deduped.length - 1], point)) {
      deduped.push(point);
    }
  });

  if (deduped.length <= 2) {
    return deduped;
  }

  const simplified: Point[] = [deduped[0]];
  for (let index = 1; index < deduped.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];
    const current = deduped[index];
    const next = deduped[index + 1];

    const sameVertical = nearlyEqual(previous.x, current.x) && nearlyEqual(current.x, next.x);
    const sameHorizontal = nearlyEqual(previous.y, current.y) && nearlyEqual(current.y, next.y);
    if (sameVertical || sameHorizontal) {
      continue;
    }

    simplified.push(current);
  }

  simplified.push(deduped[deduped.length - 1]);
  return simplified;
}

function orthogonalizeRoutePoints(points: Point[]) {
  if (points.length <= 1) {
    return points;
  }

  const orthogonal: Point[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = orthogonal[orthogonal.length - 1];

    if (pointsEqual(previous, point)) {
      continue;
    }

    const sameVertical = nearlyEqual(previous.x, point.x);
    const sameHorizontal = nearlyEqual(previous.y, point.y);

    if (sameVertical || sameHorizontal) {
      orthogonal.push(point);
      continue;
    }

    const dx = Math.abs(point.x - previous.x);
    const dy = Math.abs(point.y - previous.y);
    const bridge = dx >= dy
      ? { x: point.x, y: previous.y }
      : { x: previous.x, y: point.y };

    if (!pointsEqual(previous, bridge)) {
      orthogonal.push(bridge);
    }

    if (!pointsEqual(orthogonal[orthogonal.length - 1], point)) {
      orthogonal.push(point);
    }
  }

  return orthogonal;
}

function normalizeRoutePoints(start: Point, end: Point, path: Point[]) {
  const snappedPath = path.map(snapPoint);
  return simplifyRoutePoints(orthogonalizeRoutePoints([snapPoint(start), ...snappedPath, snapPoint(end)]));
}

function routeToWaypoints(start: Point, end: Point, route: Point[]) {
  const normalized = normalizeRoutePoints(start, end, route.slice(1, -1));
  return normalized.slice(1, -1);
}

function getSegmentAxis(start: Point, end: Point): 'x' | 'y' {
  return nearlyEqual(start.x, end.x) ? 'x' : 'y';
}

function getSegmentLength(start: Point, end: Point) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function moveSegmentHandle(start: Point, end: Point, waypoints: Point[], segmentIndex: number, nextPoint: Point) {
  const route = buildWireRoutePoints(start, end, waypoints);
  const segmentStart = route[segmentIndex];
  const segmentEnd = route[segmentIndex + 1];

  if (!segmentStart || !segmentEnd) {
    return normalizeWirePath(waypoints, start, end);
  }

  if (nearlyEqual(segmentStart.x, segmentEnd.x)) {
    const nextX = snap(nextPoint.x);
    return routeToWaypoints(start, end, [
      ...route.slice(0, segmentIndex + 1),
      { x: nextX, y: segmentStart.y },
      { x: nextX, y: segmentEnd.y },
      ...route.slice(segmentIndex + 1),
    ]);
  }

  const nextY = snap(nextPoint.y);
  return routeToWaypoints(start, end, [
    ...route.slice(0, segmentIndex + 1),
    { x: segmentStart.x, y: nextY },
    { x: segmentEnd.x, y: nextY },
    ...route.slice(segmentIndex + 1),
  ]);
}

export function normalizeWirePath(path: Point[], start: Point, end: Point) {
  return normalizeRoutePoints(start, end, path).slice(1, -1);
}

export function buildOrthogonalWaypoints(start: Point, end: Point, existingWaypoints: Point[] = []) {
  return normalizeWirePath(existingWaypoints, start, end);
}

export function buildWireRoutePoints(start: Point, end: Point, existingWaypoints: Point[] = []) {
  return normalizeRoutePoints(start, end, existingWaypoints);
}

export function getWireHandles(wireId: string, start: Point, end: Point, waypoints: Point[] = []): WireHandleNode[] {
  const route = buildWireRoutePoints(start, end, waypoints);
  const handles: WireHandleNode[] = [];

  for (let index = 0; index < route.length - 1; index += 1) {
    const segmentStart = route[index];
    const segmentEnd = route[index + 1];
    if (getSegmentLength(segmentStart, segmentEnd) < GRID_PITCH * 0.75) {
      continue;
    }

    handles.push({
      id: `${wireId}-segment-${index}`,
      wireId,
      position: {
        x: (segmentStart.x + segmentEnd.x) / 2,
        y: (segmentStart.y + segmentEnd.y) / 2,
      },
      axis: getSegmentAxis(segmentStart, segmentEnd),
      kind: 'segment',
      waypointIndex: -1,
      segmentIndex: index,
    });
  }

  return handles;
}

export function moveWireHandle(
  start: Point,
  end: Point,
  waypoints: Point[],
  handle: EditableWireHandle,
  nextPoint: Point
) {
  if (handle.kind === 'segment' && typeof handle.segmentIndex === 'number') {
    return moveSegmentHandle(start, end, waypoints, handle.segmentIndex, nextPoint);
  }

  return normalizeWirePath(waypoints, start, end);
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const segmentLengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (segmentLengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection =
    ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) /
    segmentLengthSquared;
  const clamped = Math.max(0, Math.min(1, projection));
  const projectedX = start.x + clamped * (end.x - start.x);
  const projectedY = start.y + clamped * (end.y - start.y);
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}

export function distanceToPolyline(point: Point, route: Point[]) {
  let closest = Number.POSITIVE_INFINITY;

  for (let index = 0; index < route.length - 1; index += 1) {
    closest = Math.min(closest, distanceToSegment(point, route[index], route[index + 1]));
  }

  return closest;
}
