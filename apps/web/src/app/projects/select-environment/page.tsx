"use client";

import { useRouter } from "next/navigation";
import { Monitor, Usb } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { useBoard, type HardwareEnvironment } from "@/contexts/BoardContext";

import { Card } from "@/components/ui/Card";

const environmentChoices = [
  {
    id: "virtual",
    eyebrow: "Best for first projects",
    title: "Virtual Simulator",
    description: "Build the circuit first, then open code and simulation in the same project.",
    detail: "Best when you want to test ideas safely in the browser before using real hardware.",
    icon: <Monitor size={24} />,
    chips: ["Build first", "Safe to test"],
  },
  {
    id: "physical",
    eyebrow: "For real boards",
    title: "Physical Hardware",
    description: "Write code for a real board and move straight into upload and device tools.",
    detail: "Best when your board is already on the desk and ready to connect.",
    icon: <Usb size={24} />,
    chips: ["Real board", "Upload flow"],
  },
] as const;

export default function SelectEnvironmentPage() {
  const router = useRouter();
  const { setEnvironment, setPendingProjectIntent } = useBoard();

  const steps = [{ label: "Environment" }, { label: "Mode" }, { label: "Board" }, { label: "Workspace" }];
  const activeStep = 0;

  const handleEnvironmentSelect = (selectedEnvironment: HardwareEnvironment) => {
    setPendingProjectIntent({ source: "wizard" });
    setEnvironment(selectedEnvironment);
    router.push("/projects/select-mode");
  };

  return (
    <MainLayout>
      <OnboardingShell
        backHref="/"
        backLabel="Back"
        steps={steps}
        activeIndex={activeStep}
        contentClassName="justify-center py-8 lg:py-14"
      >
        <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center">
          <div className="mx-auto max-w-[780px] text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-[color:var(--ui-color-primary)]">
              Step 1
            </p>
            <h1 className="mt-5 text-[3rem] font-bold tracking-tight text-[color:var(--ui-color-text)] sm:text-[4rem]">Choose where this project runs</h1>
            <p className="mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-[color:var(--ui-color-text-soft)]">
              Pick the workspace that matches what you want to do next.
            </p>
          </div>

          <div className="mx-auto mt-14 grid w-full max-w-[980px] gap-5 md:grid-cols-2">
            {environmentChoices.map((choice) => (
              <Card
                key={choice.id}
                variant="immersive"
                eyebrow={choice.eyebrow}
                title={choice.title}
                description={choice.description}
                icon={choice.icon}
                onClick={() => handleEnvironmentSelect(choice.id)}
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


