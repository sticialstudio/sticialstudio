import type { ComponentData } from '@/contexts/CircuitContext';
import type { CircuitNetlist, ComponentPinMapping, ResolvedNet } from '@/lib/wiring/NetlistEngine';
import { getComponentDefinition } from '@/lib/wiring/componentDefinitions';
import { isGroundPinId, normalizeConnectedBoardPin } from '@/lib/wiring/componentConnectivity';

import { getBoardAdapter } from './boardAdapters';
import {
  collectAnalogInputContributions,
  createComponentRuntimeState,
  getComponentSimulator,
  type ComponentRuntimeState,
  type SimulationNetSummary,
} from './componentSimulators';
import type {
  LogicalNetState,
  PinElectricalState,
  SimulationBusEvent,
  SimulationCapabilities,
  SimulationPinSnapshot,
  SimulationTraceEvent,
} from './simulationTypes';

export { createComponentRuntimeState as createSimulationRuntimeState };
export type SimulationRuntimeState = ComponentRuntimeState;
export type SimulationNetState = SimulationNetSummary;

export interface CircuitSimulationTickResult {
  netStates: Record<string, LogicalNetState>;
  boardPinStates: Record<string, boolean>;
  boardInputStates: Record<string, boolean>;
  boardAnalogStates: Record<string, number>;
  electricalPins: Record<string, PinElectricalState>;
  pinDetails: Record<string, SimulationPinSnapshot>;
  componentStatePatches: Record<string, Record<string, unknown>>;
  simulationNets: SimulationNetState[];
  runtimeState: SimulationRuntimeState;
  warnings: string[];
  capabilities: SimulationCapabilities;
  busEvents: SimulationBusEvent[];
  traceEvents: SimulationTraceEvent[];
}

interface CircuitSimulationTickOptions {
  components: ComponentData[];
  netlist: CircuitNetlist;
  resolvedConnections: Record<string, ComponentPinMapping>;
  avrDigitalPins: Record<string, boolean>;
  avrElectricalPins?: Record<string, PinElectricalState>;
  pulseWidths?: Record<string, number>;
  runtimeState?: SimulationRuntimeState | null;
  tick?: number;
  boardName?: string;
  busEvents?: SimulationBusEvent[];
  traceEvents?: SimulationTraceEvent[];
}

const SUPPLY_PINS = new Set(['5V', '3.3V', '3V3', 'VIN', 'IOREF']);

function isSupplyPinId(pinId: string | null | undefined) {
  return SUPPLY_PINS.has(normalizeConnectedBoardPin(pinId));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function sortNetStates(states: SimulationNetState[]) {
  return states.sort((left, right) => left.id.localeCompare(right.id));
}

function logicalStateFromElectricalState(electricalState: PinElectricalState): LogicalNetState {
  switch (electricalState) {
    case 'high':
    case 'pullup':
      return 'HIGH';
    case 'low':
    case 'pulldown':
      return 'LOW';
    default:
      return 'FLOAT';
  }
}

function modeFromElectricalState(pinId: string, electricalState: PinElectricalState): SimulationPinSnapshot['mode'] {
  if (isSupplyPinId(pinId)) {
    return 'power';
  }

  if (isGroundPinId(pinId)) {
    return 'ground';
  }

  switch (electricalState) {
    case 'high':
    case 'low':
      return 'output';
    case 'pullup':
      return 'inputPullup';
    case 'analog':
      return 'analog';
    default:
      return 'input';
  }
}

class NetUnionFind {
  private readonly parent = new Map<string, string>();

  constructor(netIds: string[]) {
    netIds.forEach((netId) => this.parent.set(netId, netId));
  }

  find(id: string): string {
    const current = this.parent.get(id);
    if (!current) {
      this.parent.set(id, id);
      return id;
    }

    if (current === id) {
      return id;
    }

    const root = this.find(current);
    this.parent.set(id, root);
    return root;
  }

  union(left: string | null | undefined, right: string | null | undefined) {
    if (!left || !right) {
      return;
    }

    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) {
      this.parent.set(rightRoot, leftRoot);
    }
  }
}

function buildSimulationNetGroups(
  netlist: CircuitNetlist,
  components: ComponentData[],
  resolvedConnections: Record<string, ComponentPinMapping>
) {
  const unionFind = new NetUnionFind(netlist.nets.map((net) => net.id));

  components.forEach((component) => {
    const definition = getComponentDefinition(component.type);
    const simulator = getComponentSimulator(definition);
    if (!definition || !simulator?.mergeDynamicNets) {
      return;
    }

    simulator.mergeDynamicNets({
      component,
      definition,
      pinMapping: resolvedConnections[component.id],
      unionFind,
    });
  });

  const grouped = new Map<string, ResolvedNet[]>();
  netlist.nets.forEach((net) => {
    const root = unionFind.find(net.id);
    if (!grouped.has(root)) {
      grouped.set(root, []);
    }
    grouped.get(root)?.push(net);
  });

  return sortNetStates(
    Array.from(grouped.entries()).map(([rootId, nets]) => ({
      id: rootId,
      baseNetIds: unique(nets.flatMap((net) => [net.id])),
      nodes: unique(nets.flatMap((net) => net.nodes)),
      boardPins: unique(
        nets
          .flatMap((net) => net.boardPins.map((pinId) => normalizeConnectedBoardPin(pinId)))
          .filter(Boolean)
      ),
      state: 'FLOAT' as LogicalNetState,
      electricalState: 'highZ' as PinElectricalState,
      highSources: [],
      lowSources: [],
      weakHighSources: [],
      weakLowSources: [],
      analogSources: [],
    }))
  );
}

