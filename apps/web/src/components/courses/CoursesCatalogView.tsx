"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JourneyProgress } from '@/components/ui/JourneyProgress';
import { PageLayout } from '@/components/ui/PageLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeInUp } from '@/components/ui/motion';
import { ArrowRight, BookOpen, CircuitBoard, Cpu, GraduationCap, Sparkles } from 'lucide-react';

export interface CatalogLesson {
  id: string;
  title: string;
  summary: string;
}

export interface CatalogTrack {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  lessonCount: number;
  lessons: CatalogLesson[];
}

const icons = {
  coder: CircuitBoard,
  aider: Cpu,
  rova: GraduationCap,
} as const;

export function CoursesCatalogView({ tracks }: { tracks: CatalogTrack[] }) {
  const router = useRouter();

  return (
    <MainLayout>
      <PageLayout className='flex-1' contentClassName='gap-8 py-8 sm:py-12'>
        <JourneyProgress
          steps={[{ label: 'Choose track' }, { label: 'Pick lesson' }, { label: 'Open workspace' }]}
          activeIndex={0}
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
              Guided learning
            </div>

            <div className='space-y-4'>
              <h1 className='text-[2.8rem] font-semibold tracking-[-0.07em] text-white sm:text-[3.7rem]'>Choose one track and start building</h1>
              <p className='max-w-[600px] text-base leading-8 text-slate-400 sm:text-lg'>Pick the track that fits your learner, then open one lesson-ready workspace.</p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Button icon={<ArrowRight size={18} />} onClick={() => router.push('/projects/select-mode')}>
                Start Project Instead
              </Button>
              <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300'>
                <BookOpen size={15} className='text-cyan-300' />
                {tracks.length} tracks ready
              </div>
            </div>
          </div>
        </motion.section>

        <section className='space-y-5'>
          <SectionHeader
            eyebrow='Tracks'
            title='Start with one path'
            subtitle='Choose the track that feels right for this learner.'
          />

          <div className='grid gap-5 lg:grid-cols-3'>
            {tracks.map((track) => {
              const Icon = icons[track.slug as keyof typeof icons] || BookOpen;
              const featuredLessons = track.lessons.slice(0, 2);

              return (
                <Card
                  key={track.slug}
                  variant='immersive'
                  eyebrow={track.subtitle}
                  title={track.title}
                  description={track.description}
                  icon={<Icon size={22} />}
                  onClick={() => router.push(`/courses/${track.slug}`)}
                  className='min-h-[340px]'
                >
                  <div className='space-y-4'>
                    <div className='flex flex-wrap gap-2'>
                      <span className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                        {track.lessonCount} lessons
                      </span>
                      <span className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                        Recommended start
                      </span>
                    </div>

                    <div className='space-y-2'>
                      {featuredLessons.map((lesson, index) => (
                        <div key={lesson.id} className='rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3'>
                          <p className='text-sm font-semibold text-white'>{lesson.title}</p>
                          <p className='mt-1 text-xs uppercase tracking-[0.16em] text-slate-500'>Lesson {index + 1}</p>
                        </div>
                      ))}
                    </div>

                    <div className='inline-flex items-center gap-2 text-sm font-semibold text-sky-200'>
                      View track
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
