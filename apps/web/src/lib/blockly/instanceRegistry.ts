import * as Blockly from 'blockly';

type InstanceKind = 'sonar' | 'dht' | 'encoder' | 'servo' | 'stepper' | 'l298n';

interface InstanceSpec {
  creatorTypes: string[];
  fallbackLabel: string;
}

const INSTANCE_SPECS: Record<InstanceKind, InstanceSpec> = {
  sonar: { creatorTypes: ['arduino_sonar_add'], fallbackLabel: 'mySonar' },
  dht: { creatorTypes: ['arduino_dht_named_add'], fallbackLabel: 'myDHT' },
  encoder: { creatorTypes: ['arduino_encoder_add'], fallbackLabel: 'myEncoder' },
  servo: { creatorTypes: ['arduino_servo_attach'], fallbackLabel: 'myServo' },
  stepper: { creatorTypes: ['arduino_stepper_add_2wire', 'arduino_stepper_add_4wire'], fallbackLabel: 'myStepper' },
  l298n: { creatorTypes: ['arduino_l298n_attach'], fallbackLabel: 'myL298N' },
};

declare global {
  interface Window {
    __BLOCKLY_ACTIVE_WORKSPACE?: Blockly.WorkspaceSvg | Blockly.Workspace | null;
  }
}

function getActiveWorkspace(): Blockly.Workspace | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.__BLOCKLY_ACTIVE_WORKSPACE || null;
}

function collectNames(kind: InstanceKind): string[] {
  const workspace = getActiveWorkspace();
  const spec = INSTANCE_SPECS[kind];

  if (!workspace || !spec) {
    return [];
  }

  const names = new Set<string>();

  for (const block of workspace.getAllBlocks(false)) {
    if (!spec.creatorTypes.includes(block.type)) {
      continue;
    }

    const rawName = block.getFieldValue('NAME');
    if (typeof rawName !== 'string') {
      continue;
    }

    const trimmed = rawName.trim();
    if (!trimmed) {
      continue;
    }

    names.add(trimmed);
  }

  return Array.from(names);
}

function toOptions(kind: InstanceKind): [string, string][] {
  const names = collectNames(kind);
  if (names.length === 0) {
    const fallback = INSTANCE_SPECS[kind].fallbackLabel;
    return [[fallback, fallback]];
  }
  return names.map((name) => [name, name]);
}

export const getSonarInstanceOptions = () => toOptions('sonar');
export const getDhtNamedInstanceOptions = () => toOptions('dht');
export const getEncoderNamedInstanceOptions = () => toOptions('encoder');
export const getServoNamedInstanceOptions = () => toOptions('servo');
export const getStepperNamedInstanceOptions = () => toOptions('stepper');
export const getL298nNamedInstanceOptions = () => toOptions('l298n');
