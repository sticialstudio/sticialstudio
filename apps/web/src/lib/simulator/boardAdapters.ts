import { BOARD_CONFIG } from '@/lib/boards/boardConfig';
import { BOARD_REGISTRY } from '@/boards/boards';

import type { SimulationCapabilities } from './simulationTypes';

export interface BoardAdapter {
  name: string;
  nodePrefix: string;
  digitalPins: string[];
  analogPins: string[];
  pwmPins: string[];
  supplyPins: string[];
  groundPins: string[];
  builtinLedPin: string | null;
  buses: {
    uart?: { rx: string; tx: string };
    i2c?: { sda: string; scl: string };
    spi?: { mosi: string; miso: string; sck: string; ss: string };
  };
  capabilities: SimulationCapabilities;
}

function toPinList(values: Array<string | number> | undefined) {
  return (values ?? []).map((value) => String(value).toUpperCase());
}

function withNote(note: string | undefined, fallback?: string) {
  return note ?? fallback;
}

function buildCapabilities(boardName: string): SimulationCapabilities {
  const config = BOARD_CONFIG[boardName];

  if (!config) {
    return {
      canCompile: false,
      canExecute: false,
      canSimulatePeripherals: false,
      supportsSerial: false,
      supportsLogicAnalyzer: false,
      supportsBusInspector: false,
      backend: 'unsupported',
      note: 'Board is not registered for browser simulation.',
    };
  }

  const isAvrCompile = config.compileStrategy === 'arduino-cli';
  const canExecute = boardName === 'Arduino Uno' || boardName === 'Arduino Nano';

  return {
    canCompile: isAvrCompile,
    canExecute,
    canSimulatePeripherals: canExecute,
    supportsSerial: canExecute,
    supportsLogicAnalyzer: canExecute,
    supportsBusInspector: canExecute,
    backend: canExecute ? 'avr8js' : config.supportsBrowserSimulation ? 'behavioral' : 'unsupported',
    note: canExecute
      ? config.supportNote
      : withNote(
          config.supportNote,
          isAvrCompile
            ? 'Compilation is supported, but browser execution is not yet available for this board.'
            : 'This board does not yet have a browser execution backend.'
        ),
  };
}

function resolveNodePrefix(boardName: string) {
  if (boardName === 'Arduino Uno' || boardName === 'Arduino Nano') {
    return 'UNO';
  }

  return boardName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getBoardAdapter(boardName: string): BoardAdapter {
  const registryEntry = BOARD_REGISTRY[boardName as keyof typeof BOARD_REGISTRY];
  const capabilities = buildCapabilities(boardName);

  return {
    name: boardName,
    nodePrefix: resolveNodePrefix(boardName),
    digitalPins: toPinList(registryEntry?.pins.digital),
    analogPins: toPinList(registryEntry?.pins.analog),
    pwmPins: toPinList(registryEntry?.pins.pwm),
    supplyPins: ['5V', '3.3V', '3V3', 'VIN', 'IOREF'],
    groundPins: ['GND', 'GND.1', 'GND.2', 'GND.3'],
    builtinLedPin: registryEntry?.builtin?.led ? String(registryEntry.builtin.led).toUpperCase() : null,
    buses: {
      uart: registryEntry?.communication.uart
        ? { rx: String(registryEntry.communication.uart.rx).toUpperCase(), tx: String(registryEntry.communication.uart.tx).toUpperCase() }
        : undefined,
      i2c: registryEntry?.communication.i2c
        ? { sda: String(registryEntry.communication.i2c.sda).toUpperCase(), scl: String(registryEntry.communication.i2c.scl).toUpperCase() }
        : undefined,
      spi: registryEntry?.communication.spi
        ? {
            mosi: String(registryEntry.communication.spi.mosi).toUpperCase(),
            miso: String(registryEntry.communication.spi.miso).toUpperCase(),
            sck: String(registryEntry.communication.spi.sck).toUpperCase(),
            ss: String(registryEntry.communication.spi.ss).toUpperCase(),
          }
        : undefined,
    },
    capabilities,
  };
}
