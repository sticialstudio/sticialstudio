import { 
    getDigitalPinOptions, 
    getAnalogPinOptions, 
    getPWMPinOptions,
    getUltrasonicInstances,
    getPirInstances,
    getTouchInstances,
    getSoilMoistureInstances,
    getRainInstances,
    getWaterLevelInstances,
    getDhtInstances,
    getPotentiometerInstances,
    getPhotoSensorInstances,
    getSoundSensorInstances,
    getButtonInstances,
    getPirInstances as getIrObstacleInstances
} from '../dropdowns';

export const sensorsBlocks = [
{
            type: "arduino_ultrasonic_init",
            message0: "add ultrasonic %1 trig %2 echo %3",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getUltrasonicInstances },
                { type: "field_dropdown", name: "TRIG", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "ECHO", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize an ultrasonic sensor with specific pins.",
            helpUrl: ""
        },
        {
            type: "arduino_ultrasonic",
            message0: "read %1 distance (cm)",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getUltrasonicInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read distance in centimeters from an HC-SR04 ultrasonic sensor.",
        },
{
            type: "arduino_pir_read",
            message0: "read PIR %1 motion",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getPirInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read motion status from a PIR sensor (0 or 1).",
            helpUrl: ""
        },
        {
            type: "arduino_touch_read",
            message0: "read touch sensor %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getTouchInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read touch status (0 or 1) from a digital touch module.",
            helpUrl: ""
        },
        {
            type: "arduino_soil_moisture_read",
            message0: "read soil moisture %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getSoilMoistureInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read soil moisture value from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_rain_read",
            message0: "read rain sensor %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getRainInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read rain sensor value from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_water_level_read",
            message0: "read water level %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getWaterLevelInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read water level value from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_ir_init",
            message0: "initialize IR receiver pin %1",
            args0: [
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize an IR receiver module using the IRremote library.",
            helpUrl: ""
        },
        {
            type: "arduino_ir_read_code",
            message0: "read IR code",
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read the latest decoded IR code, or 0 if none.",
            helpUrl: ""
        },
        {
            type: "arduino_keypad_init",
            message0: "initialize keypad R1 %1 R2 %2 R3 %3 R4 %4 C1 %5 C2 %6 C3 %7 C4 %8",
            args0: [
                { type: "field_dropdown", name: "R1", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "R2", options: [["8", "8"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "R3", options: [["7", "7"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "R4", options: [["6", "6"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C1", options: [["5", "5"], ["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C2", options: [["4", "4"], ["2", "2"], ["3", "3"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C3", options: [["3", "3"], ["2", "2"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]] },
                { type: "field_dropdown", name: "C4", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize a 4x4 keypad.",
            helpUrl: ""
        },
        {
            type: "arduino_keypad_get_key",
            message0: "get keypad key",
            output: "String",
            style: "sensor_blocks",
            tooltip: "Returns the current keypad key as text, empty when none.",
            helpUrl: ""
        },
        {
            type: "arduino_dht_init",
            message0: "add %1 %2 on pin %3",
            args0: [
                { type: "field_dropdown", name: "TYPE", options: [["DHT11", "DHT11"], ["DHT22", "DHT22"], ["DHT20", "DHT20"]] },
                { type: "field_dropdown", name: "SENSOR", options: getDhtInstances },
                { type: "field_dropdown", name: "PIN", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize a named DHT temperature/humidity sensor.",
            helpUrl: ""
        },
        {
            type: "arduino_dht_read",
            message0: "read %1 %2 value %3",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getDhtInstances },
                { type: "field_dropdown", name: "TYPE", options: [["DHT11", "DHT11"], ["DHT22", "DHT22"]] },
                { type: "field_dropdown", name: "METRIC", options: [["temperature (C)", "TEMP_C"], ["humidity (%)", "HUMIDITY"]] }
            ],
            output: "Number",
            style: "sensor_blocks",
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
            style: "sensor_blocks",
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
            style: "sensor_blocks",
            tooltip: "Read environmental data from BME280.",
            helpUrl: ""
        },
        {
            type: "arduino_bh1750_init",
            message0: "initialize BH1750 light sensor",
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize BH1750 ambient light sensor.",
            helpUrl: ""
        },
        {
            type: "arduino_bh1750_read",
            message0: "read BH1750 light (lux)",
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read ambient light level in lux.",
            helpUrl: ""
        },
        {
            type: "arduino_sound_sensor_read",
            message0: "read sound sensor %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getSoundSensorInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read sound level from an analog pin.",
            helpUrl: ""
        },
        {
            type: "arduino_photo_sensor_read",
            message0: "read photo sensor %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getPhotoSensorInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read light level from a photoresistor.",
            helpUrl: ""
        },
        {
            type: "arduino_potentiometer_read",
            message0: "read potentiometer %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getPotentiometerInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read rotation value from a potentiometer.",
            helpUrl: ""
        },
        {
            type: "arduino_max30102_init",
            message0: "initialize MAX30102 Pulse Oximeter",
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize MAX30102 Heart Rate and Pulse Oximeter Sensor over I2C.",
            helpUrl: ""
        },
        {
            type: "arduino_max30102_read",
            message0: "read MAX30102 %1",
            args0: [
                { type: "field_dropdown", name: "METRIC", options: [["Heart Rate (BPM)", "HEART_RATE"], ["SpO2 (%)", "SPO2"]] }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read Heart Rate or Blood Oxygen from MAX30102.",
            helpUrl: ""
        },
        {
            type: "arduino_color_sensor_read",
            message0: "read TCS3200 Color %1 S2 %2 S3 %3 OUT %4",
            args0: [
                { type: "field_dropdown", name: "COLOR", options: [["Red", "RED"], ["Green", "GREEN"], ["Blue", "BLUE"]] },
                { type: "field_dropdown", name: "S2", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "S3", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "OUT", options: getDigitalPinOptions }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read RGB frequency from TCS3200 color sensor.",
            helpUrl: ""
        },
        {
            type: "arduino_button_read",
            message0: "read button %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getButtonInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read momentary tactile button state.",
            helpUrl: ""
        },
        {
            type: "arduino_ir_obstacle_read",
            message0: "read IR obstacle sensor %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: getIrObstacleInstances }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read IR obstacle avoidance sensor (0 = obstacle, 1 = clear).",
            helpUrl: ""
        },
        {
            type: "arduino_encoder_init",
            message0: "add encoder %1 clock %2 data %3",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["encoder_1", "encoder_1"], ["encoder_2", "encoder_2"]] },
                { type: "field_dropdown", name: "CLK", options: getDigitalPinOptions },
                { type: "field_dropdown", name: "DT", options: getDigitalPinOptions }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Initialize a rotary encoder.",
            helpUrl: ""
        },
        {
            type: "arduino_encoder_read",
            message0: "read encoder %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["encoder_1", "encoder_1"], ["encoder_2", "encoder_2"]] }
            ],
            output: "Number",
            style: "sensor_blocks",
            tooltip: "Read value from a rotary encoder.",
            helpUrl: ""
        },
        {
            type: "arduino_encoder_write",
            message0: "write encoder %1 value %2",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["encoder_1", "encoder_1"], ["encoder_2", "encoder_2"]] },
                { type: "input_value", name: "VALUE", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "sensor_blocks",
            tooltip: "Set the value of a rotary encoder.",
            helpUrl: ""
        }
];
