/**
 * ili9341-test-sketch.ino
 *
 * Minimal Adafruit_ILI9341 sketch for emulation tests.
 * Draws shapes and text on the ILI9341 via hardware SPI.
 *
 * Wiring (Arduino Nano, hardware SPI):
 *   SCK  → D13 (pin 13, SPI CLK)
 *   MOSI → D11 (pin 11, SPI MOSI)
 *   MISO → D12 (pin 12, SPI MISO)
 *   CS   → D10 (pin 10)
 *   DC   → D9  (pin 9)
 *   RST  → D8  (pin 8)
 */

#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

#define TFT_CS  10
#define TFT_DC   9
#define TFT_RST  8

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

void setup() {
  Serial.begin(9600);
  tft.begin();

  // Fill screen red
  tft.fillScreen(ILI9341_RED);

  // Draw a white rectangle
  tft.fillRect(20, 20, 200, 80, ILI9341_WHITE);

  // Draw text
  tft.setTextColor(ILI9341_BLACK);
  tft.setTextSize(2);
  tft.setCursor(30, 40);
  tft.println("ILI9341 Test");

  // Draw a blue circle
  tft.fillCircle(120, 200, 50, ILI9341_BLUE);

  // Draw a yellow triangle
  tft.fillTriangle(60, 280, 120, 260, 180, 280, ILI9341_YELLOW);

  Serial.println("DONE");
}

void loop() {
  // Nothing
}
