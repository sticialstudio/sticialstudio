"use client";

import React from 'react';

interface WokwiComponentProps {
  type: string;
  x: number;
  y: number;
  rotation?: number;
  id?: string;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  state?: any;
}

const WokwiComponentFactory: React.FC<WokwiComponentProps> = ({
  type,
  x,
  y,
  rotation = 0,
  id,
  isSelected,
  onClick,
  onMouseDown,
  state
}) => {
  const renderComponent = () => {
    // Custom elements tags
    const Led = 'wokwi-led' as any;
    const Servo = 'wokwi-servo' as any;
    const Ultrasonic = 'wokwi-hc-sr04' as any;
    const Dht22 = 'wokwi-dht22' as any;
    const Oled = 'wokwi-ssd1306' as any;
    const Button = 'wokwi-pushbutton' as any;
    const Potentiometer = 'wokwi-potentiometer' as any;
    const Arduino = 'wokwi-arduino-uno' as any;
    const Lcd1602 = 'wokwi-lcd1602' as any;

    switch (type.toLowerCase()) {
      case 'led':
        return <Led color={state?.color || 'red'} value={state?.value} />;
      case 'servo':
      case 'micro-servo':
        return <Servo angle={state?.angle || 0} />;
      case 'ultrasonic':
      case 'hc-sr04':
        return <Ultrasonic distance={state?.distance || 10} />;
      case 'dht11':
      case 'dht22':
        return <Dht22 temperature={state?.temperature || 24} humidity={state?.humidity || 40} />;
      case 'oled':
      case 'ssd1306':
        return <Oled />;
      case 'button':
      case 'push-button':
        return <Button color={state?.color || 'green'} />;
      case 'potentiometer':
      case 'pot':
        return <Potentiometer value={state?.value || 0} />;
      case 'arduino':
      case 'uno':
        return <Arduino />;
      case 'lcd1602':
        return <Lcd1602 />;
      default:
        return (
          <div className="flex items-center justify-center rounded border border-dashed border-slate-500 bg-slate-800/50 p-2 text-[10px] text-slate-400">
            Unknown: {type}
          </div>
        );
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown?.(e);
        onClick?.();
      }}
      className={`absolute cursor-grab active:cursor-grabbing transition-shadow duration-200 pointer-events-auto ${
        isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 rounded-sm' : ''
      }`}
      style={{
        left: x,
        top: y,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: isSelected ? 50 : 10,
      }}
      data-component-id={id}
    >
      {renderComponent()}
    </div>
  );
};

export default WokwiComponentFactory;
