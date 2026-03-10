import * as Blockly from 'blockly';

export function defineCustomBlocks() {
    // Basic Geometry / Setup blocks
    // In Arduino, setup and loop are usually predefined in text, but if we want blocks:
    Blockly.defineBlocksWithJsonArray([
        {
            type: "arduino_setup_loop",
            message0: "Setup %1 %2 Loop %3 %4",
            args0: [
                { type: "input_dummy" },
                { type: "input_statement", name: "SETUP" },
                { type: "input_dummy" },
                { type: "input_statement", name: "LOOP" }
            ],
            colour: 120,
            tooltip: "Main structure of an Arduino program",
            helpUrl: ""
        },
        // Digital I/O
        {
            type: "arduino_pinMode",
            message0: "set pin %1 to %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["13", "13"], ["12", "12"], ["11", "11"], ["10", "10"], ["9", "9"], ["A0", "A0"], ["A1", "A1"]] },
                { type: "field_dropdown", name: "MODE", options: [["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"], ["INPUT_PULLUP", "INPUT_PULLUP"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 230,
            tooltip: "Configures the specified pin to behave either as an input or an output.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/"
        },
        {
            type: "arduino_digitalWrite",
            message0: "digital write pin %1 to %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["13", "13"], ["12", "12"], ["11", "11"], ["10", "10"], ["9", "9"], ["A0", "A0"], ["A1", "A1"]] },
                { type: "field_dropdown", name: "STATE", options: [["HIGH", "HIGH"], ["LOW", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 230,
            tooltip: "Write a HIGH or a LOW value to a digital pin.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/"
        },
        // Hardware I/O Read blocks
        {
            type: "arduino_digitalRead",
            message0: "digital read pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["13", "13"], ["12", "12"], ["11", "11"], ["10", "10"], ["9", "9"], ["A0", "A0"], ["A1", "A1"]] }
            ],
            output: "Number",
            colour: 230,
            tooltip: "Read digital value from a pin.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/"
        },
        {
            type: "arduino_analogRead",
            message0: "analog read pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]] }
            ],
            output: "Number",
            colour: 230,
            tooltip: "Read analog value from a pin (0-1023).",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/"
        },
        // Hardware I/O Analog Write (PWM)
        {
            type: "arduino_analogWrite",
            message0: "analog write pin %1 value %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["3", "3"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "input_value", name: "VALUE", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 230,
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
            colour: 50,
            tooltip: "Pauses the program for the amount of time (in milliseconds).",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/time/delay/"
        },
        {
            type: "arduino_millis",
            message0: "current time (milliseconds)",
            output: "Number",
            colour: 50,
            tooltip: "Returns the number of milliseconds passed since the board began running the current program.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/time/millis/"
        },
        // Communication
        {
            type: "arduino_serialPrint",
            message0: "Serial print %1 at baud %2",
            args0: [
                { type: "input_value", name: "TEXT" },
                { type: "field_dropdown", name: "BAUD", options: [["9600", "9600"], ["19200", "19200"], ["38400", "38400"], ["57600", "57600"], ["115200", "115200"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip: "Prints data to the serial port as human-readable ASCII text.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/communication/serial/print/"
        },
        {
            type: "arduino_serialPrintln",
            message0: "Serial print line %1 at baud %2",
            args0: [
                { type: "input_value", name: "TEXT" },
                { type: "field_dropdown", name: "BAUD", options: [["9600", "9600"], ["19200", "19200"], ["38400", "38400"], ["57600", "57600"], ["115200", "115200"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip: "Prints data to the serial port, followed by a newline.",
            helpUrl: "https://www.arduino.cc/reference/en/language/functions/communication/serial/println/"
        },
        {
            type: "arduino_hc05_init",
            message0: "initialize HC-05 RX %1 TX %2 baud %3",
            args0: [
                { type: "field_dropdown", name: "RX", options: [["10", "10"], ["11", "11"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "TX", options: [["11", "11"], ["10", "10"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "BAUD", options: [["9600", "9600"], ["19200", "19200"], ["38400", "38400"], ["57600", "57600"], ["115200", "115200"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
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
            colour: 160,
            tooltip: "Send text over Bluetooth (HC-05).",
            helpUrl: ""
        },
        {
            type: "arduino_hc05_available",
            message0: "HC-05 data available",
            output: "Number",
            colour: 160,
            tooltip: "Returns number of bytes available from HC-05.",
            helpUrl: ""
        },
        {
            type: "arduino_hc05_read_byte",
            message0: "HC-05 read byte",
            output: "Number",
            colour: 160,
            tooltip: "Read one byte from HC-05 stream.",
            helpUrl: ""
        },
        // Sensors and Actuators
        {
            type: "arduino_servo_write",
            message0: "set servo on pin %1 to %2 degrees",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["3", "3"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "input_value", name: "ANGLE", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 90,
            tooltip: "Write an angle (0-180) to a servo motor.",
            helpUrl: ""
        },
        {
            type: "arduino_ultrasonic",
            message0: "read ultrasonic distance (cm) Trig: %1 Echo: %2",
            args0: [
                { type: "field_dropdown", name: "TRIG", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] },
                { type: "field_dropdown", name: "ECHO", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read distance in centimeters from an HC-SR04 ultrasonic sensor.",
        },
        {
            type: "arduino_relay_write",
            message0: "set relay pin %1 to %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "STATE", options: [["ON", "HIGH"], ["OFF", "LOW"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 90,
            tooltip: "Turn a relay module on or off using a digital pin.",
            helpUrl: ""
        },
        {
            type: "arduino_buzzer_tone",
            message0: "play buzzer on pin %1 frequency %2 Hz for %3 ms",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "input_value", name: "FREQ", check: "Number" },
                { type: "input_value", name: "DURATION", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 45,
            tooltip: "Play a tone on a passive buzzer.",
            helpUrl: ""
        },
        {
            type: "arduino_buzzer_stop",
            message0: "stop buzzer on pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 45,
            tooltip: "Stop tone output on the buzzer pin.",
            helpUrl: ""
        },
        {
            type: "arduino_pir_read",
            message0: "read PIR motion pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read motion status from a PIR sensor (0 or 1).",
            helpUrl: ""
        },
        {
            type: "arduino_touch_read",
            message0: "read touch sensor pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read touch status (0 or 1) from a digital touch module.",
            helpUrl: ""
        },
        {
            type: "arduino_soil_moisture_read",
            message0: "read soil moisture pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read soil moisture value from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_rain_read",
            message0: "read rain sensor pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read rain sensor value from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_water_level_read",
            message0: "read water level sensor pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read water level value from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_ir_init",
            message0: "initialize IR receiver pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 280,
            tooltip: "Initialize an IR receiver module using the IRremote library.",
            helpUrl: ""
        },
        {
            type: "arduino_ir_read_code",
            message0: "read IR code",
            output: "Number",
            colour: 280,
            tooltip: "Read the latest decoded IR code, or 0 if none.",
            helpUrl: ""
        },
        {
            type: "arduino_keypad_init",
            message0: "initialize keypad R1 %1 R2 %2 R3 %3 R4 %4 C1 %5 C2 %6 C3 %7 C4 %8",
            args0: [
                { type: "field_dropdown", name: "R1", options: [["9", "9"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "R2", options: [["8", "8"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "R3", options: [["7", "7"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "R4", options: [["6", "6"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C1", options: [["5", "5"], ["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C2", options: [["4", "4"], ["2", "2"], ["3", "3"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C3", options: [["3", "3"], ["2", "2"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C4", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 280,
            tooltip: "Initialize a 4x4 keypad.",
            helpUrl: ""
        },
        {
            type: "arduino_keypad_get_key",
            message0: "get keypad key",
            output: "String",
            colour: 280,
            tooltip: "Returns the current keypad key as text, empty when none.",
            helpUrl: ""
        },
        {
            type: "arduino_dht_init",
            message0: "initialize DHT sensor pin %1 type %2",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "TYPE", options: [["DHT11", "DHT11"], ["DHT22", "DHT22"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 280,
            tooltip: "Initialize a DHT temperature/humidity sensor.",
            helpUrl: ""
        },
        {
            type: "arduino_dht_read",
            message0: "read DHT pin %1 type %2 value %3",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "TYPE", options: [["DHT11", "DHT11"], ["DHT22", "DHT22"]] },
                { type: "field_dropdown", name: "METRIC", options: [["temperature (C)", "TEMP_C"], ["humidity (%)", "HUMIDITY"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read temperature or humidity from a DHT sensor.",
            helpUrl: ""
        },
        {
            type: "arduino_bme280_init",
            message0: "initialize BME280 address %1",
            args0: [
                { type: "field_dropdown", name: "ADDRESS", options: [["0x76", "0x76"], ["0x77", "0x77"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 280,
            tooltip: "Initialize a BME280 sensor over I2C.",
            helpUrl: ""
        },
        {
            type: "arduino_bme280_read",
            message0: "read BME280 %1",
            args0: [
                { type: "field_dropdown", name: "METRIC", options: [["temperature (C)", "TEMP_C"], ["humidity (%)", "HUMIDITY"], ["pressure (hPa)", "PRESSURE_HPA"], ["altitude (m)", "ALTITUDE_M"]] }
            ],
            output: "Number",
            colour: 280,
            tooltip: "Read environmental data from BME280.",
            helpUrl: ""
        },
        {
            type: "arduino_bh1750_init",
            message0: "initialize BH1750 light sensor",
            previousStatement: null,
            nextStatement: null,
            colour: 280,
            tooltip: "Initialize BH1750 ambient light sensor.",
            helpUrl: ""
        },
        {
            type: "arduino_bh1750_read",
            message0: "read BH1750 light (lux)",
            output: "Number",
            colour: 280,
            tooltip: "Read ambient light level in lux.",
            helpUrl: ""
        },
        // --- OLED Display (SSD1306) ---
        {
            type: "oled_init",
            message0: "initialize OLED display 128x64 width: %1 height: %2",
            args0: [
                { type: "field_number", name: "WIDTH", value: 128 },
                { type: "field_number", name: "HEIGHT", value: 64 }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 190,
            tooltip: "Initialize an I2C OLED display.",
            helpUrl: ""
        },
        {
            type: "oled_clear",
            message0: "clear OLED display",
            previousStatement: null,
            nextStatement: null,
            colour: 190,
            tooltip: "Clear the entire display.",
            helpUrl: ""
        },
        {
            type: "oled_print",
            message0: "OLED print text %1 at X: %2 Y: %3",
            args0: [
                { type: "input_value", name: "TEXT" },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 190,
            tooltip: "Print text at a specific coordinate on the OLED.",
            helpUrl: ""
        },
        {
            type: "lcd_i2c_init",
            message0: "initialize LCD I2C address %1 columns %2 rows %3",
            args0: [
                { type: "field_dropdown", name: "ADDRESS", options: [["0x27", "0x27"], ["0x3F", "0x3F"]] },
                { type: "field_number", name: "COLS", value: 16, min: 8, max: 40 },
                { type: "field_number", name: "ROWS", value: 2, min: 1, max: 4 }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 190,
            tooltip: "Initialize an I2C LCD display.",
            helpUrl: ""
        },
        {
            type: "lcd_i2c_clear",
            message0: "clear LCD",
            previousStatement: null,
            nextStatement: null,
            colour: 190,
            tooltip: "Clear LCD contents.",
            helpUrl: ""
        },
        {
            type: "lcd_i2c_print",
            message0: "LCD print %1 at column %2 row %3",
            args0: [
                { type: "input_value", name: "TEXT" },
                { type: "input_value", name: "COL", check: "Number" },
                { type: "input_value", name: "ROW", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 190,
            tooltip: "Print text at a specific LCD cursor position.",
            helpUrl: ""
        },
        // --- NeoPixel ---
        {
            type: "neopixel_init",
            message0: "initialize NeoPixels on pin %1 with %2 LEDs",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "field_number", name: "COUNT", value: 8, min: 1 }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 260,
            tooltip: "Initialize an addressable LED strip.",
            helpUrl: ""
        },
        {
            type: "neopixel_set_color",
            message0: "set NeoPixel %1 to Color (R:%2 G:%3 B:%4) pin %5",
            args0: [
                { type: "input_value", name: "INDEX", check: "Number" },
                { type: "input_value", name: "R", check: "Number" },
                { type: "input_value", name: "G", check: "Number" },
                { type: "input_value", name: "B", check: "Number" },
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 260,
            tooltip: "Set the RGB color of a specific NeoPixel.",
            helpUrl: ""
        },
        {
            type: "neopixel_show",
            message0: "show NeoPixels pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 260,
            tooltip: "Update the strip with newly set colors.",
            helpUrl: ""
        },
        {
            type: "neopixel_clear",
            message0: "clear NeoPixels pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 260,
            tooltip: "Turn off all pixels.",
            helpUrl: ""
        },
        // --- Motors ---
        {
            type: "motor_forward",
            message0: "Motor Forward pin1 %1 pin2 %2 speed %3",
            args0: [
                { type: "field_dropdown", name: "PIN1", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "field_dropdown", name: "PIN2", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 330,
            tooltip: "Drive a DC motor forward.",
            helpUrl: ""
        },
        {
            type: "motor_backward",
            message0: "Motor Backward pin1 %1 pin2 %2 speed %3",
            args0: [
                { type: "field_dropdown", name: "PIN1", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "field_dropdown", name: "PIN2", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 330,
            tooltip: "Drive a DC motor backward.",
            helpUrl: ""
        },
        {
            type: "motor_stop",
            message0: "Motor Stop pin1 %1 pin2 %2",
            args0: [
                { type: "field_dropdown", name: "PIN1", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] },
                { type: "field_dropdown", name: "PIN2", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 330,
            tooltip: "Stop a DC motor.",
            helpUrl: ""
        },
        {
            type: "arduino_l298n_drive",
            message0: "L298N EN %1 IN1 %2 IN2 %3 direction %4 speed %5",
            args0: [
                { type: "field_dropdown", name: "EN", options: [["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"], ["3", "3"]] },
                { type: "field_dropdown", name: "IN1", options: [["7", "7"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "IN2", options: [["8", "8"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "DIR", options: [["forward", "FORWARD"], ["reverse", "REVERSE"], ["brake", "BRAKE"], ["stop", "STOP"]] },
                { type: "input_value", name: "SPEED", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 330,
            tooltip: "Drive an L298N motor channel with direction and PWM speed.",
            helpUrl: ""
        },
    ]);
}






