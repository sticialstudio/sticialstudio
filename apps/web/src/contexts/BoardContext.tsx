"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { BOARD_CONFIG } from '../lib/boards/boardConfig';

export type BoardKey = keyof typeof BOARD_CONFIG;
export type CodingMode = 'block' | 'text' | null;
export type HardwareEnvironment = 'virtual' | 'physical';

export interface BoardContextValue {
    currentBoard: BoardKey;
    setCurrentBoard: (board: BoardKey) => void;
    codingMode: CodingMode;
    setCodingMode: (mode: CodingMode) => void;
    language: string | null;
    setLanguage: (lang: string | null) => void;
    generator: string | null;
    setGenerator: (gen: string | null) => void;
    compileStrategy: string;
    isFullScreen: boolean;
    setIsFullScreen: (val: boolean) => void;
    environment: HardwareEnvironment | null;
    setEnvironment: (env: HardwareEnvironment) => void;
}

interface PersistedBoardState {
    currentBoard?: BoardKey;
    codingMode?: CodingMode;
    language?: string | null;
    generator?: string | null;
    environment?: HardwareEnvironment | null;
}

const STORAGE_KEY = 'edtech-board-context';
const BoardContext = createContext<BoardContextValue | undefined>(undefined);

function readStoredBoardState(): PersistedBoardState {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }

        return JSON.parse(raw) as PersistedBoardState;
    } catch {
        return {};
    }
}

export function BoardProvider({ children }: { children: ReactNode }) {
    const defaultBoard: BoardKey = 'Arduino Uno' in BOARD_CONFIG
        ? 'Arduino Uno'
        : (Object.keys(BOARD_CONFIG)[0] as BoardKey);

    const initialConfig = BOARD_CONFIG[defaultBoard];

    const [currentBoard, setCurrentBoard] = useState<BoardKey>(defaultBoard);
    const [codingMode, setCodingMode] = useState<CodingMode>(null);
    const [language, setLanguage] = useState<string | null>(initialConfig.language ?? null);
    const [generator, setGenerator] = useState<string | null>(initialConfig.generator ?? null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [environment, setEnvironment] = useState<HardwareEnvironment | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        const stored = readStoredBoardState();
        if (stored.currentBoard && stored.currentBoard in BOARD_CONFIG) setCurrentBoard(stored.currentBoard);
        if (stored.codingMode) setCodingMode(stored.codingMode);
        if (stored.language) setLanguage(stored.language);
        if (stored.generator) setGenerator(stored.generator);
        if (stored.environment) setEnvironment(stored.environment);
        setHasHydrated(true);
    }, []);

    const config = BOARD_CONFIG[currentBoard] || BOARD_CONFIG[defaultBoard];

    useEffect(() => {
        if (!hasHydrated) {
            return;
        }

        const nextLanguage = config.language ?? null;
        const nextGenerator = config.generator ?? null;

        if (language !== nextLanguage) {
            setLanguage(nextLanguage);
        }

        if (generator !== nextGenerator) {
            setGenerator(nextGenerator);
        }
    }, [config.generator, config.language, currentBoard, generator, hasHydrated, language]);

    useEffect(() => {
        if (!hasHydrated || typeof window === 'undefined') {
            return;
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                currentBoard,
                codingMode,
                language,
                generator,
                environment,
            })
        );
    }, [currentBoard, codingMode, language, generator, environment, hasHydrated]);

    const value: BoardContextValue = useMemo(() => ({
        currentBoard,
        setCurrentBoard,
        codingMode,
        setCodingMode,
        language,
        setLanguage,
        generator,
        setGenerator,
        compileStrategy: config.compileStrategy,
        isFullScreen,
        setIsFullScreen,
        environment,
        setEnvironment,
    }), [currentBoard, codingMode, language, generator, config.compileStrategy, isFullScreen, environment]);

    return (
        <BoardContext.Provider value={value}>
            {children}
        </BoardContext.Provider>
    );
}

export function useBoard() {
    const context = useContext(BoardContext);
    if (context === undefined) {
        throw new Error('useBoard must be used within a BoardProvider');
    }
    return context;
}

