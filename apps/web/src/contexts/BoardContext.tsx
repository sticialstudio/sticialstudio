"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BOARD_CONFIG } from '../lib/boards/boardConfig';

export type BoardKey = keyof typeof BOARD_CONFIG;
export type CodingMode = 'block' | 'text' | null;

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
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
    // Default to 'Arduino Uno' if it exists in BOARD_CONFIG, else the first available key
    const defaultBoard: BoardKey = 'Arduino Uno' in BOARD_CONFIG
        ? 'Arduino Uno'
        : (Object.keys(BOARD_CONFIG)[0] as BoardKey);

    const [currentBoard, setCurrentBoard] = useState<BoardKey>(defaultBoard);
    const [codingMode, setCodingMode] = useState<CodingMode>(null);
    const [language, setLanguage] = useState<string | null>(null);
    const [generator, setGenerator] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const config = BOARD_CONFIG[currentBoard] || BOARD_CONFIG[defaultBoard];

    const value: BoardContextValue = {
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
    };

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
