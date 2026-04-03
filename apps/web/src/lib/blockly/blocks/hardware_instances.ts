import * as Blockly from 'blockly';

import { getDigitalPinOptions, getPWMPinOptions } from '../dropdowns';
import {
  getDhtNamedInstanceOptions,
  getEncoderNamedInstanceOptions,
  getL298nNamedInstanceOptions,
  getServoNamedInstanceOptions,
  getSonarInstanceOptions,
  getStepperNamedInstanceOptions,
} from '../instanceRegistry';

const dynamicDropdown = (name: string) => ({ type: 'field_dropdown', name: 'NAME', options: [[name, name]] as [string, string][] });

export const hardwareInstanceBlocks = [
  {
    type: 'arduino_sonar_add',
    message0: 'add sonar %1 trig %2 echo %3',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'mySonar' },
      { type: 'field_dropdown', name: 'TRIG', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'ECHO', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'sensor_blocks',
    tooltip: 'Define a named HC-SR04 ultrasonic sensor.',
    helpUrl: '',
  },
  {
    type: 'arduino_sonar_read',
    extensions: ['dynamic_sonar_instance_extension'],
    message0: '%1 distance from %2',
    args0: [
      {
        type: 'field_dropdown',
        name: 'UNIT',
        options: [['cm', 'CM'], ['inches', 'INCH'], ['mm', 'MM']],
      },
      dynamicDropdown('mySonar'),
    ],
    output: 'Number',
    style: 'sensor_blocks',
    tooltip: 'Read distance from a named sonar sensor.',
    helpUrl: '',
  },
  {
    type: 'arduino_dht_named_add',
    message0: 'add DHT %1 %2 on pin %3',
    args0: [
      {
        type: 'field_dropdown',
        name: 'TYPE',
        options: [['DHT11', 'DHT11'], ['DHT22', 'DHT22'], ['DHT21', 'DHT21']],
      },
      { type: 'field_input', name: 'NAME', text: 'myDHT' },
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'sensor_blocks',
    tooltip: 'Define a named DHT temperature and humidity sensor.',
    helpUrl: '',
  },
  {
    type: 'arduino_dht_named_temp',
    extensions: ['dynamic_dht_instance_extension'],
    message0: 'temperature C from %1',
    args0: [dynamicDropdown('myDHT')],
    output: 'Number',
    style: 'sensor_blocks',
    tooltip: 'Read temperature in Celsius from a named DHT sensor.',
    helpUrl: '',
  },
  {
    type: 'arduino_dht_named_humidity',
    extensions: ['dynamic_dht_instance_extension'],
    message0: 'humidity from %1',
    args0: [dynamicDropdown('myDHT')],
    output: 'Number',
    style: 'sensor_blocks',
    tooltip: 'Read humidity from a named DHT sensor.',
    helpUrl: '',
  },
  {
    type: 'arduino_dht_named_temp_f',
    extensions: ['dynamic_dht_instance_extension'],
    message0: 'temperature F from %1',
    args0: [dynamicDropdown('myDHT')],
    output: 'Number',
    style: 'sensor_blocks',
    tooltip: 'Read temperature in Fahrenheit from a named DHT sensor.',
    helpUrl: '',
  },
  {
    type: 'arduino_encoder_add',
    message0: 'add encoder %1 clock %2 data %3',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myEncoder' },
      { type: 'field_dropdown', name: 'CLK', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'DT', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'sensor_blocks',
    tooltip: 'Define a named rotary encoder.',
    helpUrl: '',
  },
  {
    type: 'arduino_encoder_named_read',
    extensions: ['dynamic_encoder_instance_extension'],
    message0: 'read encoder %1',
    args0: [dynamicDropdown('myEncoder')],
    output: 'Number',
    style: 'sensor_blocks',
    tooltip: 'Read the current position from a named encoder.',
    helpUrl: '',
  },
  {
    type: 'arduino_encoder_reset',
    extensions: ['dynamic_encoder_instance_extension'],
    message0: 'reset encoder %1',
    args0: [dynamicDropdown('myEncoder')],
    previousStatement: null,
    nextStatement: null,
    style: 'sensor_blocks',
    tooltip: 'Reset a named encoder back to zero.',
    helpUrl: '',
  },
  {
    type: 'arduino_servo_attach',
    message0: 'attach servo %1 on pin %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myServo' },
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Attach a named servo motor to a pin.',
    helpUrl: '',
  },
  {
    type: 'arduino_servo_detach',
    extensions: ['dynamic_servo_instance_extension'],
    message0: 'detach servo %1',
    args0: [dynamicDropdown('myServo')],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Detach a named servo motor.',
    helpUrl: '',
  },
  {
    type: 'arduino_servo_set_angle',
    extensions: ['dynamic_servo_instance_extension'],
    message0: 'set servo %1 to %2 degrees',
    args0: [dynamicDropdown('myServo'), { type: 'input_value', name: 'ANGLE', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Move a named servo to an angle between 0 and 180.',
    helpUrl: '',
  },
  {
    type: 'arduino_servo_read_angle',
    extensions: ['dynamic_servo_instance_extension'],
    message0: 'angle of servo %1',
    args0: [dynamicDropdown('myServo')],
    output: 'Number',
    style: 'motor_blocks',
    tooltip: 'Read the current angle of a named servo.',
    helpUrl: '',
  },
  {
    type: 'arduino_stepper_add_2wire',
    message0: 'add stepper %1 steps %2 pin1 %3 pin2 %4',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myStepper' },
      { type: 'input_value', name: 'STEPS', check: 'Number' },
      { type: 'field_dropdown', name: 'PIN1', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'PIN2', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Define a 2-wire stepper motor.',
    helpUrl: '',
  },
  {
    type: 'arduino_stepper_add_4wire',
    message0: 'add stepper %1 steps %2 pins %3 %4 %5 %6',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myStepper' },
      { type: 'input_value', name: 'STEPS', check: 'Number' },
      { type: 'field_dropdown', name: 'PIN1', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'PIN2', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'PIN3', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'PIN4', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Define a 4-wire stepper motor.',
    helpUrl: '',
  },
  {
    type: 'arduino_stepper_set_speed',
    extensions: ['dynamic_stepper_instance_extension'],
    message0: 'set stepper %1 speed to %2 RPM',
    args0: [dynamicDropdown('myStepper'), { type: 'input_value', name: 'RPM', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Set the speed of a named stepper motor.',
    helpUrl: '',
  },
  {
    type: 'arduino_stepper_step_named',
    extensions: ['dynamic_stepper_instance_extension'],
    message0: 'move stepper %1 by %2 steps',
    args0: [dynamicDropdown('myStepper'), { type: 'input_value', name: 'STEPS', check: 'Number' }],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Move a named stepper motor by a number of steps.',
    helpUrl: '',
  },
  {
    type: 'arduino_l298n_attach',
    message0: 'attach L298N %1 enA %2 enB %3 in1 %4 in2 %5 in3 %6 in4 %7',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myL298N' },
      { type: 'field_dropdown', name: 'ENA', options: getPWMPinOptions },
      { type: 'field_dropdown', name: 'ENB', options: getPWMPinOptions },
      { type: 'field_dropdown', name: 'IN1', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'IN2', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'IN3', options: getDigitalPinOptions },
      { type: 'field_dropdown', name: 'IN4', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Configure a named L298N motor driver.',
    helpUrl: '',
  },
  {
    type: 'arduino_l298n_set_direction',
    extensions: ['dynamic_l298n_instance_extension'],
    message0: 'set %1 motor %2 to %3',
    args0: [
      dynamicDropdown('myL298N'),
      { type: 'field_dropdown', name: 'MOTOR', options: [['A', 'A'], ['B', 'B']] },
      { type: 'field_dropdown', name: 'DIR', options: [['forward', 'FORWARD'], ['backward', 'BACKWARD'], ['stop', 'STOP'], ['brake', 'BRAKE']] },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Set a named L298N motor direction.',
    helpUrl: '',
  },
  {
    type: 'arduino_l298n_set_speed',
    extensions: ['dynamic_l298n_instance_extension'],
    message0: 'set %1 motor %2 speed to %3',
    args0: [
      dynamicDropdown('myL298N'),
      { type: 'field_dropdown', name: 'MOTOR', options: [['A', 'A'], ['B', 'B']] },
      { type: 'input_value', name: 'SPEED', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'motor_blocks',
    tooltip: 'Set a named L298N motor PWM speed.',
    helpUrl: '',
  },
];

let hardwareInstanceExtensionsRegistered = false;

function registerInstanceExtension(name: string, options: () => [string, string][]) {
  Blockly.Extensions.register(name, function registerNamedInstanceField(this: Blockly.Block) {
    const field = this.getField('NAME') as Blockly.FieldDropdown | null;
    if (field) {
      (field as any).menuGenerator_ = options;
    }
  });
}

export function registerHardwareInstanceExtensions() {
  if (hardwareInstanceExtensionsRegistered) {
    return;
  }

  registerInstanceExtension('dynamic_sonar_instance_extension', getSonarInstanceOptions);
  registerInstanceExtension('dynamic_dht_instance_extension', getDhtNamedInstanceOptions);
  registerInstanceExtension('dynamic_encoder_instance_extension', getEncoderNamedInstanceOptions);
  registerInstanceExtension('dynamic_servo_instance_extension', getServoNamedInstanceOptions);
  registerInstanceExtension('dynamic_stepper_instance_extension', getStepperNamedInstanceOptions);
  registerInstanceExtension('dynamic_l298n_instance_extension', getL298nNamedInstanceOptions);

  hardwareInstanceExtensionsRegistered = true;
}

