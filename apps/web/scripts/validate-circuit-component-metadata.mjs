import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import {
  buildCircuitMetadata,
  loadCatalogOverrides,
  loadComponentDefinitionLiterals,
  loadLiteralExports,
  resolveCircuitCatalogPaths,
} from './circuit-component-metadata.shared.mjs';

const require = createRequire(import.meta.url);

function resolveTsModule(specifier, fromDirectory) {
  const basePath = path.resolve(fromDirectory, specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error(`Unable to resolve module ${specifier} from ${fromDirectory}`);
  }

  return match;
}

function createTsModuleLoader() {
  const cache = new Map();

  function loadModule(filePath) {
    const absolutePath = path.resolve(filePath);
    if (cache.has(absolutePath)) {
      return cache.get(absolutePath);
    }

    const source = fs.readFileSync(absolutePath, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: absolutePath,
    });

    const module = { exports: {} };
    cache.set(absolutePath, module.exports);

    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) {
        return loadModule(resolveTsModule(specifier, path.dirname(absolutePath)));
      }

      return require(specifier);
    };

    const evaluator = new Function('require', 'module', 'exports', '__filename', '__dirname', transpiled.outputText);
    evaluator(localRequire, module, module.exports, absolutePath, path.dirname(absolutePath));
    cache.set(absolutePath, module.exports);
    return module.exports;
  }

  return { loadModule };
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const paths = resolveCircuitCatalogPaths(repoRoot);
const sourceDefinitions = loadComponentDefinitionLiterals(paths.definitionsPath);
const overrides = loadCatalogOverrides(paths.overridesPath);
const expected = buildCircuitMetadata(sourceDefinitions, overrides);
const generated = loadLiteralExports(paths.generatedPath, [
  'CIRCUIT_COMPONENT_CATEGORY_ORDER',
  'CIRCUIT_COMPONENT_CATEGORY_LABELS',
  'CIRCUIT_COMPONENT_METADATA',
]);

assert.deepEqual(generated.CIRCUIT_COMPONENT_CATEGORY_ORDER, expected.categoryOrder, 'Generated category order should match overrides');
assert.deepEqual(generated.CIRCUIT_COMPONENT_CATEGORY_LABELS, expected.categoryLabels, 'Generated category labels should match overrides');
assert.deepEqual(
  generated.CIRCUIT_COMPONENT_METADATA.map((entry) => entry.id),
  expected.metadata.map((entry) => entry.id),
  'Generated metadata should preserve source component IDs'
);

expected.metadata.forEach((entry) => {
  const generatedEntry = generated.CIRCUIT_COMPONENT_METADATA.find((candidate) => candidate.id === entry.id);
  assert.ok(generatedEntry, `Missing generated metadata for ${entry.id}`);
  assert.deepEqual(generatedEntry.aliases, entry.aliases, `Aliases should match for ${entry.id}`);
  assert.equal(generatedEntry.singleton, entry.singleton, `Singleton flag should match for ${entry.id}`);
  assert.deepEqual(generatedEntry.propertySchema, entry.propertySchema, `Property schema should match for ${entry.id}`);
});

const placeableMetadata = generated.CIRCUIT_COMPONENT_METADATA.filter((entry) => entry.placeable);
assert.deepEqual(
  placeableMetadata.map((entry) => entry.id),
  sourceDefinitions.filter((entry) => entry.placeable).map((entry) => entry.id),
  'Generated metadata should include every placeable component'
);
assert.ok(
  placeableMetadata.every((entry) => Array.isArray(entry.propertySchema?.fields)),
  'Every placeable component should expose a property schema'
);

const loader = createTsModuleLoader();
const registryModule = loader.loadModule(path.join(repoRoot, 'apps', 'web', 'src', 'lib', 'wiring', 'circuitComponentRegistry.ts'));
const registry = registryModule.getCircuitComponentRegistry();

assert.deepEqual(
  registry.getCategories({ placeableOnly: true }),
  expected.categoryOrder,
  'Registry categories should follow override order'
);
assert.equal(registry.getEntry('arduino-uno')?.id, 'ARDUINO_UNO', 'Registry should resolve Arduino aliases');
assert.equal(registry.getEntry('push_button')?.id, 'BUTTON', 'Registry should resolve button aliases');
assert.ok(
  registry.search('sonar', { placeableOnly: true }).some((entry) => entry.id === 'ULTRASONIC'),
  'Registry search should match keyword tags'
);
assert.ok(
  registry.search('sg90', { placeableOnly: true }).some((entry) => entry.id === 'SERVO'),
  'Registry search should match alias/keyword content'
);
assert.ok(
  registry.getEntries({ placeableOnly: true }).every((entry) => entry.placeable),
  'Registry placeable catalog should exclude hidden components'
);

console.log(`Validated ${generated.CIRCUIT_COMPONENT_METADATA.length} circuit component metadata entries.`);
