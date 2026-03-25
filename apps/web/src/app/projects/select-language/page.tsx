"use client";

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Braces, FileCode2 } from 'lucide-react';
import { useBoard } from '@/contexts/BoardContext';
import LanguageCard from '@/components/ui/LanguageCard';

export default function SelectLanguagePage() {
    const router = useRouter();
    const { setCodingMode, setLanguage, setGenerator } = useBoard();

    const handleLanguage = (lang: 'cpp' | 'python') => {
        setCodingMode('text');
        if (lang === 'cpp') {
            setLanguage('cpp');
            setGenerator('arduino');
        } else {
            setLanguage('python');
            setGenerator('micropython');
        }
        router.push('/projects/select-board');
    };

    return (
        <MainLayout>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden app-canvas px-4 py-10 text-foreground sm:px-6 sm:py-12">
                <button
                    type="button"
                    onClick={() => router.push('/projects/select-mode')}
                    className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-cyan-400/70 hover:text-cyan-200 sm:left-6 sm:top-6"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>

                <div className="w-full max-w-5xl space-y-8 sm:space-y-9">
                    <header className="ui-fade-up space-y-3 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300 sm:text-base">Text Coding</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Choose a Text Language</h1>
                        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                            Pick the language first. The next step will only show boards that work with it.
                        </p>
                    </header>

                    <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        <LanguageCard
                            icon={Braces}
                            title="Arduino C++"
                            subtitle="Works with Arduino boards"
                            description="Write Arduino sketches and upload them to supported Arduino boards."
                            onClick={() => handleLanguage('cpp')}
                            delayMs={100}
                        />
                        <LanguageCard
                            icon={FileCode2}
                            title="MicroPython"
                            subtitle="Works with ESP and Pico boards"
                            description="Write MicroPython for supported ESP and Raspberry Pi Pico boards."
                            onClick={() => handleLanguage('python')}
                            delayMs={170}
                        />
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}



