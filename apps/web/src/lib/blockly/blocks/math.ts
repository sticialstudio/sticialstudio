import { getDigitalPinOptions } from '../dropdowns';

// ────────────────────────────────────────────────────────────────────────────
//  Extended Math Blocks  (Phase 2 — matching EduKits Code Kit Math category)
// ────────────────────────────────────────────────────────────────────────────
export const mathBlocks = [

  // Trig functions
  {
    type: 'math_trig_arduino',
    message0: '%1 of %2 °',
    args0: [
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['sin', 'SIN'],
          ['cos', 'COS'],
          ['tan', 'TAN'],
          ['asin', 'ASIN'],
          ['acos', 'ACOS'],
          ['atan', 'ATAN'],
        ],
      },
      { type: 'input_value', name: 'NUM', check: 'Number' },
    ],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Trigonometric function — input in degrees.',
    helpUrl: '',
  },

  // Pi constant
  {
    type: 'math_pi_arduino',
    message0: 'π',
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'The constant π (3.14159265…)',
    helpUrl: '',
  },

  // Even / odd / positive / negative check
  {
    type: 'math_check_arduino',
    message0: '%1 is %2',
    args0: [
      { type: 'input_value', name: 'NUM', check: 'Number' },
      {
        type: 'field_dropdown',
        name: 'PROPERTY',
        options: [
          ['even', 'EVEN'],
          ['odd', 'ODD'],
          ['positive', 'POSITIVE'],
          ['negative', 'NEGATIVE'],
          ['zero', 'ZERO'],
        ],
      },
    ],
    output: 'Boolean',
    style: 'math_blocks',
    tooltip: 'Check a numeric property.',
    helpUrl: '',
  },

  // Random fraction (0.0 – 1.0)
  {
    type: 'math_random_fraction_arduino',
    message0: 'random fraction',
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Returns a random float between 0.0 and 1.0.',
    helpUrl: '',
  },

  // Absolute value  
  {
    type: 'math_abs_arduino',
    message0: 'abs %1',
    args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Absolute value of a number.',
    helpUrl: '',
  },

  // Bit read
  {
    type: 'math_bit_read',
    message0: 'bit value at position %1 in %2',
    args0: [
      { type: 'input_value', name: 'BIT', check: 'Number' },
      { type: 'input_value', name: 'NUM', check: 'Number' },
    ],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Read a bit at a position in a number (0 or 1).',
    helpUrl: '',
  },

  // Bit set
  {
    type: 'math_bit_set',
    message0: 'set bit %1 in %2',
    args0: [
      { type: 'input_value', name: 'BIT', check: 'Number' },
      { type: 'input_value', name: 'NUM', check: 'Number' },
    ],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Set (make 1) a bit at a position in a number.',
    helpUrl: '',
  },

  // Bit clear
  {
    type: 'math_bit_clear',
    message0: 'clear bit %1 in %2',
    args0: [
      { type: 'input_value', name: 'BIT', check: 'Number' },
      { type: 'input_value', name: 'NUM', check: 'Number' },
    ],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Clear (make 0) a bit at a position in a number.',
    helpUrl: '',
  },

  // High byte
  {
    type: 'math_high_byte',
    message0: 'high byte of %1',
    args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Returns the high byte of a 16-bit number.',
    helpUrl: '',
  },

  // Low byte
  {
    type: 'math_low_byte',
    message0: 'low byte of %1',
    args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Returns the low byte of a 16-bit number.',
    helpUrl: '',
  },

  // Moving average filter — create
  {
    type: 'math_moving_avg_new',
    message0: 'new moving average filter %1 size %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myFilter' },
      { type: 'input_value', name: 'SIZE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'math_blocks',
    tooltip: 'Create a new moving average (smoothing) filter.',
    helpUrl: '',
  },

  // Moving average filter — add value
  {
    type: 'math_moving_avg_add',
    message0: 'add %1 to filter %2',
    args0: [
      { type: 'input_value', name: 'VALUE', check: 'Number' },
      { type: 'field_input', name: 'NAME', text: 'myFilter' },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'math_blocks',
    tooltip: 'Add a new value to the moving average filter.',
    helpUrl: '',
  },

  // Moving average filter — read
  {
    type: 'math_moving_avg_get',
    message0: 'average value from filter %1',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'myFilter' },
    ],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Read the current average from the filter.',
    helpUrl: '',
  },
];
