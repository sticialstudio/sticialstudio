"use client";

import MainLayout from '@/components/layout/MainLayout';
import DashboardCard from '@/components/ui/DashboardCard';
import { BookOpen, FolderGit2 } from 'lucide-react';

export default function WelcomePage() {
  return (
    <MainLayout>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden app-canvas px-4 py-10 text-foreground sm:px-6 sm:py-12">
        <div className="w-full max-w-6xl space-y-8 sm:space-y-10">
          <header className="ui-fade-up space-y-3 text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              <span className="text-slate-100">Welcome to </span>
              <span className="text-cyan-300">EdTech</span>{' '}
              <span className="text-emerald-300">sOS</span>
            </h1>
            <div className="mx-auto max-w-2xl space-y-1 text-sm leading-7 text-slate-400 md:text-base">
              <p>Learn, Build, and Upload with Confidence</p>
              <p>Choose your next step and continue your embedded programming journey.</p>
            </div>
          </header>

          <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <DashboardCard
              href="/courses"
              icon={BookOpen}
              title="Study Course"
              description="Follow guided lessons to learn embedded programming."
              delayMs={100}
            />
            <DashboardCard
              href="/projects/select-mode"
              icon={FolderGit2}
              title="Build Project"
              description="Create your own hardware project using blocks or code."
              delayMs={180}
            />
          </section>
        </div>
      </div>
    </MainLayout>
  );
}



