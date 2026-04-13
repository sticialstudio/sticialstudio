import type { ComponentData } from '@/contexts/CircuitContext';
import { getComponentDefinition, type ComponentDefinition } from '@/lib/wiring/componentDefinitions';
import { isGroundPinId, normalizeConnectedBoardPin, resolveMappedBoardPin } from '@/lib/wiring/componentConnectivity';
import type { ComponentPinMapping } from '@/lib/wiring/NetlistEngine';

import type { BoardAdapter } from './boardAdapters';
import type { LogicalNetState, PinElectricalState, SimulationBusEvent } from './simulationTypes';

const SUPPLY_PINS = new Set(['5V', '3.3V', '3V3', 'VIN', 'IOREF']);

export interface UltrasonicRuntimeState {
  echoTicksRemaining: number;
  lastTriggerHigh: boolean;
}

export interface ComponentRuntimeState {
  ultrasonic: Record<string, UltrasonicRuntimeState>;
}

export interface SimulationNetSummary {
  id: string;
  baseNetIds: string[];
  nodes: string[];
  boardPins: string[];
  state: LogicalNetState;
  electricalState: PinElectricalState;
  highSources: string[];
  lowSources: string[];
  weakHighSources: string[];
  weakLowSources: string[];
  analogSources: string[];
}

export interface NetContribution {
  boardPinId: string;
  electricalState: PinElectricalState;
  source: string;
  analogValue?: number;
}

export interface NetMergeContext {
  component: ComponentData;
  definition: ComponentDefinition;
  pinMapping: ComponentPinMapping | undefined;
  unionFind: { union: (left: string | null | undefined, right: string | null | undefined) => void };
}

export interface ComponentSimulationContext {
  board: BoardAdapter;
  component: ComponentData;
  definition: ComponentDefinition;
  pinMapping: ComponentPinMapping | undefined;
  boardPinStates: Record<string, boolean>;
  boardElectricalStates: Record<string, PinElectricalState>;
  boardInputStates: Record<string, boolean>;
  boardAnalogStates: Record<string, number>;
  baseNetState: Map<string, LogicalNetState>;
  simulationNets: SimulationNetSummary[];
  pulseWidths: Record<string, number>;
  runtimeState: ComponentRuntimeState;
  componentStatePatches: Record<string, Record<string, unknown>>;
  busEvents: SimulationBusEvent[];
  tick: number;
}

