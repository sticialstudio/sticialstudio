"use client";







import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';

import * as Blockly from 'blockly';

import { AlertCircle, Blocks as BlocksIcon, ChevronLeft, ChevronRight, Code2, Crosshair, Move, Search, Wand2 } from 'lucide-react';







import { defineCustomBlocks } from '@/lib/blockly/blocks';



import { getBlocklyGridColor, getBlocklyTheme } from '@/lib/blockly/theme';



import { buildSourceCodeFromBlocklyWorkspace } from '@/lib/blockly/codegen';



import { useBoard, BoardKey } from '@/contexts/BoardContext';
import { useStudioPreferences } from '@/contexts/StudioPreferencesContext';
import { useTheme } from '@/contexts/ThemeContext';



import {



  buildCategoryToolboxXml,

  getVisibleToolboxCategories,



  hideNativeToolboxUi,



  isLikelyBlocklyXmlDocument,



  type CircuitAwareWindow,



} from '@/lib/blockly/toolbox';



import { useCircuit } from '@/contexts/CircuitContext';



import { getNetFromNodeId, getNetToNodeId } from '@/lib/circuit/netData';
import { getOledInstances } from '@/lib/blockly/dropdowns';
import { isBlockSupportedForBoard } from '@/lib/blockly/blockSupport';



import { BLOCK_CATEGORIES } from './WorkspaceSidebar';








type BoardAwareWindow = Window & typeof globalThis & {



  SELECTED_BOARD?: BoardKey;



};







type BlocklyMotionEvent = Blockly.Events.Abstract & {



  isStart?: boolean;



  isMoveInProgress?: boolean;



};







const EMPTY_TOOLBOX_XML = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';



const BLOCKLY_FLYOUT_SCALE = 0.9;







function boardLabel(board: BoardKey) {



  return board.replace(/_/g, ' ');



}

const CATEGORY_METADATA_FALLBACKS = {
  'My Components': {
    label: 'My Components',
    description: 'Blocks for the parts already in your project',
    icon: <BlocksIcon size={16} strokeWidth={2.3} />,
    color: '#5b6dff',
  },
} as const;








