import type { ComponentData, NetData } from "@/contexts/CircuitContext";
import { getNetFromNodeId, getNetToNodeId } from "@/lib/circuit/netData";
import {
  getComponentDefinition,
  normalizeComponentType,
  type CircuitPinType,
} from "@/lib/wiring/componentDefinitions";
import { hasResolvedPin } from "@/lib/wiring/componentConnectivity";
import type { CircuitNetlist, ComponentPinMapping } from "@/lib/wiring/NetlistEngine";

interface ComponentBlockRule {
  blocks: string[];
  requiredPins: string[];
}

const COMPONENT_BLOCK_RULES: Record<string, ComponentBlockRule[]> = {
  LED: [{ blocks: ["arduino_led_set"], requiredPins: ["SIG"] }],
  BUTTON: [{ blocks: ["arduino_button_read"], requiredPins: ["SIG"] }],
  POTENTIOMETER: [{ blocks: ["arduino_potentiometer_read"], requiredPins: ["SIG"] }],
  SERVO: [{ blocks: ["arduino_servo_write"], requiredPins: ["SIG"] }],
  ULTRASONIC: [{ blocks: ["arduino_ultrasonic"], requiredPins: ["TRIG", "ECHO"] }],
  DHT: [{ blocks: ["arduino_dht_read"], requiredPins: ["DATA"] }],
  OLED: [{ blocks: ["oled_init", "oled_clear", "oled_print", "oled_draw_pixel", "oled_draw_line", "oled_draw_rect", "oled_draw_circle", "oled_draw_triangle"], requiredPins: ["SCL", "SDA"] }],
};

const OPTIONAL_COMPONENT_BLOCKS = new Set<string>([
  "arduino_led_set",
  "arduino_ultrasonic",
  "arduino_pir_read",
  "arduino_touch_read",
  "arduino_sound_sensor_read",
  "arduino_photo_sensor_read",
  "arduino_potentiometer_read",
  "arduino_button_read",
  "arduino_ir_obstacle_read",
  "arduino_dht_init",
  "arduino_dht_read",
  "arduino_bme280_init",
  "arduino_bme280_read",
  "arduino_soil_moisture_read",
  "arduino_rain_read",
  "arduino_water_level_read",
  "arduino_max30102_init",
  "arduino_max30102_read",
  "arduino_color_sensor_read",
  "arduino_servo_write",
  "arduino_dc_motor_set",
  "arduino_water_pump_set",
  "motor_forward",
  "motor_backward",
  "motor_stop",
  "arduino_l298n_drive",
  "arduino_afmotor_run",
  "robot_move_forward",
  "robot_move_backward",
  "robot_turn_left",
  "robot_turn_right",
  "robot_stop",
  "robot_move_speed",
  "arduino_relay_write",
  "arduino_buzzer_tone",
  "arduino_buzzer_stop",
  "arduino_active_buzzer_set",
  "neopixel_init",
  "neopixel_set_color",
  "neopixel_show",
  "neopixel_clear",
  "arduino_rgb_set",
  "arduino_traffic_light_set",
  "lcd_i2c_init",
  "lcd_i2c_clear",
  "lcd_i2c_print",
  "oled_init",
  "oled_clear",
  "oled_print",
  "oled_draw_pixel",
  "oled_draw_line",
  "oled_draw_rect",
  "oled_draw_circle",
  "oled_draw_triangle",
  "arduino_tft_init",
  "arduino_tft_clear",
  "arduino_tft_print",
  "arduino_ir_init",
  "arduino_ir_read_code",
  "arduino_keypad_init",
  "arduino_keypad_get_key",
  "arduino_bh1750_init",
  "arduino_bh1750_read",
]);

const SIGNAL_PIN_TYPES = new Set<CircuitPinType>(["digital", "analog", "pwm"]);

export interface CodingMappedPin {
  pinId: string;
  pinName: string;
  pinType: CircuitPinType;
  connected: boolean;
  boardPinId: string | null;
  boardPinIds: string[];
  boardPinLabel: string | null;
  netId: string | null;
}

