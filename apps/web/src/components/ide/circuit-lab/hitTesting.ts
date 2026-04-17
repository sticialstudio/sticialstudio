import type { Point } from '@/lib/wiring/componentGeometry';
import { findClosestSegmentHit } from '@/vendor/velxio-adapter';

import type { HitResult, SceneGraph, WorldComponentNode, WorldPinNode, WorldWireNode } from './sceneTypes';

export type WireIntentAxis = 'horizontal' | 'vertical' | 'free';
export type WireTargetLockState = 'candidate' | 'locked';

export interface BiasedPinTargetOptions {
  excludeNodeId?: string;
  sourcePinId?: string | null;
  sourcePoint?: Point | null;
  previousTargetPinId?: string | null;
}

export interface BiasedPinTargetResult {
  pin: WorldPinNode;
  axis: WireIntentAxis;
  crowded: boolean;
  lockState: WireTargetLockState;
}

function toWorldRadius(scale: number, pixels: number) {
  return pixels / Math.max(scale, 0.35);
}

function toPixels(scale: number, worldDistance: number) {
  return worldDistance * Math.max(scale, 0.35);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
    return strict ? 8 : 11.5;
  }

  if (pin.kind === 'board') {
    return strict ? 7.5 : 10.5;
  }

  if (pin.isMounted) {
    return strict ? 5.75 : 7.75;
  }

  return strict ? 6.5 : 8.75;
}

function getDenseAreaCount(scene: SceneGraph, worldPoint: Point, scale: number) {
  const radius = toWorldRadius(scale, 24);
  let count = 0;

  scene.pins.forEach((pin) => {
    if (Math.hypot(pin.position.x - worldPoint.x, pin.position.y - worldPoint.y) <= radius) {
      count += 1;
    }
  });

  return count;
}

