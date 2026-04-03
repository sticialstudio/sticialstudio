'use client';

import React from 'react';

export interface CustomHardwarePin {
  id: string;
  label: string;
  cx: number;
  cy: number;
}

interface CustomHardwareWrapperProps {
  svgContent: string | React.ReactNode;
  x: number;
  y: number;
  pins: CustomHardwarePin[];
  onPinClick?: (pin: CustomHardwarePin, event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

function SvgContentRenderer({ svgContent }: { svgContent: string | React.ReactNode }) {
  if (typeof svgContent === 'string') {
    return (
      <div
        className="pointer-events-none block select-none"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  return (
    <div className="pointer-events-none block select-none" aria-hidden="true">
      {svgContent}
    </div>
  );
}

export default function CustomHardwareWrapper({
  svgContent,
  x,
  y,
  pins,
  onPinClick,
  className,
}: CustomHardwareWrapperProps) {
  return (
    <div
      className={`absolute inline-block ${className ?? ''}`}
      style={{ left: x, top: y }}
      data-hardware-wrapper="custom"
    >
      <div className="relative inline-block">
        <SvgContentRenderer svgContent={svgContent} />

        {pins.map((pin) => (
          <button
            key={pin.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPinClick?.(pin, event);
            }}
            className="group absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-rose-500/70 shadow-[0_0_0_1px_rgba(15,23,42,0.45)] transition-colors hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            style={{
              left: pin.cx,
              top: pin.cy,
            }}
            aria-label={pin.label}
            title={pin.label}
            data-pin-id={pin.id}
            data-pin-label={pin.label}
          >
            <span className="absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-100 shadow-lg group-hover:block group-focus:block">
              {pin.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}