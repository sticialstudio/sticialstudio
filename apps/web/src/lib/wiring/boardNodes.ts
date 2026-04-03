import { normalizeComponentType } from '@/lib/wiring/componentDefinitions';

const KNOWN_BOARD_PREFIXES: Record<string, string> = {
  ARDUINO_UNO: 'UNO',
  ARDUINO_NANO: 'UNO',
  ARDUINO_MEGA: 'MEGA',
  ARDUINO_LEONARDO: 'LEONARDO',
  ESP32: 'ESP32',
  ESP8266: 'ESP8266',
  RASPBERRY_PI_PICO: 'PICO',
  RASPBERRY_PI_PICO_W: 'PICO_W',
  RASPBERRY_PI_PICO_2W: 'PICO_2W',
};

export function getBoardNodePrefix(componentType: string) {
  const normalized = normalizeComponentType(componentType);
  return KNOWN_BOARD_PREFIXES[normalized] ?? normalized.replace(/[^A-Z0-9]+/g, '_');
}

export function createBoardNodeId(componentType: string, pinId: string) {
  return `${getBoardNodePrefix(componentType)}_${pinId}`;
}

export function parseBoardNodeId(nodeId: string) {
  const prefixes = Object.values(KNOWN_BOARD_PREFIXES);
  for (const prefix of prefixes) {
    if (nodeId.startsWith(`${prefix}_`)) {
      return {
        prefix,
        pinId: nodeId.slice(prefix.length + 1),
      };
    }
  }

  return null;
}

export function isBoardNodeId(nodeId: string) {
  return Boolean(parseBoardNodeId(nodeId));
}

export function getBoardPinFromNodeId(nodeId: string) {
  return parseBoardNodeId(nodeId)?.pinId ?? null;
}
