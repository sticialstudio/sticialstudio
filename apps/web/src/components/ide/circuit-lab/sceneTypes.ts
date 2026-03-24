import type { ComponentData, NetData } from '@/contexts/CircuitContext';
import type { CircuitPinType, ComponentDefinition } from '@/lib/wiring/componentDefinitions';
import type { Point, Size } from '@/lib/wiring/componentGeometry';
import type { MountFootprintClass, MountedPinAssignment } from '@/lib/wiring/mountingTypes';

export type CanvasPinKind = 'board' | 'breadboard' | 'component';

export interface ViewportBounds {
  width: number;
  height: number;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface WorldPinNode {
  id: string;
  componentId?: string;
  pinId?: string;
  kind: CanvasPinKind;
  type: CircuitPinType | 'breadboard';
  label: string;
  shortLabel: string;
  position: Point;
}

export interface WorldComponentNode {
  id: string;
  component: ComponentData;
  definition: ComponentDefinition;
  position: Point;
  rotation: number;
  size: Size;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  pins: WorldPinNode[];
  isPowered: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isDragging: boolean;
}

export interface WireHandleNode {
  id: string;
  wireId: string;
  position: Point;
  axis: 'x' | 'y';
  segmentIndex: number;
}

export interface WorldWireNode {
  id: string;
  net: NetData;
  fromPinId: string;
  toPinId: string;
  color: string;
  points: Point[];
  waypoints: Point[];
  bendHandles: WireHandleNode[];
  isActive: boolean;
  isHovered: boolean;
  isSelected: boolean;
}

export interface SceneGraph {
  components: WorldComponentNode[];
  pins: WorldPinNode[];
  wires: WorldWireNode[];
  componentById: Record<string, WorldComponentNode>;
  pinById: Record<string, WorldPinNode>;
  wireById: Record<string, WorldWireNode>;
}

export interface WireDraftState {
  fromPinId: string;
  start: Point;
  current: Point;
  targetPinId: string | null;
  points: Point[];
}

export interface MountPreviewState {
  componentId: string;
  footprintClass: MountFootprintClass;
  position: Point;
  rawPosition: Point;
  size: Size;
  rotation: number;
  matchedAnchors: Point[];
  isValid: boolean;
  reason?: string;
  mappedPins?: MountedPinAssignment[];
}

export type HitResult =
  | { type: 'pin'; pin: WorldPinNode }
  | { type: 'wire-handle'; handle: WireHandleNode }
  | { type: 'wire-segment'; wire: WorldWireNode; segmentIndex: number; point: Point }
  | { type: 'component'; component: WorldComponentNode }
  | { type: 'wire'; wire: WorldWireNode }
  | null;
