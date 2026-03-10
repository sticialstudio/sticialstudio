"use client";

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { Blocks, ArrowLeft, Code2 } from 'lucide-react';
import { useBoard } from '@/contexts/BoardContext';
import LanguageCard from '@/components/ui/LanguageCard';

export default function SelectModePage() {
    const router = useRouter();
    const { setCodingMode } = useBoard();

    const handleSelection = (mode: 'block' | 'text') => {
        setCodingMode(mode);
        if (mode === 'block') {
            router.push('/projects/select-board');
        } else {
            router.push('/projects/select-language');
        }
    };

    return (
        <MainLayout>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden app-canvas px-4 py-10 text-foreground sm:px-6 sm:py-12">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-cyan-400/70 hover:text-cyan-200 sm:left-6 sm:top-6"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>

                <div className="w-full max-w-5xl space-y-8 sm:space-y-9">
                    <header className="ui-fade-up space-y-3 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300 sm:text-base">Build Project</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Choose Coding Mode</h1>
                        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                            Pick how you want to create your project. You can keep learning with visual blocks or write code directly.
                        </p>
                    </header>

                    <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        <LanguageCard
                            icon={Blocks}
                            title="Block Coding"
                            description="Build programs using visual blocks."
                            subtitle="Beginner Friendly"
                            onClick={() => handleSelection('block')}
                            delayMs={100}
                        />
                        <LanguageCard
                            icon={Code2}
                            title="Text Coding"
                            description="Write programs using Arduino C++ or MicroPython."
                            subtitle="Advanced Control"
                            onClick={() => handleSelection('text')}
                            delayMs={170}
                        />
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}



