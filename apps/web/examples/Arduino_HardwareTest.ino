// Basic Hardware Test (Arduino)
// Demonstrates PWM, Digital Write, and Analog Read functionality

const int ledPin = 3;      // PWM Capable
const int buttonPin = 2;   // Digital In
const int potPin = A0;     // Analog In

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {
  // Read Potentiometer
  int potValue = analogRead(potPin);
  
  // Map pot value (0-1023) to PWM duty cycle (0-255)
  int pwmValue = map(potValue, 0, 1023, 0, 255);
  
  // Read button state
  bool buttonPressed = (digitalRead(buttonPin) == LOW);
  
  if (buttonPressed) {
    // If button pressed, pulse the LED brightly
    analogWrite(ledPin, 255);
    Serial.println("Button PRESSED! LED Max");
  } else {
    // Otherwise, let the potentiometer control brightness
    analogWrite(ledPin, pwmValue);
    
    Serial.print("Potentiometer Value: ");
    Serial.println(potValue);
  }
  
  delay(100);
}
