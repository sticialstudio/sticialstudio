import type { ComponentData } from '@/contexts/CircuitContext';
import {
  getBreadboardContinuityGroups,
  getBreadboardNodeEntries,
  getBreadboardZoneForEntry,
  type BreadboardContinuityGroup,
  type BreadboardNodeEntry,
} from '@/lib/wiring/breadboardModel';
import {
  getComponentDefinition,
  normalizeComponentType,
  type ComponentDefinition,
} from '@/lib/wiring/componentDefinitions';
import {
  GRID_PITCH,
  getWorldAnchor,
  type Point,
} from '@/lib/wiring/componentGeometry';
import type {
  BreadboardContinuityHighlight,
  BreadboardOccupancy,
  ComponentFootprint,
  MountedPinAssignment,
  MountedPlacement,
  MountFootprintClass,
  MountValidationResult,
} from '@/lib/wiring/mountingTypes';

const PIN_SNAP_THRESHOLD = GRID_PITCH * 0.66;
const REFERENCE_NODE_SEARCH_RADIUS = GRID_PITCH * 2.1;
const PREVIEW_ACTIVATION_RADIUS = GRID_PITCH * 3.65;
const MAX_REFERENCE_CANDIDATES = 24;

interface CandidatePlacement {
  x: number;
  y: number;
  rotation: number;
}

interface BreadboardWorldNode extends BreadboardNodeEntry {
  position: Point;
}

