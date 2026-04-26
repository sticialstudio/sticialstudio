/**
 * mega-blink-test.ino
 *
 * Arduino Mega 2560 GPIO test sketch used by mega-emulation.test.ts
 *
 * Exercises pins across multiple ATmega2560 ports:
 *   - Pin 13  — PORTB bit 7 (LED_BUILTIN)
 *   - Pins 22-29 — PORTA bits 0-7 (all HIGH in setup)
 *   - Pin 53  — PORTB bit 0 (SPI SS)
 *   - Pin 4   — PORTG bit 5
 *   - Pin 6   — PORTH bit 3 (PWM)
 *   - Pin 42  — PORTL bit 7
 *
 * loop(): blinks pin 13 using a busy-wait loop (avoids Timer0 ISR dependency)
 * so the emulation test can detect both HIGH→LOW and LOW→HIGH transitions
 * within a bounded cycle budget.
 *
 * NOTE: delay() is intentionally avoided here. Arduino's delay() relies on
 * Timer0 overflow interrupts whose vector address differs between ATmega328P
 * (used by avr8js defaults) and ATmega2560, so it would spin forever in the
 * emulator.  The busy-wait loop below completes in ~1.4 M CPU cycles per half-
 * period — well within the 20 M cycle budget of the emulation test.
 */

/* Number of iterations per half-blink; ~14 cycles/iter × 100 000 ≈ 1.4 M cycles */
#define HALF_BLINK_ITERS 100000UL

static void busyWait(unsigned long iters) {
  volatile unsigned long i;
  for (i = 0; i < iters; i++) { /* nothing */ }
}

void setup() {
  // LED_BUILTIN = pin 13 = PORTB bit 7
  pinMode(13, OUTPUT);
  digitalWrite(13, HIGH);

  // PORTA: pins 22–29 (bits 0–7)
  for (int i = 22; i <= 29; i++) {
    pinMode(i, OUTPUT);
    digitalWrite(i, HIGH);
  }

  // PORTB bit 0: pin 53 (SPI SS)
  pinMode(53, OUTPUT);
  digitalWrite(53, HIGH);

  // PORTG bit 5: pin 4
  pinMode(4, OUTPUT);
  digitalWrite(4, HIGH);

  // PORTH bit 3: pin 6
  pinMode(6, OUTPUT);
  digitalWrite(6, HIGH);

  // PORTL bit 7: pin 42
  pinMode(42, OUTPUT);
  digitalWrite(42, HIGH);
}

void loop() {
  digitalWrite(13, HIGH);
  busyWait(HALF_BLINK_ITERS);
  digitalWrite(13, LOW);
  busyWait(HALF_BLINK_ITERS);
}
