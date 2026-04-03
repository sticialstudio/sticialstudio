// src/lib/wiring/arduinoUnoBoard.tsx

import React from 'react';

export interface PinDefinition {
  x: number;
  y: number;
  label: string;
}

/**
 * CANONICAL WOKWI PIN MAPPING
 * 
 * Extracted from wokwi-elements (arduino-uno-element.ts)
 * ViewBox: -4 0 72.58 53.34 (mm)
 * Internal units: 10 mil (0.254mm)
 * Scale Factor: 0.72 (Internal units to 72DPI pixels)
 * Board Origin (0,0) maps to ViewBox (-4, 0)
 */
const S = 0.72;
const X_OFF_MM = 0; // Align (0,0) with PCB edge, not USB
const PX_PER_MM = 72 / 25.4;

const mapX = (internalX: number) => (internalX * 0.254 + X_OFF_MM) * PX_PER_MM;
const mapY = (internalY: number) => (internalY * 0.254) * PX_PER_MM;

export const ARDUINO_UNO_PINS: Record<string, PinDefinition> = {
  // Digital Header (Top)
  'SCL': { x: mapX(87), y: mapY(9), label: 'SCL' }, // A5.2
  'SDA': { x: mapX(97), y: mapY(9), label: 'SDA' }, // A4.2
  'AREF': { x: mapX(106), y: mapY(9), label: 'AREF' },
  'GND.1': { x: mapX(115.5), y: mapY(9), label: 'GND' },
  '13': { x: mapX(125), y: mapY(9), label: '13' },
  '12': { x: mapX(134.5), y: mapY(9), label: '12' },
  '11': { x: mapX(144), y: mapY(9), label: '11' },
  '10': { x: mapX(153.5), y: mapY(9), label: '10' },
  '9': { x: mapX(163), y: mapY(9), label: '9' },
  '8': { x: mapX(173), y: mapY(9), label: '8' },
  '7': { x: mapX(189), y: mapY(9), label: '7' },
  '6': { x: mapX(198.5), y: mapY(9), label: '6' },
  '5': { x: mapX(208), y: mapY(9), label: '5' },
  '4': { x: mapX(217.5), y: mapY(9), label: '4' },
  '3': { x: mapX(227), y: mapY(9), label: '3' },
  '2': { x: mapX(236.5), y: mapY(9), label: '2' },
  'TX': { x: mapX(246), y: mapY(9), label: 'TX' },
  'RX': { x: mapX(255.5), y: mapY(9), label: 'RX' },

  // Power Header (Bottom)
  'IOREF': { x: mapX(131), y: mapY(191.5), label: 'IOF' },
  'RESET.1': { x: mapX(140.5), y: mapY(191.5), label: 'RES' },
  '3.3V': { x: mapX(150), y: mapY(191.5), label: '3.3V' },
  '5V': { x: mapX(160), y: mapY(191.5), label: '5V' },
  'GND.2': { x: mapX(169.5), y: mapY(191.5), label: 'GND' },
  'GND.3': { x: mapX(179), y: mapY(191.5), label: 'GND' },
  'VIN': { x: mapX(188.5), y: mapY(191.5), label: 'VIN' },

  // Analog Header (Bottom)
  'A0': { x: mapX(208), y: mapY(191.5), label: 'A0' },
  'A1': { x: mapX(217.5), y: mapY(191.5), label: 'A1' },
  'A2': { x: mapX(227), y: mapY(191.5), label: 'A2' },
  'A3': { x: mapX(236.5), y: mapY(191.5), label: 'A3' },
  'A4': { x: mapX(246), y: mapY(191.5), label: 'A4' },
  'A5': { x: mapX(255.5), y: mapY(191.5), label: 'A5' },
};

const HeaderPin = ({ x, y, label, top }: { x: number; y: number; label: string; top: boolean }) => (
  <g>
    <rect x={x - 4.5} y={y - 4.5} width="9" height="9" rx="1" fill="#323844" />
    <circle cx={x} cy={y} r="2.3" fill="#f8fafc" />
    <text
      x={x}
      y={top ? y - 12 : y + 17}
      fill="#ecfeff"
      fontSize="8.5"
      textAnchor="middle"
      fontFamily="monospace"
      fontWeight="700"
    >
      {label}
    </text>
  </g>
);

export const ArduinoUnoVisual = ({ definition }: { definition: any }) => {
  const Arduino = 'wokwi-arduino-uno' as any;
  return (
    <div style={{ width: definition.width, height: definition.height, position: 'relative' }}>
      <Arduino style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export const ArduinoUnoSVG = ({
  width = 205.7,
  height = 151.2,
  x = 0,
  y = 0,
}: {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}) => {
  const topPins = Object.entries(ARDUINO_UNO_PINS).filter(([, pin]) => pin.y < 50);
  const bottomPins = Object.entries(ARDUINO_UNO_PINS).filter(([, pin]) => pin.y > 50);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={height} rx="4" fill="#1e293b" opacity="0.1" stroke="#334155" />
      {topPins.map(([key, pin]) => (
        <HeaderPin key={key} x={pin.x} y={pin.y} label="" top />
      ))}
      {bottomPins.map(([key, pin]) => (
        <HeaderPin key={key} x={pin.x} y={pin.y} label="" top={false} />
      ))}
    </g>
  );
};