function hitTestPins(scene: SceneGraph, worldPoint: Point, scale: number, strict = false): HitResult {
  let closestDistance = Number.POSITIVE_INFINITY;
  let closestPin = null as HitResult;
  const denseAreaCount = getDenseAreaCount(scene, worldPoint, scale);
  const densityBoost = denseAreaCount >= 3 ? (strict ? 0.75 : 1.8) : 0;

  scene.pins.forEach((pin) => {
    const radius = toWorldRadius(scale, getPinHitPixels(pin, strict) + densityBoost);
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

  for (const handle of wire.bendHandles) {
    const handlePixels =
      handle.kind === 'endpoint'
        ? 10.5
        : handle.kind === 'elbow'
          ? 9.5
          : 10;
    const radius = toWorldRadius(scale, handlePixels);
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

function hitTestWires(scene: SceneGraph, worldPoint: Point, scale: number): HitResult {
  const tolerance = toWorldRadius(scale, 11.5);
  let closest: HitResult = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  scene.wires.forEach((wire) => {
    const segmentHit = findClosestSegmentHit(wire.interactionPoints, worldPoint, tolerance);
    if (!segmentHit || segmentHit.distance >= closestDistance) {
      return;
    }

    closestDistance = segmentHit.distance;
    closest = {
      type: 'wire-segment',
      wire,
      segmentIndex: segmentHit.segmentIndex,
      point: segmentHit.projection,
    };
  });

  return closest;
}

function getWireIntentAxis(sourcePoint: Point | null | undefined, worldPoint: Point, scale: number): WireIntentAxis {
  if (!sourcePoint) {
    return 'free';
  }

  const dx = Math.abs(toPixels(scale, worldPoint.x - sourcePoint.x));
  const dy = Math.abs(toPixels(scale, worldPoint.y - sourcePoint.y));

  if (dx > dy * 1.2) {
    return 'horizontal';
  }

  if (dy > dx * 1.2) {
    return 'vertical';
  }

  return 'free';
}

export function resolveBiasedPinTarget(
  scene: SceneGraph,
  worldPoint: Point,
  scale: number,
  options: BiasedPinTargetOptions = {}
): BiasedPinTargetResult | null {
  const sourcePin = options.sourcePinId ? scene.pinById[options.sourcePinId] : null;
  const axis = getWireIntentAxis(options.sourcePoint ?? null, worldPoint, scale);
  const coarseCandidates = scene.pins
    .filter((pin) => pin.nodeId !== options.excludeNodeId)
    .map((pin) => ({
      pin,
      distancePx: toPixels(scale, Math.hypot(pin.position.x - worldPoint.x, pin.position.y - worldPoint.y)),
    }))
    .filter((candidate) => candidate.distancePx <= 28);

  if (coarseCandidates.length === 0) {
    return null;
  }

  const crowded = coarseCandidates.length >= 3;
  const searchRadiusPx = 14.5 + Math.min(Math.max(coarseCandidates.length - 1, 0), 4) * (crowded ? 2.1 : 1.25);

  const candidates = coarseCandidates
    .filter((candidate) => {
      if (candidate.distancePx <= searchRadiusPx) {
        return true;
      }

      return options.previousTargetPinId === candidate.pin.id && candidate.distancePx <= searchRadiusPx + 4;
    })
    .map((candidate) => {
      let score = 180 - candidate.distancePx * 7.2;

      if (options.previousTargetPinId === candidate.pin.id) {
        score += crowded ? 28 : 18;
      }

      if (options.sourcePoint) {
        if (axis === 'horizontal') {
          const alignmentPx = toPixels(scale, Math.abs(candidate.pin.position.y - options.sourcePoint.y));
          score += clamp(24 - alignmentPx * 1.45, -10, 24);
        } else if (axis === 'vertical') {
          const alignmentPx = toPixels(scale, Math.abs(candidate.pin.position.x - options.sourcePoint.x));
          score += clamp(24 - alignmentPx * 1.45, -10, 24);
        }
      }

      if (sourcePin) {
        if (sourcePin.kind === candidate.pin.kind) {
          score += 4;
        }

        if (sourcePin.kind === 'breadboard' && candidate.pin.kind === 'breadboard') {
          if (sourcePin.continuityKind && sourcePin.continuityKind === candidate.pin.continuityKind) {
            score += 5;
          }
          if (sourcePin.continuityZone && sourcePin.continuityZone === candidate.pin.continuityZone) {
            score += 8;
          }
          if (sourcePin.continuitySegment && sourcePin.continuitySegment === candidate.pin.continuitySegment) {
            score += 3;
          }
        }
      }

      return {
        ...candidate,
        score,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.distancePx - right.distancePx;
    });

  const best = candidates[0];
  if (!best) {
    return null;
  }

  const second = candidates[1];
  const scoreGap = second ? best.score - second.score : Number.POSITIVE_INFINITY;
  const stickyLock = options.previousTargetPinId === best.pin.id && best.distancePx <= searchRadiusPx * 0.88;
  const lockState: WireTargetLockState =
    stickyLock || best.distancePx <= (crowded ? 10.5 : 8.5) || scoreGap >= (crowded ? 11 : 16)
      ? 'locked'
      : 'candidate';

  return {
    pin: best.pin,
    axis,
    crowded,
    lockState,
  };
}

export function hitTestScene(
  scene: SceneGraph,
  worldPoint: Point,
  scale: number,
  selectedWire: WorldWireNode | null,
  selectedComponentId: string | null = null
) {
  const selectedWireHandleHit = hitTestWireHandles(selectedWire, worldPoint, scale);
  if (selectedWireHandleHit) {
    return selectedWireHandleHit;
  }

  const precisePinHit = hitTestPins(scene, worldPoint, scale, true);
  if (precisePinHit) {
    return precisePinHit;
  }

  const selectedComponentHit = selectedComponentId
    ? hitTestComponents({ ...scene, components: scene.components.filter((component) => component.id === selectedComponentId) }, worldPoint)
    : null;

  return (
    selectedComponentHit ||
    hitTestComponents(scene, worldPoint) ||
    hitTestPins(scene, worldPoint, scale, false) ||
    hitTestWires(scene, worldPoint, scale)
  );
}
