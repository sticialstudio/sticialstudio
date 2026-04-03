export type CircuitTool = 'select' | 'wire' | 'delete' | 'rotate';

export type AnchorKind = 'board' | 'breadboard' | 'component';

export interface Point {
  x: number;
  y: number;
}

export interface CircuitAnchor {
  id: string;
  x: number;
  y: number;
  label: string;
  shortLabel: string;
  kind: AnchorKind;
  componentId?: string;
  pinId?: string;
}

export type ActiveWire = {
  from: CircuitAnchor;
  to: Point | CircuitAnchor;
  isPreview: boolean;
  waypoints?: Point[];
  targetId?: string | null;
};

export interface WirePreview {
  start: CircuitAnchor;
  end: Point;
  waypoints?: Point[];
  targetId?: string | null;
  isPreview?: boolean;
}
