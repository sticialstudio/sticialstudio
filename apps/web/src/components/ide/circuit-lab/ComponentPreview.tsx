"use client";

import React, { useEffect, useMemo } from 'react';

import { BreadboardSVG } from '@/lib/wiring/BreadboardSVG';
import type { ComponentDefinition } from '@/lib/wiring/componentDefinitions';

interface ComponentPreviewProps {
  definition: ComponentDefinition;
  className?: string;
}

const PREVIEW_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

const WOKWI_PREVIEW_COMPONENTS = new Set([
  'ARDUINO_UNO',
  'LED',
  'BUTTON',
  'RESISTOR',
  'POTENTIOMETER',
  'SERVO',
  'ULTRASONIC',
  'DHT',
  'OLED',
]);

function PreviewFrame({
  definition,
  children,
}: {
  definition: ComponentDefinition;
  children: React.ReactNode;
}) {
  const aspectRatio = Math.max(definition.size.width / Math.max(definition.size.height, 1), 0.2);
  const width = aspectRatio >= 1 ? '100%' : `${aspectRatio * 100}%`;
  const height = aspectRatio >= 1 ? `${(1 / aspectRatio) * 100}%` : '100%';

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative max-h-full max-w-full" style={{ width, height }}>
        {children}
      </div>
    </div>
  );
}

function StaticSvgPreview({ svg }: { svg: string }) {
  const normalizedSvg = useMemo(() => {
    if (!svg.includes('<svg')) {
      return svg;
    }

    return svg.replace(
      '<svg ',
      '<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block" '
    );
  }, [svg]);

  return <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: normalizedSvg }} />;
}

function BreadboardPreview() {
  return (
    <svg viewBox="0 0 652.8 201.6" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <BreadboardSVG />
    </svg>
  );
}

function WokwiPreview({ definition }: { definition: ComponentDefinition }) {
  const { width, height } = definition.size;
  const content = (() => {
    switch (definition.id) {
      case 'ARDUINO_UNO': {
        const Arduino = 'wokwi-arduino-uno' as React.ElementType;
        return <Arduino style={PREVIEW_STYLE} />;
      }
      case 'LED': {
        const Led = 'wokwi-led' as React.ElementType;
        return <Led color="red" style={PREVIEW_STYLE} />;
      }
      case 'BUTTON': {
        const Button = 'wokwi-pushbutton' as React.ElementType;
        return <Button color="slategray" style={PREVIEW_STYLE} />;
      }
      case 'RESISTOR': {
        const Resistor = 'wokwi-resistor' as React.ElementType;
        return <Resistor value="220" style={PREVIEW_STYLE} />;
      }
      case 'POTENTIOMETER': {
        const Potentiometer = 'wokwi-potentiometer' as React.ElementType;
        return <Potentiometer value={512} min={0} max={1023} style={PREVIEW_STYLE} />;
      }
      case 'SERVO': {
        const Servo = 'wokwi-servo' as React.ElementType;
        return <Servo angle={90} style={PREVIEW_STYLE} />;
      }
      case 'ULTRASONIC': {
        const Ultrasonic = 'wokwi-hc-sr04' as React.ElementType;
        return <Ultrasonic style={PREVIEW_STYLE} />;
      }
      case 'DHT': {
        const Dht = 'wokwi-dht22' as React.ElementType;
        return <Dht style={PREVIEW_STYLE} />;
      }
      case 'OLED': {
        const Oled = 'wokwi-ssd1306' as React.ElementType;
        return <Oled style={PREVIEW_STYLE} />;
      }
      default:
        return null;
    }
  })();

  if (!content) {
    return null;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <foreignObject width={width} height={height}>{content}</foreignObject>
    </svg>
  );
}

export default function ComponentPreview({ definition, className = '' }: ComponentPreviewProps) {
  useEffect(() => {
    if (!WOKWI_PREVIEW_COMPONENTS.has(definition.id)) {
      return;
    }

    void import('@wokwi/elements').catch((error) => {
      console.error('Failed to load Wokwi elements for component previews', error);
    });
  }, [definition.id]);

  if (definition.id === 'BREADBOARD') {
    return (
      <PreviewFrame definition={definition}>
        <BreadboardPreview />
      </PreviewFrame>
    );
  }

  if (WOKWI_PREVIEW_COMPONENTS.has(definition.id)) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        <PreviewFrame definition={definition}>
          <WokwiPreview definition={definition} />
        </PreviewFrame>
      </div>
    );
  }

  if (definition.svg) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <StaticSvgPreview svg={definition.svg} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-900/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {definition.name}
      </div>
    </div>
  );
}