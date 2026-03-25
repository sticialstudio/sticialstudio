import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { ArrowRight, BookOpen, CircuitBoard, Cpu, GraduationCap } from 'lucide-react';
import { getCourseCatalog } from '@/lib/courses/catalog';

const icons = {
    coder: CircuitBoard,
    aider: Cpu,
    rova: GraduationCap,
} as const;

export default function CoursesPage() {
    const tracks = getCourseCatalog();

    return (
        <MainLayout>
            <div className="min-h-full overflow-y-auto app-canvas px-4 py-6 text-foreground sm:px-6 sm:py-8">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <header className="rounded-3xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.95)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Courses</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Choose a track and start learning</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                            Choose a guided track, follow the lessons, then open a matching project setup in one click.
                        </p>
                    </header>

                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {tracks.map((track, index) => {
                            const Icon = icons[track.slug as keyof typeof icons] || BookOpen;
                            const featured = track.lessons.slice(0, 3);

                            return (
                                <article
                                    key={track.slug}
                                    className="ui-fade-up rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5"
                                    style={{ animationDelay: `${80 + index * 40}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{track.subtitle}</p>
                                            <h2 className="mt-1 text-2xl font-semibold text-slate-100">{track.title}</h2>
                                        </div>
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                                            <Icon size={22} />
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm leading-7 text-slate-400">{track.description}</p>
                                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        {track.lessonCount} guided lesson{track.lessonCount === 1 ? '' : 's'}
                                    </p>

                                    <div className="mt-5 space-y-3">
                                        {featured.map((lesson) => (
                                            <div key={lesson.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                                                <p className="font-semibold text-slate-100">{lesson.title}</p>
                                                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{lesson.summary}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <Link
                                            href={`/courses/${track.slug}`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                                        >
                                            View Track
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

