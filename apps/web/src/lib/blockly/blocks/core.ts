import { getDigitalPinOptions, getAnalogPinOptions, getPWMPinOptions } from '../dropdowns';

export const coreBlocks = [
{
            type: "arduino_setup_loop",
            message0: "legacy setup %1 %2 loop %3 %4",
            args0: [
                { type: "input_dummy" },
                { type: "input_statement", name: "SETUP" },
                { type: "input_dummy" },
                { type: "input_statement", name: "LOOP" }
            ],
            style: "setup_blocks",
            tooltip: "Legacy combined root block kept for older projects. New projects should use on start and forever.",
            helpUrl: ""
        },
        // Root blocks (Code Kit style â€” two independent root blocks)
        {
            type: "arduino_on_start",
            message0: "on start %1 %2",
            args0: [
                { type: "input_dummy" },
                { type: "input_statement", name: "SETUP" }
            ],
            style: "setup_blocks",
            tooltip: "Blocks inside here run once when the board starts.",
            helpUrl: ""
        },
        {
            type: "arduino_forever",
            message0: "forever %1 %2",
            args0: [
                { type: "input_dummy" },
                { type: "input_statement", name: "LOOP" }
            ],
            style: "loop_blocks",
            tooltip: "Blocks inside here run continuously in a loop.",
            helpUrl: ""
        },
        // Digital I/O
        {
            type: "arduino_pinMode",
            message0: "set pin %1 to %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "MODE", options: [["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"], ["INPUT_PULLUP", "INPUT_PULLUP"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Configures the specified pin to behave either as an input or an output.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/"
        },
        {
            type: "arduino_digitalWrite",
            message0: "digital write pin %1 to %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "STATE", options: [["HIGH", "HIGH"], ["LOW", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Write a HIGH or a LOW value to a digital pin.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/"
        },
        {
            type: "arduino_digitalRead",
            message0: "digital read pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions }
            ],
            output: "Number",
            style: "io_blocks",
            tooltip: "Read digital value from a pin.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/"
        },
        {
            type: "arduino_analogRead",
            message0: "analog read pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getAnalogPinOptions }
            ],
            output: "Number",
            style: "io_blocks",
            tooltip: "Read analog value from a pin (0-1023).",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/"
        },
        {
            type: "arduino_analogWrite",
            message0: "analog write pin %1 value %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getPWMPinOptions },
                { type: "input_value", name: "VALUE", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "io_blocks",
            tooltip: "Write an analog (PWM) value to a pin (0-255).",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/"
        },
        // Timing
        {
            type: "arduino_delay",
            message0: "wait %1 milliseconds",
            args0: [
                { type: "field_number", name: "MS", value: 1000, min: 0 }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "timing_blocks",
            tooltip: "Pauses the program for the amount of time (in milliseconds).",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/time/delay/"
        },
        {
            type: "arduino_millis",
            message0: "current time (milliseconds)",
            output: "Number",
            style: "timing_blocks",
            tooltip: "Returns the number of milliseconds passed since the board began running the current program.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/time/millis/"
        },
        // Communication
        {
            type: "arduino_serialBegin",
            message0: "Serial begin at baud %1",
            args0: [
                { type: "field_dropdown", name: "BAUD", options: [["9600", "9600"], ["19200", "19200"], ["38400", "38400"], ["57600", "57600"], ["115200", "115200"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "comm_blocks",
            tooltip: "Initialize the serial port. Place this once in the Setup section.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/communication/serial/begin/"
        },
        {
            type: "arduino_serialPrint",
            message0: "Serial print %1",
            args0: [
                { type: "input_value", name: "TEXT" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "comm_blocks",
            tooltip: "Prints data without a newline. Requires a 'Serial begin' block.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/communication/serial/print/"
        },
        {
            type: "arduino_serialPrintln",
            message0: "Serial print line %1",
            args0: [
                { type: "input_value", name: "TEXT" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "comm_blocks",
            tooltip: "Prints data followed by a newline. Requires a 'Serial begin' block.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/communication/serial/println/"
        },
        {
            type: "arduino_hc05_init",
            message0: "initialize HC-05 RX %1 TX %2 baud %3",
            args0: [
                { type: "field_dropdown", name: "RX", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "TX", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "BAUD", options: [["9600", "9600"], ["19200", "19200"], ["38400", "38400"], ["57600", "57600"], ["115200", "115200"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "comm_blocks",
            tooltip: "Initialize an HC-05 Bluetooth serial module.",
            helpUrl: ""
        },
        {
            type: "arduino_hc05_send",
            message0: "HC-05 send %1",
            args0: [
                { type: "input_value", name: "TEXT" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "comm_blocks",
            tooltip: "Send text over Bluetooth (HC-05).",
            helpUrl: ""
        },
        {
            type: "arduino_hc05_available",
            message0: "HC-05 data available",
            output: "Number",
            style: "comm_blocks",
            tooltip: "Returns number of bytes available from HC-05.",
            helpUrl: ""
        },
        {
            type: "arduino_hc05_read_byte",
            message0: "HC-05 read byte",
            output: "Number",
            style: "comm_blocks",
            tooltip: "Read one byte from HC-05 stream.",
            helpUrl: ""
        },
{
            type: "arduino_map",
            message0: "map %1 from (%2, %3) to (%4, %5)",
            args0: [
                { type: "input_value", name: "VALUE", check: "Number" },
                { type: "input_value", name: "FROM_LOW", check: "Number" },
                { type: "input_value", name: "FROM_HIGH", check: "Number" },
                { type: "input_value", name: "TO_LOW", check: "Number" },
                { type: "input_value", name: "TO_HIGH", check: "Number" }
            ],
            output: "Number",
            style: "math_blocks",
            tooltip: "Map a value from one range to another.",
            helpUrl: ""
        },
        {
            type: "arduino_constrain",
            message0: "constrain %1 between (%2, %3)",
            args0: [
                { type: "input_value", name: "VALUE", check: "Number" },
                { type: "input_value", name: "LOW", check: "Number" },
                { type: "input_value", name: "HIGH", check: "Number" }
            ],
            output: "Number",
            style: "math_blocks",
            tooltip: "Constrain a value between a low and high limit.",
            helpUrl: ""
        },
{
            type: "controls_repeat",
            message0: "repeat %1 times",
            args0: [{ type: "field_number", name: "TIMES", value: 10, min: 0 }],
            message1: "%1",
            args1: [{ type: "input_statement", name: "DO" }],
            previousStatement: null,
            nextStatement: null,
            style: "loop_blocks",
            tooltip: "Repeat building blocks a number of times."
        },
        {
            type: "controls_forever",
            message0: "forever",
            message1: "%1",
            args1: [{ type: "input_statement", name: "DO" }],
            previousStatement: null,
            nextStatement: null,
            style: "loop_blocks",
            tooltip: "Repeat building blocks forever."
        },
        {
            type: "controls_repeat_until",
            message0: "repeat until %1",
            args0: [{ type: "input_value", name: "BOOL", check: "Boolean" }],
            message1: "%1",
            args1: [{ type: "input_statement", name: "DO" }],
            previousStatement: null,
            nextStatement: null,
            style: "loop_blocks",
            tooltip: "Repeat until a condition is met."
        },
        {
            type: "controls_for_loop",
            message0: "count with %1 from %2 to %3 by %4",
            args0: [
                { type: "field_variable", name: "VAR", variable: "i" },
                { type: "input_value", name: "FROM", check: "Number" },
                { type: "input_value", name: "TO", check: "Number" },
                { type: "input_value", name: "BY", check: "Number" }
            ],
            message1: "%1",
            args1: [{ type: "input_statement", name: "DO" }],
            previousStatement: null,
            nextStatement: null,
            style: "loop_blocks",
            tooltip: "Loop through a range of numbers."
        },
        // --- TIME ---
        {
            type: "time_delay",
            message0: "wait %1 milliseconds",
            args0: [{ type: "input_value", name: "MS", check: "Number" }],
            previousStatement: null,
            nextStatement: null,
            style: "timing_blocks",
            tooltip: "Wait for a specific number of milliseconds."
        },
        {
            type: "time_wait_seconds",
            message0: "wait %1 seconds",
            args0: [{ type: "input_value", name: "SECONDS", check: "Number" }],
            previousStatement: null,
            nextStatement: null,
            style: "timing_blocks",
            tooltip: "Wait for a specific number of seconds."
        },
        {
            type: "time_wait_until",
            message0: "wait until %1",
            args0: [{ type: "input_value", name: "BOOL", check: "Boolean" }],
            previousStatement: null,
            nextStatement: null,
            style: "timing_blocks",
            tooltip: "Wait until a condition becomes true."
        },
        // --- MATH ---
        {
            type: "math_random_int_custom",
            message0: "random integer from %1 to %2",
            args0: [
                { type: "input_value", name: "FROM", check: "Number" },
                { type: "input_value", name: "TO", check: "Number" }
            ],
            output: "Number",
            style: "math_blocks",
            tooltip: "Return a random integer between two numbers."
        },
        {
            type: "math_modulo_custom",
            message0: "remainder of %1 Ã· %2",
            args0: [
                { type: "input_value", name: "DIVIDEND", check: "Number" },
                { type: "input_value", name: "DIVISOR", check: "Number" }
            ],
            output: "Number",
            style: "math_blocks",
            tooltip: "Return the remainder from dividing the two numbers."
        },
        {
            type: "math_round",
            message0: "round %1 %2",
            args0: [
                { type: "field_dropdown", name: "OP", options: [["round", "ROUND"], ["round up", "ROUNDUP"], ["round down", "ROUNDDOWN"]] },
                { type: "input_value", name: "NUM", check: "Number" }
            ],
            output: "Number",
            style: "math_blocks",
            tooltip: "Round a number up or down."
        },
        {
            type: "text_print",
            message0: "print %1",
            args0: [{ type: "input_value", name: "TEXT" }],
            previousStatement: null,
            nextStatement: null,
            style: "output_blocks",
            tooltip: "Print the specified text, number or other value."
        },
        {
            type: "math_on_list",
            message0: "%1 of %2",
            args0: [
                { type: "field_dropdown", name: "OP", options: [["min", "MIN"], ["max", "MAX"]] },
                { type: "input_value", name: "LIST", check: "Array" }
            ],
            output: "Number",
            style: "math_blocks",
            tooltip: "Return the smallest or largest number in a list (or two values)."
        }
];

