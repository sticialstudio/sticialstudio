import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const registryPath = path.join(rootDir, 'src', 'lib', 'blockly', 'registry.ts');
const generatorPath = path.join(rootDir, 'src', 'lib', 'blockly', 'generator.ts');
const blocksIndexPath = path.join(rootDir, 'src', 'lib', 'blockly', 'blocks.ts');
const blocksDir = path.join(rootDir, 'src', 'lib', 'blockly', 'blocks');

const registrySource = fs.readFileSync(registryPath, 'utf8');
const generatorSource = fs.readFileSync(generatorPath, 'utf8');
const blocksIndexSource = fs.readFileSync(blocksIndexPath, 'utf8');
const blockFiles = fs.readdirSync(blocksDir).filter((file) => file.endsWith('.ts'));
const blockSources = blockFiles.map((file) => ({
  file,
  source: fs.readFileSync(path.join(blocksDir, file), 'utf8'),
}));

const registryEntryMatches = [...registrySource.matchAll(/\{\s*type:\s*'([^']+)'\s*,[\s\S]*?generators:\s*\[[^\]]+\]\s*,[\s\S]*?category:\s*'[^']+'\s*\}/g)];
const registryTypes = new Map();
const duplicateRegistryTypes = new Set();

for (const match of registryEntryMatches) {
  const type = match[1];
  if (registryTypes.has(type)) {
    duplicateRegistryTypes.add(type);
    continue;
  }
  registryTypes.set(type, true);
}

const toolboxStart = registrySource.indexOf('export const TOOLBOX_CATEGORY_DEFINITIONS');
const toolboxEnd = registrySource.indexOf('const escapeXml');
if (toolboxStart === -1 || toolboxEnd === -1) {
  console.error('Validation failed: could not locate toolbox definitions in registry.ts.');
  process.exit(1);
}

const toolboxSegment = registrySource.slice(toolboxStart, toolboxEnd);
const toolboxTypes = [...new Set([...toolboxSegment.matchAll(/block\('([^']+)'/g)].map((match) => match[1]))].sort();
const missingRegistryEntries = toolboxTypes.filter((type) => !registryTypes.has(type));

const extensionUsageByFile = new Map();
for (const { file, source } of blockSources) {
  const names = new Set();
  for (const match of source.matchAll(/extensions:\s*\[([^\]]+)\]/gms)) {
    for (const name of match[1].matchAll(/['"]([^'"]+)['"]/g)) {
      names.add(name[1]);
    }
  }
  extensionUsageByFile.set(file, names);
}

const usedExtensions = new Set([...extensionUsageByFile.values()].flatMap((names) => [...names]));
const registeredExtensions = new Set();
for (const { source } of blockSources) {
  for (const match of source.matchAll(/Blockly\.Extensions\.register\('([^']+)'/g)) {
    registeredExtensions.add(match[1]);
  }
  for (const match of source.matchAll(/registerInstanceExtension\('([^']+)'/g)) {
    registeredExtensions.add(match[1]);
  }
}

const missingExtensionRegistrations = [...usedExtensions].filter((name) => !registeredExtensions.has(name));
const missingExtensionBootstrapCalls = [];
const requiredArduinoGeneratorBlocks = ['arduino_tft_init', 'arduino_tft_clear', 'arduino_tft_print'];
const missingRequiredArduinoGenerators = requiredArduinoGeneratorBlocks.filter((type) => {
  const directHandler = new RegExp(`forBlock\\['${type}'\\]`).test(generatorSource);
  const overrideHandler = new RegExp(`\\b${type}\\(block: Blockly\\.Block\\)`).test(generatorSource);
  return !directHandler && !overrideHandler;
});


const displayExtensions = [...(extensionUsageByFile.get('display.ts') ?? [])];
if (displayExtensions.length > 0 && !blocksIndexSource.includes('registerDisplayExtensions();')) {
  missingExtensionBootstrapCalls.push('registerDisplayExtensions()');
}

const hardwareExtensions = [...(extensionUsageByFile.get('hardware_instances.ts') ?? [])];
if (hardwareExtensions.length > 0 && !blocksIndexSource.includes('registerHardwareInstanceExtensions();')) {
  missingExtensionBootstrapCalls.push('registerHardwareInstanceExtensions()');
}

const failures = [];
if (duplicateRegistryTypes.size > 0) {
  failures.push(`Duplicate registry types (${duplicateRegistryTypes.size}): ${[...duplicateRegistryTypes].sort().join(', ')}`);
}
if (missingRegistryEntries.length > 0) {
  failures.push(`Toolbox blocks missing registry entries (${missingRegistryEntries.length}): ${missingRegistryEntries.join(', ')}`);
}
if (missingExtensionRegistrations.length > 0) {
  failures.push(`Missing Blockly extension registrations (${missingExtensionRegistrations.length}): ${missingExtensionRegistrations.join(', ')}`);
}
if (missingExtensionBootstrapCalls.length > 0) {
  failures.push(`Missing extension bootstrap calls: ${missingExtensionBootstrapCalls.join(', ')}`);
}
if (missingRequiredArduinoGenerators.length > 0) {
  failures.push(`Missing required Arduino display generators (${missingRequiredArduinoGenerators.length}): ${missingRequiredArduinoGenerators.join(', ')}`);
}

if (failures.length > 0) {
  console.error('Blockly registry validation failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Blockly registry validation OK. Registry entries: ${registryTypes.size}. Toolbox blocks checked: ${toolboxTypes.length}. Extensions checked: ${usedExtensions.size}.`);