export interface CodingMappedComponent {
  componentId: string;
  componentType: string;
  componentName: string;
  instanceIndex: number;
  instanceKey: string;
  instanceLabel: string;
  hasAnyConnection: boolean;
  hasSignalMapping: boolean;
  isCodeReady: boolean;
  boardPinIds: string[];
  boardPins: string[];
  signalBoardPinIds: string[];
  signalBoardPins: string[];
  primaryBoardPinId: string | null;
  primaryBoardPin: string | null;
  pinMappings: Record<string, CodingMappedPin>;
  availableBlocks: string[];
}

export interface CircuitComponentCodeMapping {
  componentId: string;
  componentType: string;
  label: string;
  pin?: string;
  pins: Record<string, string>;
}

export interface CodingCircuitSnapshot {
  components: CodingMappedComponent[];
  componentMappings: Record<string, CircuitComponentCodeMapping>;
  connectedComponentIds: string[];
  mappedComponentIds: string[];
  usedBoardPins: string[];
  usedSignalPins: string[];
  availableBlockTypes: string[];
}

export const EMPTY_CODING_CIRCUIT_SNAPSHOT: CodingCircuitSnapshot = {
  components: [],
  componentMappings: {},
  connectedComponentIds: [],
  mappedComponentIds: [],
  usedBoardPins: [],
  usedSignalPins: [],
  availableBlockTypes: [],
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function isSignalPin(pinType: CircuitPinType) {
  return SIGNAL_PIN_TYPES.has(pinType);
}

function toInstanceKey(componentType: string, index: number) {
  return `${normalizeComponentType(componentType).replace(/_/g, "")}${index}`;
}

export function formatResolvedBoardPinLabel(boardPinId: string) {
  const trimmed = String(boardPinId || "").trim();
  const normalized = trimmed.toUpperCase();

  if (!trimmed) {
    return trimmed;
  }

  if (/^\d+$/.test(trimmed)) {
    return `D${trimmed}`;
  }

  if (normalized.startsWith("GND")) {
    return "GND";
  }

  if (normalized === "5V") {
    return "VCC";
  }

  if (normalized === "3V3") {
    return "3.3V";
  }

  return trimmed;
}

export function getBlocksForComponentType(componentType: string) {
  const rules = COMPONENT_BLOCK_RULES[normalizeComponentType(componentType)] || [];
  return uniqueStrings(rules.flatMap((rule) => rule.blocks));
}

export function isOptionalCircuitBlock(blockType: string) {
  return OPTIONAL_COMPONENT_BLOCKS.has(blockType);
}

export function buildCodingCircuitSnapshot(
  components: ComponentData[],
  nets: NetData[],
  netlist: CircuitNetlist,
  resolvedConnections: Record<string, ComponentPinMapping>
): CodingCircuitSnapshot {
  if (components.length === 0) {
    return EMPTY_CODING_CIRCUIT_SNAPSHOT;
  }

  const explicitConnections = new Set<string>();
  const netIdByNode = new Map<string, string>();
  const typeCounts = new Map<string, number>();

  nets.forEach((net) => {
    explicitConnections.add(getNetFromNodeId(net));
    explicitConnections.add(getNetToNodeId(net));
  });

  netlist.nets.forEach((net) => {
    net.nodes.forEach((node) => {
      if (!netIdByNode.has(node)) {
        netIdByNode.set(node, net.id);
      }
    });
  });

  const mappedComponents = components.map<CodingMappedComponent>((component) => {
    const componentType = normalizeComponentType(component.type);
    const definition = getComponentDefinition(component.type);
    const instanceIndex = (typeCounts.get(componentType) || 0) + 1;
    typeCounts.set(componentType, instanceIndex);

    const pinMappings = (definition?.pins || []).reduce<Record<string, CodingMappedPin>>((record, pin) => {
      const nodeId = `${component.id}.${pin.id}`;
      const connection = resolvedConnections[component.id]?.[pin.id];
      const boardPinIds = uniqueStrings(connection?.boardPins || []);
      const boardPinId = boardPinIds[0] || null;
      const connected = Boolean(connection?.netId && connection.nodes.some((node) => node !== nodeId)) || explicitConnections.has(nodeId);

      record[pin.id] = {
        pinId: pin.id,
        pinName: pin.name,
        pinType: pin.type,
        connected,
        boardPinId,
        boardPinIds,
        boardPinLabel: boardPinId ? formatResolvedBoardPinLabel(boardPinId) : null,
        netId: connection?.netId || netIdByNode.get(nodeId) || null,
      };

      return record;
    }, {});

    const boardPinIds = uniqueStrings(Object.values(pinMappings).flatMap((pin) => pin.boardPinIds));
    const boardPins = uniqueStrings(Object.values(pinMappings).map((pin) => pin.boardPinLabel));
    const signalPins = Object.values(pinMappings).filter((pin) => isSignalPin(pin.pinType));
    const signalBoardPinIds = uniqueStrings(signalPins.flatMap((pin) => pin.boardPinIds));
    const signalBoardPins = uniqueStrings(signalPins.map((pin) => pin.boardPinLabel));
    const rules = COMPONENT_BLOCK_RULES[componentType] || [];
    const availableBlocks = uniqueStrings(
      rules
        .filter((rule) =>
          rule.requiredPins.every((requiredPin) =>
            requiredPin === "SIG"
              ? hasResolvedPin(component.type, resolvedConnections[component.id], "SIG")
              : hasResolvedPin(component.type, resolvedConnections[component.id], requiredPin)
          )
        )
        .flatMap((rule) => rule.blocks)
    );

    return {
      componentId: component.id,
      componentType,
      componentName: definition?.name || component.type,
      instanceIndex,
      instanceKey: toInstanceKey(componentType, instanceIndex),
      instanceLabel: `${definition?.name || component.type} ${instanceIndex}`,
      hasAnyConnection: Object.values(pinMappings).some((pin) => pin.connected),
      hasSignalMapping: signalBoardPinIds.length > 0,
      isCodeReady: availableBlocks.length > 0,
      boardPinIds,
      boardPins,
      signalBoardPinIds,
      signalBoardPins,
      primaryBoardPinId: signalBoardPinIds[0] || null,
      primaryBoardPin: signalBoardPins[0] || null,
      pinMappings,
      availableBlocks,
    };
  });

  const codeReadyComponents = mappedComponents.filter((component) => component.isCodeReady);
  const componentMappings = codeReadyComponents.reduce<Record<string, CircuitComponentCodeMapping>>((record, component) => {
    const mappedSignalPins = Object.values(component.pinMappings).filter(
      (pin) => isSignalPin(pin.pinType) && Boolean(pin.boardPinLabel)
    );

    record[component.instanceKey] = {
      componentId: component.componentId,
      componentType: component.componentType,
      label: component.instanceLabel,
      pin: component.primaryBoardPin || undefined,
      pins: mappedSignalPins.reduce<Record<string, string>>((pinsRecord, pin) => {
        if (pin.boardPinLabel) {
          pinsRecord[pin.pinId] = pin.boardPinLabel;
        }
        return pinsRecord;
      }, {}),
    };

    return record;
  }, {});

  return {
    components: mappedComponents,
    componentMappings,
    connectedComponentIds: mappedComponents.filter((component) => component.hasAnyConnection).map((component) => component.componentId),
    mappedComponentIds: codeReadyComponents.map((component) => component.componentId),
    usedBoardPins: uniqueStrings(codeReadyComponents.flatMap((component) => component.boardPins)),
    usedSignalPins: uniqueStrings(codeReadyComponents.flatMap((component) => component.signalBoardPins)),
    availableBlockTypes: uniqueStrings(codeReadyComponents.flatMap((component) => component.availableBlocks)),
  };
}

export function getMappedHardwareInstances(
  snapshot: CodingCircuitSnapshot,
  componentType: string
): [string, string][] {
  const normalizedType = normalizeComponentType(componentType);
  const instances = snapshot.components.filter(
    (component) => component.componentType === normalizedType && component.isCodeReady
  );

  if (instances.length === 0) {
    return [[`No ${componentType} Connected`, "NONE"]];
  }

  return instances.map((component) => [
    component.primaryBoardPin ? `${component.instanceLabel} (${component.primaryBoardPin})` : component.instanceLabel,
    component.componentId,
  ]);
}




