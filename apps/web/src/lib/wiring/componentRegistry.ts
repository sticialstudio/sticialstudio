// src/lib/wiring/componentRegistry.ts

export type PinType = 'VCC' | 'GND' | 'DIGITAL' | 'ANALOG' | 'PWM' | 'I2C_SDA' | 'I2C_SCL' | 'SPI_MOSI' | 'SPI_MISO' | 'SPI_SCK';

export interface ComponentPin {
  name: string; // e.g., 'VCC', 'TRIG', 'SDA'
  type: PinType;
  // If the pin is dynamically assigned via Blockly field, specify the field name here
  blocklyFieldName?: string; 
  // If the pin has a fixed hardware connection (e.g., I2C on Uno is A4/A5), specify it here
  fixedPin?: string;
}

export interface HardwareComponent {
  id: string; // Matches the Blockly block type, e.g., 'arduino_ultrasonic'
  name: string; // Human readable name
  imageType: 'ultrasonic' | 'led' | 'servo' | 'oled' | 'dht' | 'photo_resistor' | 'button' | 'generic';
  pins: ComponentPin[];
}

export const COMPONENT_REGISTRY: Record<string, HardwareComponent> = {
  // --- Sensors ---
  'arduino_ultrasonic': {
    id: 'arduino_ultrasonic',
    name: 'Ultrasonic Sensor (HC-SR04)',
    imageType: 'ultrasonic',
    pins: [
      { name: 'VCC', type: 'VCC' },
      { name: 'GND', type: 'GND' },
      { name: 'TRIG', type: 'DIGITAL', blocklyFieldName: 'TRIG_PIN' },
      { name: 'ECHO', type: 'DIGITAL', blocklyFieldName: 'ECHO_PIN' },
    ],
  },
  'arduino_dht_init': {
    id: 'arduino_dht_init',
    name: 'DHT Temperature/Humidity',
    imageType: 'dht',
    pins: [
      { name: 'VCC', type: 'VCC' },
      { name: 'GND', type: 'GND' },
      { name: 'DATA', type: 'DIGITAL', blocklyFieldName: 'PIN' },
    ],
  },
  'arduino_photo_sensor_read': {
    id: 'arduino_photo_sensor_read',
    name: 'Photoresistor (LDR)',
    imageType: 'photo_resistor',
    pins: [
      { name: 'VCC', type: 'VCC' },
      { name: 'GND', type: 'GND' },
      { name: 'SIG', type: 'ANALOG', blocklyFieldName: 'PIN' },
    ],
  },
  'arduino_button_read': {
    id: 'arduino_button_read',
    name: 'Push Button',
    imageType: 'button',
    pins: [
      { name: 'GND', type: 'GND' },
      { name: 'SIG', type: 'DIGITAL', blocklyFieldName: 'PIN' },
    ],
  },

  // --- Output & Motion ---
  'arduino_led_set': {
    id: 'arduino_led_set',
    name: 'LED',
    imageType: 'led',
    pins: [
      { name: 'GND', type: 'GND' },
      { name: 'SIG', type: 'DIGITAL', blocklyFieldName: 'PIN' },
    ],
  },
  'arduino_servo_write': {
    id: 'arduino_servo_write',
    name: 'Servo Motor',
    imageType: 'servo',
    pins: [
      { name: 'VCC', type: 'VCC' },
      { name: 'GND', type: 'GND' },
      { name: 'SIG', type: 'PWM', blocklyFieldName: 'PIN' },
    ],
  },

  // --- Displays ---
  'oled_init': {
    id: 'oled_init',
    name: 'OLED Display (I2C)',
    imageType: 'oled',
    pins: [
      { name: 'VCC', type: 'VCC' },
      { name: 'GND', type: 'GND' },
      { name: 'SCL', type: 'I2C_SCL', fixedPin: 'SCL' }, // Render logic will map 'SCL' to board-specific pin
      { name: 'SDA', type: 'I2C_SDA', fixedPin: 'SDA' },
    ],
  },
  'lcd_i2c_init': {
    id: 'lcd_i2c_init',
    name: 'LCD 16x2 (I2C)',
    imageType: 'generic',
    pins: [
      { name: 'VCC', type: 'VCC' },
      { name: 'GND', type: 'GND' },
      { name: 'SCL', type: 'I2C_SCL', fixedPin: 'SCL' },
      { name: 'SDA', type: 'I2C_SDA', fixedPin: 'SDA' },
    ],
  },
};
