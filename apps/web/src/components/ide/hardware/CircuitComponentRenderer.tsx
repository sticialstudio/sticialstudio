"use client";

import React from 'react';
import type { ComponentData } from '@/contexts/CircuitContext';
import type { ComponentDefinition } from '@/lib/wiring/componentDefinitions';

interface CircuitComponentRendererProps {
  component: ComponentData;
  definition: ComponentDefinition;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (event: React.MouseEvent) => void;
  onToggleButton?: () => void;
  onPotentiometerChange?: (value: number) => void;
}

function StaticSvg({ svg, width, height }: { svg: string; width: number; height: number }) {
  return (
    <div
      className="pointer-events-none h-full w-full"
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function LedVisual({ definition, outputHigh, color }: { definition: ComponentDefinition; outputHigh: boolean; color: string }) {
  const glowColor = color === 'green' ? 'rgba(34,197,94,0.42)' : color === 'blue' ? 'rgba(59,130,246,0.42)' : 'rgba(239,68,68,0.45)';

  return (
    <div className="relative h-full w-full">
      <div
        className="pointer-events-none absolute inset-0 rounded-full transition-all duration-150"
        style={{
          background: outputHigh ? `radial-gradient(circle at 50% 38%, ${glowColor} 0%, rgba(0,0,0,0) 62%)` : 'transparent',
          filter: outputHigh ? 'blur(10px)' : 'none',
          opacity: outputHigh ? 1 : 0,
        }}
      />
      <StaticSvg svg={definition.svg} width={definition.size.width} height={definition.size.height} />
      <span
        className={`absolute right-1 top-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${
          outputHigh ? 'bg-rose-500/20 text-rose-200' : 'bg-slate-800/80 text-slate-400'
        }`}
      >
        {outputHigh ? 'HIGH' : 'LOW'}
      </span>
    </div>
  );
}

function ButtonVisual({ definition, pressed, onToggle }: { definition: ComponentDefinition; pressed: boolean; onToggle?: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.();
      }}
      className={`relative h-full w-full rounded-2xl transition-transform duration-100 ${pressed ? 'translate-y-1' : 'translate-y-0'}`}
      aria-pressed={pressed}
    >
      <div className={`absolute inset-0 rounded-2xl ${pressed ? 'bg-cyan-400/10 shadow-[0_0_16px_rgba(34,211,238,0.18)]' : ''}`} />
      <StaticSvg svg={definition.svg} width={definition.size.width} height={definition.size.height} />
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-300">
        {pressed ? 'Pressed' : 'Released'}
      </span>
    </button>
  );
}

function PotentiometerVisual({
  definition,
  value,
  min,
  max,
  onChange,
}: {
  definition: ComponentDefinition;
  value: number;
  min: number;
  max: number;
  onChange?: (value: number) => void;
}) {
  const rotation = ((value - min) / Math.max(1, max - min)) * 270 - 135;

  return (
    <div className="relative h-full w-full">
      <StaticSvg svg={definition.svg} width={definition.size.width} height={definition.size.height} />
      <div
        className="pointer-events-none absolute left-[39px] top-[30px] h-8 w-8 rounded-full border-2 border-white/35"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="absolute left-1/2 top-0 h-3 w-1 -translate-x-1/2 rounded-full bg-slate-950" />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="absolute bottom-0 left-2 right-2 accent-orange-400"
      />
      <span className="absolute right-1 top-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold text-orange-200">
        {value}
      </span>
    </div>
  );
}

function ServoVisual({ definition, angle }: { definition: ComponentDefinition; angle: number }) {
  const boundedAngle = Math.max(0, Math.min(180, angle));
  const hornRotation = boundedAngle - 90;

  return (
    <div className="relative h-full w-full">
      <StaticSvg svg={definition.svg} width={definition.size.width} height={definition.size.height} />
      <div
        className="pointer-events-none absolute left-[44px] top-[4px] h-6 w-12 origin-[18px_18px] rounded-full border border-slate-300/70 bg-slate-100/90"
        style={{ transform: `rotate(${hornRotation}deg)` }}
      >
        <div className="absolute left-[16px] top-[7px] h-2 w-8 rounded-full bg-slate-300" />
      </div>
      <span className="absolute right-1 top-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold text-sky-200">
        {Math.round(boundedAngle)} deg
      </span>
    </div>
  );
}

export default function CircuitComponentRenderer({
  component,
  definition,
  isSelected,
  onClick,
  onMouseDown,
  onToggleButton,
  onPotentiometerChange,
}: CircuitComponentRendererProps) {
  const state = component.state || {};

  const content = (() => {
    switch (definition.id) {
      case 'LED':
        return <LedVisual definition={definition} outputHigh={Boolean(state.outputHigh)} color={String(state.color || 'red')} />;
      case 'BUTTON':
        return <ButtonVisual definition={definition} pressed={Boolean(state.pressed)} onToggle={onToggleButton} />;
      case 'POTENTIOMETER':
        return (
          <PotentiometerVisual
            definition={definition}
            value={Number(state.value ?? 512)}
            min={Number(state.min ?? 0)}
            max={Number(state.max ?? 1023)}
            onChange={onPotentiometerChange}
          />
        );
      case 'SERVO':
        return <ServoVisual definition={definition} angle={Number(state.angle ?? 90)} />;
      default:
        return <StaticSvg svg={definition.svg} width={definition.size.width} height={definition.size.height} />;
    }
  })();

  return (
    <div
      onMouseDown={(event) => {
        event.stopPropagation();
        onMouseDown?.(event);
        onClick?.();
      }}
      className={`absolute cursor-grab active:cursor-grabbing pointer-events-auto transition-shadow duration-200 ${
        isSelected ? 'rounded-2xl ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''
      }`}
      style={{
        left: component.x,
        top: component.y,
        width: definition.size.width,
        height: definition.size.height,
        transform: `rotate(${component.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: isSelected ? 50 : 10,
      }}
      data-component-id={component.id}
    >
      {content}
    </div>
  );
}
