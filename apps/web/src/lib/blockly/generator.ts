import * as Blockly from 'blockly';

// ----------------------------------------------------------------------------
// 1. ARDUINO C++ GENERATOR
// ----------------------------------------------------------------------------
export const arduinoGenerator = new Blockly.CodeGenerator('Arduino');
arduinoGenerator.INDENT = '  ';

(arduinoGenerator as any).init = function (workspace: Blockly.Workspace) {
    (this as any).setups_ = Object.create(null);
    (this as any).loops_ = Object.create(null);
};

(arduinoGenerator as any).finish = function (code: string) {
    // We do NOT wrap the code anymore, the template system handles it
    return code;
};

(arduinoGenerator as any).scrub_ = function (block: Blockly.Block, code: string, opt_thisOnly?: boolean): string {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
    return code + nextCode;
};

// -- Arduino Blocks --
(arduinoGenerator as any).forBlock['arduino_pinMode'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    (arduinoGenerator as any).setups_[`pinMode_${pin}`] = `  pinMode(${pin}, ${mode});`;
    return '';
};

(arduinoGenerator as any).forBlock['arduino_digitalWrite'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    return `  digitalWrite(${pin}, ${state});\n`;
};

(arduinoGenerator as any).forBlock['arduino_delay'] = function (block: Blockly.Block) {
    const ms = block.getFieldValue('MS');
    return `  delay(${ms});\n`;
};