interface BreadboardWorldGroup extends Omit<BreadboardContinuityGroup, 'bounds'> {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BreadboardState {
  breadboardId: string;
  nodes: BreadboardWorldNode[];
  nodeById: Record<string, BreadboardWorldNode>;
  groups: BreadboardWorldGroup[];
  groupById: Record<string, BreadboardWorldGroup>;
  occupancy: BreadboardOccupancy;
}

export interface BreadboardMountPreview extends MountValidationResult {
  footprintClass: MountFootprintClass;
  position: Point;
  rawPosition: Point;
  matchedAnchors: Point[];
  groupHighlights: BreadboardContinuityHighlight[];
  totalError: number;
  isValid: boolean;
}

interface MountCandidateResult extends MountValidationResult {
  position: Point;
  matchedAnchors: Point[];
  matchedNodes: BreadboardWorldNode[];
  groupHighlights: BreadboardContinuityHighlight[];
  totalError: number;
  matchedCount: number;
}

function roundToHundredth(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeRotation(rotation: number) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getDefinitionFootprint(definition: ComponentDefinition): ComponentFootprint | null {
  if (definition.footprint) {
    return definition.footprint;
  }

  if (definition.mountStyle === 'breadboard') {
    return {
      type: 'breadboard-mountable',
      referencePinId: definition.pins[0]?.id,
      pins: definition.pins.map((pin) => ({
        id: pin.id,
        dx: pin.position.x - (definition.pins[0]?.position.x ?? pin.position.x),
        dy: pin.position.y - (definition.pins[0]?.position.y ?? pin.position.y),
      })),
    };
  }

  return null;
}

export function getFootprintClass(definition: ComponentDefinition): MountFootprintClass {
  const footprint = getDefinitionFootprint(definition);
  if (footprint) {
    return footprint.type;
  }

  switch (normalizeComponentType(definition.id)) {
    case 'BREADBOARD':
    case 'ARDUINO_UNO':
      return 'board';
    default:
      return definition.mountStyle === 'breadboard' ? 'breadboard-mountable' : 'freeform';
  }
}

export function canMountToBreadboard(definition: ComponentDefinition) {
  const footprint = getDefinitionFootprint(definition);
  if (!footprint) {
    return false;
  }

  return (
    (footprint.type === 'breadboard-mountable' || footprint.type === 'module') && footprint.pins.length > 0
  );
}

function isRotationSupported(footprint: ComponentFootprint, rotation: number) {
  if (!footprint.supportedRotations || footprint.supportedRotations.length === 0) {
    return true;
  }

  return footprint.supportedRotations.includes(normalizeRotation(rotation));
}

function zoneAllowed(node: BreadboardWorldNode, footprint: ComponentFootprint, pinId: string) {
  const footprintPin = footprint.pins.find((candidate) => candidate.id === pinId);
  const allowedZones = footprintPin?.allowedZones ?? footprint.allowedZones;
  return !allowedZones || allowedZones.includes(node.zone);
}

function findNearestNode(
  point: Point,
  nodes: BreadboardWorldNode[],
  footprint: ComponentFootprint,
  pinId: string,
  usedNodeIds: Set<string>
) {
  let closest: { node: BreadboardWorldNode; distance: number } | null = null;
  const footprintPin = footprint.pins.find((candidate) => candidate.id === pinId);

  for (const node of nodes) {
    if (!zoneAllowed(node, footprint, pinId)) {
      continue;
    }

    if (usedNodeIds.has(node.nodeId) && !footprintPin?.allowSharedNode) {
      continue;
    }

    const distance = distanceBetween(point, node.position);
    if (!closest || distance < closest.distance) {
      closest = { node, distance };
    }
  }

  return closest;
}

function buildNodeLookup(nodes: BreadboardWorldNode[]) {
  return nodes.reduce<Record<string, BreadboardWorldNode>>((lookup, node) => {
    lookup[node.nodeId] = node;
    return lookup;
  }, {});
}

function buildGroupLookup(groups: BreadboardWorldGroup[]) {
  return groups.reduce<Record<string, BreadboardWorldGroup>>((lookup, group) => {
    lookup[group.id] = group;
    return lookup;
  }, {});
}

function toWorldBounds(
  breadboard: Pick<ComponentData, 'x' | 'y' | 'rotation'>,
  definition: ComponentDefinition,
  bounds: BreadboardContinuityGroup['bounds']
) {
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ].map((point) => getWorldAnchor(breadboard, definition, point));

  const minX = Math.min(...corners.map((point) => point.x));
  const maxX = Math.max(...corners.map((point) => point.x));
  const minY = Math.min(...corners.map((point) => point.y));
  const maxY = Math.max(...corners.map((point) => point.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function createBreadboardWorldNodes(components: ComponentData[]) {
  const breadboard = components.find((component) => normalizeComponentType(component.type) === 'BREADBOARD');
  const definition = breadboard ? getComponentDefinition(breadboard.type) : null;
  if (!breadboard || !definition) {
    return null;
  }

  const nodes = getBreadboardNodeEntries().map((entry) => ({
    ...entry,
    zone: entry.zone ?? getBreadboardZoneForEntry(entry),
    position: getWorldAnchor(breadboard, definition, { x: entry.x, y: entry.y }),
  }));

  const groups = getBreadboardContinuityGroups().map((group) => ({
    ...group,
    bounds: toWorldBounds(breadboard, definition, group.bounds),
  }));

  return {
    breadboardId: breadboard.id,
    nodes,
    nodeById: buildNodeLookup(nodes),
    groups,
    groupById: buildGroupLookup(groups),
  };
}

export function buildBreadboardOccupancy(
  components: ComponentData[],
  excludeComponentId?: string
): BreadboardOccupancy {
  return components.reduce<BreadboardOccupancy>((occupancy, component) => {
    if (component.id === excludeComponentId || !component.mountedPlacement?.mounted) {
      return occupancy;
    }

    component.mountedPlacement.pinMap.forEach((mapping) => {
      occupancy[mapping.nodeId] = {
        componentId: component.id,
        pinId: mapping.pinId,
      };
    });

    return occupancy;
  }, {});
}

export function buildBreadboardState(
  components: ComponentData[],
  excludeComponentId?: string
): BreadboardState | null {
  const worldNodes = createBreadboardWorldNodes(components);
  if (!worldNodes) {
    return null;
  }

  return {
    ...worldNodes,
    occupancy: buildBreadboardOccupancy(components, excludeComponentId),
  };
}

function scoreInvalidCandidate(left: MountCandidateResult | null, right: MountCandidateResult) {
  if (!left) {
    return right;
  }

  if (right.matchedCount !== left.matchedCount) {
    return right.matchedCount > left.matchedCount ? right : left;
  }

  return right.totalError < left.totalError ? right : left;
}

function buildGroupHighlights(
  breadboardState: BreadboardState,
  matchedNodes: BreadboardWorldNode[]
): BreadboardContinuityHighlight[] {
  const seen = new Set<string>();

  return matchedNodes.reduce<BreadboardContinuityHighlight[]>((highlights, node) => {
    if (seen.has(node.continuityGroupId)) {
      return highlights;
    }

    const group = breadboardState.groupById[node.continuityGroupId];
    if (!group) {
      return highlights;
    }

    seen.add(group.id);
    highlights.push({
      id: group.id,
      kind: group.kind,
      zone: group.zone,
      segment: group.segment,
      bounds: group.bounds,
    });

    return highlights;
  }, []);
}

function createCandidateResult(
  breadboardState: BreadboardState,
  candidatePlacement: CandidatePlacement,
  matchedNodes: BreadboardWorldNode[],
  matchedAnchors: Point[],
  totalError: number,
  valid: boolean,
  reason?: string,
  mappedPins?: MountedPinAssignment[]
): MountCandidateResult {
  return {
    valid,
    reason,
    mappedPins,
    position: { x: candidatePlacement.x, y: candidatePlacement.y },
    matchedAnchors,
    matchedNodes,
    groupHighlights: buildGroupHighlights(breadboardState, matchedNodes),
    totalError,
    matchedCount: matchedNodes.length,
  };
}

function assessCandidate(
  component: Pick<ComponentData, 'id' | 'type'>,
  definition: ComponentDefinition,
  footprint: ComponentFootprint,
  candidatePlacement: CandidatePlacement,
  breadboardState: BreadboardState
): MountCandidateResult {
  const normalizedRotation = normalizeRotation(candidatePlacement.rotation);
  const componentFrame = {
    x: candidatePlacement.x,
    y: candidatePlacement.y,
    rotation: normalizedRotation,
  };

  const usedNodeIds = new Set<string>();
  const mappedPins: MountedPinAssignment[] = [];
  const matchedAnchors: Point[] = [];
  const matchedNodes: BreadboardWorldNode[] = [];
  let totalError = 0;

  for (const footprintPin of footprint.pins) {
    const pinDefinition = definition.pins.find((pin) => pin.id === footprintPin.id);
    if (!pinDefinition) {
      return createCandidateResult(
        breadboardState,
        candidatePlacement,
        matchedNodes,
        matchedAnchors,
        totalError,
        false,
        `Missing pin definition for ${footprintPin.id}`,
        mappedPins
      );
    }

    const projectedWorldPoint = getWorldAnchor(componentFrame, definition, pinDefinition.position);
    const nearest = findNearestNode(projectedWorldPoint, breadboardState.nodes, footprint, footprintPin.id, usedNodeIds);

    if (!nearest || nearest.distance > PIN_SNAP_THRESHOLD) {
      return createCandidateResult(
        breadboardState,
        candidatePlacement,
        matchedNodes,
        matchedAnchors,
        totalError + (nearest?.distance ?? PREVIEW_ACTIVATION_RADIUS),
        false,
        `Pin ${footprintPin.id} is not aligned to a valid breadboard hole`,
        mappedPins
      );
    }

    const occupiedBy = breadboardState.occupancy[nearest.node.nodeId];
    if (occupiedBy && occupiedBy.componentId !== component.id) {
      return createCandidateResult(
        breadboardState,
        candidatePlacement,
        [...matchedNodes, nearest.node],
        [...matchedAnchors, nearest.node.position],
        totalError + nearest.distance,
        false,
        `Hole ${nearest.node.row}${nearest.node.column} is already occupied`,
        mappedPins
      );
    }

    if (usedNodeIds.has(nearest.node.nodeId) && !footprintPin.allowSharedNode) {
      return createCandidateResult(
        breadboardState,
        candidatePlacement,
        [...matchedNodes, nearest.node],
        [...matchedAnchors, nearest.node.position],
        totalError + nearest.distance,
        false,
        `Multiple pins cannot share hole ${nearest.node.row}${nearest.node.column}`,
        mappedPins
      );
    }

    usedNodeIds.add(nearest.node.nodeId);
    totalError += nearest.distance;
    matchedAnchors.push(nearest.node.position);
    matchedNodes.push(nearest.node);
    mappedPins.push({
      pinId: footprintPin.id,
      nodeId: nearest.node.nodeId,
    });
  }

  const minColumn = Math.min(...matchedNodes.map((node) => node.column));
  const maxColumn = Math.max(...matchedNodes.map((node) => node.column));
  const zones = new Set(matchedNodes.map((node) => node.zone));

  if (footprint.minColumnSpan !== undefined && maxColumn - minColumn < footprint.minColumnSpan) {
    return createCandidateResult(
      breadboardState,
      candidatePlacement,
      matchedNodes,
      matchedAnchors,
      totalError,
      false,
      `Component must span at least ${footprint.minColumnSpan + 1} holes`,
      mappedPins
    );
  }

  if (footprint.requiresTrenchCrossing) {
    if (zones.has('rail-top') || zones.has('rail-bottom')) {
      return createCandidateResult(
        breadboardState,
        candidatePlacement,
        matchedNodes,
        matchedAnchors,
        totalError,
        false,
        'This component must mount across the breadboard trench, not on the rails',
        mappedPins
      );
    }

    if (!(zones.has('strip-top') && zones.has('strip-bottom'))) {
      return createCandidateResult(
        breadboardState,
        candidatePlacement,
        matchedNodes,
        matchedAnchors,
        totalError,
        false,
        'This component must bridge the top and bottom strips across the trench',
        mappedPins
      );
    }
  }

  return createCandidateResult(
    breadboardState,
    candidatePlacement,
    matchedNodes,
    matchedAnchors,
    totalError,
    true,
    undefined,
    mappedPins
  );
}

function getReferenceNodes(
  referenceWorldPoint: Point,
  breadboardState: BreadboardState,
  footprint: ComponentFootprint,
  referencePinId: string
) {
  return breadboardState.nodes
    .filter((node) => zoneAllowed(node, footprint, referencePinId))
    .map((node) => ({
      node,
      distance: distanceBetween(referenceWorldPoint, node.position),
    }))
    .sort((left, right) => left.distance - right.distance)
    .filter((candidate) => candidate.distance <= REFERENCE_NODE_SEARCH_RADIUS)
    .slice(0, MAX_REFERENCE_CANDIDATES);
}

function getClosestBreadboardDistance(
  definition: ComponentDefinition,
  candidatePlacement: CandidatePlacement,
  breadboardState: BreadboardState
) {
  let closestDistance = Number.POSITIVE_INFINITY;
  const componentFrame = {
    x: candidatePlacement.x,
    y: candidatePlacement.y,
    rotation: normalizeRotation(candidatePlacement.rotation),
  };

  definition.pins.forEach((pin) => {
    const projectedWorldPoint = getWorldAnchor(componentFrame, definition, pin.position);
    breadboardState.nodes.forEach((node) => {
      closestDistance = Math.min(closestDistance, distanceBetween(projectedWorldPoint, node.position));
    });
  });

  return closestDistance;
}

function resolveMountCandidate(
  component: Pick<ComponentData, 'id' | 'type'>,
  candidatePlacement: CandidatePlacement,
  breadboardState: BreadboardState
): { definition: ComponentDefinition; footprint: ComponentFootprint; candidate: MountCandidateResult | null } | null {
  const definition = getComponentDefinition(component.type);
  if (!definition) {
    return null;
  }

  const footprint = getDefinitionFootprint(definition);
  if (!footprint || !canMountToBreadboard(definition)) {
    return null;
  }

  if (!isRotationSupported(footprint, candidatePlacement.rotation)) {
    return {
      definition,
      footprint,
      candidate: createCandidateResult(
        breadboardState,
        candidatePlacement,
        [],
        [],
        Number.POSITIVE_INFINITY,
        false,
        `Rotation ${normalizeRotation(candidatePlacement.rotation)} deg is not supported for ${definition.name}`
      ),
    };
  }

  const referencePinId = footprint.referencePinId ?? footprint.pins[0]?.id;
  const referencePin = definition.pins.find((pin) => pin.id === referencePinId);
  if (!referencePin) {
    return null;
  }

  const rawReferenceWorld = getWorldAnchor(
    {
      x: candidatePlacement.x,
      y: candidatePlacement.y,
      rotation: normalizeRotation(candidatePlacement.rotation),
    },
    definition,
    referencePin.position
  );

  const referenceNodes = getReferenceNodes(rawReferenceWorld, breadboardState, footprint, referencePin.id);
  if (referenceNodes.length === 0) {
    return {
      definition,
      footprint,
      candidate: null,
    };
  }

  let bestValid: MountCandidateResult | null = null;
  let bestInvalid: MountCandidateResult | null = null;

  for (const referenceCandidate of referenceNodes) {
    const alignedPosition = {
      x: roundToHundredth(candidatePlacement.x + (referenceCandidate.node.position.x - rawReferenceWorld.x)),
      y: roundToHundredth(candidatePlacement.y + (referenceCandidate.node.position.y - rawReferenceWorld.y)),
      rotation: normalizeRotation(candidatePlacement.rotation),
    };

    const result = assessCandidate(component, definition, footprint, alignedPosition, breadboardState);
    if (result.valid) {
      if (!bestValid || result.totalError < bestValid.totalError) {
        bestValid = result;
      }
    } else {
      bestInvalid = scoreInvalidCandidate(bestInvalid, result);
    }
  }

  return {
    definition,
    footprint,
    candidate: bestValid ?? bestInvalid,
  };
}

export function validateBreadboardMount(
  component: Pick<ComponentData, 'id' | 'type'>,
  candidatePlacement: CandidatePlacement,
  breadboardState: BreadboardState
): MountValidationResult {
  const resolved = resolveMountCandidate(component, candidatePlacement, breadboardState);
  if (!resolved?.candidate) {
    return {
      valid: false,
      reason: 'No valid breadboard mount candidate found',
    };
  }

  return {
    valid: resolved.candidate.valid,
    reason: resolved.candidate.reason,
    mappedPins: resolved.candidate.mappedPins,
  };
}

export function getBreadboardMountPreview(
  component: Pick<ComponentData, 'id' | 'type'>,
  candidatePlacement: CandidatePlacement,
  components: ComponentData[]
): BreadboardMountPreview | null {
  const definition = getComponentDefinition(component.type);
  if (!definition) {
    return null;
  }

  const footprintClass = getFootprintClass(definition);
  if (!canMountToBreadboard(definition)) {
    return null;
  }

  const breadboardState = buildBreadboardState(components, component.id);
  if (!breadboardState) {
    return null;
  }

  const resolved = resolveMountCandidate(component, candidatePlacement, breadboardState);
  if (!resolved?.candidate) {
    const closestDistance = getClosestBreadboardDistance(definition, candidatePlacement, breadboardState);
    if (closestDistance > PREVIEW_ACTIVATION_RADIUS) {
      return null;
    }

    return {
      footprintClass,
      position: { x: candidatePlacement.x, y: candidatePlacement.y },
      rawPosition: { x: candidatePlacement.x, y: candidatePlacement.y },
      matchedAnchors: [],
      groupHighlights: [],
      totalError: closestDistance,
      valid: false,
      isValid: false,
      reason: 'No valid breadboard holes match this footprint',
    };
  }

  if (!resolved.candidate.valid) {
    const closestDistance = getClosestBreadboardDistance(resolved.definition, candidatePlacement, breadboardState);
    if (closestDistance > PREVIEW_ACTIVATION_RADIUS) {
      return null;
    }
  }

  return {
    footprintClass,
    position: resolved.candidate.position,
    rawPosition: { x: candidatePlacement.x, y: candidatePlacement.y },
    matchedAnchors: resolved.candidate.matchedAnchors,
    groupHighlights: resolved.candidate.groupHighlights,
    totalError: resolved.candidate.totalError,
    valid: resolved.candidate.valid,
    isValid: resolved.candidate.valid,
    reason: resolved.candidate.reason,
    mappedPins: resolved.candidate.mappedPins,
  };
}

export function createMountedPlacement(
  componentId: string,
  rotation: number,
  preview: Pick<BreadboardMountPreview, 'isValid' | 'mappedPins' | 'footprintClass'>
): MountedPlacement | null {
  if (!preview.isValid || !preview.mappedPins || preview.mappedPins.length === 0) {
    return null;
  }

  return {
    componentId,
    mounted: true,
    footprintType: preview.footprintClass,
    rotation: normalizeRotation(rotation),
    pinMap: preview.mappedPins,
  };
}

