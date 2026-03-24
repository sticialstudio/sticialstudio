import type { ComponentData, NetData } from '@/contexts/CircuitContext';
import {
  getBreadboardContinuityEdges,
  getBreadboardNodeEntries,
  isBreadboardNodeId,
} from '@/lib/wiring/breadboardModel';
import { getComponentDefinition, normalizeComponentType } from '@/lib/wiring/componentDefinitions';
import { GRID_PITCH, getWorldAnchor, type Point } from '@/lib/wiring/componentGeometry';

export interface PinConnection {
  netId: string | null;
  nodes: string[];
  boardPins: string[];
  breadboardNodes: string[];
  primaryBoardPin: string | null;
}

export type ComponentPinMapping = Record<string, PinConnection>;

export interface ResolvedNet {
  id: string;
  nodes: string[];
  boardPins: string[];
  breadboardNodes: string[];
  componentPins: Record<string, string[]>;
}

export interface CircuitNetlist {
  nets: ResolvedNet[];
}

interface BreadboardWorldNode {
  nodeId: string;
  position: Point;
}

interface ComponentWorldPin {
  pinId: string;
  nodeId: string;
  position: Point;
}

interface PinCandidate {
  pinIndex: number;
  nodeId: string;
  distance: number;
}

const BREADBOARD_MOUNT_THRESHOLD = GRID_PITCH * 0.25;

function createEmptyConnection(nodeId: string): PinConnection {
  return {
    netId: null,
    nodes: [nodeId],
    boardPins: [],
    breadboardNodes: [],
    primaryBoardPin: null,
  };
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}

