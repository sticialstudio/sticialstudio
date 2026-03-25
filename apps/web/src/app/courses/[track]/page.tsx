import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Cpu, GraduationCap } from 'lucide-react';
import { getCourseTrack } from '@/lib/courses/catalog';

const icons = {
    coder: BookOpen,
    aider: Cpu,
    rova: GraduationCap,
} as const;

export default async function CourseTrackPage({ params }: { params: Promise<{ track: string }> }) {
    const { track } = await params;
    const courseTrack = getCourseTrack(track);

    if (!courseTrack) {
        notFound();
    }

    const Icon = icons[courseTrack.slug as keyof typeof icons] || BookOpen;

    return (
        <MainLayout>
            <div className="min-h-full overflow-y-auto app-canvas px-4 py-6 text-foreground sm:px-6 sm:py-8">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <Link
                        href="/courses"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-cyan-400/70 hover:text-cyan-200"
                    >
                        <ArrowLeft size={14} />
                        Back to Courses
                    </Link>

                    <header className="rounded-3xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.95)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{courseTrack.subtitle}</p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">{courseTrack.title}</h1>
                                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">{courseTrack.description}</p>
                            </div>
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                                <Icon size={26} />
                            </span>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {courseTrack.lessons.map((lesson, index) => {
                            const href = `/projects/start?mode=${lesson.mode}&board=${encodeURIComponent(lesson.board)}&language=${lesson.language}&generator=${lesson.generator}&environment=${lesson.environment}&name=${encodeURIComponent(lesson.title)}`;

                            return (
                                <article
                                    key={lesson.id}
                                    className="ui-fade-up rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5"
                                    style={{ animationDelay: `${50 + index * 18}ms` }}
                                >
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1">{lesson.difficulty}</span>
                                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1">{lesson.board}</span>
                                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1">{lesson.mode === 'block' ? 'Block Coding' : 'Text Coding'}</span>
                                    </div>
                                    <h2 className="mt-4 text-xl font-semibold text-slate-100">{lesson.title}</h2>
                                    <p className="mt-2 text-sm leading-7 text-slate-400">{lesson.summary}</p>
                                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Source: {lesson.sourceLabel}</p>

                                    <div className="mt-5 flex flex-wrap items-center gap-3">
                                        <Link
                                            href={href}
                                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                                        >
                                            Start Lesson Project
                                            <ArrowRight size={15} />
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}

