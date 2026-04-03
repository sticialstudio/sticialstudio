"use client";

import React, { useMemo, useState, useRef } from 'react';
import { extractHardwareComponents } from '@/lib/wiring/workspaceParser';
import { ARDUINO_UNO_PINS, ArduinoUnoSVG } from '@/lib/wiring/arduinoUnoBoard';
import { BreadboardSVG, generateBreadboardAnchors, BREADBOARD_CONFIG, BreadboardAnchor } from '@/lib/wiring/BreadboardSVG';
import { 
    UltrasonicSensorSvg, 
    LedSvg, 
    ServoSvg, 
    Dht11Svg, 
    OledSvg, 
    GenericComponentSvg 
} from '@/lib/wiring/HardwareSvgLibrary';

interface WiringDiagramViewerProps {
  blocklyXml: string;
  board: string;
}

type WireColor = 'VCC' | 'GND' | 'SIGNAL';

const getWireColorHex = (type: WireColor, index: number = 0) => {
    if (type === 'VCC') return '#EF4444'; // Red
    if (type === 'GND') return '#171717'; // Almost black
    
    // Signal Colors Array for variety
    const signalColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06b6d4'];
    return signalColors[index % signalColors.length];
}

/**
 * Creates an orthogonal (90-degree) path between two points.
 * Optimized for breadboard jumpers where we want wires to route neatly.
 */
const createJumperPath = (startX: number, startY: number, endX: number, endY: number, collisionOffset: number = 0) => {
    const isTargetVeryHigh = endY < startY; 
    const isTargetLeft = endX < startX;

    // Default route: Down, Across, Down
    let midY = startY + 30 + (collisionOffset * 5); 

    if (isTargetVeryHigh) {
        // If target is above, route UP and around to avoid crossing the whole breadboard face
        midY = startY - 30 - (collisionOffset * 5); 
    }

    // Add bezier curves to the corners of the jumper wires so they look like flexible cables, not rigid PCB traces
    const radius = 10;
    
    // Fallback if distance is too short for curves
    if (Math.abs(startX - endX) < radius * 2 || Math.abs(startY - endY) < radius * 2) {
       return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
    }

    return `M ${startX} ${startY} 
            L ${startX} ${midY - (isTargetVeryHigh ? -radius : radius)} 
            Q ${startX} ${midY} ${startX + (isTargetLeft ? -radius : radius)} ${midY}
            L ${endX - (isTargetLeft ? -radius : radius)} ${midY} 
            Q ${endX} ${midY} ${endX} ${midY + (isTargetVeryHigh ? -radius : radius)}
            L ${endX} ${endY}`;
}

const renderHardwareSvg = (imageType: string, name: string) => {
    switch (imageType) {
        case 'ultrasonic': return <UltrasonicSensorSvg />;
        case 'led': return <LedSvg />;
        case 'servo': return <ServoSvg />;
        case 'dht': return <Dht11Svg />;
        case 'oled': return <OledSvg />;
        default: return <GenericComponentSvg name={name} />;
    }
}

