import type { ComponentData, NetData } from '@/contexts/CircuitContext';
import { getNetFromNodeId, getNetToNodeId } from '@/lib/circuit/netData';
import { getBreadboardContinuityEdges, isBreadboardNodeId } from '@/lib/wiring/breadboardModel';
import { getComponentDefinition, normalizeComponentType } from '@/lib/wiring/componentDefinitions';
import { getBoardPinFromNodeId, isBoardNodeId } from '@/lib/wiring/boardNodes';

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

  private static getMountedComponentEdges(components: ComponentData[]): Array<[string, string]> {
    return components.flatMap((component) => {
      if (component.mountedPlacement?.mounted) {
        return component.mountedPlacement.pinMap.map((mapping) => [
          `${component.id}.${mapping.pinId}`,
          mapping.nodeId,
        ] as [string, string]);
      }

      return [];
    });
  }

  private static buildGraph(components: ComponentData[], nets: NetData[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    nets.forEach((net) => {
      this.addEdge(graph, getNetFromNodeId(net), getNetToNodeId(net));
    });

    const breadboard = this.getBreadboardComponent(components);
    if (!breadboard) {
      return graph;
    }

    getBreadboardContinuityEdges().forEach(([fromNodeId, toNodeId]) => {
      this.addEdge(graph, fromNodeId, toNodeId);
    });

    const mountedEdges = this.getMountedComponentEdges(components);
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
    const explicitEndpoints = new Set(nets.flatMap((net) => [getNetFromNodeId(net), getNetToNodeId(net)]));
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
          isBoardNodeId(node) ||
          isBreadboardNodeId(node) ||
          node.includes('.')
      );

      if (!shouldInclude) {
        continue;
      }

      const sortedNodes = uniqueSorted(nodes);
      const boardPins = uniqueSorted(
        sortedNodes
          .filter((node) => isBoardNodeId(node))
          .map((node) => getBoardPinFromNodeId(node) ?? '')
          .filter(Boolean)
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