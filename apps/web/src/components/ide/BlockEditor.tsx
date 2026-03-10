"use client";
import React, { useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import { defineCustomBlocks } from '@/lib/blockly/blocks';
import { getGenerator } from '@/lib/blockly/generator';
import { edtechTheme } from '@/lib/blockly/theme';
import { isBlockSupportedForBoard } from '@/lib/blockly/blockSupport';
import { generateArduinoTemplate, generateMicroPythonTemplate } from '@/templates/codeTemplates';
import { useBoard, BoardKey } from '@/contexts/BoardContext';

const getToolboxForBoard = (board: BoardKey) => {
  const defaultToolbox = `
          <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
            <category name="Basic" colour="%{BKY_SETUP_HUE}">
              <block type="arduino_setup_loop"></block>
            </category>
            <category name="Digital I/O" colour="%{BKY_IO_HUE}">
              <block type="arduino_pinMode">
                <field name="PIN">13</field>
                <field name="MODE">OUTPUT</field>
              </block>
              <block type="arduino_digitalWrite">
                <field name="PIN">13</field>
                <field name="STATE">HIGH</field>
              </block>
              <block type="arduino_digitalRead">
                <field name="PIN">13</field>
              </block>
            </category>
            <category name="Analog I/O" colour="%{BKY_IO_HUE}">
              <block type="arduino_analogRead">
                <field name="PIN">A0</field>
              </block>
              <block type="arduino_analogWrite">
                <field name="PIN">3</field>
                <value name="VALUE">
                  <shadow type="math_number">
                    <field name="NUM">128</field>
                  </shadow>
                </value>
              </block>
            </category>
            <category name="Timing" colour="%{BKY_TIMING_HUE}">
              <block type="arduino_delay">
                <field name="MS">1000</field>
              </block>
              <block type="arduino_millis"></block>
            </category>
            <category name="Communication" colour="%{BKY_MATH_HUE}">
              <block type="arduino_serialPrint">
                <field name="BAUD">9600</field>
                <value name="TEXT">
                  <shadow type="text">
                    <field name="TEXT">Hello</field>
                  </shadow>
                </value>
              </block>
              <block type="arduino_serialPrintln">
                <field name="BAUD">9600</field>
                <value name="TEXT">
                  <shadow type="text">
                    <field name="TEXT">Hello World!</field>
                  </shadow>
                </value>
              </block>
              <block type="arduino_hc05_init">
                <field name="RX">10</field>
                <field name="TX">11</field>
                <field name="BAUD">9600</field>
              </block>
              <block type="arduino_hc05_send">
                <value name="TEXT">
                  <shadow type="text">
                    <field name="TEXT">BT message</field>
                  </shadow>
                </value>
              </block>
              <block type="arduino_hc05_available"></block>
              <block type="arduino_hc05_read_byte"></block>
            </category>
            <category name="Sensors &amp; Actuators" colour="%{BKY_LOGIC_HUE}">
              <label text="Sensors: Motion & Presence"></label>
              <block type="arduino_ultrasonic">
                <field name="TRIG">2</field>
                <field name="ECHO">3</field>
              </block>
              <block type="arduino_pir_read"></block>
              <block type="arduino_touch_read"></block>

              <sep gap="12"></sep>
              <label text="Sensors: Water, Soil & Rain"></label>
              <block type="arduino_soil_moisture_read"></block>
              <block type="arduino_rain_read"></block>
              <block type="arduino_water_level_read"></block>

              <sep gap="12"></sep>
              <label text="Sensors: Environment"></label>
              <block type="arduino_dht_init"></block>
              <block type="arduino_dht_read"></block>
              <block type="arduino_bme280_init"></block>
              <block type="arduino_bme280_read"></block>
              <block type="arduino_bh1750_init"></block>
              <block type="arduino_bh1750_read"></block>

              <sep gap="12"></sep>
              <label text="Sensors: IR & Keypad"></label>
              <block type="arduino_ir_init"></block>
              <block type="arduino_ir_read_code"></block>
              <block type="arduino_keypad_init"></block>
              <block type="arduino_keypad_get_key"></block>

              <sep gap="12"></sep>
              <label text="Actuators"></label>
              <block type="arduino_servo_write">
                <field name="PIN">9</field>
                <value name="ANGLE">
                  <shadow type="math_number">
                    <field name="NUM">90</field>
                  </shadow>
                </value>
              </block>
              <block type="arduino_relay_write">
                <field name="PIN">7</field>
                <field name="STATE">HIGH</field>
              </block>
              <block type="arduino_buzzer_tone">
                <value name="FREQ">
                  <shadow type="math_number">
                    <field name="NUM">1000</field>
                  </shadow>
                </value>
                <value name="DURATION">
                  <shadow type="math_number">
                    <field name="NUM">250</field>
                  </shadow>
                </value>
              </block>
              <block type="arduino_buzzer_stop"></block>
            </category>
            <category name="Displays" colour="%{BKY_TEXTS_HUE}">
              <block type="oled_init"></block>
              <block type="oled_clear"></block>
              <block type="oled_print">
                <value name="TEXT">
                  <shadow type="text">
                    <field name="TEXT">Hello</field>
                  </shadow>
                </value>
                <value name="X">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
                <value name="Y">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
              </block>
              <block type="lcd_i2c_init"></block>
              <block type="lcd_i2c_clear"></block>
              <block type="lcd_i2c_print">
                <value name="TEXT">
                  <shadow type="text">
                    <field name="TEXT">Hello LCD</field>
                  </shadow>
                </value>
                <value name="COL">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
                <value name="ROW">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
              </block>
            </category>
            <category name="Lights" colour="%{BKY_MATH_HUE}">
              <block type="neopixel_init"></block>
              <block type="neopixel_set_color">
                <value name="INDEX">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
                <value name="R">
                  <shadow type="math_number">
                    <field name="NUM">255</field>
                  </shadow>
                </value>
                <value name="G">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
                <value name="B">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
              </block>
              <block type="neopixel_show"></block>
              <block type="neopixel_clear"></block>
            </category>
            <category name="Motors" colour="%{BKY_LOOPS_HUE}">
              <block type="motor_forward">
                <value name="SPEED">
                  <shadow type="math_number">
                    <field name="NUM">255</field>
                  </shadow>
                </value>
              </block>
              <block type="motor_backward">
                <value name="SPEED">
                  <shadow type="math_number">
                    <field name="NUM">255</field>
                  </shadow>
                </value>
              </block>
              <block type="motor_stop"></block>
              <block type="arduino_l298n_drive">
                <value name="SPEED">
                  <shadow type="math_number">
                    <field name="NUM">200</field>
                  </shadow>
                </value>
              </block>
            </category>
            <category name="Logic" colour="%{BKY_LOGIC_HUE}">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_negate"></block>
              <block type="logic_boolean"></block>
            </category>
            <category name="Loops" colour="%{BKY_LOOPS_HUE}">
              <block type="controls_repeat_ext">
                <value name="TIMES">
                  <shadow type="math_number">
                    <field name="NUM">10</field>
                  </shadow>
                </value>
              </block>
              <block type="controls_whileUntil"></block>
            </category>
            <category name="Math" colour="%{BKY_MATH_HUE}">
              <block type="math_number">
                <field name="NUM">123</field>
              </block>
              <block type="math_arithmetic"></block>
              <block type="math_single"></block>
            </category>
            <category name="Text" colour="%{BKY_TEXTS_HUE}">
              <block type="text"></block>
              <block type="text_print"></block>
            </category>
          </xml>
        `;
  switch (board) {
    case 'Arduino Uno':
    case 'Arduino Nano':
    case 'Arduino Mega':
    case 'Arduino Leonardo':
      return defaultToolbox;
    case 'ESP32':
      return defaultToolbox;
    case 'Raspberry Pi Pico':
      return defaultToolbox;
    default:
      return defaultToolbox;
  }
};

function isLikelyBlocklyXmlDocument(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const withoutDeclaration = trimmed.replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
  return /^<xml(\s|>)/i.test(withoutDeclaration);
}

function normalizeCategoryName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface SensorGroupDefinition {
  key: string;
  aliases: string[];
}

const SENSOR_GROUP_DEFINITIONS: SensorGroupDefinition[] = [
  {
    key: 'motionpresence',
    aliases: ['sensorsmotionpresence', 'motionpresence', 'motionsensors', 'presence']
  },
  {
    key: 'watersoilrain',
    aliases: ['sensorswatersoilrain', 'watersoilrain', 'watersoil', 'rain']
  },
  {
    key: 'environment',
    aliases: ['sensorsenvironment', 'environment']
  },
  {
    key: 'irkeypad',
    aliases: ['sensorsirkeypad', 'irkeypad', 'infraredkeypad']
  },
  {
    key: 'actuators',
    aliases: ['sensorsactuators', 'actuators']
  }
];

function resolveSensorGroupKey(name: string) {
  const normalizedName = normalizeCategoryName(name || '');
  if (!normalizedName) {
    return null;
  }

  const group = SENSOR_GROUP_DEFINITIONS.find((candidate) =>
    candidate.aliases.some((alias) => normalizedName === alias || normalizedName.includes(alias))
  );

  return group ? group.key : null;
}

function buildSensorGroupCategory(categoryNode: Element, sensorGroupKey: string, board: BoardKey) {
  const filteredCategory = categoryNode.cloneNode(false) as Element;

  let activeSensorGroup: string | null = null;
  let hasIncludedBlocks = false;
  let addedGroupLabel = false;

  for (const child of Array.from(categoryNode.children)) {
    const tagName = child.tagName.toLowerCase();

    if (tagName === 'label') {
      activeSensorGroup = resolveSensorGroupKey(child.getAttribute('text') || '');
      if (activeSensorGroup === sensorGroupKey && !addedGroupLabel) {
        filteredCategory.appendChild(child.cloneNode(true));
        addedGroupLabel = true;
      }
      continue;
    }

    if (activeSensorGroup !== sensorGroupKey) {
      continue;
    }

    if (tagName === 'block') {
      const blockType = child.getAttribute('type') || '';
      if (blockType && !isBlockSupportedForBoard(blockType, board)) {
        continue;
      }
      filteredCategory.appendChild(child.cloneNode(true));
      hasIncludedBlocks = true;
      continue;
    }

    if (tagName === 'sep' && hasIncludedBlocks) {
      filteredCategory.appendChild(child.cloneNode(true));
    }
  }

  return filteredCategory;
}

function filterCategoryByBoardSupport(categoryNode: Element, board: BoardKey) {
  const filteredCategory = categoryNode.cloneNode(false) as Element;
  for (const child of Array.from(categoryNode.children)) {
    const tagName = child.tagName.toLowerCase();
    if (tagName === 'block') {
      const blockType = child.getAttribute('type') || '';
      if (!blockType || !isBlockSupportedForBoard(blockType, board)) {
        continue;
      }
      filteredCategory.appendChild(child.cloneNode(true));
      continue;
    }

    if (tagName === 'label' || tagName === 'sep') {
      filteredCategory.appendChild(child.cloneNode(true));
    }
  }
  return filteredCategory;
}

function matchesCategoryName(itemName: string, requestedName: string) {
  const normalizedItemName = normalizeCategoryName(itemName);

  if (normalizedItemName === requestedName) {
    return true;
  }

  if (requestedName === 'sensors' && normalizedItemName.includes('sensors')) {
    return true;
  }

  if (requestedName.includes('actuators') && normalizedItemName.includes('actuators')) {
    return true;
  }

  if (resolveSensorGroupKey(requestedName) && normalizedItemName.includes('sensors')) {
    return true;
  }

  return normalizedItemName.startsWith(requestedName) || requestedName.startsWith(normalizedItemName);
}

const EMPTY_TOOLBOX_XML = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

interface ToolboxWithItems extends Blockly.IToolbox {
  getToolboxItems: () => Blockly.IToolboxItem[];
}

function hasToolboxItemsApi(toolbox: Blockly.IToolbox): toolbox is ToolboxWithItems {
  return typeof (toolbox as ToolboxWithItems).getToolboxItems === 'function';
}

function buildCategoryToolboxXml(board: BoardKey, requestedName: string) {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return EMPTY_TOOLBOX_XML;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(getToolboxForBoard(board), 'text/xml');
  const categoryNodes = Array.from(doc.getElementsByTagName('category'));
  if (categoryNodes.length === 0) {
    return EMPTY_TOOLBOX_XML;
  }

  const normalizedRequested = normalizeCategoryName(requestedName || '');
  const selectedCategory =
    categoryNodes.find((categoryNode) => {
      const categoryName = categoryNode.getAttribute('name') || '';
      return matchesCategoryName(categoryName, normalizedRequested);
    }) || categoryNodes[0];

  const sensorGroupKey = resolveSensorGroupKey(requestedName || '');
  const selectedCategoryName = selectedCategory.getAttribute('name') || '';

  let categoryToSerialize = selectedCategory;
  if (sensorGroupKey && normalizeCategoryName(selectedCategoryName).includes('sensors')) {
    categoryToSerialize = buildSensorGroupCategory(selectedCategory, sensorGroupKey, board);
  }

  const serializer = new XMLSerializer();

  const filteredCategory = filterCategoryByBoardSupport(categoryToSerialize, board);
  const serializedCategory = serializer.serializeToString(filteredCategory);

  return `<xml xmlns="https://developers.google.com/blockly/xml">${serializedCategory}</xml>`;
}

function hideNativeToolboxUi(workspace: Blockly.WorkspaceSvg) {
  const parentSvg = workspace.getParentSvg();
  const rootElement = parentSvg?.parentElement;
  if (!rootElement) return;

  const toolboxDiv = rootElement.querySelector<HTMLElement>('.blocklyToolboxDiv');
  if (toolboxDiv) {
    toolboxDiv.style.display = 'none';
  }
}

interface BlocklyGeneratorLike {
  init: (workspace: Blockly.Workspace) => void;
  workspaceToCode: (workspace: Blockly.Workspace) => string;
  setups_?: Record<string, string>;
  getImports?: () => string[];
}

export default function BlockEditor({
  onCodeChange,
  onXmlChange,
  initialXml,
  selectedCategoryName,
  generatorType
}: {
  onCodeChange: (code: string) => void,
  onXmlChange?: (xml: string) => void,
  initialXml?: string,
  selectedCategoryName?: string,
  generatorType: string
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const persistedXmlRef = useRef<string | null>(null);
  const { currentBoard } = useBoard();
  const prevBoardRef = useRef<BoardKey | null>(null);

  const onCodeChangeRef = useRef(onCodeChange);
  const onXmlChangeRef = useRef(onXmlChange);
  const generatorTypeRef = useRef(generatorType);
  const initialXmlRef = useRef(initialXml || '');
  const selectedCategoryNameRef = useRef(selectedCategoryName || '');
  const lastSyncedXmlRef = useRef<string | null>(null);
  const activeCategoryKeyRef = useRef<string>('');

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
    onXmlChangeRef.current = onXmlChange;
    generatorTypeRef.current = generatorType;
  }, [onCodeChange, onXmlChange, generatorType]);

  useEffect(() => {
    initialXmlRef.current = initialXml || '';
  }, [initialXml]);

  useEffect(() => {
    selectedCategoryNameRef.current = selectedCategoryName || '';
  }, [selectedCategoryName]);

  const serializeWorkspace = useCallback(() => {
    if (!workspaceRef.current) return '';
    const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
    return Blockly.utils.xml.domToText(xml);
  }, []);

  const emitWorkspaceXml = useCallback((force = false) => {
    const xmlText = serializeWorkspace();
    if (!force && lastSyncedXmlRef.current === xmlText) {
      return;
    }

    lastSyncedXmlRef.current = xmlText;
    persistedXmlRef.current = xmlText;
    if (onXmlChangeRef.current) {
      onXmlChangeRef.current(xmlText);
    }
  }, [serializeWorkspace]);

  const createDefaultSetupBlock = useCallback(() => {
    if (!workspaceRef.current) return;

    const setupBlock = workspaceRef.current.newBlock('arduino_setup_loop');
    setupBlock.initSvg();
    setupBlock.render();
    setupBlock.moveBy(40, 40);
  }, []);

  const loadXmlIntoWorkspace = useCallback((xmlText: string | null | undefined) => {
    if (!workspaceRef.current) return;

    const candidate = typeof xmlText === 'string' ? xmlText.trim() : '';

    workspaceRef.current.clear();

    if (!candidate || !isLikelyBlocklyXmlDocument(candidate)) {
      createDefaultSetupBlock();
      return;
    }

    try {
      const xml = Blockly.utils.xml.textToDom(candidate);
      Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
    } catch (e) {
      console.error('Failed to load workspace XML', e);
      workspaceRef.current.clear();
      createDefaultSetupBlock();
    }
  }, [createDefaultSetupBlock]);

  const showCategoryBlocks = useCallback((board: BoardKey, categoryName: string | null | undefined) => {
    if (!workspaceRef.current) return;

    const requestedCategory = (categoryName || '').trim() || 'Basic';
    const normalizedCategory = normalizeCategoryName(requestedCategory);
    const categoryKey = `${board}::${normalizedCategory}`;

    if (activeCategoryKeyRef.current === categoryKey) {
      return;
    }

    const toolboxXml = buildCategoryToolboxXml(board, requestedCategory);
    try {
      workspaceRef.current.updateToolbox(toolboxXml);
    } catch (error) {
      console.error('Failed to update toolbox category:', error);
      return;
    }
    hideNativeToolboxUi(workspaceRef.current);

    const toolbox = workspaceRef.current.getToolbox();
    if (toolbox && hasToolboxItemsApi(toolbox) && toolbox.getToolboxItems().length > 0) {
      toolbox.selectItemByPosition(0);
    }

    activeCategoryKeyRef.current = categoryKey;
  }, []);

  const handleGenerate = useCallback(() => {
    if (!workspaceRef.current) return;
    try {
      const gType = generatorTypeRef.current;
      const generator = getGenerator(gType) as unknown as BlocklyGeneratorLike;

      // Clear definition state
      generator.init(workspaceRef.current);

      const loopCode = generator.workspaceToCode(workspaceRef.current) || '';

      // Extract setup/global snippets generated by custom blocks.
      const setupEntries: string[] = [];
      const globalEntries: string[] = [];
      const setupsDict = generator.setups_ || {};
      for (const name in setupsDict) {
        const snippet = setupsDict[name];
        if (typeof snippet !== 'string' || snippet.trim().length === 0) continue;

        if (gType === 'arduino') {
          const trimmed = snippet.trimStart();
          const isGlobalSnippet =
            trimmed.startsWith('#include') ||
            trimmed.startsWith('Servo ') ||
            trimmed.startsWith('Adafruit_') ||
            trimmed.startsWith('long readUltrasonicDistance') ||
            /^[A-Za-z_][\w:<>&*\s]*\([^)]*\)\s*\{/.test(trimmed);

          if (isGlobalSnippet) {
            globalEntries.push(snippet);
          } else {
            setupEntries.push(snippet);
          }
        } else {
          setupEntries.push(snippet);
        }
      }

      const setupCode = setupEntries.join('\n');

      let finalCode = '';
      if (gType === 'arduino') {
        const globalCode = globalEntries.join('\n');
        finalCode = generateArduinoTemplate(globalCode, setupCode, loopCode);
      } else if (gType === 'micropython') {
        const indentedLoop = loopCode.split('\n').map((line: string) => line ? '    ' + line : line).join('\n');
        const importLines = typeof generator.getImports === 'function' ? generator.getImports() : [];
        finalCode = generateMicroPythonTemplate(importLines, setupCode, indentedLoop);
      }

      onCodeChangeRef.current(finalCode);
    } catch (e) {
      console.error('Code generation error:', e);
    }
  }, []);

  const onWorkspaceChange = useCallback((e: Blockly.Events.Abstract) => {
    if (e.isUiEvent || e.type === Blockly.Events.FINISHED_LOADING) return;
    emitWorkspaceXml();
    handleGenerate();
  }, [emitWorkspaceXml, handleGenerate]);

  const initializeWorkspace = useCallback((board: BoardKey) => {
    if (!containerRef.current) return;

    const initialCategoryName = selectedCategoryNameRef.current || 'Basic';

    workspaceRef.current = Blockly.inject(containerRef.current, {
      toolbox: buildCategoryToolboxXml(board, initialCategoryName),
      theme: edtechTheme,
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 }
    });

    workspaceRef.current.addChangeListener(onWorkspaceChange);
    hideNativeToolboxUi(workspaceRef.current);
    Blockly.svgResize(workspaceRef.current);

    const xmlToRestore = persistedXmlRef.current || initialXmlRef.current;
    loadXmlIntoWorkspace(xmlToRestore);
    handleGenerate();
    const snapshot = serializeWorkspace();
    persistedXmlRef.current = snapshot;
    lastSyncedXmlRef.current = snapshot;
    activeCategoryKeyRef.current = '';
    showCategoryBlocks(board, selectedCategoryNameRef.current);
  }, [onWorkspaceChange, loadXmlIntoWorkspace, handleGenerate, serializeWorkspace, showCategoryBlocks]);

  // Initial setup and unmount cleanup
  useEffect(() => {
    defineCustomBlocks();

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []);

  // Board change watcher
  useEffect(() => {
    if (!containerRef.current) return;

    if (!workspaceRef.current || prevBoardRef.current !== currentBoard) {
      if (workspaceRef.current) {
        persistedXmlRef.current = serializeWorkspace();
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
      initializeWorkspace(currentBoard);
      prevBoardRef.current = currentBoard;
    } else {
      handleGenerate();
    }
  }, [currentBoard, initializeWorkspace, serializeWorkspace, handleGenerate]);

  useEffect(() => {
    if (!workspaceRef.current) return;
    showCategoryBlocks(currentBoard, selectedCategoryName);
  }, [currentBoard, selectedCategoryName, showCategoryBlocks]);

  // When opening a different project or when XML arrives from persisted files,
  // replace workspace content only if it differs from the current snapshot.
  useEffect(() => {
    if (!workspaceRef.current) return;

    const incomingXml = (initialXml || '').trim();
    const currentXml = serializeWorkspace().trim();

    if (incomingXml === currentXml) return;
    if (incomingXml.length === 0 && currentXml.length === 0) return;

    persistedXmlRef.current = initialXml || '';
    loadXmlIntoWorkspace(initialXml);
    handleGenerate();
    const snapshot = serializeWorkspace();
    persistedXmlRef.current = snapshot;
    lastSyncedXmlRef.current = snapshot;
  }, [initialXml, loadXmlIntoWorkspace, serializeWorkspace, handleGenerate]);

  // Handle Blockly Resizing (Window rescale or SplitView dragging)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="z-10 flex h-9 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          Blockly Workspace
        </span>
        <span className="text-[11px] font-medium tracking-[0.12em] text-slate-500">Auto Sync Enabled</span>
      </div>
      <div ref={containerRef} className="relative min-h-0 flex-1" />
    </div>
  );
}































