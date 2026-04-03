"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircuitBoard, Cpu, Microchip, Search, Sparkles } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { useBoard, type BoardKey } from "@/contexts/BoardContext";
import { useProject } from "@/contexts/ProjectContext";
import { BOARD_CONFIG } from "@/lib/boards/boardConfig";
import { writePendingProjectIntent } from "@/lib/projects/projectFlow";
import { Card } from "@/components/ui/Card";

type FamilyFilter = "all" | "arduino" | "esp" | "raspberry";

const familyLabel: Record<FamilyFilter, string> = {
  all: "All",
  arduino: "Arduino",
  esp: "ESP",
  raspberry: "Raspberry Pi",
};

const familyIcon = {
  arduino: Microchip,
  esp: Cpu,
  raspberry: CircuitBoard,
} as const;

function SelectBoardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { codingMode, setCodingMode, environment, setEnvironment, setLanguage, setGenerator, setCurrentBoard } = useBoard();
  const { setProjectId } = useProject();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FamilyFilter>("all");

  const entry = searchParams?.get("entry");
  const isDirectBlockEntry = entry === "block-home";
  const isDirectTextEntry = entry === "text-home";
  const isCircuitEntry = entry === "circuit-lab";
  const isVirtualEntry = entry === "virtual";
  const isDirectHomeEntry = isDirectBlockEntry || isDirectTextEntry;
  const isVirtualFlow = isCircuitEntry || isVirtualEntry || environment === "virtual";

  useEffect(() => {
    if (isDirectBlockEntry) {
      if (environment !== "physical") setEnvironment("physical");
      if (codingMode !== "block") setCodingMode("block");
      return;
    }

    if (isDirectTextEntry) {
      if (environment !== "physical") setEnvironment("physical");
      if (codingMode !== "text") setCodingMode("text");
      return;
    }

    if ((isCircuitEntry || isVirtualEntry) && environment !== "virtual") {
      setEnvironment("virtual");
    }
  }, [codingMode, environment, isCircuitEntry, isVirtualEntry, isDirectBlockEntry, isDirectTextEntry, setCodingMode, setEnvironment]);

  const availableBoards = useMemo(() => {
    return Object.entries(BOARD_CONFIG) as [BoardKey, (typeof BOARD_CONFIG)[BoardKey]][];
  }, []);

  const filteredBoards = useMemo(() => {
    return availableBoards.filter(([name, config]) => {
      const matchesFamily = activeFilter === "all" || config.family === activeFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        name.toLowerCase().includes(query) ||
        config.chip.toLowerCase().includes(query) ||
        config.summary.toLowerCase().includes(query);
      return matchesFamily && matchesSearch;
    });
  }, [activeFilter, availableBoards, search]);

  const steps = isDirectHomeEntry
    ? [{ label: "Board" }, { label: "Workspace" }]
    : isVirtualEntry
      ? [{ label: "Mode" }, { label: "Language" }, { label: "Board" }, { label: "Workspace" }]
      : isVirtualFlow
        ? [{ label: "Mode" }, { label: "Board" }, { label: "Workspace" }]
        : [{ label: "Environment" }, { label: "Mode" }, { label: "Language" }, { label: "Workspace" }];

  const activeStep = isDirectHomeEntry ? 0 : isVirtualEntry ? 2 : isVirtualFlow ? 1 : 2;

  const nextMessage = isVirtualFlow
    ? "Open the workspace in Circuit Lab and start building."
    : codingMode === "text"
      ? "Open the editor with the language that matches this board."
      : "Open Blockly directly and start building with blocks.";

  const handleBoardSelect = (board: BoardKey) => {
    const config = BOARD_CONFIG[board];

    setProjectId(null);
    setCurrentBoard(board);

    // For the virtual flow the user already chose their language on the language page.
    // Only overwrite language/generator when coming from a direct home or physical flow
    // where no explicit choice was made yet.
    if (!isVirtualEntry) {
      setLanguage(config.language);
      setGenerator(config.generator);
    }

    writePendingProjectIntent({ source: "wizard" });
    router.push("/projects/ide");
  };

  const backHref = isDirectHomeEntry
    ? "/"
    : isVirtualEntry
      ? `/projects/select-language?mode=${codingMode ?? "block"}&entry=virtual`
      : isCircuitEntry
        ? "/projects/select-mode?entry=circuit-lab"
        : "/projects/select-mode";

  return (
    <MainLayout>
      <OnboardingShell
        backHref={backHref}
        backLabel="Back"
        steps={steps}
        activeIndex={activeStep}
        contentClassName="justify-center py-8 lg:py-12"
      >
        <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center">
          <div className="mx-auto max-w-[780px] text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-[color:var(--ui-color-primary)]">
              Step {activeStep + 1}
            </p>
            <h1 className="mt-5 text-[3rem] font-bold tracking-tight text-[color:var(--ui-color-text)] sm:text-[4rem]">Choose your board</h1>
            <p className="mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-[color:var(--ui-color-text-soft)]">
              Pick the board first. The workspace will open with the right coding setup automatically.
            </p>
          </div>

          <div className="mx-auto mt-10 flex w-full max-w-[1120px] flex-col gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/34" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search board or chip"
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/26 focus:border-sky-300/36 focus:bg-white/[0.06]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(familyLabel) as FamilyFilter[]).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setActiveFilter(filterKey)}
                  className={[
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                    activeFilter === filterKey
                      ? "border-sky-300/26 bg-sky-400/12 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/46 hover:border-white/18 hover:text-white/72",
                  ].join(" ")}
                >
                  {familyLabel[filterKey]}
                </button>
              ))}
            </div>
          </div>

          {filteredBoards.length === 0 ? (
            <div className="mx-auto mt-8 flex w-full max-w-[820px] items-center justify-center gap-2 rounded-[26px] border border-white/10 bg-white/[0.04] p-8 text-center text-white/58 backdrop-blur-xl">
              <Sparkles size={16} className="text-sky-300/80" />
              Try another search or switch the board family.
            </div>
          ) : (
            <div className="mx-auto mt-8 grid w-full max-w-[1120px] gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBoards.map(([boardName, config]) => {
                const Icon = familyIcon[config.family];
                return (
                  <Card
                    key={boardName}
                    variant="immersive"
                    eyebrow={familyLabel[config.family]}
                    title={boardName}
                    description={config.summary}
                    icon={<Icon size={22} />}
                    image={config.image}
                    onClick={() => handleBoardSelect(boardName)}
                    className="h-full"

                    footer={
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">
                          {config.runtimeLabel}
                        </span>
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200/84">
                          {config.chip}
                        </span>
                      </div>
                    }
                  >
                    <p className="max-w-[34ch] text-sm leading-7 text-white/52">{nextMessage}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </OnboardingShell>
    </MainLayout>
  );
}

export default function SelectBoardPage() {
  return (
    <Suspense fallback={null}>
      <SelectBoardContent />
    </Suspense>
  );
}
