"use client";

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Cpu, CircuitBoard, Microchip } from 'lucide-react';
import { useBoard, BoardKey } from '@/contexts/BoardContext';
import { BOARD_CONFIG } from '@/lib/boards/boardConfig';
import { useMemo, useState } from 'react';
import BoardCard from '@/components/ui/BoardCard';

type FamilyFilter = 'all' | 'arduino' | 'esp' | 'raspberry';

const familyLabel: Record<FamilyFilter, string> = {
    all: 'All',
    arduino: 'Arduino',
    esp: 'ESP',
    raspberry: 'Raspberry Pi'
};

const familyIcon = {
    arduino: Microchip,
    esp: Cpu,
    raspberry: CircuitBoard
} as const;

export default function SelectBoardPage() {
    const router = useRouter();
    const { codingMode, language, setLanguage, setGenerator, setCurrentBoard } = useBoard();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FamilyFilter>('all');
    const [selectedBoard, setSelectedBoard] = useState<BoardKey | null>(null);

    const languageScopedBoards = useMemo(() => {
        return Object.entries(BOARD_CONFIG).filter(([, config]) => {
            if (codingMode === 'text') {
                return config.language === language;
            }
            return true;
        }) as [BoardKey, (typeof BOARD_CONFIG)[BoardKey]][];
    }, [codingMode, language]);

    const filteredBoards = useMemo(() => {
        return languageScopedBoards.filter(([name, config]) => {
            const matchesFamily = activeFilter === 'all' || config.family === activeFilter;
            const q = search.trim().toLowerCase();
            const matchesSearch =
                q.length === 0 ||
                name.toLowerCase().includes(q) ||
                config.chip.toLowerCase().includes(q) ||
                config.summary.toLowerCase().includes(q);
            return matchesFamily && matchesSearch;
        });
    }, [activeFilter, languageScopedBoards, search]);

    const handleSelectBoard = (boardKey: BoardKey) => {
        const config = BOARD_CONFIG[boardKey];

        if (codingMode === 'block') {
            setLanguage(config.language);
            setGenerator(config.generator);
        }

        setSelectedBoard(boardKey);
        window.setTimeout(() => {
            setCurrentBoard(boardKey);
            router.push('/projects/select-environment');
        }, 160);
    };

    return (
        <MainLayout>
            <div className="relative flex flex-1 justify-center overflow-y-auto app-canvas px-4 py-8 text-foreground sm:px-6 sm:py-10">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-cyan-400/70 hover:text-cyan-200 sm:left-6 sm:top-6"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>

                <div className="w-full max-w-6xl space-y-7 pt-10 sm:space-y-8 sm:pt-12">
                    <header className="ui-fade-up space-y-3 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300 sm:text-base">Board Setup</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Choose Your Board</h1>
                        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                            Pick the board you want to program. We will keep the next setup steps matched to this board.
                        </p>
                    </header>

                    <section className="space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-sm">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by board, chip, or feature"
                                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/70 focus:outline-none"
                                />
                            </div>

                            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pl-1">
                                {(Object.keys(familyLabel) as FamilyFilter[]).map((filterKey) => (
                                    <button
                                        key={filterKey}
                                        type="button"
                                        onClick={() => setActiveFilter(filterKey)}
                                        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                                            activeFilter === filterKey
                                                ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-200'
                                                : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                        }`}
                                    >
                                        {familyLabel[filterKey]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            {filteredBoards.length} board option{filteredBoards.length === 1 ? '' : 's'} shown
                        </p>
                    </section>

                    {filteredBoards.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
                            <p className="text-lg font-semibold text-slate-200">No boards match that filter</p>
                            <p className="mt-2 text-sm text-slate-400">Try a different search term or choose another board family.</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredBoards.map(([boardName, config], index) => {
                                const Icon = familyIcon[config.family];
                                return (
                                    <BoardCard
                                        key={boardName}
                                        name={boardName}
                                        chip={config.chip}
                                        description={config.summary}
                                        familyLabel={familyLabel[config.family]}
                                        icon={Icon}
                                        selected={selectedBoard === boardName}
                                        onClick={() => handleSelectBoard(boardName)}
                                        delayMs={60 + index * 28}
                                    />
                                );
                            })}
                        </section>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}




