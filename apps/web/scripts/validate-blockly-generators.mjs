import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const blockEditorPath = path.join(rootDir, 'src', 'components', 'ide', 'BlockEditor.tsx');
const generatorPath = path.join(rootDir, 'src', 'lib', 'blockly', 'generator.ts');

const toolboxSource = fs.readFileSync(blockEditorPath, 'utf8');
const generatorSource = fs.readFileSync(generatorPath, 'utf8');

const toolboxTypes = [...toolboxSource.matchAll(/<block type="([^"]+)"/g)]
  .map((match) => match[1])
  .filter(Boolean);

const uniqueToolboxTypes = [...new Set(toolboxTypes)].sort();

const microSectionMarker = '// -- MicroPython Blocks --';
const microSectionIndex = generatorSource.indexOf(microSectionMarker);

if (microSectionIndex === -1) {
  console.error('Validation failed: could not locate MicroPython generator section.');
  process.exit(1);
}

const arduinoSection = generatorSource.slice(0, microSectionIndex);
const micropythonSection = generatorSource.slice(microSectionIndex);

const collectHandlers = (section) => {
  return new Set([...section.matchAll(/forBlock\['([^']+)'\]/g)].map((match) => match[1]));
};

const arduinoHandlers = collectHandlers(arduinoSection);
const micropythonHandlers = collectHandlers(micropythonSection);

const missingArduino = uniqueToolboxTypes.filter((type) => !arduinoHandlers.has(type));
const missingMicroPython = uniqueToolboxTypes.filter((type) => !micropythonHandlers.has(type));

if (missingArduino.length > 0 || missingMicroPython.length > 0) {
  console.error('Blockly generator coverage validation failed.');
  if (missingArduino.length > 0) {
    console.error(`Missing Arduino handlers (${missingArduino.length}): ${missingArduino.join(', ')}`);
  }
  if (missingMicroPython.length > 0) {
    console.error(`Missing MicroPython handlers (${missingMicroPython.length}): ${missingMicroPython.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Blockly generator coverage OK. Toolbox blocks checked: ${uniqueToolboxTypes.length}`);
