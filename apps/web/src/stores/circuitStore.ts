import { create } from 'zustand';
import { CircuitNetlist, NetlistEngine, ComponentPinMapping } from '@/lib/wiring/NetlistEngine';
import {
  buildCodingCircuitSnapshot,
  EMPTY_CODING_CIRCUIT_SNAPSHOT,
  type CodingCircuitSnapshot,
} from '@/lib/blockly/circuitAwareness';
import {
  type ComponentData,
  type NetData,
  type CircuitData,
  type CircuitSimulationState,
} from '@/contexts/CircuitContext';
import { getNetFromNodeId, getNetToNodeId } from '@/lib/circuit/netData';
import type { MountedPlacement } from '@/lib/wiring/mountingTypes';
import { createMountedPlacement, getBreadboardMountPreview } from '@/lib/wiring/breadboardMounting';

interface CircuitStoreState {
  components: ComponentData[];
  nets: NetData[];
  netlist: CircuitNetlist;
  resolvedConnections: Record<string, ComponentPinMapping>;
  codingSnapshot: CodingCircuitSnapshot;
  simulationState: CircuitSimulationState;
  selectedComponentId: string | null;
}

interface CircuitStoreActions {
  addComponent: (component: ComponentData) => void;
  removeComponent: (id: string) => void;
  updateComponentPosition: (id: string, x: number, y: number, mountedPlacement?: MountedPlacement | null) => void;
  updateComponentState: (
    id: string,
    updater: Record<string, any> | ((previousState: Record<string, any>) => Record<string, any>)
  ) => void;
  addNet: (net: NetData) => void;
  removeNet: (id: string) => void;
  updateNet: (id: string, updater: Partial<NetData>) => void;
  setCircuitData: (data: CircuitData, skipHistory?: boolean) => void;
  clearCircuit: () => void;
  rotateComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  setSimulationState: (patch: Partial<CircuitSimulationState>) => void;
  resetSimulationState: () => void;
  undo: () => void;
  redo: () => void;
}

interface HistoryState {
  past: CircuitData[];
  future: CircuitData[];
}

export type CircuitStore = CircuitStoreState & CircuitStoreActions & HistoryState;

const emptyNetlist: CircuitNetlist = { nets: [] };
const defaultSimulationState: CircuitSimulationState = {
  running: false,
  ready: false,
  error: null,
  digitalPins: {},
  pulseWidths: {},
  analogPins: {},
  netStates: {},
  electricalPins: {},
  pinDetails: {},
  busEvents: [],
  traceEvents: [],
  warnings: [],
  capabilities: null,
};

function deriveCircuit(components: ComponentData[], nets: NetData[]) {
  const netlist = NetlistEngine.generateNetlist(components, nets);
  const resolvedConnections = NetlistEngine.resolveConnections(components, nets);
  const codingSnapshot = buildCodingCircuitSnapshot(components, nets, netlist, resolvedConnections);
  return { netlist, resolvedConnections, codingSnapshot };
}

function hasStateChanged(previous: Record<string, any>, next: Record<string, any>) {
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);

  if (previousKeys.length !== nextKeys.length) {
    return true;
  }

  return nextKeys.some((key) => previous[key] !== next[key]);
}

function mountedPlacementsEqual(left?: MountedPlacement | null, right?: MountedPlacement | null) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return !left && !right;
  }

  if (
    left.componentId !== right.componentId ||
    left.mounted !== right.mounted ||
    left.footprintType !== right.footprintType ||
    left.rotation !== right.rotation ||
    left.pinMap.length !== right.pinMap.length
  ) {
    return false;
  }

  return left.pinMap.every((entry, index) => {
    const next = right.pinMap[index];
    return Boolean(next) && entry.pinId === next.pinId && entry.nodeId === next.nodeId;
  });
}

function isComponentOwnedNode(nodeId: string, componentId: string) {
  return nodeId.startsWith(`${componentId}.`);
}

