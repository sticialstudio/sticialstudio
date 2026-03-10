import { BOARD_CONFIG, type BoardConfigItem } from '@/lib/boards/boardConfig';
import type { BoardKey } from '@/contexts/BoardContext';

export type GeneratorId = 'arduino' | 'micropython';

export interface BlockSupportMetadata {
  supportedBoards: string[];
  generators: GeneratorId[];
  category: string;
}

const ALL_BOARDS = ['all'];

export const BLOCK_SUPPORT_MATRIX: Record<string, BlockSupportMetadata> = {
  // Basic
  arduino_setup_loop: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'basic' },

  // Digital I/O
  arduino_pinMode: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  arduino_digitalWrite: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  arduino_digitalRead: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },

  // Analog I/O
  arduino_analogRead: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'analog-io' },
  arduino_analogWrite: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'analog-io' },

  // Timing
  arduino_delay: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },
  arduino_millis: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },

  // Communication
  arduino_serialPrint: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  arduino_serialPrintln: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  arduino_hc05_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  arduino_hc05_send: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  arduino_hc05_available: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  arduino_hc05_read_byte: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },

  // Sensors & Actuators
  arduino_ultrasonic: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_pir_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_touch_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_soil_moisture_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_rain_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_water_level_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_dht_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_dht_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_bme280_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_bme280_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_bh1750_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_bh1750_read: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_ir_init: { supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  arduino_ir_read_code: { supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  arduino_keypad_init: { supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  arduino_keypad_get_key: { supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  arduino_servo_write: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_relay_write: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_buzzer_tone: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  arduino_buzzer_stop: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },

  // Displays
  oled_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  oled_clear: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  oled_print: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  lcd_i2c_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  lcd_i2c_clear: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  lcd_i2c_print: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },

  // Lights
  neopixel_init: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  neopixel_set_color: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  neopixel_show: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  neopixel_clear: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },

  // Motors
  motor_forward: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  motor_backward: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  motor_stop: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  arduino_l298n_drive: { supportedBoards: ['arduino'], generators: ['arduino'], category: 'motors' },

  // Logic
  controls_if: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  logic_compare: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  logic_operation: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  logic_negate: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  logic_boolean: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },

  // Loops
  controls_repeat_ext: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },
  controls_whileUntil: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },

  // Math
  math_number: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  math_arithmetic: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  math_single: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },

  // Text
  text: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'text' },
  text_print: { supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'text' }
};

function matchesBoardFamily(candidate: string, boardConfig: BoardConfigItem) {
  return candidate === boardConfig.family;
}

function matchesBoardKey(candidate: string, boardKey: BoardKey) {
  return candidate === boardKey;
}

export function isBlockSupportedForBoard(blockType: string, boardKey: BoardKey) {
  const metadata = BLOCK_SUPPORT_MATRIX[blockType];
  if (!metadata) return true;

  const boardConfig = BOARD_CONFIG[boardKey];
  if (!boardConfig) return true;

  const supportsBoard =
    metadata.supportedBoards.includes('all') ||
    metadata.supportedBoards.some((candidate) => matchesBoardFamily(candidate, boardConfig) || matchesBoardKey(candidate, boardKey));

  const supportsGenerator = metadata.generators.includes(boardConfig.generator);

  return supportsBoard && supportsGenerator;
}
