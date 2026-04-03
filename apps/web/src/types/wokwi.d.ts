import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wokwi-led': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        color?: string;
        value?: boolean | string;
        label?: string;
      };
      'wokwi-servo': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        angle?: number | string;
        label?: string;
      };
      'wokwi-hc-sr04': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        distance?: number | string;
        label?: string;
      };
      'wokwi-dht22': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        temperature?: number | string;
        humidity?: number | string;
        label?: string;
      };
      'wokwi-ssd1306': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
      };
      'wokwi-pushbutton': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        color?: string;
        value?: boolean | string;
        label?: string;
      };
      'wokwi-potentiometer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: number | string;
        min?: number | string;
        max?: number | string;
        label?: string;
      };
      'wokwi-arduino-uno': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        gnd?: string;
        '5v'?: string;
      };
      'wokwi-lcd1602': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
      };
      'wokwi-resistor': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
      };
      'wokwi-breadboard': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        rows?: string;
        columns?: string;
      };
    }
  }
}

export {};
