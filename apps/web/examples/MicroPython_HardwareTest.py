# Basic Hardware Test (MicroPython for Raspberry Pi Pico / ESP32)
# Demonstrates PWM, Digital Write, and Analog Read functionality

import machine
import time

# Pin Definitions (Pico Example)
led_pin = machine.Pin(15, machine.Pin.OUT)
pwm_led = machine.PWM(led_pin)
pwm_led.freq(1000)

button_pin = machine.Pin(14, machine.Pin.IN, machine.Pin.PULL_UP)

# Analog / Potentiometer Setup
# ADC pins vary by board (e.g., Pico ADC0 is usually GP26)
pot_adc = machine.ADC(machine.Pin(26)) 

print("MicroPython Hardware Test Started...")

while True:
    # Read Potentiometer (0 - 65535)
    pot_value = pot_adc.read_u16()
    
    # Read Button (0 is pressed due to PULL_UP)
    button_pressed = (button_pin.value() == 0)
    
    if button_pressed:
        pwm_led.duty_u16(65535) # Max brightness
        print("Button PRESSED! LED Max")
    else:
        pwm_led.duty_u16(pot_value) # Potentiometer controlled brightness
        print("Potentiometer Value:", pot_value)
        
    time.sleep_ms(100)