export default function WiringDiagramViewer({ blocklyXml, board }: WiringDiagramViewerProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.85 });
  const isDragging = useRef(false);
  const startPanPos = useRef({ x: 0, y: 0 });

  const components = useMemo(() => extractHardwareComponents(blocklyXml), [blocklyXml]);
  const isArduinoUno = board.toLowerCase().includes('arduino uno');

  // Layout Configuration
  const SVG_WIDTH = 1200; 
  const SVG_HEIGHT = 1000;
  
  // Placement
  const BOARD_X = SVG_WIDTH / 2 - 200; 
  const BOARD_Y = 650; 
  
  const BREADBOARD_X = SVG_WIDTH / 2 - (BREADBOARD_CONFIG.width / 2);
  const BREADBOARD_Y = 250;

  // Generate logical anchors for the breadboard at its rendered position
  const bbAnchors = useMemo(() => generateBreadboardAnchors(BREADBOARD_X, BREADBOARD_Y), [BREADBOARD_X, BREADBOARD_Y]);

  if (!isArduinoUno) {
      return (
          <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
              <p>Realistic wiring diagrams are currently only available for the Arduino Uno.</p>
          </div>
      )
  }

  const wires: React.ReactNode[] = [];
  const peripheralNodes: React.ReactNode[] = [];

  // --- 1. CORE POWER DISTRIBUTION ---
  // Arduino 5V -> Breadboard Bottom + (Column 2)
  const uno5v = ARDUINO_UNO_PINS['5V'];
  const bb5vIn = bbAnchors['RAIL_BOT_PLUS_2'];
  if (uno5v && bb5vIn) wires.push(<path key="sys_5v" d={createJumperPath(BOARD_X + uno5v.x, BOARD_Y + uno5v.y, bb5vIn.x, bb5vIn.y, 1)} fill="none" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" opacity="0.9" />);

  // Arduino GND -> Breadboard Bottom - (Column 4)
  const unoGnd = ARDUINO_UNO_PINS['GND_1'];
  const bbGndIn = bbAnchors['RAIL_BOT_MINUS_4'];
  if (unoGnd && bbGndIn) wires.push(<path key="sys_gnd" d={createJumperPath(BOARD_X + unoGnd.x, BOARD_Y + unoGnd.y, bbGndIn.x, bbGndIn.y, 2)} fill="none" stroke="#171717" strokeWidth="5" strokeLinecap="round" opacity="0.9" />);

  // Tie Breadboard Bottom Rails to Top Rails (Column 29)
  const bbBotPlus = bbAnchors['RAIL_BOT_PLUS_29'];
  const bbTopPlus = bbAnchors['RAIL_TOP_PLUS_29'];
  if (bbBotPlus && bbTopPlus) wires.push(<path key="bb_tie_plus" d={createJumperPath(bbBotPlus.x, bbBotPlus.y, bbTopPlus.x, bbTopPlus.y, 8)} fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" opacity="0.9" />);

  const bbBotMinus = bbAnchors['RAIL_BOT_MINUS_28'];
  const bbTopMinus = bbAnchors['RAIL_TOP_MINUS_28'];
  if (bbBotMinus && bbTopMinus) wires.push(<path key="bb_tie_minus" d={createJumperPath(bbBotMinus.x, bbBotMinus.y, bbTopMinus.x, bbTopMinus.y, 9)} fill="none" stroke="#171717" strokeWidth="4" strokeLinecap="round" opacity="0.9" />);


  // --- 2. COMPONENT PLACEMENT & SIGNAL ROUTING ---
  // We place components floating just above the breadboard, and map their pins to specific columns
  const COMPONENT_START_Y = BREADBOARD_Y - 90;
  
  // Allocate ~5 breadboard columns per component logically to space them out
  let currentBreadboardColumn = 5; 

  let signalWireCount = 0; // Used for coloring

  components.forEach((comp, compIndex) => {
      // Calculate component X based on its assigned breadboard column
      const assignedAnchor = bbAnchors[`STRIP_${currentBreadboardColumn}_A`];
      const nodeX = (assignedAnchor ? assignedAnchor.x : BREADBOARD_X + 50) - 30; // Center comp over the column
      const nodeY = COMPONENT_START_Y;
      
      const nodeWidth = 80; // Estimated visual center grouping for SVG
      
      // Render the Component Artwork
      peripheralNodes.push(
          <g key={`comp_node_${comp.instanceId}`} transform={`translate(${nodeX}, ${nodeY})`}>
              {renderHardwareSvg(comp.imageType, comp.name)}
          </g>
      );

      const pinCount = comp.pins.length;
      const pinSpacing = nodeWidth / (pinCount + 1);

      comp.pins.forEach((pin, pinIndex) => {
          const isVCC = pin.type === 'VCC';
          const isGND = pin.type === 'GND';
          const pinColorHex = getWireColorHex(isVCC ? 'VCC' : isGND ? 'GND' : 'SIGNAL', signalWireCount);
          if (!isVCC && !isGND) signalWireCount++;

          const componentPinX = nodeX + (pinSpacing * (pinIndex + 1)) + 15;
          const componentPinY = nodeY + 80;

          // Target on the breadboard
          let bbTargetAnchor: BreadboardAnchor | undefined;
          
          if (isVCC) {
            bbTargetAnchor = bbAnchors[`RAIL_TOP_PLUS_${currentBreadboardColumn + pinIndex}`];
          } else if (isGND) {
            bbTargetAnchor = bbAnchors[`RAIL_TOP_MINUS_${currentBreadboardColumn + pinIndex}`];
          } else {
            // Signal pin: Route into row A
            bbTargetAnchor = bbAnchors[`STRIP_${currentBreadboardColumn + pinIndex}_A`];
          }

          // A: Short leg from Component -> Breadboard hole
          if (bbTargetAnchor) {
            wires.push(
               <line 
                  key={`leg_${comp.instanceId}_${pin.name}`}
                  x1={componentPinX} y1={componentPinY} 
                  x2={bbTargetAnchor.x} y2={bbTargetAnchor.y}
                  stroke={pinColorHex} strokeWidth="3" opacity="0.8"
               />
            );
          }

          // B: If Signal, jump from Breadboard -> Arduino
          if (!isVCC && !isGND) {
              const targetPinLabel = comp.extractedPins[pin.name]; 
              if (targetPinLabel) {
                  let anchorKey = targetPinLabel.toUpperCase();
                  if (pin.name === 'SCL') anchorKey = 'A5'; 
                  if (pin.name === 'SDA') anchorKey = 'A4';
    
                  const unoAnchor = ARDUINO_UNO_PINS[anchorKey];
                  
                  // Start jumping from row E on the same column
                  const bbJumpStart = bbAnchors[`STRIP_${currentBreadboardColumn + pinIndex}_E`];

                  if (unoAnchor && bbJumpStart) {
                      const boardPinX = BOARD_X + unoAnchor.x;
                      const boardPinY = BOARD_Y + unoAnchor.y;
    
                      wires.push(
                          <path 
                              key={`jump_${comp.instanceId}_${pin.name}`}
                              d={createJumperPath(bbJumpStart.x, bbJumpStart.y, boardPinX, boardPinY, compIndex + pinIndex + 3)}
                              fill="none"
                              stroke={pinColorHex}
                              strokeWidth="4"
                              opacity="0.9"
                          />
                      );
                  }
              }
          }
      });

      // Advance column allocation for the next component
      currentBreadboardColumn += Math.max(6, pinCount + 2); 
  });

  // --- Handlers for Panning & Zooming ---
  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const scaleAdj = e.deltaY > 0 ? 0.9 : 1.1; 
      setTransform(prev => ({ ...prev, scale: Math.max(0.3, Math.min(3, prev.scale * scaleAdj)) }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      startPanPos.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      setTransform(prev => ({ 
          ...prev, 
          x: e.clientX - startPanPos.current.x, 
          y: e.clientY - startPanPos.current.y 
      }));
  };

  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-900 select-none">
      <div className="z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-slate-800 px-4 shadow-sm">
        <h3 className="text-sm font-semibold tracking-wide text-slate-200">
          Hardware Schematic âš¡
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Scroll to Zoom, Click & Drag to Pan</span>
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            {components.length} Components
          </span>
        </div>
      </div>
      
      {/* Interactive Canvas Container */}
      <div 
        className="flex-1 overflow-hidden" 
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      >
          {/* Main SVG Coordinate Space */}
          <svg width="100%" height="100%" style={{ backgroundColor: '#0f172a' }}>
              <defs>
                  <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.08" />
                  </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

              {/* Pan & Zoom Transform Group */}
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                  
                  {/* Underlay / Breadboard */}
                  <BreadboardSVG x={BREADBOARD_X} y={BREADBOARD_Y} />

                  {/* Wire Layer */}
                  {wires}
                  
                  {/* Microcontroller Layer */}
                  <ArduinoUnoSVG x={BOARD_X} y={BOARD_Y} />

                  {/* Peripheral Hardware Components Top Layer */}
                  {peripheralNodes}
              </g>
          </svg>
      </div>
    </div>
  );
}