function evaluateSimulationNetState(
  net: SimulationNetState,
  avrDigitalPins: Record<string, boolean>,
  avrElectricalPins: Record<string, PinElectricalState>
) {
  const highSources: string[] = [];
  const lowSources: string[] = [];
  const weakHighSources: string[] = [];
  const weakLowSources: string[] = [];
  const analogSources: string[] = [];

  net.boardPins.forEach((pinId) => {
    if (isSupplyPinId(pinId)) {
      highSources.push(pinId);
      return;
    }

    if (isGroundPinId(pinId)) {
      lowSources.push(pinId);
      return;
    }

    const electricalState = avrElectricalPins[pinId];
    if (electricalState) {
      switch (electricalState) {
        case 'high':
          highSources.push(pinId);
          return;
        case 'low':
          lowSources.push(pinId);
          return;
        case 'pullup':
          weakHighSources.push(pinId);
          return;
        case 'pulldown':
          weakLowSources.push(pinId);
          return;
        case 'analog':
          analogSources.push(pinId);
          return;
        case 'conflict':
          highSources.push(`${pinId}:conflict-high`);
          lowSources.push(`${pinId}:conflict-low`);
          return;
        default:
          return;
      }
    }

    if (Object.prototype.hasOwnProperty.call(avrDigitalPins, pinId)) {
      if (avrDigitalPins[pinId]) {
        highSources.push(pinId);
      } else {
        lowSources.push(pinId);
      }
    }
  });

  let electricalState: PinElectricalState = 'highZ';
  if ((highSources.length > 0 || weakHighSources.length > 0) && (lowSources.length > 0 || weakLowSources.length > 0)) {
    electricalState = 'conflict';
  } else if (highSources.length > 0) {
    electricalState = 'high';
  } else if (lowSources.length > 0) {
    electricalState = 'low';
  } else if (analogSources.length > 0) {
    electricalState = 'analog';
  } else if (weakHighSources.length > 0) {
    electricalState = 'pullup';
  } else if (weakLowSources.length > 0) {
    electricalState = 'pulldown';
  }

  return {
    ...net,
    state: logicalStateFromElectricalState(electricalState),
    electricalState,
    highSources,
    lowSources,
    weakHighSources,
    weakLowSources,
    analogSources,
  };
}

function buildBoardPinStates(simulationNets: SimulationNetState[], avrElectricalPins: Record<string, PinElectricalState>) {
  const boardPinStates: Record<string, boolean> = {};
  const boardInputStates: Record<string, boolean> = {};
  const boardElectricalStates: Record<string, PinElectricalState> = { ...avrElectricalPins };

  simulationNets.forEach((net) => {
    net.boardPins.forEach((pinId) => {
      if (isSupplyPinId(pinId)) {
        boardPinStates[pinId] = true;
        boardElectricalStates[pinId] = 'high';
        return;
      }

      if (isGroundPinId(pinId)) {
        boardPinStates[pinId] = false;
        boardElectricalStates[pinId] = 'low';
        return;
      }

      switch (net.electricalState) {
        case 'high':
          boardPinStates[pinId] = true;
          boardInputStates[pinId] = true;
          boardElectricalStates[pinId] = 'high';
          break;
        case 'low':
          boardPinStates[pinId] = false;
          boardInputStates[pinId] = false;
          boardElectricalStates[pinId] = 'low';
          break;
        case 'pullup':
          boardPinStates[pinId] = true;
          boardInputStates[pinId] = true;
          boardElectricalStates[pinId] = 'pullup';
          break;
        case 'pulldown':
          boardPinStates[pinId] = false;
          boardInputStates[pinId] = false;
          boardElectricalStates[pinId] = 'pulldown';
          break;
        case 'analog':
          boardElectricalStates[pinId] = 'analog';
          break;
        case 'conflict':
          boardElectricalStates[pinId] = 'conflict';
          break;
        default:
          if (!boardElectricalStates[pinId]) {
            boardElectricalStates[pinId] = 'highZ';
          }
          break;
      }
    });
  });

  return { boardPinStates, boardInputStates, boardElectricalStates };
}

