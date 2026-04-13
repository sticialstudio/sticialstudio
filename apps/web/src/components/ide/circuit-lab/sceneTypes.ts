import type { ComponentData, NetData } from '@/contexts/CircuitContext';
import type { LogicalNetState } from '@/lib/simulator/simulationTypes';
import type { CircuitPinType, ComponentDefinition } from '@/lib/wiring/componentDefinitions';
import type { Point, Size } from '@/lib/wiring/componentGeometry';
import type { BreadboardSegment, BreadboardZone, BreadboardContinuityHighlight, MountFootprintClass, MountedPinAssignment } from '@/lib/wiring/mountingTypes';

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
  nodeId: string;
  componentId?: string;
  pinId?: string;
  kind: CanvasPinKind;
  isMounted?: boolean;
  type: CircuitPinType | 'breadboard';
  label: string;
  shortLabel: string;
  position: Point;
  signalState?: LogicalNetState | null;
  continuityGroupId?: string;
  continuityBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  continuityKind?: 'rail' | 'strip';
  continuitySegment?: BreadboardSegment;
  continuityZone?: BreadboardZone;
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
  axis: 'x' | 'y' | 'both';
  kind: 'elbow' | 'spine' | 'segment';
  waypointIndex: number;
  segmentIndex?: number;
}

export interface WorldWireNode {
  id: string;
  net: NetData;
  fromNodeId: string;
  toNodeId: string;
  fromAnchorId: string | null;
  toAnchorId: string | null;
  fromPoint: Point;
  toPoint: Point;
  color: string;
  points: Point[];
  waypoints: Point[];
  bendHandles: WireHandleNode[];
  isActive: boolean;
  isHovered: boolean;
  isSelected: boolean;
  signalState?: LogicalNetState | null;
}

export interface SceneGraph {
  components: WorldComponentNode[];
  pins: WorldPinNode[];
  wires: WorldWireNode[];
  componentById: Record<string, WorldComponentNode>;
  pinById: Record<string, WorldPinNode>;
  pinsByNodeId: Record<string, WorldPinNode[]>;
  wireById: Record<string, WorldWireNode>;
}

export interface WireDraftState {
  fromNodeId: string;
  fromPinId: string;
  fromPoint: Point;
  previewPoint: Point;
  hoveredTargetNodeId: string | null;
  hoveredTargetPinId: string | null;
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
  groupHighlights: BreadboardContinuityHighlight[];
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


