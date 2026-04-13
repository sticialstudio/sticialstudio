import * as Blockly from 'blockly';

import { actuatorsBlocks } from './blocks/actuators';
import { coreBlocks } from './blocks/core';
import { displayBlocks, registerDisplayExtensions } from './blocks/display';
import { hardwareInstanceBlocks, registerHardwareInstanceExtensions } from './blocks/hardware_instances';
import { ioAdvancedBlocks } from './blocks/io_advanced';
import { mathBlocks } from './blocks/math';
import { robotBlocks } from './blocks/robot';
import { sensorsBlocks } from './blocks/sensors';

type JsonBlockDefinition = {
  type: string;
  [key: string]: unknown;
};

const customBlockDefinitions: JsonBlockDefinition[] = [
  ...coreBlocks,
  ...sensorsBlocks,
  ...actuatorsBlocks,
  ...displayBlocks,
  ...robotBlocks,
  ...mathBlocks,
  ...ioAdvancedBlocks,
  ...hardwareInstanceBlocks,
];

let customBlocksDefined = false;

export function defineCustomBlocks() {
  registerDisplayExtensions();
  registerHardwareInstanceExtensions();

  if (customBlocksDefined) {
    return;
  }

  const definitionsToRegister = customBlockDefinitions.filter((definition) => !Blockly.Blocks[definition.type]);
  if (definitionsToRegister.length > 0) {
    Blockly.defineBlocksWithJsonArray(definitionsToRegister as any);
  }

  customBlocksDefined = true;
}

