"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Braces, FileCode2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { useBoard } from "@/contexts/BoardContext";
import { Card } from "@/components/ui/Card";

const languageChoices = [
  {
    id: "cpp" as const,
    eyebrow: "Arduino C++",
    title: "Arduino C++",
    description: "Classic Arduino syntax with setup() and loop().",
    detail: "Best for Arduino boards. Compiles and uploads directly to hardware.",
    icon: <Braces size={24} />,
    chips: ["Arduino boards", "C++ syntax"],
    blockLabel: "Convert blocks → Arduino C++",
    blockDetail: "Your Blockly blocks will generate Arduino C++ code on the right panel.",
  },
  {
    id: "python" as const,
    eyebrow: "MicroPython",
    title: "MicroPython",
    description: "Python-style scripting that runs directly on the board.",
    detail: "Best for ESP and Raspberry Pi Pico boards. Familiar Python syntax.",
    icon: <FileCode2 size={24} />,
    chips: ["ESP / Pico", "Python syntax"],
    blockLabel: "Convert blocks → MicroPython",
    blockDetail: "Your Blockly blocks will generate MicroPython code on the right panel.",
  },
] as const;

type LangId = "cpp" | "python";

function SelectLanguageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCodingMode, setLanguage, setGenerator } = useBoard();

  const entry = searchParams?.get("entry") ?? "";          // "circuit-lab" | "virtual" | ""
  const mode = searchParams?.get("mode") ?? "text";         // "block" | "text"

  const isCircuitEntry = entry === "circuit-lab";
  const isVirtualEntry = entry === "virtual";
  const isBlockMode = mode === "block";

  // ── Breadcrumb steps ────────────────────────────────────────────────────────
  const steps = isCircuitEntry
    ? [{ label: "Mode" }, { label: "Language" }, { label: "Workspace" }]
    : isVirtualEntry
      ? [{ label: "Mode" }, { label: "Language" }, { label: "Board" }, { label: "Workspace" }]
      : [{ label: "Environment" }, { label: "Mode" }, { label: "Language" }, { label: "Workspace" }];

  const activeIndex = isCircuitEntry || isVirtualEntry ? 1 : 2;

  const backHref = isCircuitEntry
    ? `/projects/select-mode?entry=circuit-lab`
    : isVirtualEntry
      ? `/projects/select-mode?entry=virtual`
      : "/projects/select-mode";

  // ── Heading copy ─────────────────────────────────────────────────────────
  const heading = isBlockMode
    ? "Choose your code converter"
    : "Choose your text language";

  const subheading = isBlockMode
    ? "Your Blockly blocks will be converted to the language you pick. You can see the code live on the right side of the editor."
    : "Pick the code language first. The board and editor will match your selection.";

  // ── Selection handler ─────────────────────────────────────────────────────
  const handleSelect = (lang: LangId) => {
    setCodingMode(isBlockMode ? "block" : "text");

    if (lang === "cpp") {
      setLanguage("cpp");
      setGenerator("arduino");
    } else {
      setLanguage("python");
      setGenerator("micropython");
    }

    if (isCircuitEntry) {
      // Circuit Lab: go straight to the IDE workspace
      router.push("/projects/ide");
      return;
    }

    if (isVirtualEntry) {
      // Virtual Simulator: pick a board next
      router.push("/projects/select-board?entry=virtual");
      return;
    }

    // Physical text flow: pick a board next
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
            <h1 className="mt-5 text-[3rem] font-bold tracking-tight text-[color:var(--ui-color-text)] sm:text-[4rem]">
              {heading}
            </h1>
            <p className="mx-auto mt-6 max-w-[580px] text-lg leading-relaxed text-[color:var(--ui-color-text-soft)]">
              {subheading}
            </p>
          </div>

          <div className="mx-auto mt-14 grid w-full max-w-[980px] gap-5 md:grid-cols-2">
            {languageChoices.map((choice) => (
              <Card
                key={choice.id}
                variant="immersive"
                eyebrow={choice.eyebrow}
                title={isBlockMode ? choice.blockLabel : choice.title}
                description={choice.description}
                icon={choice.icon}
                onClick={() => handleSelect(choice.id)}
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
                <p className="max-w-[34ch] text-[0.95rem] leading-relaxed text-[color:var(--ui-color-text-soft)]">
                  {isBlockMode ? choice.blockDetail : choice.detail}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </OnboardingShell>
    </MainLayout>
  );
}

export default function SelectLanguagePage() {
  return (
    <Suspense fallback={null}>
      <SelectLanguageContent />
    </Suspense>
  );
}