export class NetlistEngine {
  private static addEdge(graph: Map<string, Set<string>>, a: string, b: string) {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a)?.add(b);
    graph.get(b)?.add(a);
  }

  private static getBreadboardComponent(components: ComponentData[]) {
    return components.find((component) => normalizeComponentType(component.type) === 'BREADBOARD') || null;
  }

  private static createBreadboardWorldNodes(breadboard: ComponentData): BreadboardWorldNode[] {
    const breadboardDefinition = getComponentDefinition(breadboard.type);
    if (!breadboardDefinition) {
      return [];
    }

    return getBreadboardNodeEntries().map((entry) => ({
      nodeId: entry.nodeId,
      position: getWorldAnchor(breadboard, breadboardDefinition, { x: entry.x, y: entry.y }),
    }));
  }

  private static getMountedComponentEdges(
    components: ComponentData[],
    breadboardNodes: BreadboardWorldNode[]
  ): Array<[string, string]> {
    if (breadboardNodes.length === 0) {
      return [];
    }

    const breadboardNodeIds = new Set(breadboardNodes.map((node) => node.nodeId));

    return components.flatMap((component) => {
      if (component.mountedPlacement?.mounted) {
        return component.mountedPlacement.pinMap
          .filter((mapping) => breadboardNodeIds.has(mapping.nodeId))
          .map((mapping) => [`${component.id}.${mapping.pinId}`, mapping.nodeId] as [string, string]);
      }

      const definition = getComponentDefinition(component.type);
      if (!definition || normalizeComponentType(component.type) === 'BREADBOARD' || definition.mountStyle !== 'breadboard') {
        return [];
      }

      const pins: ComponentWorldPin[] = definition.pins.map((pin) => ({
        pinId: pin.id,
        nodeId: `${component.id}.${pin.id}`,
        position: getWorldAnchor(component, definition, pin.position),
      }));

      const assignments = this.matchMountedPinsToBreadboardNodes(pins, breadboardNodes);
      return assignments.map((assignment) => [pins[assignment.pinIndex].nodeId, assignment.nodeId] as [string, string]);
    });
  }

  private static matchMountedPinsToBreadboardNodes(
    pins: ComponentWorldPin[],
    breadboardNodes: BreadboardWorldNode[]
  ): PinCandidate[] {
    if (pins.length === 0) {
      return [];
    }

    const candidateGroups = pins.map((pin, pinIndex) => ({
      pinIndex,
      candidates: breadboardNodes
        .map((node) => ({
          pinIndex,
          nodeId: node.nodeId,
          distance: Math.hypot(pin.position.x - node.position.x, pin.position.y - node.position.y),
        }))
        .filter((candidate) => candidate.distance <= BREADBOARD_MOUNT_THRESHOLD)
        .sort((left, right) => left.distance - right.distance),
    }));

    if (candidateGroups.some((group) => group.candidates.length === 0)) {
      return [];
    }

    candidateGroups.sort((left, right) => left.candidates.length - right.candidates.length);

    let bestMatch: PinCandidate[] | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    const usedNodeIds = new Set<string>();
    const current: PinCandidate[] = [];

    const visit = (groupIndex: number, totalDistance: number) => {
      if (groupIndex === candidateGroups.length) {
        if (totalDistance < bestDistance) {
          bestDistance = totalDistance;
          bestMatch = [...current];
        }
        return;
      }

      if (totalDistance >= bestDistance) {
        return;
      }

      for (const candidate of candidateGroups[groupIndex].candidates) {
        if (usedNodeIds.has(candidate.nodeId)) {
          continue;
        }

        usedNodeIds.add(candidate.nodeId);
        current.push(candidate);
        visit(groupIndex + 1, totalDistance + candidate.distance);
        current.pop();
        usedNodeIds.delete(candidate.nodeId);
      }
    };

    visit(0, 0);
    return bestMatch || [];
  }

  private static buildGraph(components: ComponentData[], nets: NetData[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    nets.forEach((net) => {
      this.addEdge(graph, net.from, net.to);
    });

    const breadboard = this.getBreadboardComponent(components);
    if (!breadboard) {
      return graph;
    }

    getBreadboardContinuityEdges().forEach(([fromNodeId, toNodeId]) => {
      this.addEdge(graph, fromNodeId, toNodeId);
    });

    const mountedEdges = this.getMountedComponentEdges(components, this.createBreadboardWorldNodes(breadboard));
    mountedEdges.forEach(([fromNodeId, toNodeId]) => {
      this.addEdge(graph, fromNodeId, toNodeId);
    });

    return graph;
  }

  private static extractComponentPins(nodes: string[]) {
    return nodes.reduce<Record<string, string[]>>((result, node) => {
      if (!node.includes('.')) {
        return result;
      }

      const separator = node.indexOf('.');
      const componentId = node.slice(0, separator);
      const pinId = node.slice(separator + 1);
      if (!componentId || !pinId) {
        return result;
      }

      if (!result[componentId]) {
        result[componentId] = [];
      }

      result[componentId].push(pinId);
      result[componentId] = uniqueSorted(result[componentId]);
      return result;
    }, {});
  }

  public static generateNetlist(components: ComponentData[], nets: NetData[]): CircuitNetlist {
    const graph = this.buildGraph(components, nets);
    const visited = new Set<string>();
    const explicitEndpoints = new Set(nets.flatMap((net) => [net.from, net.to]));
    const resolvedNets: ResolvedNet[] = [];

    for (const startNode of graph.keys()) {
      if (visited.has(startNode)) {
        continue;
      }

      const queue = [startNode];
      const nodes: string[] = [];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) {
          continue;
        }

        visited.add(current);
        nodes.push(current);

        for (const neighbor of graph.get(current) || []) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      const shouldInclude = nodes.some(
        (node) =>
          explicitEndpoints.has(node) ||
          node.startsWith('UNO_') ||
          isBreadboardNodeId(node) ||
          node.includes('.')
      );

      if (!shouldInclude) {
        continue;
      }

      const sortedNodes = uniqueSorted(nodes);
      const boardPins = uniqueSorted(
        sortedNodes
          .filter((node) => node.startsWith('UNO_'))
          .map((node) => node.replace('UNO_', ''))
      );
      const breadboardNodes = uniqueSorted(sortedNodes.filter((node) => isBreadboardNodeId(node)));

      resolvedNets.push({
        id: `net-${resolvedNets.length + 1}`,
        nodes: sortedNodes,
        boardPins,
        breadboardNodes,
        componentPins: this.extractComponentPins(sortedNodes),
      });
    }

    for (const component of components) {
      const definition = getComponentDefinition(component.type);
      if (!definition) {
        continue;
      }

      definition.pins.forEach((pin) => {
        const nodeId = `${component.id}.${pin.id}`;
        const alreadyTracked = resolvedNets.some((net) => net.nodes.includes(nodeId));
        if (alreadyTracked) {
          return;
        }

        resolvedNets.push({
          id: `net-${resolvedNets.length + 1}`,
          nodes: [nodeId],
          boardPins: [],
          breadboardNodes: [],
          componentPins: { [component.id]: [pin.id] },
        });
      });
    }

    return { nets: resolvedNets };
  }

  public static resolveConnections(components: ComponentData[], nets: NetData[]): Record<string, ComponentPinMapping> {
    const netlist = this.generateNetlist(components, nets);
    const nodeToNet = new Map<string, ResolvedNet>();
    const resolved: Record<string, ComponentPinMapping> = {};

    netlist.nets.forEach((net) => {
      net.nodes.forEach((node) => {
        if (!nodeToNet.has(node)) {
          nodeToNet.set(node, net);
        }
      });
    });

    for (const component of components) {
      const definition = getComponentDefinition(component.type);
      const defaultPins = definition?.pins.map((pin) => pin.id) || [];

      resolved[component.id] = defaultPins.reduce<ComponentPinMapping>((mapping, pinId) => {
        const nodeId = `${component.id}.${pinId}`;
        mapping[pinId] = createEmptyConnection(nodeId);
        return mapping;
      }, {});
    }

    for (const component of components) {
      const pinMapping = resolved[component.id];
      if (!pinMapping) {
        continue;
      }

      for (const pinId of Object.keys(pinMapping)) {
        const nodeId = `${component.id}.${pinId}`;
        const net = nodeToNet.get(nodeId);
        if (!net) {
          continue;
        }

        pinMapping[pinId] = {
          netId: net.id,
          nodes: [...net.nodes],
          boardPins: [...net.boardPins],
          breadboardNodes: [...net.breadboardNodes],
          primaryBoardPin: net.boardPins.length === 1 ? net.boardPins[0] : null,
        };
      }
    }

    return resolved;
  }
}