export default function BlockEditor({

  onCodeChange,

  onXmlChange,

  initialXml,

  generatorType,

  onWorkspaceReady,

  selectedCategoryName,

  onSelectCategory,

  sourceCode,

}: {



  onCodeChange: (code: string) => void;



  onXmlChange?: (xml: string) => void;



  initialXml?: string;



  generatorType: string;



  onWorkspaceReady?: (workspace: Blockly.WorkspaceSvg | null) => void;



  selectedCategoryName?: string;



  onSelectCategory?: (category: string) => void;



  sourceCode?: string;

}) {

  const containerRef = useRef<HTMLDivElement>(null);

  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const persistedXmlRef = useRef<string | null>(null);

  const { currentBoard } = useBoard();
  const { theme } = useTheme();
  const { showAdvancedBlocks } = useStudioPreferences();

  const { circuitData, codingSnapshot } = useCircuit();

  const prevBoardRef = useRef<BoardKey | null>(null);
  const prevThemeRef = useRef(theme);

  const prevCircuitSignatureRef = useRef<string>('');

  const [showCodePanel, setShowCodePanel] = useState(true);

  const [generatedPreviewCode, setGeneratedPreviewCode] = useState(sourceCode || "");

  const [previewWarning, setPreviewWarning] = useState<string | null>(null);
  const blocklyTheme = useMemo(() => getBlocklyTheme(theme), [theme]);
  const blocklyGridColor = useMemo(() => getBlocklyGridColor(theme), [theme]);







  const onCodeChangeRef = useRef(onCodeChange);



  const onXmlChangeRef = useRef(onXmlChange);



  const onWorkspaceReadyRef = useRef(onWorkspaceReady);



  const generatorTypeRef = useRef(generatorType);



  const initialXmlRef = useRef(initialXml || '');



  const selectedCategoryNameRef = useRef(selectedCategoryName || 'Input/Output');



  const lastSyncedXmlRef = useRef<string | null>(null);



  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);



  const [blockCount, setBlockCount] = useState(0);



  const [categoryQuery, setCategoryQuery] = useState('');



  const [isFlyoutVisible, setIsFlyoutVisible] = useState(true);







  const circuitRefreshSignature = useMemo(



    () =>



      JSON.stringify({



        componentIds: circuitData.components.map((component) => `${component.id}:${component.type}`),



        netEdges: circuitData.nets.map((net) => `${net.id}:${getNetFromNodeId(net)}->${getNetToNodeId(net)}`),



        availableBlockTypes: codingSnapshot.availableBlockTypes,



        usedSignalPins: codingSnapshot.usedSignalPins,



        mappedComponentIds: codingSnapshot.mappedComponentIds,



      }),



    [circuitData.components, circuitData.nets, codingSnapshot.availableBlockTypes, codingSnapshot.usedSignalPins, codingSnapshot.mappedComponentIds]



  );







  useEffect(() => {



    (window as BoardAwareWindow).SELECTED_BOARD = currentBoard;



  }, [currentBoard]);







  useEffect(() => {



    if (typeof window === 'undefined') {



      return;



    }







    const awareWindow = window as CircuitAwareWindow;



    awareWindow.__CIRCUIT_DATA = circuitData;



    awareWindow.__CIRCUIT_CODING_SNAPSHOT = codingSnapshot;



  }, [circuitData, codingSnapshot]);







  useEffect(() => {



    onCodeChangeRef.current = onCodeChange;



    onXmlChangeRef.current = onXmlChange;



    onWorkspaceReadyRef.current = onWorkspaceReady;



    generatorTypeRef.current = generatorType;



  }, [onCodeChange, onXmlChange, onWorkspaceReady, generatorType]);







  useEffect(() => {



    initialXmlRef.current = initialXml || '';



  }, [initialXml]);

  useEffect(() => {
    if (workspaceRef.current) return;
    setGeneratedPreviewCode(sourceCode || '');
  }, [sourceCode]);







  useEffect(() => {



    selectedCategoryNameRef.current = selectedCategoryName || 'Input/Output';



  }, [selectedCategoryName]);







  const syncBlockCount = useCallback(() => {



    if (!workspaceRef.current) {



      setBlockCount(0);



      return;



    }







    const count = workspaceRef.current



      .getAllBlocks(false)



      .filter((block) => !block.isShadow())



      .length;



    setBlockCount(count);



  }, []);







  const serializeWorkspace = useCallback(() => {



    if (!workspaceRef.current) return '';



    const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);



    return Blockly.utils.xml.domToText(xml);



  }, []);







  const emitWorkspaceXml = useCallback(



    (force = false) => {



      const xmlText = serializeWorkspace();



      if (!force && lastSyncedXmlRef.current === xmlText) {



        return;



      }







      lastSyncedXmlRef.current = xmlText;



      persistedXmlRef.current = xmlText;



      if (onXmlChangeRef.current) {



        onXmlChangeRef.current(xmlText);



      }



    },



    [serializeWorkspace]



  );







  const createDefaultSetupBlock = useCallback(() => {

    if (!workspaceRef.current) return;

    // Spawn "on start" block
    const onStartBlock = workspaceRef.current.newBlock('arduino_on_start');
    onStartBlock.initSvg();
    onStartBlock.render();
    onStartBlock.moveBy(56, 56);

    // Spawn "forever" block to the right of on start
    const foreverBlock = workspaceRef.current.newBlock('arduino_forever');
    foreverBlock.initSvg();
    foreverBlock.render();
    foreverBlock.moveBy(320, 56);

    syncBlockCount();

  }, [syncBlockCount]);







  const loadXmlIntoWorkspace = useCallback(



    (xmlText: string | null | undefined) => {



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

        const hasUserBlocks = workspaceRef.current
          .getAllBlocks(false)
          .some((block) => !block.isShadow());

        if (!hasUserBlocks) {
          createDefaultSetupBlock();
        }



      } catch (e) {



        console.error('Failed to load workspace XML', e);



        workspaceRef.current.clear();



        createDefaultSetupBlock();



      }







      syncBlockCount();



    },



    [createDefaultSetupBlock, syncBlockCount]



  );







  const showCategoryFlyout = useCallback(



    (board: BoardKey, categoryName: string | null | undefined) => {



      if (!workspaceRef.current) return;







      hideNativeToolboxUi(workspaceRef.current);







      const flyout = workspaceRef.current.getFlyout();



      if (!flyout) return;



      const flyoutApi = flyout as Blockly.IFlyout & {

        setAutoClose?: (autoClose: boolean) => void;

        getFlyoutScale?: () => number;

      };







      const nextCategory = (categoryName || '').trim();



      const flyoutXmlText = nextCategory



        ? buildCategoryToolboxXml(board, nextCategory, circuitData, codingSnapshot, { showAdvancedBlocks })



        : EMPTY_TOOLBOX_XML;



      const flyoutXml = Blockly.utils.xml.textToDom(flyoutXmlText);







      flyoutApi.setAutoClose?.(false);



      flyout.show(Array.from(flyoutXml.childNodes) as unknown as Blockly.utils.toolbox.FlyoutItemInfoArray);







      const flyoutWorkspace = flyout.getWorkspace();



      if (flyoutWorkspace) {



        flyoutWorkspace.setScale(BLOCKLY_FLYOUT_SCALE);



      }



    },



    [circuitData, codingSnapshot, showAdvancedBlocks]



  );







  const hideCategoryFlyout = useCallback(() => {



    const flyout = workspaceRef.current?.getFlyout();



    if (!flyout) return;



    flyout.hide();



  }, []);







  const syncFlyoutScale = useCallback(() => {



    const flyout = workspaceRef.current?.getFlyout();



    if (!flyout) return;



    const flyoutApi = flyout as Blockly.IFlyout & {

      getFlyoutScale?: () => number;

    };



    const flyoutWorkspace = flyout.getWorkspace();



    if (!flyoutWorkspace) return;







    const flyoutScale = flyoutApi.getFlyoutScale?.() ?? flyoutWorkspace.scale;



    if (Math.abs(flyoutScale - BLOCKLY_FLYOUT_SCALE) > 0.001) {



      flyoutWorkspace.setScale(BLOCKLY_FLYOUT_SCALE);



    }



  }, []);







  const handleGenerate = useCallback(() => {
    if (!workspaceRef.current) return;

    try {
      const result = buildSourceCodeFromBlocklyWorkspace(workspaceRef.current, generatorTypeRef.current);
      setGeneratedPreviewCode(result.code);

      if (result.looseTopLevelBlockCount > 0) {
        const blockLabel = result.looseTopLevelBlockCount === 1 ? 'block' : 'blocks';
        setPreviewWarning(`Preview auto-routed ${result.looseTopLevelBlockCount} loose ${blockLabel} into setup()/loop(). Snap them into the root flow for exact behavior.`);
      } else {
        setPreviewWarning(null);
      }

      onCodeChangeRef.current(result.code);
    } catch (e) {
      console.error('Code generation error:', e);
    }
  }, []);







  const onWorkspaceChange = useCallback(



    (e: Blockly.Events.Abstract) => {



      if (e.type === Blockly.Events.VIEWPORT_CHANGE) {



        syncFlyoutScale();



      }







      if (e.isUiEvent || e.type === Blockly.Events.FINISHED_LOADING) return;







      if (e.type === Blockly.Events.BLOCK_DRAG || e.type === Blockly.Events.BLOCK_MOVE) {



        const motionEvent = e as BlocklyMotionEvent;



        if (motionEvent.isStart || motionEvent.isMoveInProgress) return;



      }







      syncBlockCount();







      if (debounceTimerRef.current) {



        clearTimeout(debounceTimerRef.current);



      }







      debounceTimerRef.current = setTimeout(() => {



        emitWorkspaceXml();



        handleGenerate();



        debounceTimerRef.current = null;



      }, 250);



    },



    [emitWorkspaceXml, handleGenerate, syncBlockCount, syncFlyoutScale]



  );







  const initializeWorkspace = useCallback(



    (board: BoardKey) => {



      if (!containerRef.current) return;







      workspaceRef.current = Blockly.inject(containerRef.current, {



        toolbox: EMPTY_TOOLBOX_XML,
        
        media: '/blockly/media/',



        theme: blocklyTheme,



        renderer: 'zelos',



        trashcan: true,



        move: { scrollbars: true, drag: true, wheel: true },



        zoom: { controls: true, wheel: true, startScale: 0.94, maxScale: 2.4, minScale: 0.42, scaleSpeed: 1.12 },



        grid: {
          spacing: 24,
          length: 1,
          colour: blocklyGridColor,
          snap: true,
        },



      });







      workspaceRef.current.addChangeListener(onWorkspaceChange);



      requestAnimationFrame(() => {



        if (workspaceRef.current) {



          hideNativeToolboxUi(workspaceRef.current);



          if (isFlyoutVisible) {



            showCategoryFlyout(board, selectedCategoryNameRef.current);



            syncFlyoutScale();



          } else {



            hideCategoryFlyout();



          }



          Blockly.svgResize(workspaceRef.current);



          workspaceRef.current.scrollCenter();



        }



      });



      if (onWorkspaceReadyRef.current) {



        onWorkspaceReadyRef.current(workspaceRef.current);



      }



      Blockly.svgResize(workspaceRef.current);







      const xmlToRestore = persistedXmlRef.current || initialXmlRef.current;



      loadXmlIntoWorkspace(xmlToRestore);



      handleGenerate();



      const snapshot = serializeWorkspace();



      persistedXmlRef.current = snapshot;



      lastSyncedXmlRef.current = snapshot;



      syncBlockCount();



    },



    [blocklyGridColor, blocklyTheme, handleGenerate, hideCategoryFlyout, isFlyoutVisible, loadXmlIntoWorkspace, onWorkspaceChange, serializeWorkspace, showCategoryFlyout, syncBlockCount, syncFlyoutScale]



  );







  useEffect(() => {



    defineCustomBlocks();







    return () => {



      if (workspaceRef.current) {



        if (onWorkspaceReadyRef.current) {



          onWorkspaceReadyRef.current(null);



        }



        workspaceRef.current.dispose();



        workspaceRef.current = null;



      }



    };



  }, []);







  useEffect(() => {



    if (!containerRef.current) return;







    const boardChanged = prevBoardRef.current !== currentBoard;

    const themeChanged = prevThemeRef.current !== theme;

    const circuitChanged = circuitRefreshSignature !== prevCircuitSignatureRef.current;







    if (!workspaceRef.current || boardChanged || themeChanged) {



      if (workspaceRef.current) {



        persistedXmlRef.current = serializeWorkspace();



        if (onWorkspaceReadyRef.current) {



          onWorkspaceReadyRef.current(null);



        }



        workspaceRef.current.dispose();



        workspaceRef.current = null;



      }



      initializeWorkspace(currentBoard);



      prevBoardRef.current = currentBoard;

      prevThemeRef.current = theme;

      prevCircuitSignatureRef.current = circuitRefreshSignature;



      return;



    }







    if (circuitChanged) {



      prevCircuitSignatureRef.current = circuitRefreshSignature;



      hideNativeToolboxUi(workspaceRef.current);



      if (isFlyoutVisible) {



        showCategoryFlyout(currentBoard, selectedCategoryNameRef.current);



        syncFlyoutScale();



      } else {



        hideCategoryFlyout();



      }



      Blockly.svgResize(workspaceRef.current);



      handleGenerate();



      syncBlockCount();



      return;



    }







    handleGenerate();



  }, [currentBoard, circuitRefreshSignature, handleGenerate, hideCategoryFlyout, initializeWorkspace, isFlyoutVisible, serializeWorkspace, showCategoryFlyout, syncBlockCount, syncFlyoutScale, theme]);







  useEffect(() => {



    if (!workspaceRef.current) return;







    const incomingXml = (initialXml || '').trim();



    const currentXml = serializeWorkspace().trim();







    if (incomingXml === lastSyncedXmlRef.current) return;



    if (incomingXml === currentXml) return;



    if (incomingXml.length === 0 && currentXml.length === 0) return;







    persistedXmlRef.current = initialXml || '';



    loadXmlIntoWorkspace(initialXml);



    handleGenerate();



    const snapshot = serializeWorkspace();



    persistedXmlRef.current = snapshot;



    lastSyncedXmlRef.current = snapshot;



    syncBlockCount();



  }, [initialXml, loadXmlIntoWorkspace, serializeWorkspace, handleGenerate, syncBlockCount]);







  useEffect(() => {



    if (!workspaceRef.current) return;



    hideNativeToolboxUi(workspaceRef.current);



    if (isFlyoutVisible) {



      showCategoryFlyout(currentBoard, selectedCategoryNameRef.current);



      syncFlyoutScale();



    } else {



      hideCategoryFlyout();



    }



    Blockly.svgResize(workspaceRef.current);



  }, [currentBoard, hideCategoryFlyout, isFlyoutVisible, selectedCategoryName, showCategoryFlyout, syncFlyoutScale]);







  useEffect(() => {



    if (!containerRef.current) return;



    const resizeObserver = new ResizeObserver(() => {



      if (workspaceRef.current) {



        Blockly.svgResize(workspaceRef.current);



      }



    });



    resizeObserver.observe(containerRef.current);



    return () => resizeObserver.disconnect();



  }, []);







  const handleFitWorkspace = useCallback(() => {



    workspaceRef.current?.zoomToFit();



    requestAnimationFrame(() => {



      syncFlyoutScale();



    });



  }, [syncFlyoutScale]);







  const handleCenterWorkspace = useCallback(() => {



    workspaceRef.current?.scrollCenter();



  }, []);







  const handleCleanWorkspace = useCallback(() => {



    workspaceRef.current?.cleanUp();



  }, []);







  const handleCategorySelect = useCallback(



    (categoryId: string) => {



      selectedCategoryNameRef.current = categoryId;



      onSelectCategory?.(categoryId);



      setIsFlyoutVisible(true);







      if (!workspaceRef.current) {



        return;



      }







      hideNativeToolboxUi(workspaceRef.current);



      showCategoryFlyout(currentBoard, categoryId);



      syncFlyoutScale();



      Blockly.svgResize(workspaceRef.current);



    },



    [currentBoard, onSelectCategory, showCategoryFlyout, syncFlyoutScale]



  );







  const handleStagePointerDownCapture = useCallback(



    (event: React.PointerEvent<HTMLDivElement>) => {



      const target = event.target as HTMLElement | null;



      if (!target) return;







      if (target.closest('.blocklyFlyout') || target.closest('.blocklyFlyoutBackground')) {



        return;



      }







      setIsFlyoutVisible(false);



      hideCategoryFlyout();



    },



    [hideCategoryFlyout]



  );







  const workspaceLooksEmpty = blockCount <= 1;

  const visibleToolboxCategories = useMemo(
    () => getVisibleToolboxCategories(currentBoard, circuitData, codingSnapshot, { showAdvancedBlocks }),
    [currentBoard, circuitData, codingSnapshot, showAdvancedBlocks]
  );

  const availableCategories = useMemo(() => {
    return visibleToolboxCategories.map((category) => {
      const knownCategory = BLOCK_CATEGORIES.find((candidate) => candidate.id === category.name);
      const fallbackCategory = CATEGORY_METADATA_FALLBACKS[category.name as keyof typeof CATEGORY_METADATA_FALLBACKS];
      const base = knownCategory || fallbackCategory || {
        label: category.name,
        description: category.isDynamic ? 'Workspace-managed blocks' : `${category.blockCount} blocks ready`,
        icon: <BlocksIcon size={16} strokeWidth={2.3} />,
        color: '#5b6dff',
      };

      return {
        id: category.name,
        label: base.label,
        description: base.description,
        icon: base.icon,
        color: base.color,
        blockCount: category.blockCount,
        isDynamic: category.isDynamic,
      };
    });
  }, [visibleToolboxCategories]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      return;
    }

    const hasSelectedCategory = availableCategories.some((category) => category.id === selectedCategoryName);
    if (hasSelectedCategory) {
      return;
    }

    const nextCategory = availableCategories[0].id;
    selectedCategoryNameRef.current = nextCategory;
    onSelectCategory?.(nextCategory);
  }, [availableCategories, onSelectCategory, selectedCategoryName]);

  const activeCategoryName =
    selectedCategoryName && availableCategories.some((category) => category.id === selectedCategoryName)
      ? selectedCategoryName
      : availableCategories[0]?.id || 'Input/Output';

  const activeCategory = availableCategories.find((category) => category.id === activeCategoryName) ?? availableCategories[0] ?? {
    id: 'Input/Output',
    label: 'Input/Output',
    description: 'Pins, reads, writes, and sound',
    icon: <BlocksIcon size={16} strokeWidth={2.3} />,
    color: '#5b6dff',
    blockCount: 0,
    isDynamic: false,
  };

  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return availableCategories;
    }

    return availableCategories.filter((category) =>
      category.label.toLowerCase().includes(normalizedQuery) ||
      category.description.toLowerCase().includes(normalizedQuery)
    );
  }, [availableCategories, categoryQuery]);

  const displayWizardOptions = useMemo(() => {
    const escapeXmlValue = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const numberShadow = (name: string, value: number) =>
      `<value name="${name}"><shadow type="math_number"><field name="NUM">${value}</field></shadow></value>`;
    const textShadow = (name: string, value: string) =>
      `<value name="${name}"><shadow type="text"><field name="TEXT">${escapeXmlValue(value)}</field></shadow></value>`;

    const oledInstance = getOledInstances().find(([, value]) => value && value !== 'NONE')?.[1] ?? 'NONE';

    return [
      {
        id: 'oled',
        label: 'OLED starter',
        description: oledInstance === 'NONE' ? 'Initialize, clear, and print a greeting.' : 'Start with the first mapped OLED in your circuit.',
        buildXml: (x: number, y: number) => `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="arduino_on_start" x="${x}" y="${y}">
              <statement name="SETUP">
                <block type="oled_init">
                  <field name="SENSOR">${escapeXmlValue(oledInstance)}</field>
                  <field name="WIDTH">128</field>
                  <field name="HEIGHT">64</field>
                  <next>
                    <block type="oled_clear">
                      <field name="SENSOR">${escapeXmlValue(oledInstance)}</field>
                      <next>
                        <block type="oled_print">
                          <field name="SENSOR">${escapeXmlValue(oledInstance)}</field>
                          ${textShadow('TEXT', 'Hello!')}
                          ${numberShadow('X', 0)}
                          ${numberShadow('Y', 0)}
                        </block>
                      </next>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </xml>
        `,
      },
      {
        id: 'lcd',
        label: 'LCD starter',
        description: 'Create a 16x2 LCD setup and print a short status line.',
        buildXml: (x: number, y: number) => `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="arduino_on_start" x="${x}" y="${y}">
              <statement name="SETUP">
                <block type="lcd_i2c_init">
                  <field name="ADDRESS">0x27</field>
                  <field name="COLS">16</field>
                  <field name="ROWS">2</field>
                  <next>
                    <block type="lcd_i2c_print">
                      ${textShadow('TEXT', 'System ready')}
                      ${numberShadow('COL', 0)}
                      ${numberShadow('ROW', 0)}
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </xml>
        `,
      },
      {
        id: 'tft',
        label: 'TFT starter',
        description: 'Initialize the TFT, set a background, and print a title.',
        requiresBlock: 'arduino_tft_init',
        buildXml: (x: number, y: number) => `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="arduino_on_start" x="${x}" y="${y}">
              <statement name="SETUP">
                <block type="arduino_tft_init">
                  <next>
                    <block type="arduino_tft_clear">
                      <field name="COLOR">TFT_BLACK</field>
                      <next>
                        <block type="arduino_tft_print">
                          ${textShadow('TEXT', 'Display ready')}
                          ${numberShadow('X', 18)}
                          ${numberShadow('Y', 24)}
                          <field name="SIZE">2</field>
                          <field name="COLOR">TFT_WHITE</field>
                        </block>
                      </next>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </xml>
        `,
      },
    ].filter((starter) => !starter.requiresBlock || isBlockSupportedForBoard(starter.requiresBlock, currentBoard));
  }, [currentBoard]);

  const insertDisplayStarter = useCallback(
    (starterId: string) => {
      const workspace = workspaceRef.current;
      if (!workspace) {
        return;
      }

      const starter = displayWizardOptions.find((candidate) => candidate.id === starterId);
      if (!starter) {
        return;
      }

      const nextY = 36 + workspace.getTopBlocks(false).length * 120;
      const xml = Blockly.utils.xml.textToDom(starter.buildXml(40, nextY));
      Blockly.Xml.domToWorkspace(xml, workspace);
      emitWorkspaceXml();
      handleGenerate();
      syncBlockCount();
      Blockly.svgResize(workspace);
      workspace.scrollCenter();
    },
    [displayWizardOptions, emitWorkspaceXml, handleGenerate, syncBlockCount]
  );







  return (



    <div className="custom-blockly-host relative flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-[30px] border border-[var(--blockly-shell-border)] bg-[var(--blockly-shell-bg)] shadow-[var(--blockly-shell-shadow)]">



      <aside className="flex w-[236px] shrink-0 flex-col border-r border-[color:var(--blockly-sidebar-border)] bg-[var(--blockly-sidebar-bg)]">



        <div className="border-b border-[color:var(--blockly-sidebar-border)] px-4 py-4">



          <div className="flex items-center justify-between gap-3">



            <div>



              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--blockly-sidebar-kicker)]">Block shelf</p>



              <p className="mt-2 text-base font-semibold text-[color:var(--blockly-sidebar-text)]">{boardLabel(currentBoard)}</p>



            </div>



            <span className="rounded-full border border-[color:var(--blockly-sidebar-border-strong)] bg-[color:var(--blockly-sidebar-chip)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--blockly-sidebar-text-soft)]">



              {filteredCategories.length}



            </span>



          </div>







          <label className="mt-4 flex h-11 items-center gap-3 rounded-[18px] border border-[color:var(--blockly-sidebar-border)] bg-[color:var(--blockly-sidebar-input-bg)] px-3 text-[color:var(--blockly-sidebar-text-soft)] transition-colors focus-within:border-[color:var(--blockly-sidebar-accent)] focus-within:text-[color:var(--blockly-sidebar-text)]">



            <Search size={15} />



            <input



              value={categoryQuery}



              onChange={(event) => setCategoryQuery(event.target.value)}



              placeholder="Search blocks"



              className="w-full bg-transparent text-sm text-[color:var(--blockly-sidebar-text)] outline-none placeholder:text-[color:var(--blockly-sidebar-text-soft)]/70"



            />



          </label>

          {activeCategoryName === 'Displays' && displayWizardOptions.length > 0 ? (
            <div className="mt-4 rounded-[22px] border border-[color:var(--blockly-sidebar-border-strong)] bg-[color:var(--blockly-sidebar-card)] p-3 shadow-[0_20px_36px_-28px_rgba(15,23,42,0.55)]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--blockly-sidebar-text-soft)]">
                <Wand2 size={13} />
                Display Wizard
              </div>
              <div className="mt-3 space-y-2">
                {displayWizardOptions.map((starter) => (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={() => insertDisplayStarter(starter.id)}
                    className="w-full rounded-[16px] border border-[color:var(--blockly-sidebar-border)] bg-[color:var(--blockly-sidebar-input-bg)] px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--blockly-sidebar-accent)]/70 hover:bg-[color:var(--blockly-sidebar-card-strong)]"
                  >
                    <div className="text-sm font-semibold text-[color:var(--blockly-sidebar-text)]">{starter.label}</div>
                    <div className="mt-1 text-xs leading-5 text-[color:var(--blockly-sidebar-text-soft)]">{starter.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

        </div>







        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">



          <div className="space-y-2">



            {filteredCategories.map((category) => {



              const isActive = activeCategoryName === category.id;







              return (



                <button



                  key={category.id}



                  type="button"



                  onClick={() => handleCategorySelect(category.id)}



                  className={`group flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-all ${



                    isActive



                      ? 'border-violet-300/35 bg-[linear-gradient(180deg,#8a56ff_0%,#7641ea_100%)] text-white shadow-[0_22px_38px_-26px_rgba(134,78,251,0.72)]'



                      : 'border-white/8 bg-white/[0.03] text-violet-50/88 hover:border-white/14 hover:bg-white/[0.06] hover:text-white'



                  }`}



                >



                  <span



                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white shadow-[0_18px_36px_-26px_rgba(0,0,0,0.7)]"



                    style={{ backgroundColor: category.color }}



                  >



                    {category.icon}



                  </span>



                  <span className="min-w-0 flex-1">



                    <span className="block truncate text-sm font-semibold">{category.label}</span>



                    <span className="mt-0.5 block truncate text-xs text-violet-100/55 group-hover:text-violet-50/88">{category.description}</span>



                  </span>



                </button>



              );



            })}



          </div>







          {filteredCategories.length === 0 ? (



            <div className="mt-4 rounded-[18px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm text-violet-100/60">



              No block families match &quot;{categoryQuery}&quot;.



            </div>



          ) : null}



        </div>



      </aside>







      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Main canvas area ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">

        {/* Blockly workspace column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

          {/* Header row */}
          <div className="flex min-h-[68px] shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#2f1169]/84 px-4 py-3 backdrop-blur">

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-500/70">Blockly studio</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-300/24 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  {activeCategory.label}
                </span>
                <span className="hidden text-xs text-violet-100/60 md:inline">Drag blocks into the canvas.</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-50/78 sm:inline-flex">
                {blockCount} blocks
              </span>
              <button type="button" onClick={handleFitWorkspace} className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-violet-50/90 transition-all hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-white/[0.08] hover:text-white">
                <Crosshair size={14} />
                <span className="hidden sm:inline">Fit</span>
              </button>
              <button type="button" onClick={handleCenterWorkspace} className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-violet-50/90 transition-all hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-white/[0.08] hover:text-white">
                <Move size={14} />
                <span className="hidden sm:inline">Center</span>
              </button>
              <button type="button" onClick={handleCleanWorkspace} className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-violet-50/90 transition-all hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-white/[0.08] hover:text-white">
                <Wand2 size={14} />
                <span className="hidden sm:inline">Arrange</span>
              </button>
              {/* Toggle code panel */}
              <button
                type="button"
                onClick={() => setShowCodePanel((v) => !v)}
                title={showCodePanel ? 'Hide code preview' : 'Show code preview'}
                className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-violet-50/90 transition-all hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-white/[0.08] hover:text-white"
              >
                <Code2 size={14} />
                <span className="hidden sm:inline">Code</span>
                {showCodePanel ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div
            className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(134,78,251,0.2),transparent_42%),linear-gradient(180deg,#32106f_0%,#270e5b_100%)]"
            onPointerDownCapture={handleStagePointerDownCapture}
          >
            <div ref={containerRef} className="absolute inset-0 h-full w-full min-h-0 min-w-0" />
          </div>
        </div>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Code preview panel ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        {showCodePanel && (
          <div className="flex w-[320px] shrink-0 flex-col border-l border-white/10 bg-[linear-gradient(180deg,#341172_0%,#270e5b_100%)]">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-500/70">Generated code</p>
                <p className="mt-0.5 text-xs text-slate-500">Live preview from blocks</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCodePanel(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.05] text-violet-100/70 transition-all hover:border-violet-300/35 hover:bg-white/[0.08] hover:text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            {previewWarning ? (
              <div className="mx-4 mt-3 flex items-start gap-2 rounded-[14px] border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[11px] leading-5 text-amber-100/90">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-200/90" />
                <p>{previewWarning}</p>
              </div>
            ) : null}
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              {generatedPreviewCode && generatedPreviewCode.trim().length > 0 ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-violet-50/92">{generatedPreviewCode}</pre>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-violet-100/55">
                  <Code2 size={28} className="text-violet-300/60" />
                  <p className="text-xs">Add blocks to see generated code here.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>



  );



}

























