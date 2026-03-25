"use client";

import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import DashboardCard from "@/components/ui/DashboardCard";
import {
  BookOpen,
  FolderGit2,
  Cpu,
  CircuitBoard,
  Cable,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const capabilities = [
  {
    icon: CircuitBoard,
    title: "Circuit Lab",
    description: "Lay out boards, place components, wire connections, and move into code with the same project context.",
  },
  {
    icon: Cpu,
    title: "Block + Text Coding",
    description: "Switch between Blockly and source code while keeping generated files, board targeting, and project state synchronized.",
  },
  {
    icon: Cable,
    title: "Board Upload",
    description: "Verify, upload, and connect to Arduino boards plus MicroPython targets such as ESP32 and Raspberry Pi Pico boards.",
  },
];

const workflow = [
  "Choose your coding path and hardware target.",
  "Build the circuit, generate code, and save everything in one project.",
  "Upload to a connected board or run the virtual simulator when supported.",
];

export default function WelcomePage() {
  return (
    <MainLayout>
      <div className="relative flex flex-1 overflow-y-auto app-canvas px-4 py-8 text-foreground sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="ui-fade-up overflow-hidden rounded-[32px] border border-slate-700/80 bg-slate-900/65 shadow-[0_28px_90px_-54px_rgba(34,211,238,0.35)]">
            <div className="grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-8 lg:py-8">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-200">Circuit Lab</span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">Blockly + Code</span>
                  <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-violet-200">Board Upload</span>
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-balance text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                    Build circuits, generate code, and ship to hardware from one workspace.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    EdTech OS combines circuit design, block coding, source editing, simulation, and live board upload into a guided embedded workflow.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/projects/select-mode"
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/20"
                  >
                    Start Project
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/20"
                  >
                    Try a Course
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500"
                  >
                    Open Workspace Home
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">How It Works</p>
                <div className="mt-4 space-y-3">
                  {workflow.map((step, index) => (
                    <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/65 px-4 py-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-xs font-bold text-cyan-200">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-300">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100">
                  First time here? Start with a virtual Arduino project for the quickest path from circuit to simulation, or open a course if you want guided steps.
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="ui-fade-up rounded-[26px] border border-slate-700/80 bg-slate-900/60 p-5"
                style={{ animationDelay: `${80 + index * 60}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/70 text-cyan-300">
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-100">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <DashboardCard
              href="/courses"
              icon={BookOpen}
              title="Study Course"
              description="Follow guided lessons to learn embedded systems, components, and programming foundations."
              delayMs={120}
            />
            <DashboardCard
              href="/projects/select-mode"
              icon={FolderGit2}
              title="Build Project"
              description="Create a project, pick a board, build the circuit, and move straight into blocks or source code."
              delayMs={190}
            />
          </section>

          <section className="rounded-[28px] border border-slate-800 bg-slate-950/70 px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace Highlights</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">Everything stays connected</h2>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  Persistent projects
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  Blockly to source sync
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  Upload logs and device tools
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