export interface ComponentSimulator {
  matches: (definition: ComponentDefinition) => boolean;
  mergeDynamicNets?: (ctx: NetMergeContext) => void;
  samplePins?: (ctx: ComponentSimulationContext) => NetContribution[];
  init?: (ctx: ComponentSimulationContext) => void;
  applyInputs?: (ctx: ComponentSimulationContext) => void;
  tick?: (ctx: ComponentSimulationContext) => void;
  emitVisualState?: (ctx: ComponentSimulationContext) => Record<string, unknown> | null;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function getPinNetId(pinMapping: ComponentPinMapping | undefined, pinId: string) {
  return pinMapping?.[pinId]?.netId ?? null;
}

function getBoardPinId(pinMapping: ComponentPinMapping | undefined, pinId: string) {
  const boardPins = pinMapping?.[pinId]?.boardPins ?? [];
  return normalizeConnectedBoardPin(boardPins[0]);
}

function getBoardPinLogicalState(pinId: string | null | undefined, boardPinStates: Record<string, boolean>): LogicalNetState {
  const normalized = normalizeConnectedBoardPin(pinId);
  if (!normalized) {
    return 'FLOAT';
  }

  if (SUPPLY_PINS.has(normalized)) {
    return 'HIGH';
  }

  if (isGroundPinId(normalized)) {
    return 'LOW';
  }

  if (Object.prototype.hasOwnProperty.call(boardPinStates, normalized)) {
    return boardPinStates[normalized] ? 'HIGH' : 'LOW';
  }

  return 'FLOAT';
}

function getConnectionState(pinMapping: ComponentPinMapping | undefined, pinId: string, baseNetState: Map<string, LogicalNetState>) {
  const connection = pinMapping?.[pinId];
  if (!connection?.netId) {
    return 'FLOAT';
  }

  return baseNetState.get(connection.netId) ?? 'FLOAT';
}

function isPinMappingPowered(pinMapping: ComponentPinMapping | undefined, boardPinStates: Record<string, boolean>) {
  if (!pinMapping) {
    return false;
  }

  const connectedPins = Object.values(pinMapping).flatMap((connection) =>
    (connection?.boardPins ?? []).map((pinId) => normalizeConnectedBoardPin(pinId))
  );
  const powerPins = connectedPins.filter((pinId) => SUPPLY_PINS.has(pinId));
  const groundPins = connectedPins.filter((pinId) => isGroundPinId(pinId));

  if (powerPins.length === 0 || groundPins.length === 0) {
    return false;
  }

  return powerPins.some((pinId) => getBoardPinLogicalState(pinId, boardPinStates) === 'HIGH') &&
    groundPins.some((pinId) => getBoardPinLogicalState(pinId, boardPinStates) === 'LOW');
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pulseWidthToServoAngle(pulseWidthMicros: number) {
  const normalized = (pulseWidthMicros - 544) / (2400 - 544);
  return Math.max(0, Math.min(180, normalized * 180));
}

function inferDisplayAddress(component: ComponentData) {
  const candidate = component.state?.address ?? component.metadata?.address ?? 0x3c;
  return Number(candidate);
}

function formatByte(value: number) {
  return `0x${value.toString(16).padStart(2, '0').toUpperCase()}`;
}

function buildDisplayLinesFromBus(component: ComponentData, pinMapping: ComponentPinMapping | undefined, boardPinStates: Record<string, boolean>, busEvents: SimulationBusEvent[]) {
  const address = inferDisplayAddress(component);
  const title = String(component.state?.label ?? 'OLED').toUpperCase().slice(0, 12);
  const writes = busEvents.filter((event) => event.bus === 'i2c' && event.write && event.address === address);
  const dataBytes = writes.flatMap((event) => event.data ?? []);
  const lastBurst = dataBytes.slice(-6);
  const sdaPin = getBoardPinId(pinMapping, 'SDA');
  const sclPin = getBoardPinId(pinMapping, 'SCL');

  if (writes.length === 0) {
    return [
      title,
      'WAITING FOR I2C',
      `ADDR ${formatByte(address)}`,
      `${sdaPin || 'SDA'} ${getBoardPinLogicalState(sdaPin, boardPinStates)}`,
      `${sclPin || 'SCL'} ${getBoardPinLogicalState(sclPin, boardPinStates)}`,
    ];
  }

  return [
    title,
    `${writes.length} I2C WRITES`,
    lastBurst.length > 0 ? lastBurst.map(formatByte).join(' ') : 'NO PAYLOAD',
    `${sdaPin || 'SDA'} ${getBoardPinLogicalState(sdaPin, boardPinStates)}`,
    `${sclPin || 'SCL'} ${getBoardPinLogicalState(sclPin, boardPinStates)}`,
  ];
}

const buttonSimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.type === 'button',
  mergeDynamicNets: ({ component, pinMapping, unionFind }) => {
    const leftNetIds = unique(
      ['1.l', '2.l']
        .map((pinId) => getPinNetId(pinMapping, pinId))
        .filter((netId): netId is string => Boolean(netId))
    );
    const rightNetIds = unique(
      ['1.r', '2.r']
        .map((pinId) => getPinNetId(pinMapping, pinId))
        .filter((netId): netId is string => Boolean(netId))
    );

    for (let index = 1; index < leftNetIds.length; index += 1) {
      unionFind.union(leftNetIds[0], leftNetIds[index]);
    }

    for (let index = 1; index < rightNetIds.length; index += 1) {
      unionFind.union(rightNetIds[0], rightNetIds[index]);
    }

    if (component.state?.pressed && leftNetIds[0] && rightNetIds[0]) {
      unionFind.union(leftNetIds[0], rightNetIds[0]);
    }
  },
  emitVisualState: ({ component }) => ({ pressed: Boolean(component.state?.pressed) }),
};

const ledSimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.type === 'led',
  emitVisualState: ({ pinMapping, baseNetState }) => {
    const anodeState = getConnectionState(pinMapping, 'A', baseNetState);
    const cathodeState = getConnectionState(pinMapping, 'C', baseNetState);
    return { outputHigh: anodeState === 'HIGH' && cathodeState === 'LOW' };
  },
};

const resistorSimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.model === 'resistor',
  emitVisualState: () => null,
};

const potentiometerSimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.type === 'pot',
  samplePins: ({ component, pinMapping, boardPinStates }) => {
    const signalPin = resolveMappedBoardPin(component.type, pinMapping, 'SIG');
    if (!signalPin || !isPinMappingPowered(pinMapping, boardPinStates)) {
      return [];
    }

    return [
      {
        boardPinId: signalPin,
        electricalState: 'analog',
        source: `${component.id}:analog`,
        analogValue: Number(component.state?.value ?? 512),
      },
    ];
  },
  emitVisualState: ({ component }) => ({ value: Number(component.state?.value ?? 512) }),
};

const servoSimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.type === 'servo',
  emitVisualState: ({ definition, pinMapping, boardPinStates, pulseWidths }) => {
    const signalPin = getBoardPinId(pinMapping, 'PWM');
    const pulseWidth = signalPin ? pulseWidths[signalPin] : undefined;
    const angle =
      isPinMappingPowered(pinMapping, boardPinStates) && typeof pulseWidth === 'number'
        ? pulseWidthToServoAngle(pulseWidth)
        : Number(definition.defaultProperties?.angle ?? 90);
    return { angle: Math.round(angle) };
  },
};

const ultrasonicSimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.type === 'ultrasonic',
  tick: ({ component, definition, pinMapping, boardPinStates, boardInputStates, runtimeState, componentStatePatches }) => {
    const powered = isPinMappingPowered(pinMapping, boardPinStates);
    const trigPin = getBoardPinId(pinMapping, 'TRIG');
    const echoPin = getBoardPinId(pinMapping, 'ECHO');
    const distance = Number(component.state?.distance ?? definition.defaultProperties?.distance ?? 100);
    const runtime = runtimeState.ultrasonic[component.id] ?? {
      echoTicksRemaining: 0,
      lastTriggerHigh: false,
    };
    const triggerHigh = powered && getBoardPinLogicalState(trigPin, boardPinStates) === 'HIGH';
    const nextRuntime: UltrasonicRuntimeState = { ...runtime };

    if (triggerHigh && !runtime.lastTriggerHigh) {
      nextRuntime.echoTicksRemaining = clamp(Math.round(distance / 25), 1, 12);
    }

    if (powered && echoPin && nextRuntime.echoTicksRemaining > 0) {
      boardPinStates[echoPin] = true;
      boardInputStates[echoPin] = true;
      nextRuntime.echoTicksRemaining -= 1;
      componentStatePatches[component.id] = {
        ...componentStatePatches[component.id],
        distance,
        echoActive: true,
      };
    } else {
      componentStatePatches[component.id] = {
        ...componentStatePatches[component.id],
        distance,
        echoActive: false,
      };
    }

    nextRuntime.lastTriggerHigh = triggerHigh;
    runtimeState.ultrasonic[component.id] = nextRuntime;
  },
  emitVisualState: ({ component, definition }) => ({
    distance: Number(component.state?.distance ?? definition.defaultProperties?.distance ?? 100),
    echoActive: false,
  }),
};

const dht22Simulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.model === 'dht22',
  tick: ({ component, definition, pinMapping, boardPinStates, boardInputStates, componentStatePatches, tick }) => {
    const powered = isPinMappingPowered(pinMapping, boardPinStates);
    const dataPin = getBoardPinId(pinMapping, 'DATA');
    const temperature = Number(component.state?.temperature ?? definition.defaultProperties?.temperature ?? 24);
    const humidity = Number(component.state?.humidity ?? definition.defaultProperties?.humidity ?? 40);
    const dataReady = powered && ((tick + Math.round(temperature) + Math.round(humidity)) % 8 < 4);

    if (powered && dataPin) {
      boardPinStates[dataPin] = dataReady;
      boardInputStates[dataPin] = dataReady;
    }

    componentStatePatches[component.id] = {
      ...componentStatePatches[component.id],
      temperature,
      humidity,
      dataReady,
    };
  },
  emitVisualState: ({ component, definition }) => ({
    temperature: Number(component.state?.temperature ?? definition.defaultProperties?.temperature ?? 24),
    humidity: Number(component.state?.humidity ?? definition.defaultProperties?.humidity ?? 40),
    dataReady: false,
  }),
};

const displaySimulator: ComponentSimulator = {
  matches: (definition) => definition.simulation?.type === 'display',
  emitVisualState: ({ component, pinMapping, boardPinStates, busEvents }) => ({
    displayLines: buildDisplayLinesFromBus(component, pinMapping, boardPinStates, busEvents),
  }),
};

const simulatorRegistry: ComponentSimulator[] = [
  buttonSimulator,
  ledSimulator,
  resistorSimulator,
  potentiometerSimulator,
  servoSimulator,
  ultrasonicSimulator,
  dht22Simulator,
  displaySimulator,
];

export function createComponentRuntimeState(): ComponentRuntimeState {
  return {
    ultrasonic: {},
  };
}

export function getComponentSimulator(definition: ComponentDefinition | undefined) {
  if (!definition?.simulation) {
    return null;
  }

  return simulatorRegistry.find((simulator) => simulator.matches(definition)) ?? null;
}

export function collectAnalogInputContributions(
  board: BoardAdapter,
  components: ComponentData[],
  resolvedConnections: Record<string, ComponentPinMapping>,
  boardPinStates: Record<string, boolean>,
  busEvents: SimulationBusEvent[]
) {
  const boardAnalogStates: Record<string, number> = {};
  const boardElectricalStates: Record<string, PinElectricalState> = {};

  components.forEach((component) => {
    const definition = getComponentDefinition(component.type);
    const simulator = getComponentSimulator(definition);
    if (!definition || !simulator?.samplePins) {
      return;
    }

    const contributions = simulator.samplePins({
      board,
      component,
      definition,
      pinMapping: resolvedConnections[component.id],
      boardPinStates,
      boardElectricalStates,
      boardInputStates: {},
      boardAnalogStates,
      baseNetState: new Map(),
      simulationNets: [],
      pulseWidths: {},
      runtimeState: createComponentRuntimeState(),
      componentStatePatches: {},
      busEvents,
      tick: 0,
    });

    contributions?.forEach((contribution) => {
      if (contribution.electricalState === 'analog' && typeof contribution.analogValue === 'number') {
        boardAnalogStates[contribution.boardPinId] = contribution.analogValue;
        boardElectricalStates[contribution.boardPinId] = 'analog';
      }
    });
  });

  return { boardAnalogStates, boardElectricalStates };
}
