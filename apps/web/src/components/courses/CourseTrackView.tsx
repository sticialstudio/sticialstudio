"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JourneyProgress } from '@/components/ui/JourneyProgress';
import { PageLayout } from '@/components/ui/PageLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeInUp } from '@/components/ui/motion';
import { ArrowLeft, ArrowRight, BookOpen, CircuitBoard, Cpu, GraduationCap, Sparkles } from 'lucide-react';

interface CourseLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  board: string;
  mode: 'block' | 'text';
  language: string;
  generator: string;
  environment: 'virtual' | 'physical';
  difficulty: string;
  sourceLabel: string;
}

interface CourseTrack {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  lessonCount: number;
  lessons: CourseLesson[];
}

const icons = {
  coder: CircuitBoard,
  aider: Cpu,
  rova: GraduationCap,
} as const;

function buildLessonHref(lesson: CourseLesson) {
  return `/projects/start?mode=${lesson.mode}&board=${encodeURIComponent(lesson.board)}&language=${lesson.language}&generator=${lesson.generator}&environment=${lesson.environment}&name=${encodeURIComponent(lesson.title)}`;
}

function getLessonStatus(index: number) {
  if (index === 0) return 'Recommended first';
  return 'Available';
}

export function CourseTrackView({ track }: { track: CourseTrack }) {
  const router = useRouter();
  const Icon = icons[track.slug as keyof typeof icons] || BookOpen;
  const firstLesson = track.lessons[0] ?? null;
  const firstLessonHref = firstLesson ? buildLessonHref(firstLesson) : null;

  const summaryPills = useMemo(
    () => [
      `${track.lessonCount} lesson${track.lessonCount === 1 ? '' : 's'}`,
      track.subtitle,
      firstLesson ? firstLesson.board : 'Workspace ready',
    ],
    [firstLesson, track.lessonCount, track.subtitle]
  );

  return (
    <MainLayout>
      <PageLayout className='flex-1' contentClassName='gap-8 py-8 sm:py-12'>
        <JourneyProgress
          steps={[{ label: 'Choose track' }, { label: 'Pick lesson' }, { label: 'Open workspace' }]}
          activeIndex={1}
        />

        <motion.section
          className='overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,#10131f_0%,#090c16_100%)] p-6 shadow-[0_40px_110px_-66px_rgba(0,0,0,1)] sm:p-8 lg:p-10'
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
        >
          <div className='space-y-7'>
            <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300'>
              <Sparkles size={14} className='text-cyan-300' />
              {track.subtitle}
            </div>

            <div className='space-y-4'>
              <h1 className='text-[2.8rem] font-semibold tracking-[-0.07em] text-white sm:text-[3.7rem]'>{track.title}</h1>
              <p className='max-w-[620px] text-base leading-8 text-slate-400 sm:text-lg'>{track.description}</p>
            </div>

            <div className='flex flex-wrap gap-2'>
              {summaryPills.map((pill) => (
                <span key={pill} className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                  {pill}
                </span>
              ))}
            </div>

            <div className='flex flex-wrap gap-3'>
              {firstLessonHref ? (
                <Button icon={<ArrowRight size={18} />} onClick={() => router.push(firstLessonHref)}>
                  Start First Lesson
                </Button>
              ) : null}
              <Button variant='inverse' icon={<ArrowLeft size={18} />} onClick={() => router.push('/courses')}>
                Back to Courses
              </Button>
              <div className='inline-flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300'>
                <span className='flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-cyan-300'>
                  <Icon size={18} />
                </span>
                <span>{firstLesson ? firstLesson.title : 'Choose a lesson below'}</span>
              </div>
            </div>
          </div>
        </motion.section>

        <section className='space-y-5'>
          <SectionHeader
            eyebrow='Lessons'
            title='Choose one lesson'
            subtitle='Open the lesson workspace with the recommended setup already ready.'
          />

          <div className='grid gap-5 xl:grid-cols-2'>
            {track.lessons.map((lesson, index) => {
              const href = buildLessonHref(lesson);
              const status = getLessonStatus(index);

              return (
                <Card
                  key={lesson.id}
                  variant='immersive'
                  eyebrow={`Lesson ${index + 1}`}
                  title={lesson.title}
                  description={lesson.summary}
                  icon={<BookOpen size={22} />}
                  onClick={() => router.push(href)}
                  className='min-h-[260px]'
                >
                  <div className='space-y-4'>
                    <div className='flex flex-wrap gap-2'>
                      <span className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                        {status}
                      </span>
                      <span className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                        {lesson.board}
                      </span>
                      <span className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                        {lesson.mode === 'block' ? 'Block coding' : 'Text coding'}
                      </span>
                    </div>

                    <div className='rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400'>
                      Source: <span className='font-semibold text-white'>{lesson.sourceLabel}</span>
                    </div>

                    <div className='inline-flex items-center gap-2 text-sm font-semibold text-sky-200'>
                      Open lesson workspace
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </PageLayout>
    </MainLayout>
  );
}
