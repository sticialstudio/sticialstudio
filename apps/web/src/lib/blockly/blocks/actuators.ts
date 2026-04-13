import { 
    getDigitalPinOptions, 
    getAnalogPinOptions, 
    getPWMPinOptions, 
    getLedInstances, 
    getServoInstances,
    getRelayInstances,
    getBuzzerInstances
} from '../dropdowns';

export const actuatorsBlocks = [
{
            type: "arduino_servo_init",
            message0: "attach servo %1 on pin %2",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getServoInstances },
                { type: "field_dropdown", name: "PIN", options: getPWMPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Initialize a servo motor on a PWM pin.",
            helpUrl: ""
        },
        {
            type: "arduino_servo_write",
            message0: "set %1 to %2 degrees",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getServoInstances },
                { type: "input_value", name: "ANGLE", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Write an angle (0-180) to a servo motor.",
            helpUrl: ""
        },
        {
            type: "arduino_servo_read",
            message0: "servo %1 angle",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getServoInstances }
            ],
            output: "Number",
            style: "motor_blocks",
            tooltip: "Read the last set angle of a servo motor.",
            helpUrl: ""
        },
{
            type: "arduino_relay_write",
            message0: "set relay %1 to %2",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getRelayInstances },
                { type: "field_dropdown", name: "STATE", options: [["ON", "HIGH"], ["OFF", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Turn a relay module on or off using a digital pin.",
            helpUrl: ""
        },
        {
            type: "arduino_buzzer_tone",
            message0: "play buzzer %1 frequency %2 Hz for %3 ms",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getBuzzerInstances },
                { type: "input_value", name: "FREQ", check: "Number" },
                { type: "input_value", name: "DURATION", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Play a tone on a passive buzzer.",
            helpUrl: ""
        },
        {
            type: "arduino_buzzer_stop",
            message0: "stop buzzer %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getBuzzerInstances }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Stop tone output on the buzzer pin.",
            helpUrl: ""
        },
{
            type: "motor_forward",
            message0: "Motor Forward pin1 %1 pin2 %2 speed %3",
            args0: [
                { type: "field_dropdown", name: "PIN1", options: getPWMPinOptions },
                { type: "field_dropdown", name: "PIN2", options: getDigitalPinOptions },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Drive a DC motor forward.",
            helpUrl: ""
        },
        {
            type: "motor_backward",
            message0: "Motor Backward pin1 %1 pin2 %2 speed %3",
            args0: [
                { type: "field_dropdown", name: "PIN1", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "PIN2", options: getPWMPinOptions },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Drive a DC motor backward.",
            helpUrl: ""
        },
        {
            type: "motor_stop",
            message0: "Motor Stop pin1 %1 pin2 %2",
            args0: [
                { type: "field_dropdown", name: "PIN1", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "PIN2", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Stop a DC motor.",
            helpUrl: ""
        },
        {
            type: "arduino_stepper_init",
            message0: "add stepper %1 steps %2 pins %3 %4",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["stepper_1", "stepper_1"], ["stepper_2", "stepper_2"]] },
                { type: "field_number", name: "STEPS", value: 200, min: 1 },
                { type: "field_dropdown", name: "PIN1", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "PIN2", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Initialize a 2-wire stepper motor.",
            helpUrl: ""
        },
        {
            type: "arduino_stepper_speed",
            message0: "set stepper %1 speed to %2 rpm",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["stepper_1", "stepper_1"], ["stepper_2", "stepper_2"]] },
                { type: "field_number", name: "RPM", value: 60, min: 1 }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Set the speed of a stepper motor in RPM.",
            helpUrl: ""
        },
        {
            type: "arduino_stepper_step",
            message0: "stepper %1 move %2 steps",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["stepper_1", "stepper_1"], ["stepper_2", "stepper_2"]] },
                { type: "input_value", name: "STEPS", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Move stepper motor a number of steps.",
            helpUrl: ""
        },
        {
            type: "arduino_l298n_init",
            message0: "attach L298N %1 ENA %2 ENB %3 IN1 %4 IN2 %5 IN3 %6 IN4 %7",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["l298n_1", "l298n_1"]] },
                { type: "field_dropdown", name: "ENA", options: getPWMPinOptions },
                { type: "field_dropdown", name: "ENB", options: getPWMPinOptions },
                { type: "field_dropdown", name: "IN1", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "IN2", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "IN3", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "IN4", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Initialize an L298N motor driver module.",
            helpUrl: ""
        },
        {
            type: "arduino_l298n_drive",
            message0: "set L298N %1 motor %2 to %3",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["l298n_1", "l298n_1"]] },
                { type: "field_dropdown", name: "MOTOR", options: [["A", "A"], ["B", "B"]] },
                { type: "field_dropdown", name: "DIR", options: [["forward", "FORWARD"], ["reverse", "REVERSE"], ["brake", "BRAKE"], ["stop", "STOP"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Drive an L298N motor channel with direction and PWM speed.",
            helpUrl: ""
        },
        {
            type: "arduino_l298n_speed",
            message0: "set L298N %1 motor %2 speed to %3",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["l298n_1", "l298n_1"]] },
                { type: "field_dropdown", name: "MOTOR", options: [["A", "A"], ["B", "B"]] },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Set the speed of an L298N motor channel (0-255).",
            helpUrl: ""
        },
{
            type: "arduino_afmotor_run",
            message0: "run motor %1 %2 with speed %3 %%",
            args0: [
                {
                    type: "field_dropdown",
                    name: "MOTOR",
                    options: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]
                },
                {
                    type: "field_dropdown",
                    name: "DIR",
                    options: [["forward", "FORWARD"], ["backward", "BACKWARD"], ["release", "RELEASE"]]
                },
                {
                    type: "input_value",
                    name: "SPEED",
                    check: "Number"
                }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Control a DC motor using Adafruit Motor Shield L293D",
            helpUrl: ""
        },
        {
            type: "arduino_led_set",
            message0: "set %1 to %2",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getLedInstances },
                { type: "field_dropdown", name: "STATE", options: [["ON", "HIGH"], ["OFF", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Turn a Light Emitting Diode (LED) on or off.",
            helpUrl: ""
        },
        {
            type: "arduino_traffic_light_set",
            message0: "set Traffic Light R %1 Y %2 G %3 to %4",
            args0: [
                { type: "field_dropdown", name: "R_PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "Y_PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "G_PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "STATE", options: [["Red", "RED"], ["Yellow", "YELLOW"], ["Green", "GREEN"], ["Off", "OFF"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "light_blocks",
            tooltip: "Control a 3-color traffic light module.",
            helpUrl: ""
        },
        {
            type: "arduino_rgb_set",
            message0: "set RGB LED R %1 G %2 B %3 values (R: %4 G: %5 B: %6)",
            args0: [
                { type: "field_dropdown", name: "R_PIN", options: getPWMPinOptions },
                { type: "field_dropdown", name: "G_PIN", options: getPWMPinOptions },
                { type: "field_dropdown", name: "B_PIN", options: getPWMPinOptions },
                { type: "input_value", name: "R_VAL", check: "Number" },
                { type: "input_value", name: "G_VAL", check: "Number" },
                { type: "input_value", name: "B_VAL", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "light_blocks",
            tooltip: "Set R, G, B colors on an RGB LED using PWM (0-255).",
            helpUrl: ""
        },
        {
            type: "arduino_water_pump_set",
            message0: "set Submersible Water Pump pin %1 state %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "STATE", options: [["ON", "HIGH"], ["OFF", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Turn a DC water pump on or off via relay/transistor.",
            helpUrl: ""
        },
        {
            type: "arduino_dc_motor_set",
            message0: "set DC Motor pin %1 speed %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getPWMPinOptions },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "motor_blocks",
            tooltip: "Control a generic DC motor speed (0-255).",
            helpUrl: ""
        },
        {
            type: "arduino_active_buzzer_set",
            message0: "set Active Buzzer pin %1 state %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "STATE", options: [["ON", "HIGH"], ["OFF", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Turn an active buzzer on or off.",
            helpUrl: ""
        }
];
