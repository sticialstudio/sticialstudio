import type { CircuitSimulationState } from '@/contexts/CircuitContext';

import type { ComponentPinMapping } from './NetlistEngine';
import { getComponentDefinition, type CircuitPinType } from './componentDefinitions';

const SIGNAL_PIN_TYPES = new Set<CircuitPinType>(['digital', 'analog', 'pwm']);
const SUPPLY_PINS = new Set(['5V', '3.3V', '3V3', 'VIN', 'IOREF']);

interface ConnectedPin {
  pinId: string;
  pinType: CircuitPinType;
  boardPinId: string;
}

function normalizeBoardPinId(pinId: string | null | undefined) {
  return String(pinId || '').trim().toUpperCase();
}

function uniquePins(pinIds: Array<string | null | undefined>) {
  return Array.from(new Set(pinIds.map((pinId) => normalizeBoardPinId(pinId)).filter(Boolean)));
}

function isSupplyPinId(pinId: string | null | undefined) {
  return SUPPLY_PINS.has(normalizeBoardPinId(pinId));
}

export function isGroundPinId(pinId: string | null | undefined) {
  return normalizeBoardPinId(pinId).startsWith('GND');
}

function getConnectedPins(componentType: string, pinMapping: ComponentPinMapping | undefined): ConnectedPin[] {
  const definition = getComponentDefinition(componentType);
  if (!definition || !pinMapping) {
    return [];
  }

  return definition.pins.reduce<ConnectedPin[]>((connected, pin) => {
    const mapping = pinMapping[pin.id];
    const boardPinIds = uniquePins(mapping?.boardPins || []);

    boardPinIds.forEach((boardPinId) => {
      connected.push({
        pinId: pin.id,
        pinType: pin.type,
        boardPinId,
      });
    });

    return connected;
  }, []);
}

function getBoardPinsForAlias(
  componentType: string,
  pinMapping: ComponentPinMapping | undefined,
  pinAlias: string
) {
  if (!pinMapping) {
    return [];
  }

  const directMapping = pinMapping[pinAlias];
  if (directMapping?.boardPins?.length) {
    return uniquePins(directMapping.boardPins);
  }

  const connectedPins = getConnectedPins(componentType, pinMapping);
  if (connectedPins.length === 0) {
    return [];
  }

  if (pinAlias === 'SIG') {
    const directSignal = connectedPins.filter(
      (pin) => SIGNAL_PIN_TYPES.has(pin.pinType) && !isSupplyPinId(pin.boardPinId) && !isGroundPinId(pin.boardPinId)
    );
    if (directSignal.length > 0) {
      return uniquePins(directSignal.map((pin) => pin.boardPinId));
    }

    return uniquePins(connectedPins.filter((pin) => SIGNAL_PIN_TYPES.has(pin.pinType)).map((pin) => pin.boardPinId));
  }

  if (pinAlias === 'POWER') {
    return uniquePins([
      ...connectedPins.filter((pin) => isSupplyPinId(pin.boardPinId)).map((pin) => pin.boardPinId),
      ...connectedPins.filter((pin) => pin.pinType === 'power').map((pin) => pin.boardPinId),
    ]);
  }

  if (pinAlias === 'GND') {
    return uniquePins([
      ...connectedPins.filter((pin) => isGroundPinId(pin.boardPinId)).map((pin) => pin.boardPinId),
      ...connectedPins.filter((pin) => pin.pinType === 'ground').map((pin) => pin.boardPinId),
    ]);
  }

  return [];
}

export function resolveMappedBoardPin(
  componentType: string,
  pinMapping: ComponentPinMapping | undefined,
  pinAlias: string
) {
  return getBoardPinsForAlias(componentType, pinMapping, pinAlias)[0] || null;
}

export function hasResolvedPin(componentType: string, pinMapping: ComponentPinMapping | undefined, pinAlias: string) {
  return getBoardPinsForAlias(componentType, pinMapping, pinAlias).length > 0;
}

export function isBoardPinHigh(pinId: string | null | undefined, simulationState: CircuitSimulationState) {
  const normalized = normalizeBoardPinId(pinId);
  if (!normalized) {
    return false;
  }

  if ((simulationState.ready || simulationState.running) && isSupplyPinId(normalized)) {
    return true;
  }

  return Boolean(simulationState.digitalPins[normalized]);
}

export function isBoardPinLow(pinId: string | null | undefined, simulationState: CircuitSimulationState) {
  const normalized = normalizeBoardPinId(pinId);
  if (!normalized) {
    return false;
  }

  if (isGroundPinId(normalized)) {
    return true;
  }

  if (isSupplyPinId(normalized)) {
    return false;
  }

  return !isBoardPinHigh(normalized, simulationState);
}

export function isComponentPowered(
  componentType: string,
  pinMapping: ComponentPinMapping | undefined,
  simulationState: CircuitSimulationState
) {
  const powerPins = getBoardPinsForAlias(componentType, pinMapping, 'POWER');
  const groundPins = getBoardPinsForAlias(componentType, pinMapping, 'GND');

  if (powerPins.length === 0 || groundPins.length === 0) {
    return false;
  }

  return powerPins.some((powerPin) => isBoardPinHigh(powerPin, simulationState)) &&
    groundPins.some((groundPin) => isBoardPinLow(groundPin, simulationState));
}

export function normalizeConnectedBoardPin(pinId: string | null | undefined) {
  return normalizeBoardPinId(pinId);
}
