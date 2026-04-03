"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Blocks, Code2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { useBoard } from "@/contexts/BoardContext";
import { useProject } from "@/contexts/ProjectContext";
import { writePendingProjectIntent } from "@/lib/projects/projectFlow";
import { Card } from "@/components/ui/Card";

const modeChoices = [
  {
    id: "block",
    label: "Beginner friendly",
    title: "Block Coding",
    description: "Build programs with visual blocks and less friction.",
    detail: "Great for first projects and faster experimentation.",
    chips: ["Visual blocks", "Lower friction"],
    icon: <Blocks size={24} />,
  },
  {
    id: "text",
    label: "More control",
    title: "Text Coding",
    description: "Write code directly with the editor that matches your board.",
    detail: "Arduino boards open Arduino C++. ESP and Raspberry Pi boards open MicroPython.",
    chips: ["Direct code", "Board-aware language"],
    icon: <Code2 size={24} />,
  },
] as const;

function SelectModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCodingMode, environment, setEnvironment } = useBoard();
  const { setProjectId } = useProject();

  const entry = searchParams?.get("entry");
  const isCircuitEntry = entry === "circuit-lab";
  const isVirtualFlow = isCircuitEntry || environment === "virtual";

  useEffect(() => {
    if (isVirtualFlow && environment !== "virtual") {
      setEnvironment("virtual");
    }
  }, [environment, isVirtualFlow, setEnvironment]);

  const steps = isCircuitEntry
    ? [{ label: "Mode" }, { label: "Language" }, { label: "Workspace" }]
    : isVirtualFlow
      ? [{ label: "Mode" }, { label: "Language" }, { label: "Board" }, { label: "Workspace" }]
      : [{ label: "Environment" }, { label: "Mode" }, { label: "Language" }, { label: "Workspace" }];

  const activeIndex = isVirtualFlow ? 0 : 1;
  const backHref = isCircuitEntry ? "/" : "/projects/select-environment";

  const handleModeSelect = (mode: "block" | "text") => {
    setProjectId(null);
    writePendingProjectIntent({ source: "wizard" });
    setCodingMode(mode);

    if (isCircuitEntry) {
      // Circuit Lab flow: pick language before opening the IDE
      router.push(`/projects/select-language?mode=${mode}&entry=circuit-lab`);
      return;
    }

    if (isVirtualFlow) {
      // Virtual Simulator flow: pick language before picking board
      router.push(`/projects/select-language?mode=${mode}&entry=virtual`);
      return;
    }

    // Physical flow: text coding goes to language selection, block goes to board
    if (mode === "text") {
      router.push("/projects/select-language?mode=text");
      return;
    }

    router.push("/projects/select-board");
  };


  return (
    <MainLayout>
      <OnboardingShell
        backHref={backHref}
        backLabel="Back"
        steps={steps}
        activeIndex={activeIndex}
        contentClassName="justify-center py-8 lg:py-14"
      >
        <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-[color:var(--ui-color-primary)]">
              Step {activeIndex + 1}
            </p>
            <h1 className="mt-5 text-[3rem] font-bold tracking-tight text-[color:var(--ui-color-text)] sm:text-[4rem]">Choose how you want to build</h1>
            <p className="mx-auto mt-6 max-w-[560px] text-lg leading-relaxed text-[color:var(--ui-color-text-soft)]">
              {isCircuitEntry ? "Pick the coding style first. Circuit Lab opens next." : "Pick the coding style first. The board comes next."}
            </p>
          </div>

          <div className="mx-auto mt-14 grid w-full max-w-[980px] gap-5 md:grid-cols-2">
            {modeChoices.map((choice) => (
              <Card
                key={choice.id}
                variant="immersive"
                eyebrow={choice.label}
                title={choice.title}
                description={choice.description}
                icon={choice.icon}
                onClick={() => handleModeSelect(choice.id)}
                className="min-h-[290px]"
                footer={
                  <div className="flex flex-wrap gap-2">
                    {choice.chips.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex rounded-full border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[color:var(--ui-color-text-muted)]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                }
              >
                <p className="max-w-[34ch] text-[0.95rem] leading-relaxed text-[color:var(--ui-color-text-soft)]">{choice.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      </OnboardingShell>
    </MainLayout>
  );
}

export default function SelectModePage() {
  return (
    <Suspense fallback={null}>
      <SelectModeContent />
    </Suspense>
  );
}