(arduinoGenerator as any).forBlock['arduino_digitalRead'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return [`digitalRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_analogRead'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_analogWrite'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const value = (arduinoGenerator as any).valueToCode(block, 'VALUE', (arduinoGenerator as any).ORDER_NONE) || '0';
    return `  analogWrite(${pin}, ${value});\n`;
};

(arduinoGenerator as any).forBlock['arduino_millis'] = function (block: Blockly.Block) {
    return [`millis()`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_serialPrint'] = function (block: Blockly.Block) {
    const text = (arduinoGenerator as any).valueToCode(block, 'TEXT', (arduinoGenerator as any).ORDER_NONE) || '""';
    const baud = block.getFieldValue('BAUD') || '9600';
    (arduinoGenerator as any).setups_['serial_begin'] = `  Serial.begin(${baud});`;
    return `  Serial.print(${text});\n`;
};

(arduinoGenerator as any).forBlock['arduino_serialPrintln'] = function (block: Blockly.Block) {
    const text = (arduinoGenerator as any).valueToCode(block, 'TEXT', (arduinoGenerator as any).ORDER_NONE) || '""';
    const baud = block.getFieldValue('BAUD') || '9600';
    (arduinoGenerator as any).setups_['serial_begin'] = `  Serial.begin(${baud});`;
    return `  Serial.println(${text});\n`;
};

(arduinoGenerator as any).forBlock['arduino_hc05_init'] = function (block: Blockly.Block) {
    const rx = block.getFieldValue('RX') || '10';
    const tx = block.getFieldValue('TX') || '11';
    const baud = block.getFieldValue('BAUD') || '9600';
    (arduinoGenerator as any).setups_['hc05_global'] = `#include <SoftwareSerial.h>\nSoftwareSerial hc05(${rx}, ${tx});`;
    (arduinoGenerator as any).setups_['hc05_begin'] = `  hc05.begin(${baud});`;
    return '';
};

(arduinoGenerator as any).forBlock['arduino_hc05_send'] = function (block: Blockly.Block) {
    const text = (arduinoGenerator as any).valueToCode(block, 'TEXT', (arduinoGenerator as any).ORDER_NONE) || '""';
    if (!(arduinoGenerator as any).setups_['hc05_global']) {
        (arduinoGenerator as any).setups_['hc05_global'] = '#include <SoftwareSerial.h>\nSoftwareSerial hc05(10, 11);';
    }
    if (!(arduinoGenerator as any).setups_['hc05_begin']) {
        (arduinoGenerator as any).setups_['hc05_begin'] = '  hc05.begin(9600);';
    }
    return `  hc05.println(${text});\n`;
};

(arduinoGenerator as any).forBlock['arduino_hc05_available'] = function () {
    if (!(arduinoGenerator as any).setups_['hc05_global']) {
        (arduinoGenerator as any).setups_['hc05_global'] = '#include <SoftwareSerial.h>\nSoftwareSerial hc05(10, 11);';
    }
    if (!(arduinoGenerator as any).setups_['hc05_begin']) {
        (arduinoGenerator as any).setups_['hc05_begin'] = '  hc05.begin(9600);';
    }
    return ['hc05.available()', (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_hc05_read_byte'] = function () {
    if (!(arduinoGenerator as any).setups_['hc05_global']) {
        (arduinoGenerator as any).setups_['hc05_global'] = '#include <SoftwareSerial.h>\nSoftwareSerial hc05(10, 11);';
    }
    if (!(arduinoGenerator as any).setups_['hc05_begin']) {
        (arduinoGenerator as any).setups_['hc05_begin'] = '  hc05.begin(9600);';
    }
    return ['hc05.read()', (arduinoGenerator as any).ORDER_ATOMIC];
};
(arduinoGenerator as any).forBlock['arduino_servo_write'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const angle = (arduinoGenerator as any).valueToCode(block, 'ANGLE', (arduinoGenerator as any).ORDER_NONE) || '90';
    (arduinoGenerator as any).setups_['include_servo'] = `#include <Servo.h>\nServo servo_${pin};`;
    (arduinoGenerator as any).setups_[`servo_attach_${pin}`] = `  servo_${pin}.attach(${pin});`;
    return `  servo_${pin}.write(${angle});\n`;
};

(arduinoGenerator as any).forBlock['arduino_ultrasonic'] = function (block: Blockly.Block) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');
    (arduinoGenerator as any).setups_['ultrasonic_func'] = `long readUltrasonicDistance(int triggerPin, int echoPin) {\n  pinMode(triggerPin, OUTPUT);\n  digitalWrite(triggerPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(triggerPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(triggerPin, LOW);\n  pinMode(echoPin, INPUT);\n  return pulseIn(echoPin, HIGH) * 0.01723;\n}`;
    return [`readUltrasonicDistance(${trig}, ${echo})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_relay_write'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE') || 'LOW';
    (arduinoGenerator as any).setups_[`relay_pin_${pin}`] = `  pinMode(${pin}, OUTPUT);`;
    return `  digitalWrite(${pin}, ${state});\n`;
};

(arduinoGenerator as any).forBlock['arduino_buzzer_tone'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const freq = (arduinoGenerator as any).valueToCode(block, 'FREQ', (arduinoGenerator as any).ORDER_NONE) || '1000';
    const duration = (arduinoGenerator as any).valueToCode(block, 'DURATION', (arduinoGenerator as any).ORDER_NONE) || '250';
    (arduinoGenerator as any).setups_[`buzzer_pin_${pin}`] = `  pinMode(${pin}, OUTPUT);`;
    return `  tone(${pin}, ${freq}, ${duration});\n`;
};

(arduinoGenerator as any).forBlock['arduino_buzzer_stop'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).setups_[`buzzer_pin_${pin}`] = `  pinMode(${pin}, OUTPUT);`;
    return `  noTone(${pin});\n`;
};

(arduinoGenerator as any).forBlock['arduino_pir_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).setups_[`pir_pin_${pin}`] = `  pinMode(${pin}, INPUT);`;
    return [`digitalRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_touch_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).setups_[`touch_pin_${pin}`] = `  pinMode(${pin}, INPUT);`;
    return [`digitalRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_soil_moisture_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_rain_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_water_level_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_ir_init'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN') || '2';
    (arduinoGenerator as any).setups_['ir_include'] = '#include <IRremote.hpp>';
    (arduinoGenerator as any).setups_['ir_begin'] = `  IrReceiver.begin(${pin}, ENABLE_LED_FEEDBACK);`;
    (arduinoGenerator as any).setups_['ir_helper'] = `unsigned long readIrCode() {\n  if (IrReceiver.decode()) {\n    unsigned long code = IrReceiver.decodedIRData.decodedRawData;\n    IrReceiver.resume();\n    return code;\n  }\n  return 0;\n}`;
    return '';
};

(arduinoGenerator as any).forBlock['arduino_ir_read_code'] = function () {
    if (!(arduinoGenerator as any).setups_['ir_include']) {
        (arduinoGenerator as any).setups_['ir_include'] = '#include <IRremote.hpp>';
    }
    if (!(arduinoGenerator as any).setups_['ir_begin']) {
        (arduinoGenerator as any).setups_['ir_begin'] = '  IrReceiver.begin(2, ENABLE_LED_FEEDBACK);';
    }
    if (!(arduinoGenerator as any).setups_['ir_helper']) {
        (arduinoGenerator as any).setups_['ir_helper'] = 'unsigned long readIrCode() {\n  if (IrReceiver.decode()) {\n    unsigned long code = IrReceiver.decodedIRData.decodedRawData;\n    IrReceiver.resume();\n    return code;\n  }\n  return 0;\n}';
    }
    return ['readIrCode()', (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_keypad_init'] = function (block: Blockly.Block) {
    const r1 = block.getFieldValue('R1') || '9';
    const r2 = block.getFieldValue('R2') || '8';
    const r3 = block.getFieldValue('R3') || '7';
    const r4 = block.getFieldValue('R4') || '6';
    const c1 = block.getFieldValue('C1') || '5';
    const c2 = block.getFieldValue('C2') || '4';
    const c3 = block.getFieldValue('C3') || '3';
    const c4 = block.getFieldValue('C4') || '2';
    (arduinoGenerator as any).setups_['keypad_global'] = `#include <Keypad.h>\nconst byte KP_ROWS = 4;\nconst byte KP_COLS = 4;\nchar KP_KEYS[KP_ROWS][KP_COLS] = {\n  {'1','2','3','A'},\n  {'4','5','6','B'},\n  {'7','8','9','C'},\n  {'*','0','#','D'}\n};\nbyte kpRowPins[KP_ROWS] = {${r1}, ${r2}, ${r3}, ${r4}};\nbyte kpColPins[KP_COLS] = {${c1}, ${c2}, ${c3}, ${c4}};\nKeypad customKeypad = Keypad(makeKeymap(KP_KEYS), kpRowPins, kpColPins, KP_ROWS, KP_COLS);`;
    (arduinoGenerator as any).setups_['keypad_helper'] = `String readKeypadKey() {\n  char key = customKeypad.getKey();\n  if (key == NO_KEY) return String(\"\");\n  return String(key);\n}`;
    return '';
};

(arduinoGenerator as any).forBlock['arduino_keypad_get_key'] = function () {
    if (!(arduinoGenerator as any).setups_['keypad_global']) {
        (arduinoGenerator as any).setups_['keypad_global'] = '#include <Keypad.h>\nconst byte KP_ROWS = 4;\nconst byte KP_COLS = 4;\nchar KP_KEYS[KP_ROWS][KP_COLS] = {\n  {\'1\',\'2\',\'3\',\'A\'},\n  {\'4\',\'5\',\'6\',\'B\'},\n  {\'7\',\'8\',\'9\',\'C\'},\n  {\'*\',\'0\',\'#\',\'D\'}\n};\nbyte kpRowPins[KP_ROWS] = {9, 8, 7, 6};\nbyte kpColPins[KP_COLS] = {5, 4, 3, 2};\nKeypad customKeypad = Keypad(makeKeymap(KP_KEYS), kpRowPins, kpColPins, KP_ROWS, KP_COLS);';
    }
    if (!(arduinoGenerator as any).setups_['keypad_helper']) {
        (arduinoGenerator as any).setups_['keypad_helper'] = 'String readKeypadKey() {\n  char key = customKeypad.getKey();\n  if (key == NO_KEY) return String(\"\");\n  return String(key);\n}';
    }
    return ['readKeypadKey()', (arduinoGenerator as any).ORDER_ATOMIC];
};
(arduinoGenerator as any).forBlock['arduino_dht_init'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const type = block.getFieldValue('TYPE') || 'DHT11';
    (arduinoGenerator as any).setups_[`dht_global_${pin}`] = `#include <DHT.h>\nDHT dht_${pin}(${pin}, ${type});`;
    (arduinoGenerator as any).setups_[`dht_begin_${pin}`] = `  dht_${pin}.begin();`;
    return '';
};

(arduinoGenerator as any).forBlock['arduino_dht_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const type = block.getFieldValue('TYPE') || 'DHT11';
    const metric = block.getFieldValue('METRIC') || 'TEMP_C';
    (arduinoGenerator as any).setups_[`dht_global_${pin}`] = `#include <DHT.h>\nDHT dht_${pin}(${pin}, ${type});`;
    (arduinoGenerator as any).setups_[`dht_begin_${pin}`] = `  dht_${pin}.begin();`;
    const expression = metric === 'HUMIDITY' ? `dht_${pin}.readHumidity()` : `dht_${pin}.readTemperature()`;
    return [expression, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_bme280_init'] = function (block: Blockly.Block) {
    const address = block.getFieldValue('ADDRESS') || '0x76';
    (arduinoGenerator as any).setups_['bme280_global'] = '#include <Wire.h>\n#include <Adafruit_Sensor.h>\n#include <Adafruit_BME280.h>\nAdafruit_BME280 bme;';
    (arduinoGenerator as any).setups_['bme280_begin'] = `  bme.begin(${address});`;
    return '';
};

(arduinoGenerator as any).forBlock['arduino_bme280_read'] = function (block: Blockly.Block) {
    const metric = block.getFieldValue('METRIC') || 'TEMP_C';
    (arduinoGenerator as any).setups_['bme280_global'] = '#include <Wire.h>\n#include <Adafruit_Sensor.h>\n#include <Adafruit_BME280.h>\nAdafruit_BME280 bme;';
    (arduinoGenerator as any).setups_['bme280_begin'] = '  bme.begin(0x76);';
    let expression = 'bme.readTemperature()';
    if (metric === 'HUMIDITY') expression = 'bme.readHumidity()';
    if (metric === 'PRESSURE_HPA') expression = '(bme.readPressure() / 100.0F)';
    if (metric === 'ALTITUDE_M') expression = 'bme.readAltitude(1013.25)';
    return [expression, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['arduino_bh1750_init'] = function () {
    (arduinoGenerator as any).setups_['bh1750_global'] = '#include <Wire.h>\n#include <BH1750.h>\nBH1750 lightMeter;';
    (arduinoGenerator as any).setups_['bh1750_begin'] = '  Wire.begin();\n  lightMeter.begin();';
    return '';
};

(arduinoGenerator as any).forBlock['arduino_bh1750_read'] = function () {
    (arduinoGenerator as any).setups_['bh1750_global'] = '#include <Wire.h>\n#include <BH1750.h>\nBH1750 lightMeter;';
    (arduinoGenerator as any).setups_['bh1750_begin'] = '  Wire.begin();\n  lightMeter.begin();';
    return ['lightMeter.readLightLevel()', (arduinoGenerator as any).ORDER_ATOMIC];
};
(arduinoGenerator as any).forBlock['arduino_setup_loop'] = function (block: Blockly.Block) {
    const setupCode = (arduinoGenerator as any).statementToCode(block, 'SETUP');
    if (setupCode) {
        // Collect any generic blocks attached to the setup slot
        (arduinoGenerator as any).setups_['manual_setup'] = setupCode;
    }
    const loopCode = (arduinoGenerator as any).statementToCode(block, 'LOOP');
    return loopCode;
};

(arduinoGenerator as any).forBlock['oled_init'] = function (block: Blockly.Block) {
    const width = block.getFieldValue('WIDTH');
    const height = block.getFieldValue('HEIGHT');
    (arduinoGenerator as any).setups_['include_wire'] = '#include <Wire.h>';
    (arduinoGenerator as any).setups_['include_adafruit_gfx'] = '#include <Adafruit_GFX.h>';
    (arduinoGenerator as any).setups_['include_adafruit_ssd1306'] = '#include <Adafruit_SSD1306.h>';
    (arduinoGenerator as any).setups_['declare_display'] = `Adafruit_SSD1306 display(${width}, ${height}, &Wire, -1);`;
    (arduinoGenerator as any).setups_['init_display'] = `  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {\n    for(;;);\n  }\n  display.clearDisplay();\n  display.setTextColor(WHITE);`;
    return '';
};

(arduinoGenerator as any).forBlock['oled_clear'] = function (block: Blockly.Block) {
    return '  display.clearDisplay();\n  display.display();\n';
};

(arduinoGenerator as any).forBlock['oled_print'] = function (block: Blockly.Block) {
    const x = (arduinoGenerator as any).valueToCode(block, 'X', (arduinoGenerator as any).ORDER_NONE) || '0';
    const y = (arduinoGenerator as any).valueToCode(block, 'Y', (arduinoGenerator as any).ORDER_NONE) || '0';
    const text = (arduinoGenerator as any).valueToCode(block, 'TEXT', (arduinoGenerator as any).ORDER_NONE) || '""';
    return `  display.setCursor(${x}, ${y});\n  display.print(${text});\n  display.display();\n`;
};

(arduinoGenerator as any).forBlock['lcd_i2c_init'] = function (block: Blockly.Block) {
    const address = block.getFieldValue('ADDRESS') || '0x27';
    const cols = block.getFieldValue('COLS') || '16';
    const rows = block.getFieldValue('ROWS') || '2';
    (arduinoGenerator as any).setups_['lcd_i2c_global'] = `#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(${address}, ${cols}, ${rows});`;
    (arduinoGenerator as any).setups_['lcd_i2c_begin'] = '  lcd.init();\n  lcd.backlight();';
    return '';
};

(arduinoGenerator as any).forBlock['lcd_i2c_clear'] = function () {
    if (!(arduinoGenerator as any).setups_['lcd_i2c_global']) {
        (arduinoGenerator as any).setups_['lcd_i2c_global'] = '#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);';
    }
    if (!(arduinoGenerator as any).setups_['lcd_i2c_begin']) {
        (arduinoGenerator as any).setups_['lcd_i2c_begin'] = '  lcd.init();\n  lcd.backlight();';
    }
    return '  lcd.clear();\n';
};

(arduinoGenerator as any).forBlock['lcd_i2c_print'] = function (block: Blockly.Block) {
    const text = (arduinoGenerator as any).valueToCode(block, 'TEXT', (arduinoGenerator as any).ORDER_NONE) || '""';
    const col = (arduinoGenerator as any).valueToCode(block, 'COL', (arduinoGenerator as any).ORDER_NONE) || '0';
    const row = (arduinoGenerator as any).valueToCode(block, 'ROW', (arduinoGenerator as any).ORDER_NONE) || '0';
    if (!(arduinoGenerator as any).setups_['lcd_i2c_global']) {
        (arduinoGenerator as any).setups_['lcd_i2c_global'] = '#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);';
    }
    if (!(arduinoGenerator as any).setups_['lcd_i2c_begin']) {
        (arduinoGenerator as any).setups_['lcd_i2c_begin'] = '  lcd.init();\n  lcd.backlight();';
    }
    return `  lcd.setCursor(${col}, ${row});\n  lcd.print(${text});\n`;
};
(arduinoGenerator as any).forBlock['neopixel_init'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const count = block.getFieldValue('COUNT');
    (arduinoGenerator as any).setups_['include_neopixel'] = '#include <Adafruit_NeoPixel.h>';
    (arduinoGenerator as any).setups_[`declare_strip_${pin}`] = `Adafruit_NeoPixel pixels_${pin}(${count}, ${pin}, NEO_GRB + NEO_KHZ800);`;
    (arduinoGenerator as any).setups_[`init_strip_${pin}`] = `  pixels_${pin}.begin();`;
    return '';
};

(arduinoGenerator as any).forBlock['neopixel_set_color'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const index = (arduinoGenerator as any).valueToCode(block, 'INDEX', (arduinoGenerator as any).ORDER_NONE) || '0';
    const r = (arduinoGenerator as any).valueToCode(block, 'R', (arduinoGenerator as any).ORDER_NONE) || '0';
    const g = (arduinoGenerator as any).valueToCode(block, 'G', (arduinoGenerator as any).ORDER_NONE) || '0';
    const b = (arduinoGenerator as any).valueToCode(block, 'B', (arduinoGenerator as any).ORDER_NONE) || '0';
    return `  pixels_${pin}.setPixelColor(${index}, pixels_${pin}.Color(${r}, ${g}, ${b}));\n`;
};

(arduinoGenerator as any).forBlock['neopixel_show'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return `  pixels_${pin}.show();\n`;
};

(arduinoGenerator as any).forBlock['neopixel_clear'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return `  pixels_${pin}.clear();\n  pixels_${pin}.show();\n`;
};

(arduinoGenerator as any).forBlock['motor_forward'] = function (block: Blockly.Block) {
    const pin1 = block.getFieldValue('PIN1');
    const pin2 = block.getFieldValue('PIN2');
    const speed = (arduinoGenerator as any).valueToCode(block, 'SPEED', (arduinoGenerator as any).ORDER_NONE) || '255';
    (arduinoGenerator as any).setups_[`motor_pinMode_${pin1}`] = `  pinMode(${pin1}, OUTPUT);`;
    (arduinoGenerator as any).setups_[`motor_pinMode_${pin2}`] = `  pinMode(${pin2}, OUTPUT);`;
    return `  analogWrite(${pin1}, ${speed});\n  digitalWrite(${pin2}, LOW);\n`;
};

(arduinoGenerator as any).forBlock['motor_backward'] = function (block: Blockly.Block) {
    const pin1 = block.getFieldValue('PIN1');
    const pin2 = block.getFieldValue('PIN2');
    const speed = (arduinoGenerator as any).valueToCode(block, 'SPEED', (arduinoGenerator as any).ORDER_NONE) || '255';
    (arduinoGenerator as any).setups_[`motor_pinMode_${pin1}`] = `  pinMode(${pin1}, OUTPUT);`;
    (arduinoGenerator as any).setups_[`motor_pinMode_${pin2}`] = `  pinMode(${pin2}, OUTPUT);`;
    return `  digitalWrite(${pin1}, LOW);\n  analogWrite(${pin2}, ${speed});\n`;
};

(arduinoGenerator as any).forBlock['motor_stop'] = function (block: Blockly.Block) {
    const pin1 = block.getFieldValue('PIN1');
    const pin2 = block.getFieldValue('PIN2');
    (arduinoGenerator as any).setups_[`motor_pinMode_${pin1}`] = `  pinMode(${pin1}, OUTPUT);`;
    (arduinoGenerator as any).setups_[`motor_pinMode_${pin2}`] = `  pinMode(${pin2}, OUTPUT);`;
    return `  digitalWrite(${pin1}, LOW);\n  digitalWrite(${pin2}, LOW);\n`;
};

(arduinoGenerator as any).forBlock['arduino_l298n_drive'] = function (block: Blockly.Block) {
    const en = block.getFieldValue('EN');
    const in1 = block.getFieldValue('IN1');
    const in2 = block.getFieldValue('IN2');
    const dir = block.getFieldValue('DIR') || 'STOP';
    const speed = (arduinoGenerator as any).valueToCode(block, 'SPEED', (arduinoGenerator as any).ORDER_NONE) || '255';
    const pwm = `constrain(${speed}, 0, 255)`;

    (arduinoGenerator as any).setups_[`l298_en_${en}`] = `  pinMode(${en}, OUTPUT);`;
    (arduinoGenerator as any).setups_[`l298_in1_${in1}`] = `  pinMode(${in1}, OUTPUT);`;
    (arduinoGenerator as any).setups_[`l298_in2_${in2}`] = `  pinMode(${in2}, OUTPUT);`;

    if (dir === 'FORWARD') {
        return `  analogWrite(${en}, ${pwm});\n  digitalWrite(${in1}, HIGH);\n  digitalWrite(${in2}, LOW);\n`;
    }
    if (dir === 'REVERSE') {
        return `  analogWrite(${en}, ${pwm});\n  digitalWrite(${in1}, LOW);\n  digitalWrite(${in2}, HIGH);\n`;
    }
    if (dir === 'BRAKE') {
        return `  analogWrite(${en}, ${pwm});\n  digitalWrite(${in1}, HIGH);\n  digitalWrite(${in2}, HIGH);\n`;
    }
    return `  analogWrite(${en}, 0);\n  digitalWrite(${in1}, LOW);\n  digitalWrite(${in2}, LOW);\n`;
};
// -- Standard Blocks (Loops, Math, Text) --
(arduinoGenerator as any).ORDER_ATOMIC = 0;
(arduinoGenerator as any).ORDER_NONE = 99;

(arduinoGenerator as any).forBlock['math_number'] = function (block: Blockly.Block) {
    return [block.getFieldValue('NUM'), (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['math_single'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const arg = (arduinoGenerator as any).valueToCode(block, 'NUM', (arduinoGenerator as any).ORDER_NONE) || '0';
    let code;
    if (operator === 'ROOT') code = `sqrt(${arg})`;
    else if (operator === 'ABS') code = `abs(${arg})`;
    else if (operator === 'NEG') code = `-${arg}`;
    else if (operator === 'LN') code = `log(${arg})`;
    else if (operator === 'LOG10') code = `log10(${arg})`;
    else if (operator === 'EXP') code = `exp(${arg})`;
    else if (operator === 'POW10') code = `pow(10, ${arg})`;
    else code = `(${arg})`;
    return [code, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['math_arithmetic'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const argument0 = (arduinoGenerator as any).valueToCode(block, 'A', (arduinoGenerator as any).ORDER_NONE) || '0';
    const argument1 = (arduinoGenerator as any).valueToCode(block, 'B', (arduinoGenerator as any).ORDER_NONE) || '0';

    if (operator === 'POWER') {
        return [`pow(${argument0}, ${argument1})`, (arduinoGenerator as any).ORDER_ATOMIC];
    }

    const operatorMap: Record<string, string> = {
        ADD: '+',
        MINUS: '-',
        MULTIPLY: '*',
        DIVIDE: '/'
    };
    const op = operatorMap[operator] || '+';
    return [`(${argument0} ${op} ${argument1})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['logic_boolean'] = function (block: Blockly.Block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['logic_compare'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const argument0 = (arduinoGenerator as any).valueToCode(block, 'A', (arduinoGenerator as any).ORDER_NONE) || '0';
    const argument1 = (arduinoGenerator as any).valueToCode(block, 'B', (arduinoGenerator as any).ORDER_NONE) || '0';
    const operatorMap: Record<string, string> = {
        EQ: '==',
        NEQ: '!=',
        LT: '<',
        LTE: '<=',
        GT: '>',
        GTE: '>='
    };
    const op = operatorMap[operator] || '==';
    return [`(${argument0} ${op} ${argument1})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['logic_operation'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const argument0 = (arduinoGenerator as any).valueToCode(block, 'A', (arduinoGenerator as any).ORDER_NONE) || 'false';
    const argument1 = (arduinoGenerator as any).valueToCode(block, 'B', (arduinoGenerator as any).ORDER_NONE) || 'false';
    const op = operator === 'AND' ? '&&' : '||';
    return [`(${argument0} ${op} ${argument1})`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['logic_negate'] = function (block: Blockly.Block) {
    const argument0 = (arduinoGenerator as any).valueToCode(block, 'BOOL', (arduinoGenerator as any).ORDER_NONE) || 'false';
    return [`(!(${argument0}))`, (arduinoGenerator as any).ORDER_ATOMIC];
};

(arduinoGenerator as any).forBlock['controls_if'] = function (block: Blockly.Block) {
    let n = 0;
    let code = '';

    do {
        const condition = (arduinoGenerator as any).valueToCode(block, `IF${n}`, (arduinoGenerator as any).ORDER_NONE) || 'false';
        const branch = (arduinoGenerator as any).statementToCode(block, `DO${n}`) || '';
        code += n === 0
            ? `  if (${condition}) {\n${branch}  }\n`
            : `  else if (${condition}) {\n${branch}  }\n`;
        n++;
    } while (block.getInput(`IF${n}`));

    if (block.getInput('ELSE')) {
        const elseBranch = (arduinoGenerator as any).statementToCode(block, 'ELSE') || '';
        code += `  else {\n${elseBranch}  }\n`;
    }

    return code;
};

(arduinoGenerator as any).forBlock['text_print'] = function (block: Blockly.Block) {
    const text = (arduinoGenerator as any).valueToCode(block, 'TEXT', (arduinoGenerator as any).ORDER_NONE) || '""';
    (arduinoGenerator as any).setups_['serial_begin'] = '  Serial.begin(9600);';
    return `  Serial.println(${text});\n`;
};

(arduinoGenerator as any).forBlock['controls_whileUntil'] = function (block: Blockly.Block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    const argument0 = (arduinoGenerator as any).valueToCode(block, 'BOOL', (arduinoGenerator as any).ORDER_NONE) || 'false';
    const branch = (arduinoGenerator as any).statementToCode(block, 'DO') || '';
    if (until) {
        return `  while (!(${argument0})) {\n${branch}  }\n`;
    }
    return `  while (${argument0}) {\n${branch}  }\n`;
};

(arduinoGenerator as any).forBlock['controls_repeat_ext'] = function (block: Blockly.Block) {
    const repeats = (arduinoGenerator as any).valueToCode(block, 'TIMES', (arduinoGenerator as any).ORDER_NONE) || '0';
    const branch = (arduinoGenerator as any).statementToCode(block, 'DO') || '';
    return `  for (int count = 0; count < ${repeats}; count++) {\n${branch}  }\n`;
};

(arduinoGenerator as any).forBlock['text'] = function (block: Blockly.Block) {
    return ['"' + block.getFieldValue('TEXT') + '"', (arduinoGenerator as any).ORDER_ATOMIC];
};

// ----------------------------------------------------------------------------
// 2. MICROPYTHON GENERATOR
// ----------------------------------------------------------------------------
export const micropythonGenerator = new Blockly.CodeGenerator('MicroPython');
micropythonGenerator.INDENT = '    ';

function getMicroPythonState(generator: Blockly.CodeGenerator) {
    const state = generator as any;
    if (!state.imports_) {
        state.imports_ = new Set<string>();
    }
    if (!state.setups_) {
        state.setups_ = Object.create(null);
    }
    return state as { imports_: Set<string>; setups_: Record<string, string> };
}

(micropythonGenerator as any).init = function (workspace: Blockly.Workspace) {
    const state = getMicroPythonState(this as Blockly.CodeGenerator);
    state.imports_.clear();
    state.setups_ = Object.create(null);
};

(micropythonGenerator as any).finish = function (code: string) {
    // We do NOT wrap the code anymore, the template system handles it
    return code;
};

function getMicroPythonImports(generator: Blockly.CodeGenerator) {
    const state = getMicroPythonState(generator);
    const imports: string[] = [];

    if (state.imports_.has('machine')) imports.push('import machine');
    if (state.imports_.has('time')) imports.push('import time');
    if (state.imports_.has('math')) imports.push('import math');
    if (state.imports_.has('dht')) imports.push('import dht');
    if (state.imports_.has('bme280')) imports.push('import bme280');
    if (state.imports_.has('bh1750')) imports.push('import bh1750');
    if (state.imports_.has('ssd1306')) imports.push('import ssd1306');
    if (state.imports_.has('neopixel')) imports.push('import neopixel');
    if (state.imports_.has('pico_i2c_lcd')) imports.push('from pico_i2c_lcd import I2cLcd');

    return Array.from(new Set(imports));
}
(micropythonGenerator as any).getImports = function () {
    return getMicroPythonImports(this as Blockly.CodeGenerator);
};

function dedentMicroPython(code: string) {
    if (!code) return '';
    const indent = micropythonGenerator.INDENT || '    ';
    return code
        .split('\n')
        .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
        .join('\n');
}
(micropythonGenerator as any).scrub_ = function (block: Blockly.Block, code: string, opt_thisOnly?: boolean): string {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
    return code + nextCode;
};

// -- MicroPython Blocks --
(micropythonGenerator as any).forBlock['arduino_pinMode'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE') === 'OUTPUT' ? 'machine.Pin.OUT' : 'machine.Pin.IN';
    const state = getMicroPythonState(micropythonGenerator);
    state.imports_.add('machine');
    state.setups_[`pinMode_${pin}`] = `pin_${pin} = machine.Pin(${pin}, ${mode})`;
    return '';
};

(micropythonGenerator as any).forBlock['arduino_digitalWrite'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE') === 'HIGH' ? '1' : '0';
    return `pin_${pin}.value(${state})\n`;
};

(micropythonGenerator as any).forBlock['arduino_delay'] = function (block: Blockly.Block) {
    const ms = block.getFieldValue('MS');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    return `time.sleep_ms(${ms})\n`;
};

(micropythonGenerator as any).forBlock['arduino_digitalRead'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const state = getMicroPythonState(micropythonGenerator);
    state.imports_.add('machine');
    state.setups_[`pinMode_${pin}`] = `pin_${pin} = machine.Pin(${pin}, machine.Pin.IN)`;
    return [`pin_${pin}.value()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_analogRead'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const pinNum = pin.replace('A', '');
    const state = getMicroPythonState(micropythonGenerator);
    state.imports_.add('machine');
    state.setups_[`adc_${pin}`] = `adc_${pin} = machine.ADC(machine.Pin(${pinNum}))`;
    return [`adc_${pin}.read()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_analogWrite'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const value = (micropythonGenerator as any).valueToCode(block, 'VALUE', (micropythonGenerator as any).ORDER_NONE) || '0';
    const state = getMicroPythonState(micropythonGenerator);
    state.imports_.add('machine');
    state.setups_[`pwm_${pin}`] = `pwm_${pin} = machine.PWM(machine.Pin(${pin}))\npwm_${pin}.freq(1000)`;
    // Map standard Arduino 8-bit (0-255) to 10-bit typical micropython mapping
    return `pwm_${pin}.duty(int(${value}) * 4)\n`;
};

(micropythonGenerator as any).forBlock['arduino_millis'] = function (block: Blockly.Block) {
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    return [`time.ticks_ms()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_serialPrint'] = function (block: Blockly.Block) {
    const text = (micropythonGenerator as any).valueToCode(block, 'TEXT', (micropythonGenerator as any).ORDER_NONE) || '""';
    return `print(${text}, end="")\n`;
};

(micropythonGenerator as any).forBlock['arduino_serialPrintln'] = function (block: Blockly.Block) {
    const text = (micropythonGenerator as any).valueToCode(block, 'TEXT', (micropythonGenerator as any).ORDER_NONE) || '""';
    return `print(${text})\n`;
};

(micropythonGenerator as any).forBlock['arduino_hc05_init'] = function (block: Blockly.Block) {
    const rx = block.getFieldValue('RX') || '10';
    const tx = block.getFieldValue('TX') || '11';
    const baud = block.getFieldValue('BAUD') || '9600';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_['hc05_uart'] = `hc05_uart = machine.UART(1, baudrate=${baud}, tx=machine.Pin(${tx}), rx=machine.Pin(${rx}))`;
    (micropythonGenerator as any).setups_['hc05_reader'] = `def hc05_read_byte():\n    data = hc05_uart.read(1)\n    if not data:\n        return -1\n    return data[0]`;
    return '';
};

(micropythonGenerator as any).forBlock['arduino_hc05_send'] = function (block: Blockly.Block) {
    const text = (micropythonGenerator as any).valueToCode(block, 'TEXT', (micropythonGenerator as any).ORDER_NONE) || '""';
    if (!(micropythonGenerator as any).setups_['hc05_uart']) {
        getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
        (micropythonGenerator as any).setups_['hc05_uart'] = 'hc05_uart = machine.UART(1, baudrate=9600, tx=machine.Pin(11), rx=machine.Pin(10))';
    }
    return `hc05_uart.write(str(${text}) + "\\n")\n`;
};

(micropythonGenerator as any).forBlock['arduino_hc05_available'] = function () {
    if (!(micropythonGenerator as any).setups_['hc05_uart']) {
        getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
        (micropythonGenerator as any).setups_['hc05_uart'] = 'hc05_uart = machine.UART(1, baudrate=9600, tx=machine.Pin(11), rx=machine.Pin(10))';
    }
    return ['hc05_uart.any()', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_hc05_read_byte'] = function () {
    if (!(micropythonGenerator as any).setups_['hc05_uart']) {
        getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
        (micropythonGenerator as any).setups_['hc05_uart'] = 'hc05_uart = machine.UART(1, baudrate=9600, tx=machine.Pin(11), rx=machine.Pin(10))';
    }
    if (!(micropythonGenerator as any).setups_['hc05_reader']) {
        (micropythonGenerator as any).setups_['hc05_reader'] = 'def hc05_read_byte():\n    data = hc05_uart.read(1)\n    if not data:\n        return -1\n    return data[0]';
    }
    return ['hc05_read_byte()', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_ir_init'] = function () {
    return '# IR receiver blocks are Arduino-only in this phase\n';
};

(micropythonGenerator as any).forBlock['arduino_ir_read_code'] = function () {
    return ['0', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_keypad_init'] = function () {
    return '# Keypad blocks are Arduino-only in this phase\n';
};

(micropythonGenerator as any).forBlock['arduino_keypad_get_key'] = function () {
    return ['""', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_relay_write'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE') === 'HIGH' ? '1' : '0';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`relay_${pin}`] = `relay_${pin} = machine.Pin(${pin}, machine.Pin.OUT)`;
    return `relay_${pin}.value(${state})\n`;
};

(micropythonGenerator as any).forBlock['arduino_buzzer_tone'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const freq = (micropythonGenerator as any).valueToCode(block, 'FREQ', (micropythonGenerator as any).ORDER_NONE) || '1000';
    const duration = (micropythonGenerator as any).valueToCode(block, 'DURATION', (micropythonGenerator as any).ORDER_NONE) || '250';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`buzzer_${pin}`] = `buzzer_${pin} = machine.PWM(machine.Pin(${pin}))`;
    return `buzzer_${pin}.freq(int(${freq}))\nbuzzer_${pin}.duty_u16(32768)\ntime.sleep_ms(int(${duration}))\nbuzzer_${pin}.duty_u16(0)\n`;
};

(micropythonGenerator as any).forBlock['arduino_buzzer_stop'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`buzzer_${pin}`] = `buzzer_${pin} = machine.PWM(machine.Pin(${pin}))`;
    return `buzzer_${pin}.duty_u16(0)\n`;
};

(micropythonGenerator as any).forBlock['arduino_pir_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`pir_${pin}`] = `pir_${pin} = machine.Pin(${pin}, machine.Pin.IN)`;
    return [`pir_${pin}.value()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_touch_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`touch_${pin}`] = `touch_${pin} = machine.Pin(${pin}, machine.Pin.IN)`;
    return [`touch_${pin}.value()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_soil_moisture_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const pinNum = String(pin).replace('A', '');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`soil_adc_${pin}`] = `soil_adc_${pin} = machine.ADC(machine.Pin(${pinNum}))`;
    return [`soil_adc_${pin}.read_u16()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_rain_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const pinNum = String(pin).replace('A', '');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`rain_adc_${pin}`] = `rain_adc_${pin} = machine.ADC(machine.Pin(${pinNum}))`;
    return [`rain_adc_${pin}.read_u16()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_water_level_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const pinNum = String(pin).replace('A', '');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`water_adc_${pin}`] = `water_adc_${pin} = machine.ADC(machine.Pin(${pinNum}))`;
    return [`water_adc_${pin}.read_u16()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_dht_init'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const type = block.getFieldValue('TYPE') || 'DHT11';
    const dhtClass = type === 'DHT22' ? 'DHT22' : 'DHT11';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('dht');
    (micropythonGenerator as any).setups_[`dht_${pin}`] = `dht_${pin} = dht.${dhtClass}(machine.Pin(${pin}))`;
    return '';
};

(micropythonGenerator as any).forBlock['arduino_dht_read'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const type = block.getFieldValue('TYPE') || 'DHT11';
    const metric = block.getFieldValue('METRIC') || 'TEMP_C';
    const dhtClass = type === 'DHT22' ? 'DHT22' : 'DHT11';
    const helperName = metric === 'HUMIDITY' ? `read_dht_h_${pin}` : `read_dht_t_${pin}`;
    const returnLine = metric === 'HUMIDITY'
        ? `    return dht_${pin}.humidity()`
        : `    return dht_${pin}.temperature()`;

    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('dht');
    (micropythonGenerator as any).setups_[`dht_${pin}`] = `dht_${pin} = dht.${dhtClass}(machine.Pin(${pin}))`;
    (micropythonGenerator as any).setups_[helperName] = `def ${helperName}():\n    dht_${pin}.measure()\n${returnLine}`;
    return [`${helperName}()`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_bme280_init'] = function (block: Blockly.Block) {
    const address = block.getFieldValue('ADDRESS') || '0x76';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('bme280');
    (micropythonGenerator as any).setups_['bme280_i2c'] = 'i2c_bme280 = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4))';
    (micropythonGenerator as any).setups_['bme280_sensor'] = `bme = bme280.BME280(i2c=i2c_bme280, address=${address})`;
    return '';
};

(micropythonGenerator as any).forBlock['arduino_bme280_read'] = function (block: Blockly.Block) {
    const metric = block.getFieldValue('METRIC') || 'TEMP_C';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('bme280');
    (micropythonGenerator as any).setups_['bme280_i2c'] = 'i2c_bme280 = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4))';
    (micropythonGenerator as any).setups_['bme280_sensor'] = 'bme = bme280.BME280(i2c=i2c_bme280, address=0x76)';

    if (metric === 'HUMIDITY') {
        return ['(float(bme.values[2].replace("%", "")))', (micropythonGenerator as any).ORDER_ATOMIC];
    }
    if (metric === 'PRESSURE_HPA') {
        return ['(float(bme.values[1].replace("hPa", "")))', (micropythonGenerator as any).ORDER_ATOMIC];
    }
    if (metric === 'ALTITUDE_M') {
        return ['0', (micropythonGenerator as any).ORDER_ATOMIC];
    }
    return ['(float(bme.values[0].replace("C", "")))', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_bh1750_init'] = function () {
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('bh1750');
    (micropythonGenerator as any).setups_['bh1750_i2c'] = 'i2c_bh1750 = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4))';
    (micropythonGenerator as any).setups_['bh1750_sensor'] = 'light_sensor = bh1750.BH1750(i2c_bh1750)';
    return '';
};

(micropythonGenerator as any).forBlock['arduino_bh1750_read'] = function () {
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('bh1750');
    (micropythonGenerator as any).setups_['bh1750_i2c'] = 'i2c_bh1750 = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4))';
    (micropythonGenerator as any).setups_['bh1750_sensor'] = 'light_sensor = bh1750.BH1750(i2c_bh1750)';
    return ['light_sensor.luminance(bh1750.BH1750.CONT_HIRES_1)', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['lcd_i2c_init'] = function (block: Blockly.Block) {
    const address = block.getFieldValue('ADDRESS') || '0x27';
    const cols = block.getFieldValue('COLS') || '16';
    const rows = block.getFieldValue('ROWS') || '2';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('pico_i2c_lcd');
    (micropythonGenerator as any).setups_['lcd_i2c_bus'] = 'i2c_lcd = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4), freq=400000)';
    (micropythonGenerator as any).setups_['lcd_device'] = `lcd = I2cLcd(i2c_lcd, ${address}, ${rows}, ${cols})`;
    return '';
};

(micropythonGenerator as any).forBlock['lcd_i2c_clear'] = function () {
    if (!(micropythonGenerator as any).setups_['lcd_device']) {
        getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
        getMicroPythonState(micropythonGenerator).imports_.add('pico_i2c_lcd');
        (micropythonGenerator as any).setups_['lcd_i2c_bus'] = 'i2c_lcd = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4), freq=400000)';
        (micropythonGenerator as any).setups_['lcd_device'] = 'lcd = I2cLcd(i2c_lcd, 0x27, 2, 16)';
    }
    return 'lcd.clear()\n';
};

(micropythonGenerator as any).forBlock['lcd_i2c_print'] = function (block: Blockly.Block) {
    const text = (micropythonGenerator as any).valueToCode(block, 'TEXT', (micropythonGenerator as any).ORDER_NONE) || '""';
    const col = (micropythonGenerator as any).valueToCode(block, 'COL', (micropythonGenerator as any).ORDER_NONE) || '0';
    const row = (micropythonGenerator as any).valueToCode(block, 'ROW', (micropythonGenerator as any).ORDER_NONE) || '0';
    if (!(micropythonGenerator as any).setups_['lcd_device']) {
        getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
        getMicroPythonState(micropythonGenerator).imports_.add('pico_i2c_lcd');
        (micropythonGenerator as any).setups_['lcd_i2c_bus'] = 'i2c_lcd = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4), freq=400000)';
        (micropythonGenerator as any).setups_['lcd_device'] = 'lcd = I2cLcd(i2c_lcd, 0x27, 2, 16)';
    }
    return `lcd.move_to(int(${col}), int(${row}))\nlcd.putstr(str(${text}))\n`;
};

(micropythonGenerator as any).forBlock['arduino_l298n_drive'] = function (block: Blockly.Block) {
    const en = block.getFieldValue('EN');
    const in1 = block.getFieldValue('IN1');
    const in2 = block.getFieldValue('IN2');
    const dir = block.getFieldValue('DIR') || 'STOP';
    const speed = (micropythonGenerator as any).valueToCode(block, 'SPEED', (micropythonGenerator as any).ORDER_NONE) || '0';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');

    if (dir === 'FORWARD') {
        return `pwm_${en} = machine.PWM(machine.Pin(${en}))\npwm_${en}.freq(1000)\npwm_${en}.duty(int(${speed}) * 4)\nmachine.Pin(${in1}, machine.Pin.OUT).value(1)\nmachine.Pin(${in2}, machine.Pin.OUT).value(0)\n`;
    }
    if (dir === 'REVERSE') {
        return `pwm_${en} = machine.PWM(machine.Pin(${en}))\npwm_${en}.freq(1000)\npwm_${en}.duty(int(${speed}) * 4)\nmachine.Pin(${in1}, machine.Pin.OUT).value(0)\nmachine.Pin(${in2}, machine.Pin.OUT).value(1)\n`;
    }
    if (dir === 'BRAKE') {
        return `pwm_${en} = machine.PWM(machine.Pin(${en}))\npwm_${en}.freq(1000)\npwm_${en}.duty(int(${speed}) * 4)\nmachine.Pin(${in1}, machine.Pin.OUT).value(1)\nmachine.Pin(${in2}, machine.Pin.OUT).value(1)\n`;
    }
    return `machine.Pin(${in1}, machine.Pin.OUT).value(0)\nmachine.Pin(${in2}, machine.Pin.OUT).value(0)\n`;
};
(micropythonGenerator as any).forBlock['arduino_servo_write'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const angle = (micropythonGenerator as any).valueToCode(block, 'ANGLE', (micropythonGenerator as any).ORDER_NONE) || '90';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    (micropythonGenerator as any).setups_[`servo_pwm_${pin}`] = `servo_${pin} = machine.PWM(machine.Pin(${pin}), freq=50)`;
    return `servo_${pin}.duty(int((${angle} / 180) * 75 + 40))\n`;
};

(micropythonGenerator as any).forBlock['arduino_ultrasonic'] = function (block: Blockly.Block) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_['ultrasonic_func'] = `def read_ultrasonic(trig_pin, echo_pin):\n    trig = machine.Pin(trig_pin, machine.Pin.OUT)\n    echo = machine.Pin(echo_pin, machine.Pin.IN)\n    trig.value(0)\n    time.sleep_us(2)\n    trig.value(1)\n    time.sleep_us(10)\n    trig.value(0)\n    try:\n        return machine.time_pulse_us(echo, 1, 30000) * 0.017\n    except:\n        return -1`;
    return [`read_ultrasonic(${trig}, ${echo})`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['arduino_setup_loop'] = function (block: Blockly.Block) {
    const setupCode = (micropythonGenerator as any).statementToCode(block, 'SETUP');
    if (setupCode) {
        (micropythonGenerator as any).setups_['manual_setup'] = dedentMicroPython(setupCode).trimEnd();
    }
    const loopCode = (micropythonGenerator as any).statementToCode(block, 'LOOP');
    return dedentMicroPython(loopCode);
};

(micropythonGenerator as any).forBlock['oled_init'] = function (block: Blockly.Block) {
    const width = block.getFieldValue('WIDTH');
    const height = block.getFieldValue('HEIGHT');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    getMicroPythonState(micropythonGenerator).imports_.add('ssd1306');
    (micropythonGenerator as any).setups_['init_i2c'] = 'i2c = machine.I2C(0, scl=machine.Pin(5), sda=machine.Pin(4))';
    (micropythonGenerator as any).setups_['init_display'] = `display = ssd1306.SSD1306_I2C(${width}, ${height}, i2c)`;
    return '';
};

(micropythonGenerator as any).forBlock['oled_clear'] = function (block: Blockly.Block) {
    return 'display.fill(0)\ndisplay.show()\n';
};

(micropythonGenerator as any).forBlock['oled_print'] = function (block: Blockly.Block) {
    const x = (micropythonGenerator as any).valueToCode(block, 'X', (micropythonGenerator as any).ORDER_NONE) || '0';
    const y = (micropythonGenerator as any).valueToCode(block, 'Y', (micropythonGenerator as any).ORDER_NONE) || '0';
    const text = (micropythonGenerator as any).valueToCode(block, 'TEXT', (micropythonGenerator as any).ORDER_NONE) || '""';
    return `display.text(str(${text}), int(${x}), int(${y}))\ndisplay.show()\n`;
};

(micropythonGenerator as any).forBlock['neopixel_init'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const count = block.getFieldValue('COUNT');
    getMicroPythonState(micropythonGenerator).imports_.add('neopixel');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    (micropythonGenerator as any).setups_[`init_np_${pin}`] = `np_${pin} = neopixel.NeoPixel(machine.Pin(${pin}), ${count})`;
    return '';
};

(micropythonGenerator as any).forBlock['neopixel_set_color'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    const index = (micropythonGenerator as any).valueToCode(block, 'INDEX', (micropythonGenerator as any).ORDER_NONE) || '0';
    const r = (micropythonGenerator as any).valueToCode(block, 'R', (micropythonGenerator as any).ORDER_NONE) || '0';
    const g = (micropythonGenerator as any).valueToCode(block, 'G', (micropythonGenerator as any).ORDER_NONE) || '0';
    const b = (micropythonGenerator as any).valueToCode(block, 'B', (micropythonGenerator as any).ORDER_NONE) || '0';
    return `np_${pin}[int(${index})] = (int(${r}), int(${g}), int(${b}))\n`;
};

(micropythonGenerator as any).forBlock['neopixel_show'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return `np_${pin}.write()\n`;
};

(micropythonGenerator as any).forBlock['neopixel_clear'] = function (block: Blockly.Block) {
    const pin = block.getFieldValue('PIN');
    return `np_${pin}.fill((0, 0, 0))\nnp_${pin}.write()\n`;
};

(micropythonGenerator as any).forBlock['motor_forward'] = function (block: Blockly.Block) {
    const pin1 = block.getFieldValue('PIN1');
    const pin2 = block.getFieldValue('PIN2');
    const speed = (micropythonGenerator as any).valueToCode(block, 'SPEED', (micropythonGenerator as any).ORDER_NONE) || '255';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    return `machine.PWM(machine.Pin(${pin1})).duty(int(${speed} * 4))\nmachine.Pin(${pin2}, machine.Pin.OUT).value(0)\n`;
};

(micropythonGenerator as any).forBlock['motor_backward'] = function (block: Blockly.Block) {
    const pin1 = block.getFieldValue('PIN1');
    const pin2 = block.getFieldValue('PIN2');
    const speed = (micropythonGenerator as any).valueToCode(block, 'SPEED', (micropythonGenerator as any).ORDER_NONE) || '255';
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    return `machine.Pin(${pin1}, machine.Pin.OUT).value(0)\nmachine.PWM(machine.Pin(${pin2})).duty(int(${speed} * 4))\n`;
};

(micropythonGenerator as any).forBlock['motor_stop'] = function (block: Blockly.Block) {
    const pin1 = block.getFieldValue('PIN1');
    const pin2 = block.getFieldValue('PIN2');
    getMicroPythonState(micropythonGenerator).imports_.add('machine');
    getMicroPythonState(micropythonGenerator).imports_.add('time');
    return `machine.Pin(${pin1}, machine.Pin.OUT).value(0)\nmachine.Pin(${pin2}, machine.Pin.OUT).value(0)\n`;
};

// -- Standard Blocks (Loops, Math, Text) --
(micropythonGenerator as any).ORDER_ATOMIC = 0;
(micropythonGenerator as any).ORDER_NONE = 99;

(micropythonGenerator as any).forBlock['math_number'] = function (block: Blockly.Block) {
    return [block.getFieldValue('NUM'), (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['math_single'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const arg = (micropythonGenerator as any).valueToCode(block, 'NUM', (micropythonGenerator as any).ORDER_NONE) || '0';
    getMicroPythonState(micropythonGenerator).imports_.add('math');
    let code;
    if (operator === 'ROOT') code = `math.sqrt(${arg})`;
    else if (operator === 'ABS') code = `math.fabs(${arg})`;
    else if (operator === 'NEG') code = `-${arg}`;
    else if (operator === 'LN') code = `math.log(${arg})`;
    else if (operator === 'LOG10') code = `math.log10(${arg})`;
    else if (operator === 'EXP') code = `math.exp(${arg})`;
    else if (operator === 'POW10') code = `math.pow(10, ${arg})`;
    else code = `(${arg})`;
    return [code, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['math_arithmetic'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const argument0 = (micropythonGenerator as any).valueToCode(block, 'A', (micropythonGenerator as any).ORDER_NONE) || '0';
    const argument1 = (micropythonGenerator as any).valueToCode(block, 'B', (micropythonGenerator as any).ORDER_NONE) || '0';

    if (operator === 'POWER') {
        return [`(${argument0} ** ${argument1})`, (micropythonGenerator as any).ORDER_ATOMIC];
    }

    const operatorMap: Record<string, string> = {
        ADD: '+',
        MINUS: '-',
        MULTIPLY: '*',
        DIVIDE: '/'
    };
    const op = operatorMap[operator] || '+';
    return [`(${argument0} ${op} ${argument1})`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['logic_boolean'] = function (block: Blockly.Block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False', (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['logic_compare'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const argument0 = (micropythonGenerator as any).valueToCode(block, 'A', (micropythonGenerator as any).ORDER_NONE) || '0';
    const argument1 = (micropythonGenerator as any).valueToCode(block, 'B', (micropythonGenerator as any).ORDER_NONE) || '0';
    const operatorMap: Record<string, string> = {
        EQ: '==',
        NEQ: '!=',
        LT: '<',
        LTE: '<=',
        GT: '>',
        GTE: '>='
    };
    const op = operatorMap[operator] || '==';
    return [`(${argument0} ${op} ${argument1})`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['logic_operation'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const argument0 = (micropythonGenerator as any).valueToCode(block, 'A', (micropythonGenerator as any).ORDER_NONE) || 'False';
    const argument1 = (micropythonGenerator as any).valueToCode(block, 'B', (micropythonGenerator as any).ORDER_NONE) || 'False';
    const op = operator === 'AND' ? 'and' : 'or';
    return [`(${argument0} ${op} ${argument1})`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['logic_negate'] = function (block: Blockly.Block) {
    const argument0 = (micropythonGenerator as any).valueToCode(block, 'BOOL', (micropythonGenerator as any).ORDER_NONE) || 'False';
    return [`(not (${argument0}))`, (micropythonGenerator as any).ORDER_ATOMIC];
};

(micropythonGenerator as any).forBlock['controls_if'] = function (block: Blockly.Block) {
    let n = 0;
    let code = '';

    do {
        const condition = (micropythonGenerator as any).valueToCode(block, `IF${n}`, (micropythonGenerator as any).ORDER_NONE) || 'False';
        const branch = (micropythonGenerator as any).statementToCode(block, `DO${n}`) || '    pass\n';
        code += n === 0
            ? `if ${condition}:\n${branch}`
            : `elif ${condition}:\n${branch}`;
        n++;
    } while (block.getInput(`IF${n}`));

    if (block.getInput('ELSE')) {
        const elseBranch = (micropythonGenerator as any).statementToCode(block, 'ELSE') || '    pass\n';
        code += `else:\n${elseBranch}`;
    }

    return code;
};

(micropythonGenerator as any).forBlock['text_print'] = function (block: Blockly.Block) {
    const text = (micropythonGenerator as any).valueToCode(block, 'TEXT', (micropythonGenerator as any).ORDER_NONE) || '""';
    return `print(${text})\n`;
};

(micropythonGenerator as any).forBlock['controls_whileUntil'] = function (block: Blockly.Block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    const argument0 = (micropythonGenerator as any).valueToCode(block, 'BOOL', (micropythonGenerator as any).ORDER_NONE) || 'False';
    const branch = (micropythonGenerator as any).statementToCode(block, 'DO') || '    pass\n';
    if (until) {
        return `while not (${argument0}):\n${branch}`;
    }
    return `while ${argument0}:\n${branch}`;
};

(micropythonGenerator as any).forBlock['controls_repeat_ext'] = function (block: Blockly.Block) {
    const repeats = (micropythonGenerator as any).valueToCode(block, 'TIMES', (micropythonGenerator as any).ORDER_NONE) || '0';
    const branch = (micropythonGenerator as any).statementToCode(block, 'DO') || '    pass\n';
    return `for count in range(${repeats}):\n${branch}`;
};

(micropythonGenerator as any).forBlock['text'] = function (block: Blockly.Block) {
    return ['"' + block.getFieldValue('TEXT') + '"', (micropythonGenerator as any).ORDER_ATOMIC];
};

// ----------------------------------------------------------------------------
// 3. GENERATOR HELPERS
// ----------------------------------------------------------------------------
// We no longer export a unified generateCode that returns a single string, 
// because BlockEditor needs the raw setups dictionary from the generator to fill the templates.

export function getGenerator(type: string): Blockly.CodeGenerator {
    if (type === "micropython") return micropythonGenerator;
    return arduinoGenerator;
}