function buildWarnings(simulationNets: SimulationNetState[], capabilities: SimulationCapabilities) {
  const warnings: string[] = [];

  if (capabilities.note && !capabilities.canExecute) {
    warnings.push(capabilities.note);
  }

  simulationNets.forEach((net) => {
    if (net.electricalState === 'conflict') {
      warnings.push(`Signal conflict on ${net.id}: ${net.highSources.join(', ') || 'HIGH'} vs ${net.lowSources.join(', ') || 'LOW'}`);
    }
  });

  return warnings;
}

function buildPinDetails(
  boardPins: string[],
  boardPinStates: Record<string, boolean>,
  boardElectricalStates: Record<string, PinElectricalState>,
  simulationNets: SimulationNetState[]
) {
  return boardPins.reduce<Record<string, SimulationPinSnapshot>>((record, pinId) => {
    const electricalState = boardElectricalStates[pinId] ?? (isSupplyPinId(pinId) ? 'high' : isGroundPinId(pinId) ? 'low' : 'highZ');
    const attachedSources = simulationNets
      .filter((net) => net.boardPins.includes(pinId))
      .flatMap((net) => [
        ...net.highSources,
        ...net.lowSources,
        ...net.weakHighSources,
        ...net.weakLowSources,
        ...net.analogSources,
      ]);

    record[pinId] = {
      pinId,
      logicalState: logicalStateFromElectricalState(electricalState),
      electricalState,
      mode: modeFromElectricalState(pinId, electricalState),
      high: Object.prototype.hasOwnProperty.call(boardPinStates, pinId) ? boardPinStates[pinId] : null,
      sources: unique(attachedSources),
    };

    return record;
  }, {});
}

export function simulateCircuitTick({
  components,
  netlist,
  resolvedConnections,
  avrDigitalPins,
  avrElectricalPins = {},
  pulseWidths = {},
  runtimeState = createComponentRuntimeState(),
  tick = 0,
  boardName = 'Arduino Uno',
  busEvents = [],
  traceEvents = [],
}: CircuitSimulationTickOptions): CircuitSimulationTickResult {
  const board = getBoardAdapter(boardName);
  const groupedNets = buildSimulationNetGroups(netlist, components, resolvedConnections);
  const evaluatedNets = groupedNets.map((net) => evaluateSimulationNetState(net, avrDigitalPins, avrElectricalPins));
  const baseNetState = new Map<string, LogicalNetState>();

  evaluatedNets.forEach((net) => {
    net.baseNetIds.forEach((baseNetId) => {
      baseNetState.set(baseNetId, net.state);
    });
  });

  const netStates: Record<string, LogicalNetState> = {};
  baseNetState.forEach((state, netId) => {
    netStates[netId] = state;
  });

  const nextRuntimeState: SimulationRuntimeState = {
    ultrasonic: { ...(runtimeState?.ultrasonic ?? {}) },
  };

  const { boardPinStates, boardInputStates, boardElectricalStates } = buildBoardPinStates(evaluatedNets, avrElectricalPins);
  const { boardAnalogStates, boardElectricalStates: sampledElectricalStates } = collectAnalogInputContributions(
    board,
    components,
    resolvedConnections,
    boardPinStates,
    busEvents
  );

  Object.assign(boardElectricalStates, sampledElectricalStates);

  const componentStatePatches: Record<string, Record<string, unknown>> = {};

  components.forEach((component) => {
    const definition = getComponentDefinition(component.type);
    const simulator = getComponentSimulator(definition);
    if (!definition || !simulator) {
      return;
    }

    const context = {
      board,
      component,
      definition,
      pinMapping: resolvedConnections[component.id],
      boardPinStates,
      boardElectricalStates,
      boardInputStates,
      boardAnalogStates,
      baseNetState,
      simulationNets: evaluatedNets,
      pulseWidths,
      runtimeState: nextRuntimeState,
      componentStatePatches,
      busEvents,
      tick,
    };

    simulator.applyInputs?.(context);
    simulator.tick?.(context);
    const visualPatch = simulator.emitVisualState?.(context);
    if (visualPatch) {
      componentStatePatches[component.id] = {
        ...componentStatePatches[component.id],
        ...visualPatch,
      };
    }
  });

  const trackedPins = unique([
    ...board.digitalPins,
    ...board.analogPins,
    ...board.supplyPins,
    ...board.groundPins,
    ...evaluatedNets.flatMap((net) => net.boardPins),
    ...Object.keys(avrElectricalPins),
    ...Object.keys(boardAnalogStates),
  ]);

  const pinDetails = buildPinDetails(trackedPins, boardPinStates, boardElectricalStates, evaluatedNets);
  const warnings = buildWarnings(evaluatedNets, board.capabilities);

  return {
    netStates,
    boardPinStates,
    boardInputStates,
    boardAnalogStates,
    electricalPins: boardElectricalStates,
    pinDetails,
    componentStatePatches,
    simulationNets: evaluatedNets,
    runtimeState: nextRuntimeState,
    warnings,
    capabilities: board.capabilities,
    busEvents,
    traceEvents,
  };
}
