const fs = require('fs');
const path = require('path');

const displayPath = path.join(__dirname, 'src', 'lib', 'blockly', 'blocks', 'display.ts');
let content = fs.readFileSync(displayPath, 'utf8');

// Replace { type: "field_dropdown", name: "SENSOR", options: getOledInstances }
// with: { type: "input_dummy", name: "SENSOR_DUMMY" }
// and append extensions: ["dynamic_oled_extension"] to the block object
// Actually, it's easier to just use `options: [["", "NONE"]]` and use an extension to dynamically override the menu generator.
// Let's do exactly that! This avoids messing with input_dummy vs field_dropdown.

content = content.replace(/options:\s*getOledInstances/g, 'options: [["", "NONE"]]');
content = content.replace(/options:\s*getNeopixelInstances/g, 'options: [["", "NONE"]]');

// Then add extensions to the blocks.
// For oled blocks: Find blocks with type starting with "oled_" and add extensions: ["dynamic_oled_extension"]
content = content.replace(/(type:\s*"oled_[^"]+",)/g, '$1\n            extensions: ["dynamic_oled_extension"],');

// For neopixel blocks:
content = content.replace(/(type:\s*"neopixel_[^"]+",)/g, '$1\n            extensions: ["dynamic_neopixel_extension"],');

// At the bottom of the file we add the extension registrations:
content += `

import * as Blockly from 'blockly';
import { getOledInstances, getNeopixelInstances } from '../dropdowns';

let displayExtensionsRegistered = false;
export function registerDisplayExtensions() {
    if (displayExtensionsRegistered) return;
    
    Blockly.Extensions.register('dynamic_oled_extension', function(this: Blockly.Block) {
        const field = this.getField('SENSOR') as Blockly.FieldDropdown;
        if (field) {
            field.menuGenerator_ = getOledInstances;
        }
    });

    Blockly.Extensions.register('dynamic_neopixel_extension', function(this: Blockly.Block) {
        const field = this.getField('SENSOR') as Blockly.FieldDropdown;
        if (field) {
            field.menuGenerator_ = getNeopixelInstances;
        }
    });
    
    displayExtensionsRegistered = true;
}
`;

// Remove the import from the top so we don't duplicate or conflict:
// `import { ... getOledInstances, getNeopixelInstances } from '../dropdowns';`
content = content.replace(/getOledInstances,\s*getNeopixelInstances\s*\} from '\.\.\/dropdowns';/g, "} from '../dropdowns';\nimport { getOledInstances, getNeopixelInstances } from '../dropdowns';");

fs.writeFileSync(displayPath, content, 'utf8');
console.log("Fixed display.ts");
