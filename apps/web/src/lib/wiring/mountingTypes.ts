export type BreadboardZone = 'strip-top' | 'strip-bottom' | 'rail-top' | 'rail-bottom';
export type BreadboardSegment = 'left' | 'right' | 'full';

export type MountFootprintClass = 'breadboard-mountable' | 'freeform' | 'board' | 'module';

export interface FootprintPin {
  id: string;
  dx: number;
  dy: number;
  allowedZones?: BreadboardZone[];
  allowSharedNode?: boolean;
}

export interface ComponentFootprint {
  type: MountFootprintClass;
  pins: FootprintPin[];
  referencePinId?: string;
  requiresTrenchCrossing?: boolean;
  minColumnSpan?: number;
  allowedZones?: BreadboardZone[];
  supportedRotations?: number[];
}

export interface MountedPinAssignment {
  pinId: string;
  nodeId: string;
}

export interface BreadboardContinuityHighlight {
  id: string;
  kind: 'rail' | 'strip';
  zone: BreadboardZone;
  segment: BreadboardSegment;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MountedPlacement {
  componentId: string;
  mounted: true;
  footprintType: MountFootprintClass;
  rotation: number;
  pinMap: MountedPinAssignment[];
}

export type BreadboardOccupancy = Record<
  string,
  {
    componentId: string;
    pinId: string;
  }
>;

export interface MountValidationResult {
  valid: boolean;
  reason?: string;
  mappedPins?: MountedPinAssignment[];
}
