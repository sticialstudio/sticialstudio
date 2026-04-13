'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  PinElectricalState,
  SimulationBusEvent,
  SimulationPinSnapshot,
  SimulationSerialConfig,
  SimulationTraceEvent,
} from '@/lib/simulator/simulationTypes';

type WorkerInMessage =
  | { type: 'run'; hex: string }
  | { type: 'assemble'; asm: string }
  | { type: 'stop' }
  | { type: 'reset' }
  | { type: 'set-digital-input'; pin: string; high: boolean }
  | { type: 'set-analog-input'; pin: string; value: number }
  | { type: 'serial-input'; text: string };

type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'pin-change'; pin: string; high: boolean; cycle: number; electricalState: PinElectricalState }
  | { type: 'pin-state'; pin: string; cycle: number; electricalState: PinElectricalState }
  | { type: 'serial-line'; value: string; cycle: number }
  | { type: 'serial-byte'; value: number; direction: 'tx' | 'rx'; cycle: number }
  | { type: 'serial-config'; config: SimulationSerialConfig }
  | { type: 'bus-event'; event: SimulationBusEvent }
  | { type: 'error'; message: string };

function normalizePinId(pin: string | number) {
  return String(pin).trim().toUpperCase();
}

function logicalStateFromElectricalState(electricalState: PinElectricalState): SimulationPinSnapshot['logicalState'] {
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

function modeFromElectricalState(electricalState: PinElectricalState): SimulationPinSnapshot['mode'] {
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

export interface UseAvrSimulationReturn {
  digitalPins: Map<string, boolean>;
  electricalPins: Map<string, PinElectricalState>;
  pinSnapshots: Map<string, SimulationPinSnapshot>;
  pulseWidths: Map<string, number>;
  busEvents: SimulationBusEvent[];
  traceEvents: SimulationTraceEvent[];
  serialLines: string[];
  serialConfig: SimulationSerialConfig | null;
  isRunning: boolean;
  isReady: boolean;
  error: string | null;
  runHex: (hex: string) => void;
  assembleAndRun: (asm: string) => void;
  stop: () => void;
  reset: () => void;
  sendSerialInput: (text: string) => void;
  setDigitalInput: (pin: string | number, high: boolean) => void;
  setAnalogInput: (pin: string | number, value: number) => void;
}

export function useAvrSimulation(): UseAvrSimulationReturn {
  const workerRef = useRef<Worker | null>(null);
  const lastHighCycleRef = useRef<Map<string, number>>(new Map());

  const [digitalPins, setDigitalPins] = useState<Map<string, boolean>>(new Map());
  const [electricalPins, setElectricalPins] = useState<Map<string, PinElectricalState>>(new Map());
  const [pinSnapshots, setPinSnapshots] = useState<Map<string, SimulationPinSnapshot>>(new Map());
  const [pulseWidths, setPulseWidths] = useState<Map<string, number>>(new Map());
  const [busEvents, setBusEvents] = useState<SimulationBusEvent[]>([]);
  const [traceEvents, setTraceEvents] = useState<SimulationTraceEvent[]>([]);
  const [serialLines, setSerialLines] = useState<string[]>([]);
  const [serialConfig, setSerialConfig] = useState<SimulationSerialConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const worker = new Worker(new URL('../lib/simulator/avrWorker.ts', import.meta.url));

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'ready':
          setIsReady(true);
          break;
        case 'pin-change': {
          setDigitalPins((previous) => {
            const next = new Map(previous);
            next.set(message.pin, message.high);
            return next;
          });
          setElectricalPins((previous) => {
            const next = new Map(previous);
            next.set(message.pin, message.electricalState);
            return next;
          });
          setPinSnapshots((previous) => {
            const next = new Map(previous);
            next.set(message.pin, {
              pinId: message.pin,
              logicalState: message.high ? 'HIGH' : 'LOW',
              electricalState: message.electricalState,
              mode: modeFromElectricalState(message.electricalState),
              high: message.high,
              sources: ['avr-runtime'],
              cycle: message.cycle,
            });
            return next;
          });
          setTraceEvents((previous) => [
            ...previous.slice(-399),
            {
              id: `${message.pin}-${message.cycle}`,
              pin: message.pin,
              high: message.high,
              cycle: message.cycle,
              timestamp: Date.now(),
              electricalState: message.electricalState,
            },
          ]);

          if (message.high) {
            lastHighCycleRef.current.set(message.pin, message.cycle);
          } else {
            const startCycle = lastHighCycleRef.current.get(message.pin);
            if (typeof startCycle === 'number') {
              const pulseWidthMicros = Math.max(0, (message.cycle - startCycle) / 16);
              setPulseWidths((previous) => {
                const next = new Map(previous);
                next.set(message.pin, pulseWidthMicros);
                return next;
              });
              lastHighCycleRef.current.delete(message.pin);
            }
          }
          break;
        }
        case 'pin-state': {
          setElectricalPins((previous) => {
            const next = new Map(previous);
            next.set(message.pin, message.electricalState);
            return next;
          });
          setPinSnapshots((previous) => {
            const next = new Map(previous);
            next.set(message.pin, {
              pinId: message.pin,
              logicalState: logicalStateFromElectricalState(message.electricalState),
              electricalState: message.electricalState,
              mode: modeFromElectricalState(message.electricalState),
              high: message.electricalState === 'high' ? true : message.electricalState === 'low' ? false : null,
              sources: ['avr-runtime'],
              cycle: message.cycle,
            });
            return next;
          });
          break;
        }
        case 'serial-line':
          setSerialLines((previous) => [...previous.slice(-199), message.value]);
          break;
        case 'serial-config':
          setSerialConfig(message.config);
          break;
        case 'bus-event':
          setBusEvents((previous) => [...previous.slice(-199), message.event]);
          break;
        case 'serial-byte':
          break;
        case 'error':
          setError(message.message);
          setIsRunning(false);
          setIsReady(false);
          break;
        default:
          break;
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      setError(event.message || 'Unknown worker error');
      setIsRunning(false);
      setIsReady(false);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const clearRuntimeState = useCallback(() => {
    setDigitalPins(new Map());
    setElectricalPins(new Map());
    setPinSnapshots(new Map());
    setPulseWidths(new Map());
    setBusEvents([]);
    setTraceEvents([]);
    setSerialLines([]);
    setSerialConfig(null);
    lastHighCycleRef.current = new Map();
  }, []);

  const runHex = useCallback((hex: string) => {
    if (!workerRef.current) {
      setError('Worker is not initialised.');
      return;
    }

    setError(null);
    setIsRunning(true);
    setIsReady(false);
    clearRuntimeState();
    workerRef.current.postMessage({ type: 'run', hex } as WorkerInMessage);
  }, [clearRuntimeState]);

  const assembleAndRun = useCallback((asm: string) => {
    if (!workerRef.current) {
      setError('Worker is not initialised.');
      return;
    }

    setError(null);
    setIsRunning(true);
    setIsReady(false);
    clearRuntimeState();
    workerRef.current.postMessage({ type: 'assemble', asm } as WorkerInMessage);
  }, [clearRuntimeState]);

  const stop = useCallback(() => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'stop' } as WorkerInMessage);
    setIsRunning(false);
    setIsReady(false);
  }, []);

  const reset = useCallback(() => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'reset' } as WorkerInMessage);
    setIsRunning(false);
    setIsReady(false);
    setError(null);
    clearRuntimeState();
  }, [clearRuntimeState]);

  const sendSerialInput = useCallback((text: string) => {
    if (!workerRef.current || !text) {
      return;
    }

    workerRef.current.postMessage({ type: 'serial-input', text } as WorkerInMessage);
  }, []);

  const setDigitalInput = useCallback((pin: string | number, high: boolean) => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({
      type: 'set-digital-input',
      pin: normalizePinId(pin),
      high,
    } as WorkerInMessage);
  }, []);

  const setAnalogInput = useCallback((pin: string | number, value: number) => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({
      type: 'set-analog-input',
      pin: normalizePinId(pin),
      value,
    } as WorkerInMessage);
  }, []);

  return {
    digitalPins,
    electricalPins,
    pinSnapshots,
    pulseWidths,
    busEvents,
    traceEvents,
    serialLines,
    serialConfig,
    isRunning,
    isReady,
    error,
    runHex,
    assembleAndRun,
    stop,
    reset,
    sendSerialInput,
    setDigitalInput,
    setAnalogInput,
  };
}
