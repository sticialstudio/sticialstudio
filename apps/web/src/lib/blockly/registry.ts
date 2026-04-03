import type { BoardKey } from '@/contexts/BoardContext';

export type GeneratorId = 'arduino' | 'micropython';
export type SupportedBoardId = 'all' | 'arduino' | 'esp' | 'raspberry' | BoardKey;

export interface BlockSupportMetadata {
  supportedBoards: SupportedBoardId[];
  generators: GeneratorId[];
  category: string;
}

export interface BlocklyRegistryEntry extends BlockSupportMetadata {
  type: string;
}

export interface ToolboxBlockEntry {
  kind: 'block';
  type: string;
  innerXml?: string;
}

export interface ToolboxSeparatorEntry {
  kind: 'sep';
  gap?: number;
}

export interface ToolboxLabelEntry {
  kind: 'label';
  text: string;
}

export type ToolboxCategoryEntry = ToolboxBlockEntry | ToolboxSeparatorEntry | ToolboxLabelEntry;

export interface ToolboxCategoryDefinition {
  id: string;
  name: string;
  categoryStyle: string;
  custom?: string;
  advanced?: boolean;
  entries: ToolboxCategoryEntry[];
}

const ALL_BOARDS: SupportedBoardId[] = ['all'];

const block = (type: string, innerXml?: string): ToolboxBlockEntry => ({ kind: 'block', type, innerXml });
const sep = (gap = 12): ToolboxSeparatorEntry => ({ kind: 'sep', gap });
const label = (text: string): ToolboxLabelEntry => ({ kind: 'label', text });
const shadowNumber = (name: string, value: number | string) =>
  `<value name="${name}"><shadow type="math_number"><field name="NUM">${value}</field></shadow></value>`;

