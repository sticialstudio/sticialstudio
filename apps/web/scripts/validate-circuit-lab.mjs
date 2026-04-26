import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function resolveTsModule(specifier, fromDirectory, srcRoot) {
  if (specifier.startsWith('@/')) {
    return path.resolve(srcRoot, specifier.slice(2));
  }

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

function resolveWithExtensions(basePath) {
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
    throw new Error(`Unable to resolve module ${basePath}`);
  }

  return match;
}

function createTsModuleLoader(srcRoot) {
  const cache = new Map();

  function loadModule(filePath) {
    const absolutePath = resolveWithExtensions(path.resolve(filePath));
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
      if (specifier.startsWith('.') || specifier.startsWith('@/')) {
        return loadModule(resolveTsModule(specifier, path.dirname(absolutePath), srcRoot));
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
const srcRoot = path.join(repoRoot, 'apps', 'web', 'src');
const loader = createTsModuleLoader(srcRoot);

const breadboardModel = loader.loadModule(path.join(srcRoot, 'lib', 'wiring', 'breadboardModel.ts'));
const componentDefinitionsModule = loader.loadModule(path.join(srcRoot, 'lib', 'wiring', 'componentDefinitions.ts'));
const netlistModule = loader.loadModule(path.join(srcRoot, 'lib', 'wiring', 'NetlistEngine.ts'));
const breadboardMountingModule = loader.loadModule(path.join(srcRoot, 'lib', 'wiring', 'breadboardMounting.ts'));

const { getBreadboardNodeEntries, getBreadboardContinuityEdges, getBreadboardContinuityGroups } = breadboardModel;
const { getComponentDefinition, getComponentMountClassifications } = componentDefinitionsModule;
const { NetlistEngine } = netlistModule;
const { getBreadboardMountPreview } = breadboardMountingModule;
const simulationCanvasSource = fs.readFileSync(path.join(srcRoot, 'components', 'ide', 'SimulationCanvas.tsx'), 'utf8');

const entries = getBreadboardNodeEntries();
const edges = getBreadboardContinuityEdges();

const entryByAnchorId = new Map(entries.map((entry) => [entry.anchorId, entry]));
const topMinus = entryByAnchorId.get('RAIL_TOP_MINUS_1');
const topPlus = entryByAnchorId.get('RAIL_TOP_PLUS_1');
const bottomPlus = entryByAnchorId.get('RAIL_BOT_PLUS_1');
const bottomMinus = entryByAnchorId.get('RAIL_BOT_MINUS_1');

assert.ok(topMinus && topPlus && bottomPlus && bottomMinus, 'Breadboard rail entries should exist');
assert.ok(topMinus.y < topPlus.y, 'Top minus rail should render above top plus rail');
assert.ok(bottomPlus.y < bottomMinus.y, 'Bottom plus rail should render above bottom minus rail');

const edgeSet = new Set(edges.map(([from, to]) => `${from}|${to}`));
const railGroups = getBreadboardContinuityGroups().filter((group) => group.kind === 'rail');
assert.equal(railGroups.length, 4, 'Standard breadboard should expose four full-length rail continuity groups');
assert.ok(railGroups.every((group) => group.segment === 'full'), 'Standard breadboard rail groups should be full-length, not split');
assert.ok(
  edgeSet.has('BB_RAIL_TOP_PLUS_1|BB_RAIL_TOP_PLUS_2') || edgeSet.has('BB_RAIL_TOP_PLUS_2|BB_RAIL_TOP_PLUS_1'),
  'Top plus rail should conduct horizontally across adjacent columns'
);
assert.ok(
  edgeSet.has('BB_RAIL_TOP_PLUS_31|BB_RAIL_TOP_PLUS_32') || edgeSet.has('BB_RAIL_TOP_PLUS_32|BB_RAIL_TOP_PLUS_31'),
  'Top plus rail should stay continuous across the center of the breadboard'
);
assert.ok(
  edgeSet.has('BB_RAIL_TOP_PLUS_62|BB_RAIL_TOP_PLUS_63') || edgeSet.has('BB_RAIL_TOP_PLUS_63|BB_RAIL_TOP_PLUS_62'),
  'Top plus rail should conduct to the end of the row'
);
assert.ok(
  edgeSet.has('BB_RAIL_BOT_MINUS_31|BB_RAIL_BOT_MINUS_32') || edgeSet.has('BB_RAIL_BOT_MINUS_32|BB_RAIL_BOT_MINUS_31'),
  'Bottom minus rail should stay continuous across the center of the breadboard'
);
assert.ok(
  !edgeSet.has('BB_RAIL_TOP_PLUS_1|BB_RAIL_TOP_MINUS_1') && !edgeSet.has('BB_RAIL_TOP_MINUS_1|BB_RAIL_TOP_PLUS_1'),
  'Top plus and top minus rails must not share continuity edges'
);

const ledDefinition = getComponentDefinition('LED');
const resistorDefinition = getComponentDefinition('RESISTOR');
const buttonDefinition = getComponentDefinition('BUTTON');
assert.ok(ledDefinition?.footprint, 'LED footprint should be defined');
assert.ok(resistorDefinition?.footprint, 'Resistor footprint should be defined');
assert.ok(buttonDefinition?.footprint, 'Button footprint should be defined');
assert.ok(
  ledDefinition.footprint.pins.every((pin) => !pin.allowedZones || pin.allowedZones.every((zone) => zone !== 'rail-top' && zone !== 'rail-bottom')),
  'LED mounting footprint should stay on strip rows and never snap to power rails'
);
assert.ok(
  resistorDefinition.footprint.allowedZones?.includes('rail-top') &&
    resistorDefinition.footprint.allowedZones?.includes('rail-bottom') &&
    resistorDefinition.footprint.allowedZones?.includes('strip-top') &&
    resistorDefinition.footprint.allowedZones?.includes('strip-bottom'),
  'Resistor footprint should explicitly allow both rail and strip mounting zones'
);
assert.equal(
  buttonDefinition.footprint.requiresTrenchCrossing,
  true,
  'Push buttons should explicitly require trench crossing on the breadboard'
);
assert.ok(
  edgeSet.has('BB_STRIP_10_A|BB_STRIP_10_B') || edgeSet.has('BB_STRIP_10_B|BB_STRIP_10_A'),
  'Top strip columns should stay vertically continuous within a strip group'
);
assert.ok(
  !edgeSet.has('BB_STRIP_10_E|BB_STRIP_11_E') && !edgeSet.has('BB_STRIP_11_E|BB_STRIP_10_E'),
  'Adjacent strip columns must stay electrically isolated from each other'
);

assert.deepEqual(getComponentMountClassifications('LED'), ['strip-only'], 'LED should classify as strip-only');
assert.deepEqual(getComponentMountClassifications('RESISTOR'), ['rail-allowed'], 'Resistor should classify as rail-allowed');
assert.deepEqual(getComponentMountClassifications('BUTTON'), ['strip-only', 'trench-bridging'], 'Button should classify as strip-only and trench-bridging');
assert.deepEqual(getComponentMountClassifications('SERVO'), ['freeform-only'], 'Servo should classify as freeform-only');

const breadboard = {
  id: 'breadboard-1',
  type: 'BREADBOARD',
  x: 0,
  y: 0,
  rotation: 0,
  state: {},
  mountedPlacement: null,
};

const unmountedLed = {
  id: 'led-1',
  type: 'LED',
  x: 120,
  y: 80,
  rotation: 0,
  state: {},
  mountedPlacement: null,
};

const mountedLed = {
  ...unmountedLed,
  mountedPlacement: {
    componentId: 'led-1',
    mounted: true,
    footprintType: 'breadboard-mountable',
    rotation: 0,
    pinMap: [
      { pinId: 'A', nodeId: 'BB_STRIP_10_A' },
      { pinId: 'C', nodeId: 'BB_STRIP_11_A' },
    ],
  },
};

const unmountedNetlist = NetlistEngine.generateNetlist([breadboard, unmountedLed], []);
const mountedNetlist = NetlistEngine.generateNetlist([breadboard, mountedLed], []);

const unmountedAnodeNet = unmountedNetlist.nets.find((net) => net.nodes.includes('led-1.A'));
assert.ok(unmountedAnodeNet, 'Unmounted LED anode should still appear as an isolated net');
assert.equal(unmountedAnodeNet.breadboardNodes.length, 0, 'Unmounted LED must not connect to breadboard nodes');

const mountedAnodeNet = mountedNetlist.nets.find((net) => net.nodes.includes('led-1.A'));
const mountedCathodeNet = mountedNetlist.nets.find((net) => net.nodes.includes('led-1.C'));
assert.ok(mountedAnodeNet?.breadboardNodes.includes('BB_STRIP_10_A'), 'Mounted LED anode should connect to its mapped breadboard node');
assert.ok(mountedCathodeNet?.breadboardNodes.includes('BB_STRIP_11_A'), 'Mounted LED cathode should connect to its mapped breadboard node');

const resistor = {
  id: 'resistor-1',
  type: 'RESISTOR',
  x: 0,
  y: 0,
  rotation: 0,
  state: {},
  mountedPlacement: null,
};
const button = {
  id: 'button-1',
  type: 'BUTTON',
  x: 0,
  y: 0,
  rotation: 90,
  state: {},
  mountedPlacement: null,
};

let foundRailMountedResistor = false;
for (let x = 40; x <= 520 && !foundRailMountedResistor; x += 8) {
  for (let y = 6; y <= 36 && !foundRailMountedResistor; y += 4) {
    const preview = getBreadboardMountPreview(resistor, { x, y, rotation: 0 }, [breadboard]);
    if (preview?.isValid && preview.mappedPins?.some((mapping) => mapping.nodeId.startsWith('BB_RAIL_'))) {
      foundRailMountedResistor = true;
    }
  }
}
assert.ok(foundRailMountedResistor, 'Resistors should still be able to mount onto power rails where explicitly allowed');

let foundValidTrenchButton = false;
for (let x = 40; x <= 520; x += 8) {
  for (let y = 34; y <= 128; y += 4) {
    const preview = getBreadboardMountPreview(button, { x, y, rotation: 90 }, [breadboard]);
    if (!preview) {
      continue;
    }
    if (preview.isValid) {
      foundValidTrenchButton = true;
    }
  }
}
assert.ok(foundValidTrenchButton, 'Buttons should have at least one valid trench-bridging mount position');
assert.ok(
  simulationCanvasSource.includes('componentVisuals: simulationSnapshot.componentStatePatches'),
  'SimulationCanvas should publish runtime component visuals into simulation state'
);
assert.ok(
  !simulationCanvasSource.includes('updateComponentState('),
  'SimulationCanvas must not write runtime patches back into authored circuit component state'
);

console.log('Validated Circuit Lab breadboard model, continuity, footprint policies, and authored/runtime separation.');
