import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { StudioView } from '../../TopToolbar';
import type { BlockTerminalTab } from '../../BlockTerminalShell';
import {
  BLOCK_TERMINAL_COLLAPSED_STORAGE_KEY,
  BLOCK_TERMINAL_DEFAULT_HEIGHT,
  BLOCK_TERMINAL_HEIGHT_STORAGE_KEY,
  BLOCK_TERMINAL_TAB_STORAGE_KEY,
} from '../constants';
import { clampBlockTerminalHeight, getInitialStudioView } from '../helpers';
import { useSplitViewEventBus } from '../SplitViewEventBus';

interface UseIDELayoutStateOptions {
  environment: string;
  isBlockMode: boolean;
  supportsDeviceFiles: boolean;
}

export function useIDELayoutState({ environment, isBlockMode, supportsDeviceFiles }: UseIDELayoutStateOptions) {
  const eventBus = useSplitViewEventBus();
  const [terminalHeight, setTerminalHeight] = useState(BLOCK_TERMINAL_DEFAULT_HEIGHT);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [blockTerminalTab, setBlockTerminalTab] = useState<BlockTerminalTab>('serial');
  const [hasLoadedBlockTerminalPrefs, setHasLoadedBlockTerminalPrefs] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [leftRailView, setLeftRailView] = useState('files');
  const [rightPanelView, setRightPanelView] = useState('status');
  const [activeView, setActiveView] = useState<StudioView>(() => getInitialStudioView(environment));

  const defaultRightView = supportsDeviceFiles ? 'device' : 'ai-chat';
  const effectiveBlockTerminalHeight = isCompact ? Math.min(terminalHeight, 180) : terminalHeight;

  const setStudioView = useCallback(
    (view: StudioView) => {
      if (view === activeView) return;
      if (view === 'code') {
        eventBus.emit('editor:runtime-sync-request', undefined);
      }
      setActiveView(view);
      eventBus.emit('layout:studio-view-changed', { view });
    },
    [activeView, eventBus],
  );

  useEffect(() => {
    const nextView = getInitialStudioView(environment);
    setActiveView(nextView);
    if (nextView === 'code') {
      eventBus.emit('editor:runtime-sync-request', undefined);
    }
    eventBus.emit('layout:studio-view-changed', { view: nextView });
  }, [environment, eventBus]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!isBlockMode) {
      setHasLoadedBlockTerminalPrefs(false);
      return;
    }

    const storedHeight = window.localStorage.getItem(BLOCK_TERMINAL_HEIGHT_STORAGE_KEY);
    if (storedHeight) {
      const parsedHeight = Number.parseInt(storedHeight, 10);
      if (Number.isFinite(parsedHeight)) {
        setTerminalHeight(clampBlockTerminalHeight(parsedHeight));
      }
    }

    const storedCollapsed = window.localStorage.getItem(BLOCK_TERMINAL_COLLAPSED_STORAGE_KEY);
    if (storedCollapsed === 'true' || storedCollapsed === 'false') {
      setBottomCollapsed(storedCollapsed === 'true');
    }

    const storedTab = window.localStorage.getItem(BLOCK_TERMINAL_TAB_STORAGE_KEY);
    if (storedTab === 'serial' || storedTab === 'build' || storedTab === 'connection') {
      setBlockTerminalTab(storedTab);
    }

    setHasLoadedBlockTerminalPrefs(true);
  }, [isBlockMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isBlockMode || !hasLoadedBlockTerminalPrefs) {
      return;
    }

    window.localStorage.setItem(BLOCK_TERMINAL_HEIGHT_STORAGE_KEY, String(clampBlockTerminalHeight(terminalHeight)));
    window.localStorage.setItem(BLOCK_TERMINAL_COLLAPSED_STORAGE_KEY, String(bottomCollapsed));
    window.localStorage.setItem(BLOCK_TERMINAL_TAB_STORAGE_KEY, blockTerminalTab);
  }, [blockTerminalTab, bottomCollapsed, hasLoadedBlockTerminalPrefs, isBlockMode, terminalHeight]);

  useEffect(() => {
    const updateViewportMode = () => {
      const compact = window.innerWidth < 1280;
      setIsCompact(compact);

      if (compact) {
        setLeftCollapsed(true);
        setRightCollapsed(true);
        if (window.innerHeight < 820) {
          setBottomCollapsed(true);
        }
      }
    };

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  useEffect(() => {
    if (!isBlockMode) {
      setRightPanelView(defaultRightView);
      if (!isCompact) {
        setBottomCollapsed(environment === 'virtual');
      }
    }
  }, [defaultRightView, environment, isBlockMode, isCompact]);

  useEffect(() => {
    return eventBus.on('layout:block-terminal-request', ({ tab, open = true }) => {
      setBlockTerminalTab(tab);
      if (open) {
        setBottomCollapsed(false);
      }
    });
  }, [eventBus]);

  useEffect(() => {
    return eventBus.on('app:reset-request', () => {
      setTerminalHeight(BLOCK_TERMINAL_DEFAULT_HEIGHT);
      setLeftCollapsed(false);
      setRightCollapsed(false);
      setBottomCollapsed(false);
      setBlockTerminalTab('serial');
      setLeftRailView('files');
      setRightPanelView('status');
      setActiveView(getInitialStudioView('virtual'));

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(BLOCK_TERMINAL_HEIGHT_STORAGE_KEY);
        window.localStorage.removeItem(BLOCK_TERMINAL_COLLAPSED_STORAGE_KEY);
        window.localStorage.removeItem(BLOCK_TERMINAL_TAB_STORAGE_KEY);
      }
    });
  }, [eventBus]);

  const handleTerminalResize = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = terminalHeight;

      const onMove = (moveEvent: MouseEvent) => {
        const delta = startY - moveEvent.clientY;
        setTerminalHeight(clampBlockTerminalHeight(startHeight + delta));
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [terminalHeight],
  );

  return {
    activeView,
    setStudioView,
    terminalHeight,
    effectiveBlockTerminalHeight,
    leftCollapsed,
    setLeftCollapsed,
    rightCollapsed,
    setRightCollapsed,
    bottomCollapsed,
    setBottomCollapsed,
    blockTerminalTab,
    setBlockTerminalTab,
    isCompact,
    leftRailView,
    setLeftRailView,
    rightPanelView,
    setRightPanelView,
    handleTerminalResize,
    defaultRightView,
  };
}
