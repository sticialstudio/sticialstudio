import { type CircuitData, type CircuitSimulationState } from '@/contexts/CircuitContext';
import { getNetFromAnchorId, getNetFromNodeId, getNetToAnchorId, getNetToNodeId } from '@/lib/circuit/netData';
import {
  getBreadboardContinuityGroups,
  getBreadboardNodeEntries,
} from '@/lib/wiring/breadboardModel';
import {
  getComponentDefinition,
  normalizeComponentType,
  type CircuitPinType,
} from '@/lib/wiring/componentDefinitions';
import {
  getComponentPinPosition,
  getComponentWorldBounds,
  getRenderedSize,
  getWorldAnchor,
  type Point,
} from '@/lib/wiring/componentGeometry';
import { isComponentPowered, isGroundPinId, normalizeConnectedBoardPin } from '@/lib/wiring/componentConnectivity';
import { createBoardNodeId } from '@/lib/wiring/boardNodes';
import type { CircuitNetlist, ComponentPinMapping } from '@/lib/wiring/NetlistEngine';
import type { LogicalNetState } from '@/lib/simulator/simulationTypes';

import type { SceneGraph, WorldComponentNode, WorldPinNode, WorldWireNode } from './sceneTypes';
import { buildWireRoutePoints, getWireHandles } from './wireRouting';

const UNO_DEFINITION = getComponentDefinition('ARDUINO_UNO');
const BREADBOARD_DEFINITION = getComponentDefinition('BREADBOARD');
const LEGACY_UNO_ANCHOR_IDS: Record<string, string> = {
  UNO_TX: 'UNO_1',
  UNO_RX: 'UNO_0',
  'UNO_RESET.1': 'UNO_RESET',
};
const SUPPLY_PINS = new Set(['5V', '3.3V', '3V3', 'VIN', 'IOREF']);

function formatBoardPinLabel(pinId: string) {
  const pin = UNO_DEFINITION?.pins.find((candidate) => candidate.id === pinId);
  if (!pin) {
    return pinId;
  }

  if (pinId === '0' || pinId === '1') {
    return pin.name;
  }

  if (/^\d+$/.test(pinId)) {
    return `D${pinId}`;
  }

  if (pinId.startsWith('GND')) {
    return 'GND';
  }

  return pin.name;
}

function formatBreadboardLabel(anchorId: string) {
  const railMatch = anchorId.match(/^RAIL_(TOP|BOT)_(PLUS|MINUS)_(\d+)$/);
  if (railMatch) {
    const [, railSide, polarity, column] = railMatch;
    return `${railSide === 'TOP' ? 'Top' : 'Bottom'} ${polarity === 'PLUS' ? '+' : '-'} ${column}`;
  }

  const stripMatch = anchorId.match(/^STRIP_(\d+)_([A-J])$/);
  if (stripMatch) {
    const [, column, row] = stripMatch;
    return `${row}${column}`;
  }

  return anchorId.replace(/_/g, ' ');
}

function inferPinType(pinType: CircuitPinType | undefined): CircuitPinType | 'breadboard' {
  return pinType ?? 'breadboard';
}

function buildNodeSignalStateMap(netlist: CircuitNetlist, simulationState: CircuitSimulationState) {
  const nodeStates = new Map<string, LogicalNetState>();

  netlist.nets.forEach((net) => {
    const state = simulationState.netStates[net.id] ?? 'FLOAT';
    if (state === 'FLOAT') {
      return;
    }

    net.nodes.forEach((nodeId) => nodeStates.set(nodeId, state));
  });

  return nodeStates;
}

function resolveMountedNodeId(componentId: string, pinId: string, mountedPlacement?: { pinMap: Array<{ pinId: string; nodeId: string }> } | null) {
  return mountedPlacement?.pinMap.find((mapping) => mapping.pinId === pinId)?.nodeId ?? `${componentId}.${pinId}`;
}

function registerPin(
  pin: WorldPinNode,
  pins: WorldPinNode[],
  pinById: Record<string, WorldPinNode>,
  pinsByNodeId: Record<string, WorldPinNode[]>
) {
  pins.push(pin);
  pinById[pin.id] = pin;
  if (!pinsByNodeId[pin.nodeId]) {
    pinsByNodeId[pin.nodeId] = [];
  }
  pinsByNodeId[pin.nodeId].push(pin);
}

function resolveWireEndpointPin(
  nodeId: string,
  anchorId: string | null,
  pinById: Record<string, WorldPinNode>,
  pinsByNodeId: Record<string, WorldPinNode[]>
) {
  if (anchorId) {
    const anchoredPin = pinById[anchorId];
    if (anchoredPin?.nodeId === nodeId) {
      return anchoredPin;
    }
  }

  const candidates = pinsByNodeId[nodeId] ?? [];
  return candidates[0] ?? null;
}