const registryEntries: BlocklyRegistryEntry[] = [
  { type: 'arduino_setup_loop', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'basic' },
  { type: 'arduino_on_start', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'basic' },
  { type: 'arduino_forever', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'basic' },

  { type: 'arduino_pinMode', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_digitalWrite', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_digitalRead', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_led_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_board_led', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_pin_state', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_button_add', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_button_is_pressed', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_button_was_pressed', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_tone_pin', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_tone_pin_duration', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_no_tone_pin', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'digital-io' },
  { type: 'arduino_analogRead', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'analog-io' },
  { type: 'arduino_analogWrite', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'analog-io' },

  { type: 'math_trig_arduino', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_pi_arduino', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_check_arduino', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_random_fraction_arduino', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_abs_arduino', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_bit_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_bit_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_bit_clear', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_high_byte', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_low_byte', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_moving_avg_new', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_moving_avg_add', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_moving_avg_get', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },

  { type: 'arduino_ultrasonic_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_ultrasonic', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_dht_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_dht_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_encoder_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_encoder_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_encoder_write', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_sonar_add', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_sonar_read', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_dht_named_add', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_dht_named_temp', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_dht_named_humidity', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_dht_named_temp_f', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_encoder_add', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_encoder_named_read', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_encoder_reset', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },

  { type: 'arduino_servo_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_servo_write', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_servo_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_speed', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_step', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_l298n_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_l298n_drive', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_l298n_speed', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_servo_attach', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_servo_detach', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_servo_set_angle', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_servo_read_angle', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_add_2wire', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_add_4wire', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_set_speed', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_stepper_step_named', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_l298n_attach', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_l298n_set_direction', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_l298n_set_speed', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },

  { type: 'arduino_delay', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },
  { type: 'arduino_millis', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },
  { type: 'time_delay', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },
  { type: 'time_wait_seconds', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },
  { type: 'time_wait_until', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'timing' },

  { type: 'arduino_serialPrint', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  { type: 'arduino_serialPrintln', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  { type: 'arduino_serialBegin', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  { type: 'arduino_hc05_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  { type: 'arduino_hc05_send', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  { type: 'arduino_hc05_available', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },
  { type: 'arduino_hc05_read_byte', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'communication' },

  { type: 'arduino_pir_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_touch_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_soil_moisture_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_rain_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_water_level_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_potentiometer_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_sound_sensor_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_photo_sensor_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_button_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_ir_obstacle_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_bme280_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_bme280_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_bh1750_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_bh1750_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_max30102_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_max30102_read', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_color_sensor_read', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_ir_init', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_ir_read_code', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_keypad_init', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_keypad_get_key', supportedBoards: ['arduino'], generators: ['arduino'], category: 'sensors-actuators' },
  { type: 'arduino_relay_write', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_buzzer_tone', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_buzzer_stop', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_active_buzzer_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'sensors-actuators' },
  { type: 'arduino_dc_motor_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  { type: 'arduino_water_pump_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  { type: 'arduino_rgb_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  { type: 'arduino_traffic_light_set', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },

  { type: 'oled_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_clear', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_print', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_set_rotation', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_set_text_color', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_draw_pixel', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_draw_line', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_draw_rect', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_draw_circle', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'oled_draw_triangle', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'lcd_i2c_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'lcd_i2c_clear', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'lcd_i2c_print', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'displays' },
  { type: 'arduino_tft_init', supportedBoards: ['arduino'], generators: ['arduino'], category: 'displays' },
  { type: 'arduino_tft_clear', supportedBoards: ['arduino'], generators: ['arduino'], category: 'displays' },
  { type: 'arduino_tft_print', supportedBoards: ['arduino'], generators: ['arduino'], category: 'displays' },

  { type: 'neopixel_init', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  { type: 'neopixel_set_color', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  { type: 'neopixel_show', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },
  { type: 'neopixel_clear', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'lights' },

  { type: 'motor_forward', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  { type: 'motor_backward', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  { type: 'motor_stop', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'motors' },
  { type: 'arduino_afmotor_run', supportedBoards: ['arduino'], generators: ['arduino'], category: 'motors' },

  { type: 'robot_move_forward', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'robot' },
  { type: 'robot_move_backward', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'robot' },
  { type: 'robot_turn_left', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'robot' },
  { type: 'robot_turn_right', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'robot' },
  { type: 'robot_stop', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'robot' },
  { type: 'robot_move_speed', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'robot' },

  { type: 'controls_if', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  { type: 'logic_compare', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  { type: 'logic_operation', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  { type: 'logic_negate', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },
  { type: 'logic_boolean', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'logic' },

  { type: 'controls_repeat', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },
  { type: 'controls_repeat_ext', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },
  { type: 'controls_repeat_until', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },
  { type: 'controls_for_loop', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },
  { type: 'controls_forever', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },
  { type: 'controls_whileUntil', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'loops' },

  { type: 'math_number', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_arithmetic', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_single', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_random_int_custom', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_modulo_custom', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_round', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'math_on_list', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'arduino_map', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },
  { type: 'arduino_constrain', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'math' },

  { type: 'text', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'text' },
  { type: 'text_print', supportedBoards: ALL_BOARDS, generators: ['arduino', 'micropython'], category: 'text' },
];

export const BLOCK_REGISTRY: Record<string, BlocklyRegistryEntry> = Object.fromEntries(
  registryEntries.map((entry) => [entry.type, entry])
);

export const TOOLBOX_CATEGORY_DEFINITIONS: ToolboxCategoryDefinition[] = [
  { id: 'ActiveComponents', name: 'My Components', categoryStyle: 'more_category', entries: [] },
  {
    id: 'IO',
    name: 'Input/Output',
    categoryStyle: 'io_category',
    entries: [
      block('arduino_board_led'), block('arduino_led_set'), sep(), block('arduino_pinMode'), block('arduino_digitalWrite'), block('arduino_analogWrite'),
      sep(), block('arduino_digitalRead'), block('arduino_analogRead'), block('arduino_pin_state'),
      sep(), block('arduino_button_add'), block('arduino_button_is_pressed'), block('arduino_button_was_pressed'),
      sep(), block('arduino_tone_pin', shadowNumber('FREQ', 440)), block('arduino_tone_pin_duration', `${shadowNumber('FREQ', 440)}${shadowNumber('DUR', 500)}`), block('arduino_no_tone_pin'), block('arduino_buzzer_tone'), block('arduino_buzzer_stop'),
    ],
  },
  {
    id: 'Sensors', name: 'Sensors', categoryStyle: 'sensors_category', entries: [
      block('arduino_ultrasonic_init'), block('arduino_ultrasonic'), sep(), block('arduino_dht_init'), block('arduino_dht_read'), sep(),
      block('arduino_encoder_init'), block('arduino_encoder_read'), block('arduino_encoder_write', shadowNumber('VALUE', 0)), sep(),
      label('Named instances'), block('arduino_sonar_add'), block('arduino_sonar_read'), sep(),
      block('arduino_dht_named_add'), block('arduino_dht_named_temp'), block('arduino_dht_named_humidity'), block('arduino_dht_named_temp_f'), sep(),
      block('arduino_encoder_add'), block('arduino_encoder_named_read'), block('arduino_encoder_reset'), sep(),
      block('arduino_pir_read'), block('arduino_touch_read'), sep(),
      block('arduino_sound_sensor_read'), block('arduino_photo_sensor_read'), block('arduino_potentiometer_read'), block('arduino_button_read'), block('arduino_ir_obstacle_read'), sep(),
      block('arduino_bme280_init'), block('arduino_bme280_read'), sep(),
      block('arduino_soil_moisture_read'), block('arduino_rain_read'), block('arduino_water_level_read'), sep(),
      block('arduino_max30102_init'), block('arduino_max30102_read'),
    ],
  },
  {
    id: 'Motion', name: 'Motion', categoryStyle: 'motion_category', entries: [
      block('arduino_servo_init'), block('arduino_servo_write', shadowNumber('ANGLE', 90)), block('arduino_servo_read'), sep(),
      block('arduino_stepper_init'), block('arduino_stepper_speed'), block('arduino_stepper_step', shadowNumber('STEPS', 200)), sep(),
      block('arduino_l298n_init'), block('arduino_l298n_drive'), block('arduino_l298n_speed', shadowNumber('SPEED', 255)), sep(),
      label('Named instances'), block('arduino_servo_attach'), block('arduino_servo_detach'), block('arduino_servo_set_angle', shadowNumber('ANGLE', 90)), block('arduino_servo_read_angle'), sep(),
      block('arduino_stepper_add_2wire', shadowNumber('STEPS', 200)), block('arduino_stepper_add_4wire', shadowNumber('STEPS', 200)), block('arduino_stepper_set_speed', shadowNumber('RPM', 60)), block('arduino_stepper_step_named', shadowNumber('STEPS', 200)), sep(),
      block('arduino_l298n_attach'), block('arduino_l298n_set_direction'), block('arduino_l298n_set_speed', shadowNumber('SPEED', 255)), sep(),
      block('arduino_dc_motor_set'), block('arduino_water_pump_set'), sep(),
      block('motor_forward'), block('motor_backward'), block('motor_stop'), block('arduino_afmotor_run', shadowNumber('SPEED', 50)), sep(),
      block('robot_move_forward'), block('robot_move_backward'), block('robot_turn_left'), block('robot_turn_right'), block('robot_stop'), block('robot_move_speed', shadowNumber('SPEED', 100)),
    ],
  },
  {
    id: 'Control', name: 'Control', categoryStyle: 'control_category', entries: [
      block('arduino_on_start'), block('arduino_forever'), sep(16), block('time_wait_seconds', shadowNumber('SECONDS', 1)), block('time_delay', shadowNumber('MS', 1000)), block('time_wait_until'), block('arduino_millis'),
    ],
  },
  {
    id: 'Logic', name: 'Logic', categoryStyle: 'logic_category', entries: [
      block('controls_if'), block('controls_if', '<mutation else="1"></mutation>'), block('controls_if', '<mutation elseif="1" else="1"></mutation>'), sep(), block('logic_compare'), block('logic_operation'), block('logic_negate'), block('logic_boolean'),
    ],
  },
  {
    id: 'Loops', name: 'Loops', categoryStyle: 'loops_category', entries: [block('controls_forever'), block('controls_repeat', '<field name="TIMES">10</field>'), block('controls_repeat_until'), block('controls_for_loop')],
  },
  {
    id: 'Math', name: 'Math', categoryStyle: 'math_category', entries: [
      block('math_number'), block('math_arithmetic'), block('math_abs_arduino', shadowNumber('NUM', 0)), block('math_single'), block('math_round'), block('math_pi_arduino'), sep(),
      block('arduino_map'), block('arduino_constrain'), sep(),
      block('math_random_int_custom', `${shadowNumber('FROM', 1)}${shadowNumber('TO', 100)}`), block('math_random_fraction_arduino'), block('math_modulo_custom'), block('math_on_list'), sep(),
      block('math_trig_arduino', shadowNumber('NUM', 45)), block('math_check_arduino', shadowNumber('NUM', 0)), sep(),
      block('math_bit_read', `${shadowNumber('BIT', 0)}${shadowNumber('NUM', 0)}`), block('math_bit_set', `${shadowNumber('BIT', 0)}${shadowNumber('NUM', 0)}`), block('math_bit_clear', `${shadowNumber('BIT', 0)}${shadowNumber('NUM', 0)}`), block('math_high_byte', shadowNumber('NUM', 0)), block('math_low_byte', shadowNumber('NUM', 0)), sep(),
      block('math_moving_avg_new', shadowNumber('SIZE', 10)), block('math_moving_avg_add', shadowNumber('VALUE', 0)), block('math_moving_avg_get'),
    ],
  },
  { id: 'Text', name: 'Text', categoryStyle: 'text_category', entries: [block('text'), block('text_print')] },
  { id: 'Variables', name: 'Variables', categoryStyle: 'variables_category', custom: 'VARIABLE', entries: [] },
  { id: 'Functions', name: 'Functions', categoryStyle: 'functions_category', custom: 'PROCEDURE', entries: [] },
  {
    id: 'Messaging', name: 'Messaging', categoryStyle: 'messaging_category', advanced: true, entries: [block('arduino_serialBegin'), block('arduino_serialPrint'), block('arduino_serialPrintln'), sep(), block('arduino_ir_init'), block('arduino_ir_read_code'), sep(), block('arduino_keypad_init'), block('arduino_keypad_get_key')],
  },
  {
    id: 'Color', name: 'Color', categoryStyle: 'color_category', advanced: true, entries: [block('arduino_color_sensor_read'), sep(), block('neopixel_init'), block('neopixel_set_color'), block('neopixel_show'), block('neopixel_clear'), sep(), block('arduino_rgb_set'), block('arduino_traffic_light_set')],
  },
  {
    id: 'Displays', name: 'Displays', categoryStyle: 'displays_category', entries: [
      block('lcd_i2c_init'), block('lcd_i2c_clear'), block('lcd_i2c_print'), sep(), block('oled_init'), block('oled_clear'), block('oled_print'), block('oled_set_rotation'), block('oled_set_text_color'), sep(),
      block('oled_draw_pixel', `${shadowNumber('X', 0)}${shadowNumber('Y', 0)}`), block('oled_draw_line', `${shadowNumber('X0', 0)}${shadowNumber('Y0', 0)}${shadowNumber('X1', 10)}${shadowNumber('Y1', 10)}`), block('oled_draw_rect', `${shadowNumber('X', 0)}${shadowNumber('Y', 0)}${shadowNumber('W', 10)}${shadowNumber('H', 10)}`), block('oled_draw_circle', `${shadowNumber('X', 10)}${shadowNumber('Y', 10)}${shadowNumber('R', 5)}`), block('oled_draw_triangle', `${shadowNumber('X0', 0)}${shadowNumber('Y0', 10)}${shadowNumber('X1', 10)}${shadowNumber('Y1', 0)}${shadowNumber('X2', 20)}${shadowNumber('Y2', 10)}`), sep(),
      block('arduino_tft_init'), block('arduino_tft_clear'), block('arduino_tft_print'),
    ],
  },
  {
    id: 'More', name: 'More Blocks', categoryStyle: 'more_category', advanced: true, entries: [block('arduino_relay_write'), block('arduino_active_buzzer_set'), sep(), block('arduino_bh1750_init'), block('arduino_bh1750_read'), sep(), { kind: 'label', text: 'Legacy root blocks' }, block('arduino_setup_loop')],
  },
];

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderToolboxEntry(entry: ToolboxCategoryEntry) {
  if (entry.kind === 'sep') return `<sep gap="${entry.gap ?? 12}"></sep>`;
  if (entry.kind === 'label') return `<label text="${escapeXml(entry.text)}"></label>`;
  return `<block type="${escapeXml(entry.type)}">${entry.innerXml || ''}</block>`;
}

export interface RegistryToolboxOptions {
  showAdvancedBlocks?: boolean;
}

function renderToolboxCategory(category: ToolboxCategoryDefinition) {
  const attributes = [
    `name="${escapeXml(category.name)}"`,
    `categorystyle="${escapeXml(category.categoryStyle)}"`,
    `id="${escapeXml(category.id)}"`,
    category.custom ? `custom="${escapeXml(category.custom)}"` : '',
  ].filter(Boolean).join(' ');
  return `<category ${attributes}>${category.entries.map(renderToolboxEntry).join('')}</category>`;
}

export function buildToolboxXmlFromRegistry(options: RegistryToolboxOptions = {}) {
  const { showAdvancedBlocks = true } = options;
  const categories = TOOLBOX_CATEGORY_DEFINITIONS.filter((category) => showAdvancedBlocks || !category.advanced);
  return `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">${categories.map(renderToolboxCategory).join('')}</xml>`;
}

export interface BlocklyRegistryValidationResult {
  missingRegistryEntries: string[];
  toolboxEntriesMissingDefinitions: string[];
  duplicateRegistryTypes: string[];
}

export function validateBlocklyRegistry(): BlocklyRegistryValidationResult {
  const seen = new Set<string>();
  const duplicateRegistryTypes = new Set<string>();
  for (const entry of registryEntries) {
    if (seen.has(entry.type)) {
      duplicateRegistryTypes.add(entry.type);
      continue;
    }
    seen.add(entry.type);
  }

  const toolboxBlockTypes = TOOLBOX_CATEGORY_DEFINITIONS.flatMap((category) =>
    category.entries.flatMap((entry) => (entry.kind === 'block' ? [entry.type] : []))
  );

  const missingRegistryEntries = toolboxBlockTypes.filter((type) => !BLOCK_REGISTRY[type]);
  const toolboxEntriesMissingDefinitions = Object.keys(BLOCK_REGISTRY).filter(
    (type) => !toolboxBlockTypes.includes(type) && !['arduino_hc05_init', 'arduino_hc05_send', 'arduino_hc05_available', 'arduino_hc05_read_byte'].includes(type)
  );

  return {
    missingRegistryEntries: Array.from(new Set(missingRegistryEntries)),
    toolboxEntriesMissingDefinitions: Array.from(new Set(toolboxEntriesMissingDefinitions)),
    duplicateRegistryTypes: Array.from(duplicateRegistryTypes),
  };
}













