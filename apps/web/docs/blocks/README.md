# EdTech IDE Hardware Blocks

This document lists the custom hardware blocks implemented in the Blockly environment, their required board capabilities, and example code generation (Arduino C++ & MicroPython).

## 1. Sensors

### Sound, Photoresistor (LDR), and Potentiometer
These simple analog sensors return a value relative to the voltage dividing circuit they are attached to.
* **Requirements**: Board must support `analog` read capabilities.
* **Arduino C++**: `analogRead(pin)`
* **MicroPython**: `machine.ADC(machine.Pin(pin)).read_u16()`

### MAX30102 Pulse Oximeter
An advanced I2C heart rate and blood oxygen sensor.
* **Requirements**: Board must support `i2c`. Connect to SDA/SCL pins. 
* **Arduino C++**: Requires the `SparkFun_MAX3010x_Sensor_Library`. The `Setup` block injects `#include "MAX30105.h"` and `#include "heartRate.h"`.
* **MicroPython**: Requires a custom `max30102.py` driver to be flashed to the board.

### TCS3200 Color Sensor
Outputs a square wave with frequency directly proportional to light intensity of a chosen color (Red, Green, Blue, Clear).
* **Requirements**: 3 Digital Pins (`S2`, `S3` for control, `OUT` for reading the frequency).
* **Arduino C++**: Generates `pulseIn(outPin, LOW)` logic after configuring S2/S3.
* **MicroPython**: Generates a custom `read_tcs3200()` function using `machine.time_pulse_us()`.

---

## 2. Actuators & Output

### LED, Active Buzzer, Water Pump, Relay
Simple digital output devices that take a binary HIGH/ON or LOW/OFF state.
* **Requirements**: Any standard digital output pin.
* **Arduino C++**: `digitalWrite(pin, STATE)`
* **MicroPython**: `machine.Pin(pin, machine.Pin.OUT).value(1 or 0)`

### DC Motor & RGB LED
Variable output devices relying on Pulse Width Modulation (PWM) to control speed or color brightness.
* **Requirements**: Pin must support `pwm`.
* **Arduino C++**: `analogWrite(pin, 0-255)`
* **MicroPython**: `machine.PWM(machine.Pin(pin)).duty_u16(0-65535)` 

### Traffic Light Module
A packaged module with 3 separate LEDs (Red, Yellow, Green).
* **Requirements**: 3 standard digital pins.
* **Behavior**: Activating one state (e.g., YELLOW) automatically forces the other two pins LOW.

---

## 3. Communication & Displays

### 2.4" SPI TFT Touch Screen
A sophisticated matrix display that uses the SPI bus.
* **Requirements**: Board must support `spi`. (Standard Uno uses pins 10,11,12,13).
* **Arduino C++**: Requires `#include <Adafruit_GFX.h>` and `#include <MCUFRIEND_kbv.h>`.
* **MicroPython**: Requires a driver like `ili9341` flashed to the board. 

### OLED Display & LCD I2C
* **Requirements**: Board must support `i2c` (SDA/SCL config).
* **Arduino C++**: `#include <Adafruit_SSD1306.h>` or `#include <LiquidCrystal_I2C.h>`.
* **MicroPython**: Requires the `ssd1306` module or an `i2c_lcd` module.