function getBoardPinSignalState(
  pinId: string,
  nodeId: string,
  nodeSignalStates: Map<string, LogicalNetState>,
  simulationState: CircuitSimulationState
) {
  const nodeState = nodeSignalStates.get(nodeId);
  if (nodeState) {
    return nodeState;
  }

  const normalizedPin = normalizeConnectedBoardPin(pinId);
  if (!normalizedPin) {
    return null;
  }

  if (SUPPLY_PINS.has(normalizedPin)) {
    return 'HIGH';
  }

  if (isGroundPinId(normalizedPin)) {
    return 'LOW';
  }

  if (Object.prototype.hasOwnProperty.call(simulationState.digitalPins, normalizedPin)) {
    return simulationState.digitalPins[normalizedPin] ? 'HIGH' : 'LOW';
  }

  return null;
}

function toWorldBounds(
  component: { x: number; y: number; rotation: number },
  localBounds: { x: number; y: number; width: number; height: number }
) {
  if (!BREADBOARD_DEFINITION) {
    return localBounds;
  }

  const corners = [
    { x: localBounds.x, y: localBounds.y },
    { x: localBounds.x + localBounds.width, y: localBounds.y },
    { x: localBounds.x + localBounds.width, y: localBounds.y + localBounds.height },
    { x: localBounds.x, y: localBounds.y + localBounds.height },
  ].map((point) => getWorldAnchor(component, BREADBOARD_DEFINITION, point));

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

export interface BuildSceneOptions {
  selectedComponentId?: string | null;
  selectedWireId?: string | null;
  hoveredComponentId?: string | null;
  hoveredWireId?: string | null;
  draggingComponentId?: string | null;
  positionOverrides?: Record<string, Point>;
  wireWaypointOverrides?: Record<string, Point[]>;
}

export function buildSceneGraph(
  circuitData: CircuitData,
  simulationState: CircuitSimulationState,
  netlist: CircuitNetlist,
  resolvedConnections: Record<string, ComponentPinMapping>,
  options: BuildSceneOptions = {}
): SceneGraph {
  const pins: WorldPinNode[] = [];
  const components: WorldComponentNode[] = [];
  const nodeSignalStates = buildNodeSignalStateMap(netlist, simulationState);
  const breadboardEntries = getBreadboardNodeEntries();
  const breadboardGroups = getBreadboardContinuityGroups();
  const pinById: Record<string, WorldPinNode> = {};
  const pinsByNodeId: Record<string, WorldPinNode[]> = {};
  const positionOverrides = options.positionOverrides ?? {};
  const wireWaypointOverrides = options.wireWaypointOverrides ?? {};

  const placedBreadboard = circuitData.components.find(
    (component) => normalizeComponentType(component.type) === 'BREADBOARD'
  );
  const effectiveBreadboard = placedBreadboard
    ? {
        ...placedBreadboard,
        ...(positionOverrides[placedBreadboard.id]
          ? {
              x: positionOverrides[placedBreadboard.id].x,
              y: positionOverrides[placedBreadboard.id].y,
            }
          : {}),
      }
    : null;

  const breadboardGroupBounds = effectiveBreadboard
    ? breadboardGroups.reduce<Record<string, { x: number; y: number; width: number; height: number }>>((record, group) => {
        record[group.id] = toWorldBounds({ ...effectiveBreadboard, rotation: effectiveBreadboard.rotation || 0 }, group.bounds);
        return record;
      }, {})
    : {};

  if (effectiveBreadboard && BREADBOARD_DEFINITION) {
    breadboardEntries.forEach((entry) => {
      const nodeId = entry.nodeId;
      const position = getWorldAnchor(effectiveBreadboard, BREADBOARD_DEFINITION, { x: entry.x, y: entry.y });
      const label = formatBreadboardLabel(entry.anchorId);
      registerPin(
        {
          id: nodeId,
          nodeId,
          kind: 'breadboard',
          isMounted: false,
          type: 'breadboard',
          label,
          shortLabel: label,
          position,
          signalState: nodeSignalStates.get(nodeId) ?? null,
          continuityGroupId: entry.continuityGroupId,
          continuityBounds: breadboardGroupBounds[entry.continuityGroupId],
          continuityKind: entry.kind,
          continuitySegment: entry.segment,
          continuityZone: entry.zone,
        },
        pins,
        pinById,
        pinsByNodeId
      );
    });
  }

  circuitData.components.forEach((component) => {
    const definition = getComponentDefinition(component.type);
    if (!definition) {
      return;
    }

    const effectiveComponent = positionOverrides[component.id]
      ? {
          ...component,
          x: positionOverrides[component.id].x,
          y: positionOverrides[component.id].y,
        }
      : component;

    const normalizedType = normalizeComponentType(component.type);
    const renderedSize = getRenderedSize(definition.size);
    const componentPins: WorldPinNode[] = [];

    if (normalizedType === 'ARDUINO_UNO') {
      definition.pins.forEach((pinDefinition) => {
        const position = getComponentPinPosition(effectiveComponent, definition, pinDefinition.id);
        if (!position) {
          return;
        }

        const nodeId = createBoardNodeId(component.type, pinDefinition.id);
        const pin: WorldPinNode = {
          id: nodeId,
          nodeId,
          pinId: pinDefinition.id,
          componentId: component.id,
          kind: 'board',
          isMounted: false,
          type: inferPinType(pinDefinition.type),
          label: `Arduino Uno - ${formatBoardPinLabel(pinDefinition.id)}`,
          shortLabel: formatBoardPinLabel(pinDefinition.id),
          position,
          signalState: getBoardPinSignalState(pinDefinition.id, nodeId, nodeSignalStates, simulationState),
        };
        registerPin(pin, pins, pinById, pinsByNodeId);
        componentPins.push(pin);
      });
    } else if (normalizedType !== 'BREADBOARD') {
      definition.pins.forEach((pinDefinition) => {
        const position = getComponentPinPosition(effectiveComponent, definition, pinDefinition.id);
        if (!position) {
          return;
        }

        const nodeId = resolveMountedNodeId(component.id, pinDefinition.id, component.mountedPlacement);
        const pin: WorldPinNode = {
          id: `${component.id}.${pinDefinition.id}`,
          nodeId,
          pinId: pinDefinition.id,
          componentId: component.id,
          kind: 'component',
          isMounted: Boolean(component.mountedPlacement?.mounted),
          type: inferPinType(pinDefinition.type),
          label: `${definition.name} - ${pinDefinition.name}`,
          shortLabel: pinDefinition.name,
          position,
          signalState: nodeSignalStates.get(nodeId) ?? null,
        };
        registerPin(pin, pins, pinById, pinsByNodeId);
        componentPins.push(pin);
      });
    }

    const isPowered = normalizedType === 'ARDUINO_UNO'
      ? Boolean(simulationState.ready || simulationState.running)
      : Boolean(effectiveComponent.state?.outputHigh) || isComponentPowered(component.type, resolvedConnections[component.id], simulationState);

    components.push({
      id: component.id,
      component: effectiveComponent,
      definition,
      position: { x: effectiveComponent.x, y: effectiveComponent.y },
      rotation: effectiveComponent.rotation || 0,
      size: renderedSize,
      bounds: getComponentWorldBounds(effectiveComponent, definition),
      pins: componentPins,
      isPowered,
      isHovered: options.hoveredComponentId === component.id,
      isSelected: options.selectedComponentId === component.id,
      isDragging: options.draggingComponentId === component.id,
    });
  });

  Object.entries(LEGACY_UNO_ANCHOR_IDS).forEach(([legacyId, canonicalId]) => {
    if (pinById[canonicalId]) {
      pinById[legacyId] = pinById[canonicalId];
    }
  });

  const wires: WorldWireNode[] = circuitData.nets
    .map((net) => {
      const fromNodeId = getNetFromNodeId(net);
      const toNodeId = getNetToNodeId(net);
      const fromAnchorId = getNetFromAnchorId(net);
      const toAnchorId = getNetToAnchorId(net);
      const fromPin = resolveWireEndpointPin(fromNodeId, fromAnchorId, pinById, pinsByNodeId);
      const toPin = resolveWireEndpointPin(toNodeId, toAnchorId, pinById, pinsByNodeId);
      if (!fromPin || !toPin) {
        return null;
      }

      const waypoints = wireWaypointOverrides[net.id] ?? net.waypoints ?? [];
      const points = buildWireRoutePoints(fromPin.position, toPin.position, waypoints);
      const signalState = simulationState.netStates[net.id] ?? null;
      const wire: WorldWireNode = {
        id: net.id,
        net,
        fromNodeId,
        toNodeId,
        fromAnchorId: fromPin.id,
        toAnchorId: toPin.id,
        fromPoint: fromPin.position,
        toPoint: toPin.position,
        color: net.color,
        points,
        waypoints,
        bendHandles: getWireHandles(net.id, fromPin.position, toPin.position, waypoints),
        isActive: signalState === 'HIGH',
        isHovered: options.hoveredWireId === net.id,
        isSelected: options.selectedWireId === net.id,
        signalState,
      };

      return wire;
    })
    .filter((wire): wire is WorldWireNode => Boolean(wire));

  const componentById = components.reduce<Record<string, WorldComponentNode>>((record, component) => {
    record[component.id] = component;
    return record;
  }, {});

  const wireById = wires.reduce<Record<string, WorldWireNode>>((record, wire) => {
    record[wire.id] = wire;
    return record;
  }, {});

  return {
    components,
    pins,
    wires,
    componentById,
    pinById,
    pinsByNodeId,
    wireById,
  };
}


