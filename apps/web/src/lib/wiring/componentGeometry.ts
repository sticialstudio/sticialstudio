import type { ComponentData } from '@/contexts/CircuitContext';
import type { ComponentDefinition } from '@/lib/wiring/componentDefinitions';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

type TransformableComponent = Pick<ComponentData, 'x' | 'y' | 'rotation'>;

export const NATIVE_DPI = 96;
export const WORKSPACE_DPI = 72;
export const WORKSPACE_SCALE = WORKSPACE_DPI / NATIVE_DPI;
export const WOKWI_SCALE = WORKSPACE_SCALE;
export const GRID_PITCH = 9.6 * WORKSPACE_SCALE;

export function rotatePoint(point: Point, center: Point, rotation: number): Point {
  const radians = (rotation * Math.PI) / 180;
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;

  return {
    x: center.x + translatedX * Math.cos(radians) - translatedY * Math.sin(radians),
    y: center.y + translatedX * Math.sin(radians) + translatedY * Math.cos(radians),
  };
}

export function scalePoint(point: Point, scale = WORKSPACE_SCALE): Point {
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

export function getRenderedSize(size: Size): Size {
  return {
    width: size.width * WORKSPACE_SCALE,
    height: size.height * WORKSPACE_SCALE,
  };
}

export function getComponentCenter(size: Size): Point {
  return {
    x: size.width / 2,
    y: size.height / 2,
  };
}

export function transformLocalPointToWorld(
  point: Point,
  size: Size,
  component: TransformableComponent
): Point {
  const scaledPoint = scalePoint(point);
  const scaledCenter = scalePoint(getComponentCenter(size));
  const rotatedPoint = rotatePoint(scaledPoint, scaledCenter, component.rotation || 0);

  return {
    x: component.x + rotatedPoint.x,
    y: component.y + rotatedPoint.y,
  };
}

export function getWorldAnchor(
  component: TransformableComponent,
  definitionOrSize: Pick<ComponentDefinition, 'size'> | Size,
  anchor: Point
): Point {
  const size = 'size' in definitionOrSize ? definitionOrSize.size : definitionOrSize;
  return transformLocalPointToWorld(anchor, size, component);
}

export function getComponentPinPosition(
  component: TransformableComponent,
  definition: ComponentDefinition,
  pinId: string
): Point | null {
  const pin = definition.pins.find((candidate) => candidate.id === pinId);
  if (!pin) {
    return null;
  }

  return getWorldAnchor(component, definition, pin.position);
}

export function getComponentWorldBounds(
  component: TransformableComponent,
  definition: Pick<ComponentDefinition, 'size'>
) {
  const corners = [
    getWorldAnchor(component, definition, { x: 0, y: 0 }),
    getWorldAnchor(component, definition, { x: definition.size.width, y: 0 }),
    getWorldAnchor(component, definition, { x: definition.size.width, y: definition.size.height }),
    getWorldAnchor(component, definition, { x: 0, y: definition.size.height }),
  ];

  return {
    minX: Math.min(...corners.map((corner) => corner.x)),
    minY: Math.min(...corners.map((corner) => corner.y)),
    maxX: Math.max(...corners.map((corner) => corner.x)),
    maxY: Math.max(...corners.map((corner) => corner.y)),
  };
}

export function snapPointToGrid(point: Point): Point {
  return {
    x: Math.round(point.x / GRID_PITCH) * GRID_PITCH,
    y: Math.round(point.y / GRID_PITCH) * GRID_PITCH,
  };
}
