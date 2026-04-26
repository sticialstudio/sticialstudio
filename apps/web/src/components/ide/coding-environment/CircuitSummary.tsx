"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { fadeInUp } from "@/components/ui/motion";
import { Cable, Cpu, PlugZap, RadioTower, SlidersHorizontal, Tv } from "lucide-react";
import { useCircuitStore } from '@/stores/circuitStore';
import { selectCircuitLabSimulationView, useSimulationStore } from '@/stores/simulationStore';
import { useShallow } from 'zustand/react/shallow';
import { getComponentDefinition } from "@/lib/wiring/componentDefinitions";
import { isComponentPowered } from "@/lib/wiring/componentConnectivity";
import { getComponentVisualState } from '@/lib/simulator/componentVisualState';

interface CodingEnvironmentSummaryProps {
  simulationError?: string | null;
  onBackToCircuitLab?: () => void;
}

const panelClass = 'rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,#10131f_0%,#090c16_100%)] px-4 py-4 shadow-[0_18px_46px_-36px_rgba(0,0,0,1)]';
const chipClass = 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300';

export default function CodingEnvironmentSummary({
  simulationError = null,
  onBackToCircuitLab,
}: CodingEnvironmentSummaryProps) {
  const components = useCircuitStore((state) => state.components);
  const nets = useCircuitStore((state) => state.nets);
  const codingSnapshot = useCircuitStore((state) => state.codingSnapshot);
  const resolvedConnections = useCircuitStore((state) => state.resolvedConnections);
  const updateComponentState = useCircuitStore((state) => state.updateComponentState);
  const simulationView = useSimulationStore(useShallow(selectCircuitLabSimulationView));

  const summary = useMemo(() => {
    const mappedEntries = codingSnapshot.components
      .filter((component) => component.isCodeReady)
      .map((component) => ({
        id: component.componentId,
        label: component.instanceLabel,
        primaryPin: component.primaryBoardPin,
        pins: Object.values(component.pinMappings)
          .filter((pin) => Boolean(pin.boardPinLabel))
          .map((pin) => `${pin.pinId}: ${pin.boardPinLabel}`),
      }));

    return {
      componentCount: components.length,
      netCount: nets.length,
      mappedPinCount: codingSnapshot.usedSignalPins.length,
      mappedEntries,
      mappingEntries: Object.entries(codingSnapshot.componentMappings),
    };
  }, [codingSnapshot, components.length, nets.length]);

  const simulationDevices = useMemo(
    () =>
      components
        .map((component) => {
          const definition = getComponentDefinition(component.type);
          if (!definition?.simulation) {
            return null;
          }

          return {
            component,
            definition,
            visualState: getComponentVisualState(component, simulationView),
            powered: isComponentPowered(component.type, resolvedConnections[component.id], simulationView),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    [components, resolvedConnections, simulationView]
  );

  const interactiveDevices = simulationDevices.filter(({ definition }) => {
    const simulationType = definition.simulation?.type;
    const simulationModel = definition.simulation?.model;
    return simulationType === 'button' || simulationType === 'pot' || simulationType === 'ultrasonic' || simulationModel === 'dht22';
  });

  const monitorDevices = simulationDevices.filter(({ definition }) => {
    const simulationType = definition.simulation?.type;
    return simulationType === 'servo' || simulationType === 'display' || simulationType === 'ultrasonic';
  });

  const simulationIsLive = simulationView.running || simulationView.ready;
  const activeNetCount = Object.values(simulationView.netStates).filter((state) => state !== 'FLOAT').length;
  const highPinCount = Object.values(simulationView.digitalPins).filter(Boolean).length;

  return (
    <motion.section
      className="overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,#10131f_0%,#090c16_100%)] px-5 py-5 shadow-[0_30px_80px_-56px_rgba(0,0,0,1)] sm:px-6 sm:py-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <Cpu size={13} className="text-cyan-300" />
            Live context
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Circuit summary</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={chipClass}>
            <PlugZap size={13} className="text-[var(--ui-color-primary)]" />
            {summary.mappedPinCount} linked
          </span>
          <span className={chipClass}>
            <Cable size={13} className="text-indigo-300" />
            {summary.netCount} nets
          </span>
          <span className={chipClass}>
            <RadioTower size={13} className={simulationIsLive ? 'text-[var(--ui-color-success)]' : 'text-[var(--ui-color-text-soft)]'} />
            {simulationIsLive ? 'Live' : 'Idle'}
          </span>
        </div>
      </div>

      {simulationError ? (
        <div className="mt-4 rounded-[18px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {simulationError}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">Code-ready parts</p>
                <p className="mt-1 text-sm text-slate-400">Parts already linked to board signals.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {summary.componentCount} parts
              </span>
            </div>

            {summary.componentCount > 0 ? (
              summary.mappedEntries.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.mappedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-slate-400"
                    >
                      <span className="font-semibold text-white">{entry.label}</span>
                      <span className="mx-2 text-[var(--ui-color-text-soft)]">•</span>
                      {entry.primaryPin || entry.pins.join(', ')}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
                  No signal mappings yet.
                  {onBackToCircuitLab ? (
                    <div className="mt-4">
                      <Button onClick={onBackToCircuitLab} className="min-h-10 rounded-[16px] px-4 py-2 text-sm">
                        Go to Circuit Lab
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            ) : (
              <div className="mt-4 rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
                No placed parts yet.
                {onBackToCircuitLab ? (
                  <div className="mt-4">
                    <Button onClick={onBackToCircuitLab} className="min-h-10 rounded-[16px] px-4 py-2 text-sm">
                      Go to Circuit Lab
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {summary.mappingEntries.length > 0 ? (
            <div className={panelClass}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">Resolved mapping</p>
              <div className="mt-3 space-y-2 font-mono text-[11px] leading-5 text-white">
                {summary.mappingEntries.map(([mappingKey, mapping]) => (
                  <div key={mappingKey} className="rounded-[14px] border border-white/10 bg-white/[0.06] px-3 py-2.5">
                    <span className="text-[var(--ui-color-primary)]">{mappingKey}</span>
                    <span className="mx-2 text-[var(--ui-color-text-soft)]">=</span>
                    <span>{mapping.pin ? `{ pin: \"${mapping.pin}\" }` : JSON.stringify(mapping.pins)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className={panelClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">
                  <SlidersHorizontal size={13} className="text-[var(--ui-color-accent)]" />
                  Inputs
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-400">Adjust live values from here.</p>
              </div>
              <div className="text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-color-text-soft)]">
                <div>{activeNetCount} active nets</div>
                <div>{highPinCount} high pins</div>
              </div>
            </div>

            {interactiveDevices.length > 0 ? (
              <div className="mt-4 space-y-3">
                {interactiveDevices.map(({ component, definition, powered, visualState }) => {
                  const state = visualState;
                  const poweredLabel = powered ? 'Powered' : simulationIsLive ? 'Unpowered' : 'Idle';
                  const poweredClass = powered
                    ? 'border-[color:var(--ui-color-success)]/20 bg-[color:var(--ui-color-success)]/10 text-[color:var(--ui-color-success)]'
                    : simulationIsLive
                      ? 'border-[color:var(--ui-color-warning)]/20 bg-[color:var(--ui-color-warning)]/10 text-[var(--ui-color-warning)]'
                      : 'border-white/10 bg-white/[0.04] text-[var(--ui-color-text-soft)]';

                  return (
                    <div key={component.id} className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{definition.name}</div>
                          <div className="text-[11px] text-[var(--ui-color-text-soft)]">{component.id}</div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${poweredClass}`}>
                          {poweredLabel}
                        </span>
                      </div>

                      {definition.simulation?.type === 'button' ? (
                        <Button
                          variant={state.pressed ? 'primary' : 'secondary'}
                          onClick={() => updateComponentState(component.id, { pressed: !Boolean(state.pressed) })}
                          className='min-h-10 rounded-[16px] px-4 py-2 text-sm'
                        >
                          {state.pressed ? 'Pressed' : 'Released'}
                        </Button>
                      ) : null}

                      {definition.simulation?.type === 'pot' ? (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-[11px] text-slate-400'>
                            <span>Value</span>
                            <span className='font-mono text-white'>{Number(state.value ?? 512)}</span>
                          </div>
                          <input
                            type='range'
                            min={0}
                            max={1023}
                            step={1}
                            value={Number(state.value ?? 512)}
                            onChange={(event) => updateComponentState(component.id, { value: Number(event.target.value) })}
                            className='h-2 w-full accent-[var(--ui-color-primary)]'
                          />
                        </div>
                      ) : null}

                      {definition.simulation?.type === 'ultrasonic' ? (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-[11px] text-slate-400'>
                            <span>Distance</span>
                            <span className='font-mono text-white'>{Number(state.distance ?? 100)} cm</span>
                          </div>
                          <input
                            type='range'
                            min={2}
                            max={400}
                            step={1}
                            value={Number(state.distance ?? 100)}
                            onChange={(event) => updateComponentState(component.id, { distance: Number(event.target.value) })}
                            className='h-2 w-full accent-[var(--ui-color-primary)]'
                          />
                        </div>
                      ) : null}

                      {definition.simulation?.model === 'dht22' ? (
                        <div className='space-y-3'>
                          <div>
                            <div className='mb-1 flex items-center justify-between text-[11px] text-slate-400'>
                              <span>Temperature</span>
                              <span className='font-mono text-white'>{Number(state.temperature ?? 24)} C</span>
                            </div>
                            <input
                              type='range'
                              min={-10}
                              max={80}
                              step={1}
                              value={Number(state.temperature ?? 24)}
                              onChange={(event) => updateComponentState(component.id, { temperature: Number(event.target.value) })}
                              className='h-2 w-full accent-[var(--ui-color-primary)]'
                            />
                          </div>
                          <div>
                            <div className='mb-1 flex items-center justify-between text-[11px] text-slate-400'>
                              <span>Humidity</span>
                              <span className='font-mono text-white'>{Number(state.humidity ?? 40)}%</span>
                            </div>
                            <input
                              type='range'
                              min={0}
                              max={100}
                              step={1}
                              value={Number(state.humidity ?? 40)}
                              onChange={(event) => updateComponentState(component.id, { humidity: Number(event.target.value) })}
                              className='h-2 w-full accent-[var(--ui-color-primary)]'
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='mt-4 rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400'>
                Add interactive parts in Circuit Lab to control them here.
              </div>
            )}
          </div>

          {monitorDevices.length > 0 ? (
            <div className={panelClass}>
              <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]'>
                <Tv size={13} className='text-[var(--ui-color-primary)]' />
                Outputs
              </div>
              <div className='mt-4 space-y-3'>
                {monitorDevices.map(({ component, definition, visualState }) => {
                  const state = visualState;
                  return (
                    <div key={component.id} className='rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-4'>
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <div className='text-sm font-semibold text-white'>{definition.name}</div>
                          <div className='text-[11px] text-[var(--ui-color-text-soft)]'>{component.id}</div>
                        </div>
                        {definition.simulation?.type === 'servo' ? (
                          <span className={chipClass}>{Math.round(Number(state.angle ?? 90))} deg</span>
                        ) : null}
                        {definition.simulation?.type === 'ultrasonic' ? (
                          <span className={chipClass}>{Boolean(state.echoActive) ? 'Echo pulse' : 'Echo idle'}</span>
                        ) : null}
                      </div>
                      {definition.simulation?.type === 'display' ? (
                        <div className='mt-3 rounded-[18px] border border-white/10 bg-[#081424] px-3 py-3 font-mono text-[11px] leading-5 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'>
                          {(Array.isArray(state.displayLines) ? state.displayLines : ['OLED', 'SIM OFF']).slice(0, 5).map((line, index) => (
                            <div key={`${component.id}-line-${index}`} className='truncate'>
                              {String(line || ' ')}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
