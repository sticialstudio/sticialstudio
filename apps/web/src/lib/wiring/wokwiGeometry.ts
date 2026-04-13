export interface WokwiGeometryPin {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
}

export interface WokwiComponentGeometry {
  size: {
    width: number;
    height: number;
  };
  pins: WokwiGeometryPin[];
}

export const ARDUINO_UNO_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 274.318, height: 201.6 },
  pins: [
    { id: 'SCL', name: 'SCL', position: { x: 87, y: 9 } },
    { id: 'SDA', name: 'SDA', position: { x: 97, y: 9 } },
    { id: 'AREF', name: 'AREF', position: { x: 106, y: 9 } },
    { id: 'GND.1', name: 'GND', position: { x: 115.5, y: 9 } },
    { id: '13', name: '13', position: { x: 125, y: 9 } },
    { id: '12', name: '12', position: { x: 134.5, y: 9 } },
    { id: '11', name: '11', position: { x: 144, y: 9 } },
    { id: '10', name: '10', position: { x: 153.5, y: 9 } },
    { id: '9', name: '9', position: { x: 163, y: 9 } },
    { id: '8', name: '8', position: { x: 173, y: 9 } },
    { id: '7', name: '7', position: { x: 189, y: 9 } },
    { id: '6', name: '6', position: { x: 198.5, y: 9 } },
    { id: '5', name: '5', position: { x: 208, y: 9 } },
    { id: '4', name: '4', position: { x: 217.5, y: 9 } },
    { id: '3', name: '3', position: { x: 227, y: 9 } },
    { id: '2', name: '2', position: { x: 236.5, y: 9 } },
    { id: '1', name: 'TX', position: { x: 246, y: 9 } },
    { id: '0', name: 'RX', position: { x: 255.5, y: 9 } },
    { id: 'IOREF', name: 'IOREF', position: { x: 131, y: 191.5 } },
    { id: 'RESET', name: 'RESET', position: { x: 140.5, y: 191.5 } },
    { id: '3.3V', name: '3.3V', position: { x: 150, y: 191.5 } },
    { id: '5V', name: '5V', position: { x: 160, y: 191.5 } },
    { id: 'GND.2', name: 'GND', position: { x: 169.5, y: 191.5 } },
    { id: 'GND.3', name: 'GND', position: { x: 179, y: 191.5 } },
    { id: 'VIN', name: 'VIN', position: { x: 188.5, y: 191.5 } },
    { id: 'A0', name: 'A0', position: { x: 208, y: 191.5 } },
    { id: 'A1', name: 'A1', position: { x: 217.5, y: 191.5 } },
    { id: 'A2', name: 'A2', position: { x: 227, y: 191.5 } },
    { id: 'A3', name: 'A3', position: { x: 236.5, y: 191.5 } },
    { id: 'A4', name: 'A4', position: { x: 246, y: 191.5 } },
    { id: 'A5', name: 'A5', position: { x: 255.5, y: 191.5 } },
  ],
};

export const LED_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 40, height: 50 },
  pins: [
    { id: 'A', name: 'Anode', position: { x: 25, y: 42 } },
    { id: 'C', name: 'Cathode', position: { x: 15, y: 42 } },
  ],
};

export const BUTTON_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 67.28, height: 45.36 },
  pins: [
    { id: '1.l', name: '1.L', position: { x: 0, y: 13 } },
    { id: '2.l', name: '2.L', position: { x: 0, y: 32 } },
    { id: '1.r', name: '1.R', position: { x: 67, y: 13 } },
    { id: '2.r', name: '2.R', position: { x: 67, y: 32 } },
  ],
};

export const RESISTOR_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 59.13, height: 11.34 },
  pins: [
    { id: 'A', name: 'Side A', position: { x: 0, y: 5.65 } },
    { id: 'B', name: 'Side B', position: { x: 58.8, y: 5.65 } },
  ],
};

export const POTENTIOMETER_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 75.59, height: 75.59 },
  pins: [
    { id: 'GND', name: 'GND', position: { x: 29, y: 68.5 } },
    { id: 'OUT', name: 'OUT', position: { x: 39, y: 68.5 } },
    { id: 'VCC', name: 'VCC', position: { x: 49, y: 68.5 } },
  ],
};

export const SERVO_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 170.08, height: 119.55 },
  pins: [
    { id: 'GND', name: 'GND', position: { x: 0, y: 50 } },
    { id: 'VCC', name: 'VCC', position: { x: 0, y: 59.5 } },
    { id: 'PWM', name: 'PWM', position: { x: 0, y: 69 } },
  ],
};

export const ULTRASONIC_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 170.08, height: 94.49 },
  pins: [
    { id: 'VCC', name: 'VCC', position: { x: 71.3, y: 94.5 } },
    { id: 'TRIG', name: 'Trig', position: { x: 81.3, y: 94.5 } },
    { id: 'ECHO', name: 'Echo', position: { x: 91.3, y: 94.5 } },
    { id: 'GND', name: 'GND', position: { x: 101.3, y: 94.5 } },
  ],
};

export const DHT22_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 57.07, height: 116.73 },
  pins: [
    { id: 'VCC', name: 'VCC', position: { x: 15, y: 114.9 } },
    { id: 'DATA', name: 'DATA', position: { x: 24.5, y: 114.9 } },
    { id: 'NC', name: 'NC', position: { x: 34.1, y: 114.9 } },
    { id: 'GND', name: 'GND', position: { x: 43.8, y: 114.9 } },
  ],
};

export const OLED_GEOMETRY: WokwiComponentGeometry = {
  size: { width: 150, height: 116 },
  pins: [
    { id: 'SDA', name: 'SDA', position: { x: 36.5, y: 12.5 } },
    { id: 'SCL', name: 'SCL', position: { x: 45.5, y: 12.5 } },
    { id: 'VCC', name: 'VCC', position: { x: 93.5, y: 12.5 } },
    { id: 'GND', name: 'GND', position: { x: 103.5, y: 12 } },
  ],
};

export const WOKWI_COMPONENT_GEOMETRY = {
  ARDUINO_UNO: ARDUINO_UNO_GEOMETRY,
  LED: LED_GEOMETRY,
  BUTTON: BUTTON_GEOMETRY,
  RESISTOR: RESISTOR_GEOMETRY,
  POTENTIOMETER: POTENTIOMETER_GEOMETRY,
  SERVO: SERVO_GEOMETRY,
  ULTRASONIC: ULTRASONIC_GEOMETRY,
  DHT: DHT22_GEOMETRY,
  OLED: OLED_GEOMETRY,
} as const;

export type WokwiGeometryComponentId = keyof typeof WOKWI_COMPONENT_GEOMETRY;

export function getWokwiComponentGeometry(id: string) {
  return WOKWI_COMPONENT_GEOMETRY[id as WokwiGeometryComponentId] ?? null;
}
