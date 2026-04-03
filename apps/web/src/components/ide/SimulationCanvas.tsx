"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Cpu, Download, Info, Loader2, Play, RotateCcw, Square, Zap } from 'lucide-react';
import { useAvrSimulation } from '@/hooks/useAvrSimulation';
import { compileToHex } from '@/lib/simulator/compiler';
import { createSimulationRuntimeState, simulateCircuitTick } from '@/lib/simulator/circuitSimulation';
import { exportTraceEventsToVcd } from '@/lib/simulator/trace';
import { useCircuitStore } from '@/stores/circuitStore';
import {
  isComponentPowered,
  normalizeConnectedBoardPin,
  resolveMappedBoardPin,
} from '@/lib/wiring/componentConnectivity';
import { getComponentDefinition } from '@/lib/wiring/componentDefinitions';

interface LedRowProps {
  pin13High: boolean;
}

const LedRow = memo(function LedRow({ pin13High }: LedRowProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Pin 13 - Built-in LED
      </span>
      <div className="flex items-center gap-5">
        {/* @ts-expect-error wokwi-led is declared in wokwi.d.ts */}
        <wokwi-led color="red" value={pin13High ? '1' : '0'} label={pin13High ? 'HIGH' : 'LOW'} />
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-100 ${
            pin13High
              ? 'bg-red-500/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-slate-700/50 text-slate-500'
          }`}
        >
          {pin13High ? 'HIGH *' : 'LOW o'}
        </span>
      </div>
    </div>
  );
});

export interface SimulationCanvasControls {
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export interface SimulationCanvasStatus {
  isCompiling: boolean;
  isRunning: boolean;
  isReady: boolean;
  canStart: boolean;
  isLoaded: boolean;
  errorText: string | null;
}

export interface SimulationCanvasProps {
  sourceCode: string;
  boardName?: string;
  showHeader?: boolean;
  showInternalControls?: boolean;
  showBoard?: boolean;
  onRegisterControls?: (controls: SimulationCanvasControls | null) => void;
  onStatusChange?: (status: SimulationCanvasStatus) => void;
}

export default function SimulationCanvas({
  sourceCode,
  boardName = 'Arduino Uno',
  showHeader = true,
  showInternalControls = true,
  showBoard = true,
  onRegisterControls,
  onStatusChange,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDrivenInputsRef = useRef<Record<string, boolean>>({});
  const runtimeStateRef = useRef(createSimulationRuntimeState());
  const [wokwiLoaded, setWokwiLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [simulationTick, setSimulationTick] = useState(0);

  const components = useCircuitStore((state) => state.components);
  const netlist = useCircuitStore((state) => state.netlist);
  const resolvedConnections = useCircuitStore((state) => state.resolvedConnections);
  const updateComponentState = useCircuitStore((state) => state.updateComponentState);
  const setSimulationState = useCircuitStore((state) => state.setSimulationState);
  const resetSimulationState = useCircuitStore((state) => state.resetSimulationState);

  const {
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
    stop,
    reset,
    setDigitalInput,
    setAnalogInput,
  } = useAvrSimulation();

  const errorText = loadError || compileError || error || null;
  const canStart = wokwiLoaded && !isCompiling && !loadError;
  const isSimulationActive = isRunning || isReady;
  const avrDigitalPinState = useMemo(() => Object.fromEntries(digitalPins), [digitalPins]);
  const avrElectricalPinState = useMemo(() => Object.fromEntries(electricalPins), [electricalPins]);
  const avrPinSnapshots = useMemo(() => Object.fromEntries(pinSnapshots), [pinSnapshots]);
  const pulseWidthState = useMemo(() => Object.fromEntries(pulseWidths), [pulseWidths]);

  useEffect(() => {
    if (!isSimulationActive) {
      return;
    }

    const timer = window.setInterval(() => {
      setSimulationTick((current) => current + 1);
    }, 50);

    return () => window.clearInterval(timer);
  }, [isSimulationActive]);

  const simulationSnapshot = useMemo(
    () =>
      simulateCircuitTick({
        components,
        netlist,
        resolvedConnections,
        avrDigitalPins: avrDigitalPinState,
        avrElectricalPins: avrElectricalPinState,
        pulseWidths: pulseWidthState,
        runtimeState: runtimeStateRef.current,
        tick: simulationTick,
        boardName,
        busEvents,
        traceEvents,
      }),
    [avrDigitalPinState, avrElectricalPinState, boardName, busEvents, components, netlist, pulseWidthState, resolvedConnections, simulationTick, traceEvents]
  );

  useEffect(() => {
    runtimeStateRef.current = simulationSnapshot.runtimeState;
  }, [simulationSnapshot.runtimeState]);

  const livePinState = useMemo(
    () => ({
      running: isRunning,
      ready: isReady,
      error: errorText,
      digitalPins: {
        ...avrDigitalPinState,
        ...simulationSnapshot.boardPinStates,
      },
      pulseWidths: pulseWidthState,
      analogPins: simulationSnapshot.boardAnalogStates,
      netStates: simulationSnapshot.netStates,
      electricalPins: {
        ...avrElectricalPinState,
        ...simulationSnapshot.electricalPins,
      },
      pinDetails: {
        ...avrPinSnapshots,
        ...simulationSnapshot.pinDetails,
      },
      busEvents: simulationSnapshot.busEvents,
      traceEvents: simulationSnapshot.traceEvents,
      warnings: simulationSnapshot.warnings,
      capabilities: simulationSnapshot.capabilities,
    }),
    [
      avrDigitalPinState,
      avrElectricalPinState,
      avrPinSnapshots,
      errorText,
      isReady,
      isRunning,
      pulseWidthState,
      simulationSnapshot.boardAnalogStates,
      simulationSnapshot.boardPinStates,
      simulationSnapshot.busEvents,
      simulationSnapshot.capabilities,
      simulationSnapshot.electricalPins,
      simulationSnapshot.netStates,
      simulationSnapshot.pinDetails,
      simulationSnapshot.traceEvents,
      simulationSnapshot.warnings,
    ]
  );

  const analogInputs = simulationSnapshot.boardAnalogStates;

  const pin13High = livePinState.digitalPins['13'] ?? false;
  const drivenNetCount = Object.values(simulationSnapshot.netStates).filter((state) => state !== 'FLOAT').length;
  const highNetCount = Object.values(simulationSnapshot.netStates).filter((state) => state === 'HIGH').length;
  const lowNetCount = Object.values(simulationSnapshot.netStates).filter((state) => state === 'LOW').length;
  const warningCount = simulationSnapshot.warnings.length;
  const busEventCount = simulationSnapshot.busEvents.length;
  const serialLineCount = serialLines.length;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.customElements) {
      return;
    }

    let cancelled = false;

    import('@wokwi/elements')
      .then(() => {
        if (!cancelled) {
          setWokwiLoaded(true);
        }
      })
      .catch((loadFailure) => {
        console.error('[SimulationCanvas] Failed to load @wokwi/elements:', loadFailure);
        if (!cancelled) {
          setLoadError('Could not load simulator elements.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSimulationState({
      running: isRunning,
      ready: isReady,
      error: errorText,
      digitalPins: livePinState.digitalPins,
      pulseWidths: pulseWidthState,
      analogPins: analogInputs,
      netStates: simulationSnapshot.netStates,
      electricalPins: livePinState.electricalPins,
      pinDetails: livePinState.pinDetails,
      busEvents: simulationSnapshot.busEvents,
      traceEvents: simulationSnapshot.traceEvents,
      warnings: simulationSnapshot.warnings,
      capabilities: simulationSnapshot.capabilities,
    });
  }, [
    analogInputs,
    errorText,
    isReady,
    isRunning,
    livePinState.digitalPins,
    livePinState.electricalPins,
    livePinState.pinDetails,
    pulseWidthState,
    setSimulationState,
    simulationSnapshot.busEvents,
    simulationSnapshot.capabilities,
    simulationSnapshot.netStates,
    simulationSnapshot.traceEvents,
    simulationSnapshot.warnings,
  ]);

  useEffect(() => {
    if (!isSimulationActive) {
      if (Object.keys(lastDrivenInputsRef.current).length > 0) {
        Object.keys(lastDrivenInputsRef.current).forEach((pinId) => setDigitalInput(pinId, false));
        lastDrivenInputsRef.current = {};
      }
      return;
    }

    const nextInputs = Object.fromEntries(
      Object.entries(simulationSnapshot.boardInputStates).filter(
        ([pinId]) => !Object.prototype.hasOwnProperty.call(avrDigitalPinState, pinId)
      )
    );

    const previousInputs = lastDrivenInputsRef.current;
    const allPins = new Set([...Object.keys(previousInputs), ...Object.keys(nextInputs)]);
    allPins.forEach((pinId) => {
      const nextValue = nextInputs[pinId] ?? false;
      if (previousInputs[pinId] !== nextValue) {
        setDigitalInput(pinId, nextValue);
      }
    });

    lastDrivenInputsRef.current = nextInputs;
  }, [avrDigitalPinState, isSimulationActive, setDigitalInput, simulationSnapshot.boardInputStates]);

  useEffect(() => {
    if (!isSimulationActive) {
      return;
    }

    Object.entries(analogInputs).forEach(([pinId, value]) => {
      setAnalogInput(pinId, value);
    });
  }, [analogInputs, isSimulationActive, setAnalogInput]);

  useEffect(() => {
    Object.entries(simulationSnapshot.componentStatePatches).forEach(([componentId, patch]) => {
      updateComponentState(componentId, patch);
    });
  }, [simulationSnapshot.componentStatePatches, updateComponentState]);

  const resetComponentSimulationState = useCallback(
    (resetInputs: boolean) => {
      components.forEach((component) => {
        const definition = getComponentDefinition(component.type);
        if (!definition?.simulation) {
          return;
        }

        let patch: Record<string, unknown> | null = null;
        const defaults = definition.defaultProperties ?? {};

        if (definition.simulation.type === 'led') {
          patch = { outputHigh: false };
        } else if (definition.simulation.type === 'button') {
          patch = { pressed: resetInputs ? Boolean(defaults.pressed ?? false) : Boolean(component.state?.pressed ?? defaults.pressed ?? false) };
        } else if (definition.simulation.type === 'pot') {
          patch = { value: resetInputs ? Number(defaults.value ?? 512) : Number(component.state?.value ?? defaults.value ?? 512) };
        } else if (definition.simulation.type === 'servo') {
          patch = { angle: Number(defaults.angle ?? 90) };
        } else if (definition.simulation.type === 'ultrasonic') {
          patch = {
            distance: resetInputs ? Number(defaults.distance ?? 100) : Number(component.state?.distance ?? defaults.distance ?? 100),
            echoActive: false,
          };
        } else if (definition.simulation.model === 'dht22') {
          patch = {
            temperature: resetInputs ? Number(defaults.temperature ?? 24) : Number(component.state?.temperature ?? defaults.temperature ?? 24),
            humidity: resetInputs ? Number(defaults.humidity ?? 40) : Number(component.state?.humidity ?? defaults.humidity ?? 40),
            dataReady: false,
          };
        } else if (definition.simulation.type === 'display') {
          patch = {
            displayLines: [String(defaults.label ?? 'OLED').toUpperCase(), 'SIM OFF', '', '', ''],
          };
        }

        if (patch) {
          updateComponentState(component.id, patch);
        }
      });
    },
    [components, updateComponentState]
  );

  useEffect(() => {
    return () => {
      resetSimulationState();
      lastDrivenInputsRef.current = {};
      runtimeStateRef.current = createSimulationRuntimeState();
    };
  }, [resetSimulationState]);

  const handleDownloadTrace = useCallback(() => {
    if (traceEvents.length === 0) {
      return;
    }

    const vcd = exportTraceEventsToVcd(traceEvents, `${boardName.replace(/\s+/g, '')}Trace`);
    const blob = new Blob([vcd], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${boardName.replace(/\s+/g, '-').toLowerCase()}-trace.vcd`;
    link.click();
    URL.revokeObjectURL(url);
  }, [boardName, traceEvents]);

  const handleStart = useCallback(async () => {
    const cppCode = sourceCode?.trim();
    if (!cppCode) {
      setCompileError('No source code to compile.');
      return;
    }

    setCompileError(null);
    setIsCompiling(true);
    setSimulationTick(0);
    runtimeStateRef.current = createSimulationRuntimeState();
    resetComponentSimulationState(false);
    reset();

    try {
      const hex = await compileToHex(cppCode, boardName);
      runHex(hex);
    } catch (buildError) {
      const message = buildError instanceof Error ? buildError.message : 'Compilation failed.';
      setCompileError(message);
    } finally {
      setIsCompiling(false);
    }
  }, [boardName, reset, resetComponentSimulationState, runHex, sourceCode]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleReset = useCallback(() => {
    Object.keys(lastDrivenInputsRef.current).forEach((pinId) => setDigitalInput(pinId, false));
    lastDrivenInputsRef.current = {};
    runtimeStateRef.current = createSimulationRuntimeState();
    setSimulationTick(0);
    setCompileError(null);
    reset();
    resetSimulationState();
    resetComponentSimulationState(true);
  }, [reset, resetComponentSimulationState, resetSimulationState, setDigitalInput]);

  useEffect(() => {
    onRegisterControls?.({
      start: handleStart,
      stop: handleStop,
      reset: handleReset,
    });

    return () => {
      onRegisterControls?.(null);
    };
  }, [handleReset, handleStart, handleStop, onRegisterControls]);

  useEffect(() => {
    onStatusChange?.({
      isCompiling,
      isRunning,
      isReady,
      canStart,
      isLoaded: wokwiLoaded,
      errorText,
    });
  }, [canStart, errorText, isCompiling, isReady, isRunning, onStatusChange, wokwiLoaded]);

  const statusEl = (() => {
    if (compileError) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle size={12} />
          Build Failed
        </span>
      );
    }

    if (error) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle size={12} />
          {error}
        </span>
      );
    }

    if (isCompiling) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-400">
          <Loader2 size={12} className="animate-spin" />
          Compiling...
        </span>
      );
    }

    if (isReady) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={12} />
          Running - Netlist synced
        </span>
      );
    }

    if (isRunning) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Zap size={12} className="animate-pulse" />
          Starting...
        </span>
      );
    }

    return <span className="text-xs text-slate-500">Upload code to start simulation</span>;
  })();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10">
      {showHeader ? (
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/60 px-4 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Cpu size={13} className="text-emerald-400" />
            Simulator Preview
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Circuit Bridge
            </span>
          </div>

          <div className="flex items-center gap-3">
            {statusEl}
            {showInternalControls ? (
              <div className="flex items-center gap-2">
                {!isSimulationActive ? (
                  <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(52,211,153,0.2)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isCompiling ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                    {isCompiling ? 'Compiling...' : 'Upload & Simulate'}
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/25"
                  >
                    <Square size={11} />
                    Stop
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700/80"
                >
                  <RotateCcw size={11} />
                  Reset
                </button>
                {traceEvents.length > 0 ? (
                  <button
                    onClick={handleDownloadTrace}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500/25"
                  >
                    <Download size={11} />
                    Export VCD
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Info size={11} />
              {simulationSnapshot.capabilities.backend === 'avr8js' ? 'AVR8js + Circuit Lab' : simulationSnapshot.capabilities.note || 'Behavioral circuit bridge'}
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-auto p-8"
        style={{ background: 'radial-gradient(ellipse at center, #0f1a2e 0%, #0a0f1e 100%)' }}
      >
        {!wokwiLoaded && !loadError ? (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            <span className="text-xs">Loading simulator...</span>
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">
            {loadError}
          </div>
        ) : null}

        {compileError ? (
          <div className="w-full max-w-lg overflow-x-auto whitespace-pre-wrap rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 font-mono text-xs text-rose-300 shadow-lg">
            {compileError}
          </div>
        ) : null}

        {wokwiLoaded && !loadError ? (
          <div className={`flex flex-col items-center gap-10 transition-opacity duration-300 ${isCompiling ? 'opacity-50' : 'opacity-100'}`}>
            {showBoard ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {boardName}
                </span>
                {/* @ts-expect-error wokwi-arduino-uno is declared in wokwi.d.ts */}
                <wokwi-arduino-uno />
              </div>
            ) : null}

            <LedRow pin13High={pin13High} />

            <div className="grid w-full max-w-4xl gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/55 p-4 text-sm text-slate-300 sm:grid-cols-3 xl:grid-cols-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Driven nets</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{drivenNetCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">High / Low</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{highNetCount} / {lowNetCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Pulse captures</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{pulseWidths.size}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Bus events</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{busEventCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Serial lines</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{serialLineCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Warnings</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{warningCount}</p>
              </div>
            </div>

            {simulationSnapshot.warnings.length > 0 ? (
              <div className="w-full max-w-4xl rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left text-xs text-amber-200">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Simulation Warnings</p>
                <div className="mt-2 space-y-1">
                  {simulationSnapshot.warnings.slice(0, 4).map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {(serialConfig || serialLines.length > 0 || busEvents.length > 0) ? (
              <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/55 p-4 text-left text-xs text-slate-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Serial Monitor</p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {serialConfig ? `${serialConfig.baudRate} baud · ${serialConfig.bitsPerChar} data bits · ${serialConfig.parity}` : 'Waiting for serial configuration'}
                  </p>
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 font-mono text-[11px] text-emerald-300">
                    {serialLines.length > 0 ? serialLines.slice(-4).map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    )) : <p className="text-slate-500">No UART output yet.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/55 p-4 text-left text-xs text-slate-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Bus Inspector</p>
                  <div className="mt-3 space-y-2">
                    {busEvents.length > 0 ? busEvents.slice(-4).map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                        <p className="font-semibold text-slate-200">{event.summary}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{event.bus} · cycle {event.cycle}</p>
                      </div>
                    )) : <p className="text-slate-500">No I2C or SPI traffic yet.</p>}
                  </div>
                </div>
              </div>
            ) : null}

            {!isSimulationActive && !isCompiling && !compileError ? (
              <p className="max-w-md text-center text-[11px] leading-relaxed text-slate-600">
                Circuit Lab now resolves electrical states, captures bus traffic, and exports logic traces while keeping the browser simulation deterministic and classroom-friendly.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}








