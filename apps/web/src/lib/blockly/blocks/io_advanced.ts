import { getDigitalPinOptions } from '../dropdowns';

// ────────────────────────────────────────────────────────────────────────────
//  Advanced I/O Blocks  (Phase 2 — matching EduKits Code Kit I/O category)
// ────────────────────────────────────────────────────────────────────────────
export const ioAdvancedBlocks = [

  // tone() on any digital pin — maps directly to Arduino tone()
  {
    type: 'arduino_tone_pin',
    message0: 'tone on pin %1 frequency %2 Hz',
    args0: [
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
      { type: 'input_value', name: 'FREQ', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'io_blocks',
    tooltip: 'Play a tone at a given frequency on a pin.',
    helpUrl: 'https://www.arduino.cc/reference/en/language/functions/advanced-io/tone/',
  },

  // tone() with duration
  {
    type: 'arduino_tone_pin_duration',
    message0: 'tone on pin %1 frequency %2 Hz for %3 ms',
    args0: [
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
      { type: 'input_value', name: 'FREQ', check: 'Number' },
      { type: 'input_value', name: 'DUR', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'io_blocks',
    tooltip: 'Play a tone for a set duration (milliseconds).',
    helpUrl: 'https://www.arduino.cc/reference/en/language/functions/advanced-io/tone/',
  },

  // noTone()
  {
    type: 'arduino_no_tone_pin',
    message0: 'stop tone on pin %1',
    args0: [
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'io_blocks',
    tooltip: 'Stop any tone being generated on the specified pin.',
    helpUrl: 'https://www.arduino.cc/reference/en/language/functions/advanced-io/notone/',
  },

  // Named button — add (setup)
  {
    type: 'arduino_button_add',
    message0: 'add button %1 on pin %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myButton' },
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'io_blocks',
    tooltip: 'Define a named button connected to a digital pin.',
    helpUrl: '',
  },

  // Named button — is pressed (level)
  {
    type: 'arduino_button_is_pressed',
    message0: 'is %1 pressed?',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myButton' },
    ],
    output: 'Boolean',
    style: 'io_blocks',
    tooltip: 'Returns true while the button is held down.',
    helpUrl: '',
  },

  // Named button — was pressed (edge)
  {
    type: 'arduino_button_was_pressed',
    message0: 'was %1 pressed?',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myButton' },
    ],
    output: 'Boolean',
    style: 'io_blocks',
    tooltip: 'Returns true once each time the button is pressed (edge-triggered).',
    helpUrl: '',
  },

  // Read state of pin (value block — different from digitalWrite)
  {
    type: 'arduino_pin_state',
    message0: 'state of pin %1',
    args0: [
      { type: 'field_dropdown', name: 'PIN', options: getDigitalPinOptions },
    ],
    output: 'Number',
    style: 'io_blocks',
    tooltip: 'Returns HIGH (1) or LOW (0) — current state of a digital pin.',
    helpUrl: '',
  },

  // Board LED shortcut (built-in LED)
  {
    type: 'arduino_board_led',
    message0: 'set board LED to %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'STATE',
        options: [['ON', 'HIGH'], ['OFF', 'LOW']],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'io_blocks',
    tooltip: "Control the board's built-in LED (pin 13 / LED_BUILTIN).",
    helpUrl: '',
  },
];
