import type { Point } from '@/lib/wiring/componentGeometry';

import type { HitResult, SceneGraph, WorldComponentNode, WorldPinNode, WorldWireNode } from './sceneTypes';

function toWorldRadius(scale: number, pixels: number) {
  return pixels / Math.max(scale, 0.35);
}

function isPointInsideComponent(worldPoint: Point, component: WorldComponentNode) {
  const centerX = component.position.x + component.size.width / 2;
  const centerY = component.position.y + component.size.height / 2;
  const dx = worldPoint.x - centerX;
  const dy = worldPoint.y - centerY;
  const radians = (-component.rotation * Math.PI) / 180;
  const localX = dx * Math.cos(radians) - dy * Math.sin(radians) + component.size.width / 2;
  const localY = dx * Math.sin(radians) + dy * Math.cos(radians) + component.size.height / 2;

  return localX >= 0 && localX <= component.size.width && localY >= 0 && localY <= component.size.height;
}

function getPinHitPixels(pin: WorldPinNode, strict: boolean) {
  if (pin.kind === 'breadboard') {
    return strict ? 9 : 13;
  }

  if (pin.kind === 'board') {
    return strict ? 8 : 12;
  }

  if (pin.isMounted) {
    return strict ? 6 : 8;
  }

  return strict ? 7 : 10;
}

function hitTestPins(scene: SceneGraph, worldPoint: Point, scale: number, strict = false): HitResult {
  let closestDistance = Number.POSITIVE_INFINITY;
  let closestPin = null as HitResult;

  scene.pins.forEach((pin) => {
    const radius = toWorldRadius(scale, getPinHitPixels(pin, strict));
    const distance = Math.hypot(pin.position.x - worldPoint.x, pin.position.y - worldPoint.y);
    if (distance <= radius && distance < closestDistance) {
      closestDistance = distance;
      closestPin = { type: 'pin', pin };
    }
  });

  return closestPin;
}

function hitTestWireHandles(wire: WorldWireNode | null, worldPoint: Point, scale: number): HitResult {
  if (!wire) return null;

  const radius = toWorldRadius(scale, 12);
  for (const handle of wire.bendHandles) {
    if (Math.hypot(handle.position.x - worldPoint.x, handle.position.y - worldPoint.y) <= radius) {
      return { type: 'wire-handle', handle };
    }
  }

  return null;
}

function hitTestComponents(scene: SceneGraph, worldPoint: Point): HitResult {
  const components = [...scene.components].reverse();
  for (const component of components) {
    if (isPointInsideComponent(worldPoint, component)) {
      return { type: 'component', component };
    }
  }

  return null;
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return { distance: Math.hypot(point.x - start.x, point.y - start.y), projection: start };
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const projection = { x: start.x + t * dx, y: start.y + t * dy };
  return { distance: Math.hypot(point.x - projection.x, point.y - projection.y), projection };
}

function hitTestWires(scene: SceneGraph, worldPoint: Point, scale: number): HitResult {
  const tolerance = toWorldRadius(scale, 10);
  let closest: HitResult = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  scene.wires.forEach((wire) => {
    if (wire.points.length < 2) return;

    for (let index = 0; index < wire.points.length - 1; index += 1) {
      const result = distanceToSegment(worldPoint, wire.points[index], wire.points[index + 1]);
      if (result.distance <= tolerance && result.distance < closestDistance) {
        closestDistance = result.distance;
        closest = { type: 'wire-segment', wire, segmentIndex: index, point: result.projection };
      }
    }
  });

  return closest;
}

export function hitTestScene(
  scene: SceneGraph,
  worldPoint: Point,
  scale: number,
  selectedWire: WorldWireNode | null,
  selectedComponentId: string | null = null
) {
  const precisePinHit = hitTestPins(scene, worldPoint, scale, true);
  if (precisePinHit) {
    return precisePinHit;
  }

  const selectedComponentHit = selectedComponentId ? hitTestComponents({ ...scene, components: scene.components.filter((component) => component.id === selectedComponentId) }, worldPoint) : null;

  return (
    hitTestWireHandles(selectedWire, worldPoint, scale) ||
    selectedComponentHit ||
    hitTestComponents(scene, worldPoint) ||
    hitTestPins(scene, worldPoint, scale, false) ||
    hitTestWires(scene, worldPoint, scale)
  );
}