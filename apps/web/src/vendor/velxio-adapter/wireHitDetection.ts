import type { Point } from '@/lib/wiring/componentGeometry';

export interface RenderedSegment {
  start: Point;
  end: Point;
  axis: 'horizontal' | 'vertical';
  segmentIndex: number;
}

export interface SegmentHit {
  segmentIndex: number;
  distance: number;
  projection: Point;
}

export function getRenderedSegments(points: Point[]): RenderedSegment[] {
  const segments: RenderedSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    segments.push({
      start,
      end,
      axis: start.y === end.y ? 'horizontal' : 'vertical',
      segmentIndex: index,
    });
  }

  return segments;
}

export function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return { distance: Math.hypot(point.x - start.x, point.y - start.y), projection: start };
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return {
    distance: Math.hypot(point.x - projection.x, point.y - projection.y),
    projection,
  };
}

export function findClosestSegmentHit(points: Point[], worldPoint: Point, threshold: number): SegmentHit | null {
  let closest: SegmentHit | null = null;

  getRenderedSegments(points).forEach((segment) => {
    const result = distanceToSegment(worldPoint, segment.start, segment.end);
    if (result.distance > threshold) {
      return;
    }

    if (!closest || result.distance < closest.distance) {
      closest = {
        segmentIndex: segment.segmentIndex,
        distance: result.distance,
        projection: result.projection,
      };
    }
  });

  return closest;
}

export function distanceToPolyline(point: Point, points: Point[]) {
  const hit = findClosestSegmentHit(points, point, Number.POSITIVE_INFINITY);
  return hit?.distance ?? Number.POSITIVE_INFINITY;
}
