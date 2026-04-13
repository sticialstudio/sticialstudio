// src/lib/wiring/workspaceParser.ts

import { COMPONENT_REGISTRY, HardwareComponent } from './componentRegistry';

export interface ExtractedComponent extends HardwareComponent {
  extractedPins: Record<string, string>; // Maps pin name (e.g., 'TRIG') to assigned value (e.g., '9')
  instanceId: string;
}

/**
 * Parses a raw Blockly XML string and extracts all hardware components
 * that are registered in the COMPONENT_REGISTRY.
 */
export function extractHardwareComponents(blocklyXml: string): ExtractedComponent[] {
  if (!blocklyXml || typeof window === 'undefined') return [];

  const results: ExtractedComponent[] = [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(blocklyXml, 'text/xml');
    const blocks = xmlDoc.getElementsByTagName('block');

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockType = block.getAttribute('type');

        if (blockType && COMPONENT_REGISTRY[blockType]) {
            const registryEntry = COMPONENT_REGISTRY[blockType];
            const extractedPins: Record<string, string> = {};

            // Extract values for dynamic pins based on blocklyFieldName
            registryEntry.pins.forEach(pinDef => {
                if (pinDef.blocklyFieldName) {
                    const fieldNode = Array.from(block.getElementsByTagName('field'))
                        .find(f => f.getAttribute('name') === pinDef.blocklyFieldName);
                        
                    if (fieldNode && fieldNode.textContent) {
                        extractedPins[pinDef.name] = fieldNode.textContent;
                    }
                } else if (pinDef.fixedPin) {
                    extractedPins[pinDef.name] = pinDef.fixedPin;
                }
            });

            results.push({
                ...registryEntry,
                extractedPins,
                instanceId: `${blockType}_${i}`,
            });
        }
    }
  } catch (error) {
    console.error('Failed to parse Blockly XML for wiring diagram:', error);
  }

  return results;
}