export const useCircuitStore = create<CircuitStore>((set) => ({
  components: [],
  nets: [],
  netlist: emptyNetlist,
  resolvedConnections: {},
  codingSnapshot: EMPTY_CODING_CIRCUIT_SNAPSHOT,
  simulationState: defaultSimulationState,
  selectedComponentId: null,
  past: [],
  future: [],

  addComponent: (component) =>
    set((state) => {
      const components = [...state.components, component];
      return {
        components,
        ...deriveCircuit(components, state.nets),
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  removeComponent: (id) =>
    set((state) => {
      const components = state.components.filter((component) => component.id !== id);
      const nets = state.nets.filter((net) => {
        const fromNodeId = getNetFromNodeId(net);
        const toNodeId = getNetToNodeId(net);
        return !isComponentOwnedNode(fromNodeId, id) && !isComponentOwnedNode(toNodeId, id);
      });
      return {
        components,
        nets,
        ...deriveCircuit(components, nets),
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  updateComponentPosition: (id, x, y, mountedPlacement) =>
    set((state) => {
      let didChange = false;
      const components = state.components.map((component) => {
        if (component.id !== id) {
          return component;
        }

        const nextMountedPlacement = mountedPlacement === undefined
          ? component.x === x && component.y === y
            ? component.mountedPlacement
            : null
          : mountedPlacement;
        if (component.x === x && component.y === y && mountedPlacementsEqual(component.mountedPlacement, nextMountedPlacement)) {
          return component;
        }

        didChange = true;
        return { ...component, x, y, mountedPlacement: nextMountedPlacement };
      });

      if (!didChange) {
        return state;
      }

      return {
        components,
        ...deriveCircuit(components, state.nets),
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  updateComponentState: (id, updater) =>
    set((state) => {
      let didChange = false;
      const components = state.components.map((component) => {
        if (component.id !== id) {
          return component;
        }

        const previousState = component.state || {};
        const patch = typeof updater === 'function' ? updater(previousState) : updater;
        const nextState = { ...previousState, ...patch };

        if (!hasStateChanged(previousState, nextState)) {
          return component;
        }

        didChange = true;
        return { ...component, state: nextState };
      });

      if (!didChange) {
        return state;
      }

      return { components };
    }),

  addNet: (net) =>
    set((state) => {
      const nets = [...state.nets, net];
      return {
        nets,
        ...deriveCircuit(state.components, nets),
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  removeNet: (id) =>
    set((state) => {
      const nets = state.nets.filter((net) => net.id !== id);
      return {
        nets,
        ...deriveCircuit(state.components, nets),
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  updateNet: (id, updater) =>
    set((state) => {
      const nets = state.nets.map((net) =>
        net.id === id ? { ...net, ...updater } : net
      );
      return {
        nets,
        ...deriveCircuit(state.components, nets),
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  setCircuitData: (data, skipHistory = false) =>
    set((state) => ({
      components: data.components,
      nets: data.nets,
      ...deriveCircuit(data.components, data.nets),
      past: skipHistory ? state.past : [...state.past, { components: state.components, nets: state.nets }].slice(-50),
      future: skipHistory ? state.future : [],
    })),

  clearCircuit: () =>
    set((state) => ({
      components: [],
      nets: [],
      ...deriveCircuit([], []),
      selectedComponentId: null,
      past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
      future: [],
    })),

  rotateComponent: (id) =>
    set((state) => {
      let didChange = false;
      const components = state.components.map((component) => {
        if (component.id !== id) {
          return component;
        }

        const nextRotation = ((component.rotation || 0) + 90) % 360;
        if (component.mountedPlacement?.mounted) {
          const preview = getBreadboardMountPreview(
            component,
            { x: component.x, y: component.y, rotation: nextRotation },
            state.components
          );

          if (!preview?.isValid) {
            return component;
          }

          didChange = true;
          return {
            ...component,
            x: preview.position.x,
            y: preview.position.y,
            rotation: nextRotation,
            mountedPlacement: createMountedPlacement(component.id, nextRotation, preview),
          };
        }

        didChange = true;
        return {
          ...component,
          rotation: nextRotation,
          mountedPlacement: null,
        };
      });

      if (!didChange) {
        return state;
      }

      return {
        components,
        ...deriveCircuit(components, state.nets),
        past: [...state.past, { components: state.components, nets: state.nets }].slice(-50),
        future: [],
      };
    }),

  selectComponent: (id) => set({ selectedComponentId: id }),

  setSimulationState: (patch) =>
    set((state) => ({
      simulationState: {
        ...state.simulationState,
        ...patch,
        digitalPins: patch.digitalPins ?? state.simulationState.digitalPins,
        pulseWidths: patch.pulseWidths ?? state.simulationState.pulseWidths,
        analogPins: patch.analogPins ?? state.simulationState.analogPins,
        netStates: patch.netStates ?? state.simulationState.netStates,
        electricalPins: patch.electricalPins ?? state.simulationState.electricalPins,
        pinDetails: patch.pinDetails ?? state.simulationState.pinDetails,
        busEvents: patch.busEvents ?? state.simulationState.busEvents,
        traceEvents: patch.traceEvents ?? state.simulationState.traceEvents,
        warnings: patch.warnings ?? state.simulationState.warnings,
        capabilities: patch.capabilities ?? state.simulationState.capabilities,
      },
    })),

  resetSimulationState: () =>
    set({
      simulationState: defaultSimulationState,
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      return {
        components: previous.components,
        nets: previous.nets,
        ...deriveCircuit(previous.components, previous.nets),
        past: state.past.slice(0, state.past.length - 1),
        future: [{ components: state.components, nets: state.nets }, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) {
        return state;
      }

      const next = state.future[0];
      return {
        components: next.components,
        nets: next.nets,
        ...deriveCircuit(next.components, next.nets),
        past: [...state.past, { components: state.components, nets: state.nets }],
        future: state.future.slice(1),
      };
    }),
}));



