"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useBoard } from '@/contexts/BoardContext';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';
import { getProjectMetaSummary, parseProjectMeta, type ProjectMeta } from '@/lib/projects/projectMeta';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLayout } from '@/components/ui/PageLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { fadeInUp } from '@/components/ui/motion';
import {
  ArrowRight,
  Blocks,
  BookOpen,
  CalendarClock,
  CircuitBoard,
  Code2,
  Edit2,
  FolderOpen,
  GraduationCap,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
}

const actionCards = [
  {
    id: 'start',
    eyebrow: 'Build',
    title: 'Start Project',
    description: 'Open the builder and choose your setup.',
    icon: <Plus size={24} />,
    image: '/dashboard/build_banner.png',
  },
  {
    id: 'learn',
    eyebrow: 'Learn',
    title: 'Continue Learning',
    description: 'Open a guided track and launch a lesson.',
    icon: <GraduationCap size={24} />,
    image: '/dashboard/learn_banner.png',
  },
  {
    id: 'projects',
    eyebrow: 'Projects',
    title: 'Open Projects',
    description: 'Jump back into saved work.',
    icon: <FolderOpen size={24} />,
    image: '/dashboard/projects_banner.png',
  },
] as const;

const quickStartCards = [
  {
    title: 'Quick Arduino Lab',
    caption: 'Arduino Uno + virtual simulator',
    icon: <CircuitBoard size={18} />,
    actionLabel: 'Open',
  },
  {
    title: 'Try a Guided Track',
    caption: 'Open a lesson-ready workspace',
    icon: <BookOpen size={18} />,
    actionLabel: 'Browse',
  },
  {
    title: 'Start from Scratch',
    caption: 'Walk through the builder flow',
    icon: <Zap size={18} />,
    actionLabel: 'Begin',
  },
] as const;

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getProjectMode(meta: ProjectMeta | null) {
  if (!meta) {
    return {
      label: 'Workspace',
      environment: 'Project setup',
      Icon: CircuitBoard,
      shellClass: 'from-slate-500/18 via-slate-400/8 to-transparent',
      iconClass: 'bg-slate-400/12 text-slate-100 border-white/10',
      accentClass: 'text-slate-200 border-white/12 bg-white/[0.05]',
    };
  }

  if (meta.mode === 'text') {
    return {
      label: meta.language === 'python' ? 'MicroPython' : 'Arduino C++',
      environment: meta.environment === 'physical' ? 'Hardware' : 'Virtual',
      Icon: Code2,
      shellClass: meta.environment === 'physical'
        ? 'from-amber-400/18 via-orange-400/10 to-transparent'
        : 'from-emerald-400/18 via-sky-400/10 to-transparent',
      iconClass: meta.environment === 'physical'
        ? 'bg-amber-400/14 text-amber-100 border-amber-300/18'
        : 'bg-emerald-400/14 text-emerald-100 border-emerald-300/18',
      accentClass: meta.environment === 'physical'
        ? 'text-amber-100 border-amber-300/18 bg-amber-400/10'
        : 'text-emerald-100 border-emerald-300/18 bg-emerald-400/10',
    };
  }

  return {
    label: 'Block Coding',
    environment: meta.environment === 'physical' ? 'Hardware' : 'Virtual',
    Icon: Blocks,
    shellClass: meta.environment === 'physical'
      ? 'from-fuchsia-400/18 via-violet-400/10 to-transparent'
      : 'from-indigo-400/20 via-cyan-400/10 to-transparent',
    iconClass: meta.environment === 'physical'
      ? 'bg-fuchsia-400/14 text-fuchsia-100 border-fuchsia-300/18'
      : 'bg-indigo-400/14 text-indigo-100 border-indigo-300/18',
    accentClass: meta.environment === 'physical'
      ? 'text-fuchsia-100 border-fuchsia-300/18 bg-fuchsia-400/10'
      : 'text-indigo-100 border-indigo-300/18 bg-indigo-400/10',
  };
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const projectsSectionRef = useRef<HTMLElement | null>(null);
  const { setProjectId } = useProject();
  const { setCodingMode, setLanguage, setCurrentBoard, setGenerator, setEnvironment } = useBoard();

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<ProjectData | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const recentProjects = useMemo(() => projects.slice(0, 5), [projects]);
  const featuredProject = recentProjects[0] ?? null;
  const sideProjects = recentProjects.slice(1);
  const apiHealthUrl = `${API_BASE_URL}/api/health`;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextNotice = window.sessionStorage.getItem('workspaceNotice');
    if (nextNotice) {
      setWorkspaceNotice(nextNotice);
      window.sessionStorage.removeItem('workspaceNotice');
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await apiFetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await safeJson<any>(res);
          if (Array.isArray(data)) {
            setProjects(data);
            setApiError(null);
          } else {
            setApiError('Unexpected response from the API.');
          }
        } else {
          setApiError(`Failed to load projects (status ${res.status}).`);
        }
      } catch (error) {
        setApiError(`Could not reach the API at ${API_BASE_URL}.`);
        console.error('Failed to fetch dashboard projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjects();
  }, [token, router]);

  const handleStartBuild = () => {
    setProjectId(null);
    router.push('/projects/select-environment');
  };

  const handleContinueLearning = () => {
    router.push('/courses');
  };

  const handleOpenProjects = () => {
    projectsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleQuickStartWorkspace = () => {
    router.push('/projects/start?mode=block&board=Arduino%20Uno&language=cpp&generator=arduino&environment=virtual&name=Quick%20Arduino%20Lab');
  };

  const handleOpenProject = (project: ProjectData) => {
    const meta = parseProjectMeta(project.description);

    if (meta) {
      setCodingMode(meta.mode);
      setLanguage(meta.language);
      setGenerator(meta.generator);
      setCurrentBoard(meta.board as any);
      if (meta.environment) {
        setEnvironment(meta.environment);
      }
    }

    setProjectId(project.id);
    router.push('/projects/ide');
  };

  const handleConfirmDeleteProject = async () => {
    if (!token || !projectToDelete) return;

    setIsDeletingProject(true);
    try {
      const res = await apiFetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((project) => project.id !== projectToDelete.id));
        setApiError(null);
        setProjectToDelete(null);
      } else {
        setApiError(`Failed to delete project (status ${res.status}).`);
      }
    } catch (error) {
      setApiError(`Could not reach the API at ${API_BASE_URL}.`);
      console.error('Delete error:', error);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleStartRename = (e: React.MouseEvent, project: ProjectData) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditName(project.name);
  };

  const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, id: string) => {
    e.stopPropagation();
    if (!token) return;
    if (!editName.trim()) {
      setEditingProjectId(null);
      return;
    }

    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (res.ok) {
        setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, name: editName.trim() } : project)));
        setApiError(null);
      } else {
        setApiError(`Failed to rename project (status ${res.status}).`);
      }
    } catch (error) {
      setApiError(`Could not reach the API at ${API_BASE_URL}.`);
      console.error('Rename error:', error);
    } finally {
      setEditingProjectId(null);
    }
  };

  return (
    <MainLayout>
      <div className='flex-1 overflow-y-auto'>
        <PageLayout className='min-h-full' contentClassName='gap-8 py-8 pb-16 sm:py-12 sm:pb-20'>
        <motion.section
          className='ui-foundation-panel p-6 sm:p-8 lg:p-12 relative overflow-hidden'
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
        >
          <div className='relative z-10 space-y-10'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--ui-color-text-muted)]'>
              <Sparkles size={14} className='text-[color:var(--ui-color-primary)]' />
              Workspace Home
            </div>

            <div className='space-y-4 max-w-2xl'>
              <h1 className='text-[3rem] font-bold tracking-[-0.05em] text-[color:var(--ui-color-text)] sm:text-[4.2rem] leading-[1.05]'>
                Welcome back, {user?.name || 'Builder'}.
              </h1>
              <p className='text-lg leading- relaxed text-[color:var(--ui-color-text-soft)] sm:text-xl'>
                Pick a path to jump back into building, learning, or designing your hardware projects.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              {actionCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if (card.id === 'start') handleStartBuild();
                    if (card.id === 'learn') handleContinueLearning();
                    if (card.id === 'projects') handleOpenProjects();
                  }}
                  className='group relative flex flex-col overflow-hidden rounded-[36px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] text-left transition-all duration-500 hover:-translate-y-2 hover:shadow-[color:var(--ui-shadow-card-hover)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ui-color-primary)]/30'
                >
                  <div className='relative h-[200px] w-full overflow-hidden bg-[color:var(--ui-surface-quiet)]'>
                    <img src={card.image} alt={card.title} className='h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105' />
                    <div className='absolute inset-0 bg-gradient-to-t from-[color:var(--ui-surface-inverse)]/40 to-transparent mix-blend-multiply opacity-60' />
                  </div>
                  <div className='relative z-10 -mt-12 flex flex-col p-8 pt-0'>
                    <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-black/40 text-white shadow-xl backdrop-blur-xl transition-transform duration-500 ease-out group-hover:scale-110'>
                      {card.icon}
                    </div>
                    <span className='mb-2 text-[12px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--ui-color-primary)]'>
                      {card.eyebrow}
                    </span>
                    <h3 className='mb-3 text-2xl font-bold tracking-tight text-[color:var(--ui-color-text)]'>
                      {card.title}
                    </h3>
                    <p className='text-[0.95rem] leading-relaxed text-[color:var(--ui-color-text-muted)]'>
                      {card.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className='border-t border-[color:var(--ui-border-soft)] pt-8'>
              <div className='grid gap-4 lg:grid-cols-3'>
                <button
                  type='button'
                  onClick={handleQuickStartWorkspace}
                  className='ui-foundation-panel-quiet flex items-center justify-between gap-5 p-5 text-left transition-all duration-300 hover:border-[color:var(--ui-border-strong)] hover:shadow-lg'
                >
                  <div className='flex items-center gap-4'>
                    <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--ui-color-primary)]/10 text-[color:var(--ui-color-primary)]'>
                      {quickStartCards[0].icon}
                    </span>
                    <div>
                      <p className='text-[0.95rem] font-bold text-[color:var(--ui-color-text)]'>{quickStartCards[0].title}</p>
                      <p className='text-sm text-[color:var(--ui-color-text-muted)]'>{quickStartCards[0].caption}</p>
                    </div>
                  </div>
                  <span className='text-xs font-bold uppercase tracking-widest text-[color:var(--ui-color-primary)]'>{quickStartCards[0].actionLabel}</span>
                </button>

                <button
                  type='button'
                  onClick={handleContinueLearning}
                  className='ui-foundation-panel-quiet flex items-center justify-between gap-5 p-5 text-left transition-all duration-300 hover:border-[color:var(--ui-border-strong)] hover:shadow-lg'
                >
                  <div className='flex items-center gap-4'>
                    <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--ui-color-accent)]/10 text-[color:var(--ui-color-accent)]'>
                      {quickStartCards[1].icon}
                    </span>
                    <div>
                      <p className='text-[0.95rem] font-bold text-[color:var(--ui-color-text)]'>{quickStartCards[1].title}</p>
                      <p className='text-sm text-[color:var(--ui-color-text-muted)]'>{quickStartCards[1].caption}</p>
                    </div>
                  </div>
                  <span className='text-xs font-bold uppercase tracking-widest text-[color:var(--ui-color-accent)]'>{quickStartCards[1].actionLabel}</span>
                </button>

                <button
                  type='button'
                  onClick={handleStartBuild}
                  className='ui-foundation-panel-quiet flex items-center justify-between gap-5 p-5 text-left transition-all duration-300 hover:border-[color:var(--ui-border-strong)] hover:shadow-lg'
                >
                  <div className='flex items-center gap-4'>
                    <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--ui-color-warning)]/10 text-[color:var(--ui-color-warning)]'>
                      {quickStartCards[2].icon}
                    </span>
                    <div>
                      <p className='text-[0.95rem] font-bold text-[color:var(--ui-color-text)]'>{quickStartCards[2].title}</p>
                      <p className='text-sm text-[color:var(--ui-color-text-muted)]'>{quickStartCards[2].caption}</p>
                    </div>
                  </div>
                  <span className='text-xs font-bold uppercase tracking-widest text-[color:var(--ui-color-warning)]'>{quickStartCards[2].actionLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {workspaceNotice ? (
          <StatusBanner tone='info' title='Workspace update'>
            {workspaceNotice}
          </StatusBanner>
        ) : null}

        {apiError ? (
          <StatusBanner
            tone='warning'
            title='We could not load everything yet'
            action={
              <a
                href={apiHealthUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center rounded-full border border-[color:var(--ui-border-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-color-primary)] transition-colors hover:border-[color:var(--ui-color-primary)]'
              >
                View API health
              </a>
            }
          >
            {apiError}
          </StatusBanner>
        ) : null}

        <section ref={projectsSectionRef} id='recent-projects' className='space-y-6'>
          <SectionHeader
            eyebrow='Projects'
            title='Recent work'
            subtitle='Open the latest project fast, or jump to another saved workspace.'
            actions={
              <Button icon={<ArrowRight size={18} />} onClick={handleStartBuild}>
                Start Project
              </Button>
            }
          />

          {isLoading ? (
            <div className='grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
              <div className='overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,#141925_0%,#0d1118_100%)] p-8 shadow-[0_28px_72px_-44px_rgba(0,0,0,0.9)] animate-pulse'>
                <div className='h-5 w-40 rounded-full bg-white/10' />
                <div className='mt-10 h-14 w-3/4 rounded-2xl bg-white/10' />
                <div className='mt-5 h-4 w-full rounded-full bg-white/10' />
                <div className='mt-3 h-4 w-5/6 rounded-full bg-white/10' />
                <div className='mt-14 flex gap-3'>
                  <div className='h-10 w-28 rounded-full bg-white/10' />
                  <div className='h-10 w-36 rounded-full bg-white/10' />
                </div>
              </div>
              <div className='space-y-4'>
                {[0, 1, 2].map((item) => (
                  <div key={item} className='rounded-[28px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] p-5 animate-pulse'>
                    <div className='flex items-center gap-4'>
                      <div className='h-12 w-12 rounded-2xl bg-[color:var(--ui-surface-quiet)]' />
                      <div className='flex-1 space-y-3'>
                        <div className='h-4 w-40 rounded-full bg-[color:var(--ui-surface-quiet)]' />
                        <div className='h-3 w-24 rounded-full bg-[color:var(--ui-surface-quiet)]' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentProjects.length === 0 ? (
            <div className='ui-foundation-panel p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[300px]'>
              <div className='space-y-6 max-w-lg'>
                <div className='space-y-4'>
                  <div className='inline-flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--ui-color-primary)]/10 text-[color:var(--ui-color-primary)] mb-2'>
                    <CircuitBoard size={32} />
                  </div>
                  <h3 className='text-3xl font-bold tracking-tight text-[color:var(--ui-color-text)]'>Start your first build</h3>
                  <p className='text-[1.05rem] leading-relaxed text-[color:var(--ui-color-text-soft)]'>Create a new electronic circuit project or open a lesson-ready interactive workspace.</p>
                </div>
                <div className='flex flex-wrap justify-center gap-4 pt-2'>
                  <Button icon={<Plus size={18} />} onClick={handleStartBuild}>
                    Start Project
                  </Button>
                  <Button variant='inverse' icon={<BookOpen size={18} />} onClick={handleContinueLearning}>
                    Try a Course
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className='grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
              {featuredProject ? (() => {
                const meta = parseProjectMeta(featuredProject.description);
                const summary = getProjectMetaSummary(meta);
                const projectMode = getProjectMode(meta);
                const ModeIcon = projectMode.Icon;

                return (
                  <Card variant='immersive' className='min-h-[360px] p-0'>
                    <div className='relative flex h-full flex-col overflow-hidden p-8 sm:p-10'>
                      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.12),transparent_28%)]' />
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${projectMode.shellClass}`} />

                      <div className='relative z-10 flex h-full flex-col'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='flex min-w-0 items-start gap-4'>
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border ${projectMode.iconClass}`}>
                              <ModeIcon size={22} />
                            </div>
                            <div className='min-w-0 space-y-3'>
                              <div className='flex flex-wrap items-center gap-2'>
                                <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] ${projectMode.accentClass}`}>
                                  {projectMode.label}
                                </span>
                                <span className='inline-flex items-center rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70'>
                                  {projectMode.environment}
                                </span>
                              </div>
                              <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46'>
                                {meta?.board || 'Workspace'}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center gap-1.5'>
                            <button
                              type='button'
                              onClick={(event) => handleStartRename(event, featuredProject)}
                              className='rounded-2xl p-2.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white'
                              title='Rename project'
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type='button'
                              onClick={(event) => {
                                event.stopPropagation();
                                setProjectToDelete(featuredProject);
                              }}
                              className='rounded-2xl p-2.5 text-white/55 transition-colors hover:bg-rose-500/14 hover:text-rose-100'
                              title='Delete project'
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className='mt-12 max-w-2xl space-y-5'>
                          {editingProjectId === featuredProject.id ? (
                            <input
                              type='text'
                              autoFocus
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              onBlur={(event) => handleSaveRename(event, featuredProject.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') handleSaveRename(event, featuredProject.id);
                                if (event.key === 'Escape') setEditingProjectId(null);
                              }}
                              className='w-full border-b-2 border-white/30 bg-transparent pb-1 text-[2.2rem] font-bold tracking-[-0.06em] text-white outline-none sm:text-[2.8rem]'
                            />
                          ) : (
                            <h3 className='text-[2.2rem] font-bold leading-[1.02] tracking-[-0.06em] text-white sm:text-[2.8rem]'>{featuredProject.name}</h3>
                          )}
                          <p className='max-w-xl text-base leading-8 text-white/66'>{summary}</p>
                          <div className='flex flex-wrap items-center gap-3 text-sm text-white/52'>
                            <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2'>
                              <CalendarClock size={14} className='text-cyan-300' />
                              Updated {formatProjectDate(featuredProject.updatedAt)}
                            </span>
                            <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2'>
                              <FolderOpen size={14} className='text-white/70' />
                              Recent workspace
                            </span>
                          </div>
                        </div>

                        <div className='mt-auto flex flex-wrap items-center justify-between gap-4 pt-10'>
                          <div className='text-sm text-white/52'>
                            Open the latest workspace right where you left off.
                          </div>
                          <Button icon={<FolderOpen size={16} />} onClick={() => handleOpenProject(featuredProject)}>
                            Open Project
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })() : null}

              <div className='flex min-h-[360px] flex-col gap-4'>
                <div className='px-1'>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ui-color-text-soft)]'>Jump back in</p>
                  <h3 className='mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--ui-color-text)]'>Other recent saves</h3>
                </div>

                {sideProjects.length > 0 ? (
                  sideProjects.map((project) => {
                    const meta = parseProjectMeta(project.description);
                    const summary = getProjectMetaSummary(meta);
                    const projectMode = getProjectMode(meta);
                    const ModeIcon = projectMode.Icon;

                    return (
                      <Card key={project.id} variant='panel' className='p-0'>
                        <div className='flex items-center gap-4 p-5'>
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border ${projectMode.iconClass}`}>
                            <ModeIcon size={20} />
                          </div>

                          <div className='min-w-0 flex-1 space-y-2'>
                            {editingProjectId === project.id ? (
                              <input
                                type='text'
                                autoFocus
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                onBlur={(event) => handleSaveRename(event, project.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') handleSaveRename(event, project.id);
                                  if (event.key === 'Escape') setEditingProjectId(null);
                                }}
                                className='w-full border-b-2 border-[color:var(--ui-color-primary)] bg-transparent pb-1 text-lg font-semibold tracking-[-0.03em] text-[color:var(--ui-color-text)] outline-none'
                              />
                            ) : (
                              <h3 className='truncate text-lg font-semibold tracking-[-0.03em] text-[color:var(--ui-color-text)]'>{project.name}</h3>
                            )}
                            <div className='flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ui-color-text-soft)]'>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 ${projectMode.accentClass}`}>
                                {projectMode.label}
                              </span>
                              <span>{meta?.board || 'Workspace'}</span>
                            </div>
                            <p className='truncate text-sm text-[color:var(--ui-color-text-muted)]'>{summary}</p>
                          </div>

                          <div className='flex shrink-0 items-center gap-1.5'>
                            <button
                              type='button'
                              onClick={(event) => handleStartRename(event, project)}
                              className='rounded-2xl p-2.5 text-[color:var(--ui-color-text-soft)] transition-colors hover:bg-[color:var(--ui-surface-quiet)] hover:text-[color:var(--ui-color-text)]'
                              title='Rename project'
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type='button'
                              onClick={(event) => {
                                event.stopPropagation();
                                setProjectToDelete(project);
                              }}
                              className='rounded-2xl p-2.5 text-[color:var(--ui-color-text-soft)] transition-colors hover:bg-rose-500/10 hover:text-rose-500'
                              title='Delete project'
                            >
                              <Trash2 size={16} />
                            </button>
                            <Button variant='soft' size='sm' icon={<ArrowRight size={14} />} onClick={() => handleOpenProject(project)}>
                              Open
                            </Button>
                          </div>
                        </div>
                        <div className='flex items-center justify-between border-t border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ui-color-text-soft)]'>
                          <span>Updated {formatProjectDate(project.updatedAt)}</span>
                          <span>{projectMode.environment}</span>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card variant='panel' className='p-0'>
                    <div className='flex h-full min-h-[220px] flex-col justify-between p-6'>
                      <div className='space-y-3'>
                        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ui-color-text-soft)]'>Only one saved project</p>
                        <h3 className='text-2xl font-semibold tracking-[-0.04em] text-[color:var(--ui-color-text)]'>Everything else can start from here.</h3>
                        <p className='text-sm leading-7 text-[color:var(--ui-color-text-muted)]'>Create a new build or launch a course when you want more workspaces in your home.</p>
                      </div>
                      <div className='flex flex-wrap gap-3'>
                        <Button icon={<Plus size={16} />} onClick={handleStartBuild}>Start Project</Button>
                        <Button variant='secondary' icon={<BookOpen size={16} />} onClick={handleContinueLearning}>Try a Course</Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </section>
      </PageLayout>
      </div>

      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title='Delete this project?'
        description='This removes the saved project from your workspace home. You cannot undo this action.'
        confirmLabel='Delete project'
        confirmTone='danger'
        isBusy={isDeletingProject}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={() => void handleConfirmDeleteProject()}
      />
    </MainLayout>
  );
}






