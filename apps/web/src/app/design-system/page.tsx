"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Blocks, BookOpen, CircuitBoard, Code2, Flame, Layers3, Sparkles, Wand2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Surface } from "@/components/ui/Surface";
import { fadeInUp, panelSlide, staggerContainer, staggerItem } from "@/components/ui/motion";

const audienceOptions = [
  {
    id: "guided",
    eyebrow: "Beginner",
    title: "Visual first",
    description: "Large choices, fewer words, and one obvious action keep the product approachable from the first click.",
    icon: <Sparkles size={22} />,
  },
  {
    id: "builder",
    eyebrow: "Intermediate",
    title: "Clear build rhythm",
    description: "Circuit work, code, and simulation can live in one calmer system without fighting for attention.",
    icon: <CircuitBoard size={22} />,
  },
  {
    id: "advanced",
    eyebrow: "Advanced",
    title: "Focused control",
    description: "The same spacing and hierarchy can scale up to sharper editor and inspector workflows without feeling noisy.",
    icon: <Code2 size={22} />,
  },
] as const;

const toneSwatches = [
  { label: "Light", description: "Welcoming, warm, and guided for onboarding and decision screens.", icon: <SunIcon /> },
  { label: "Dark", description: "Calm focus mode for workspaces and coding-heavy sessions.", icon: <MoonIcon /> },
  { label: "Magma", description: "Controlled energy for premium emphasis without turning the app loud.", icon: <Flame size={20} /> },
] as const;

function SunIcon() {
  return <Sparkles size={20} />;
}

function MoonIcon() {
  return <Wand2 size={20} />;
}

export default function DesignSystemDemoPage() {
  const router = useRouter();
  const [activeAudience, setActiveAudience] = useState<(typeof audienceOptions)[number]["id"]>("guided");

  const activeSummary = useMemo(
    () => audienceOptions.find((option) => option.id === activeAudience) ?? audienceOptions[0],
    [activeAudience]
  );

  return (
    <MainLayout>
      <PageLayout className="min-h-full" contentClassName="gap-8 sm:gap-10" tone="default" width="wide">
        <Surface variant="raised" padding="lg" animated className="overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-color-text-soft)]">
                <Layers3 size={14} className="text-[var(--ui-color-primary)]" />
                Phase 1 Design Foundation
              </div>
              <SectionHeader
                size="hero"
                title="A calmer visual system for building, coding, and learning hardware."
                subtitle="This foundation trims the noise, strengthens hierarchy, and gives the whole product a more premium rhythm before we redesign the screens themselves."
              />
              <div className="flex flex-wrap gap-3">
                <Button size="lg" icon={<ArrowRight size={18} />} onClick={() => router.push("/projects/select-mode")}>
                  Start Project
                </Button>
                <Button variant="secondary" size="lg" icon={<BookOpen size={18} />} onClick={() => router.push("/courses")}>
                  Explore Courses
                </Button>
              </div>
            </div>

            <motion.div className="flex flex-col gap-4" variants={panelSlide} initial="hidden" animate="visible">
              <Surface variant="inverse" padding="md">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Theme control</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">Light stays welcoming, Dark stays focused, and Magma adds controlled energy.</p>
                  </div>
                  <ThemeToggle showLabel />
                </div>
              </Surface>
              <Surface variant="quiet" padding="md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">Interaction thesis</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--ui-color-text-muted)]">
                  <li>Entrance motion should orient the page, not decorate it.</li>
                  <li>Choice surfaces should feel tactile enough to invite action.</li>
                  <li>Status, save, and run states should be readable at a glance.</li>
                </ul>
              </Surface>
            </motion.div>
          </div>
        </Surface>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Learner Levels"
            title="One system, different comfort levels"
            subtitle="The same visual language should support first-time learners, project builders, and advanced users without feeling like three different products."
          />
          <motion.div className="grid gap-5 lg:grid-cols-3" variants={staggerContainer} initial="hidden" animate="visible">
            {audienceOptions.map((option) => (
              <motion.div key={option.id} variants={staggerItem}>
                <Card
                  eyebrow={option.eyebrow}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  selected={activeAudience === option.id}
                  onClick={() => setActiveAudience(option.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_360px]">
          <Surface variant="panel" padding="lg">
            <SectionHeader
              eyebrow="Theme Language"
              title="Warm entry, focused work, controlled energy"
              subtitle="Every mode shares the same structure, but each theme changes the mood without changing how the product works."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {toneSwatches.map((swatch) => (
                <motion.div
                  key={swatch.label}
                  className="rounded-[24px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] p-5"
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.35 }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-elevated)] text-[var(--ui-color-primary)]">
                    {swatch.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[var(--ui-color-text)]">{swatch.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ui-color-text-muted)]">{swatch.description}</p>
                </motion.div>
              ))}
            </div>
          </Surface>

          <motion.aside variants={panelSlide} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
            <Surface variant="raised" padding="lg" className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-color-text-soft)]">Active Example</p>
              <h3 className="mt-4 text-[2rem] font-semibold tracking-[-0.06em] text-[var(--ui-color-text)]">{activeSummary.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--ui-color-text-muted)]">{activeSummary.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button icon={<Blocks size={18} />} onClick={() => router.push("/projects/select-mode")}>Use in Build Flow</Button>
                <Button variant="soft" icon={<BookOpen size={18} />} onClick={() => router.push("/dashboard")}>Open Workspace</Button>
              </div>
            </Surface>
          </motion.aside>
        </section>
      </PageLayout>
    </MainLayout>
  );
}
