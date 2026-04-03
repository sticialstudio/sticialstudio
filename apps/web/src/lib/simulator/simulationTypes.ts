export type LogicalNetState = 'HIGH' | 'LOW' | 'FLOAT';

export type PinElectricalState = 'high' | 'low' | 'highZ' | 'pullup' | 'pulldown' | 'analog' | 'conflict';

export type SimulationBackend = 'avr8js' | 'behavioral' | 'unsupported';

export interface SimulationCapabilities {
  canCompile: boolean;
  canExecute: boolean;
  canSimulatePeripherals: boolean;
  supportsSerial: boolean;
  supportsLogicAnalyzer: boolean;
  supportsBusInspector: boolean;
  backend: SimulationBackend;
  note?: string;
}

export interface SimulationTraceEvent {
  id: string;
  pin: string;
  high: boolean;
  cycle: number;
  timestamp: number;
  electricalState: PinElectricalState;
}

export interface SimulationSerialConfig {
  baudRate: number;
  bitsPerChar: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd';
}

export interface SimulationBusEvent {
  id: string;
  bus: 'uart' | 'i2c' | 'spi';
  action: string;
  summary: string;
  cycle: number;
  timestamp: number;
  direction?: 'tx' | 'rx' | 'meta';
  data?: number[];
  address?: number | null;
  write?: boolean | null;
  ack?: boolean | null;
}

export interface SimulationPinSnapshot {
  pinId: string;
  logicalState: LogicalNetState;
  electricalState: PinElectricalState;
  mode: 'output' | 'input' | 'inputPullup' | 'analog' | 'power' | 'ground' | 'unknown';
  high: boolean | null;
  sources: string[];
  cycle?: number;
}
