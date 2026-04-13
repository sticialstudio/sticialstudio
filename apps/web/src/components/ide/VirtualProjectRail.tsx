"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Blocks, CircuitBoard, Code2, PlayCircle, RadioTower } from 'lucide-react';

import { fadeInUp } from '@/components/ui/motion';

import WorkspaceStageRail from './WorkspaceStageRail';

interface VirtualProjectRailProps {
  activeView: 'circuit' | 'code';
  codingMode: 'block' | 'text' | null;
  componentCount: number;
  netCount: number;
  mappedPinCount: number;
  hasCode: boolean;
  supportsSimulation: boolean;
  isSimulationActive: boolean;
  isSimulationBusy: boolean;
  onOpenCode: () => void;
  onBackToCircuit: () => void;
}

const chipClass =
  'inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300';

export default function VirtualProjectRail({
  activeView,
  codingMode,
  componentCount,
  netCount,
  mappedPinCount,
  hasCode,
  supportsSimulation,
  isSimulationActive,
  isSimulationBusy,
  onOpenCode,
  onBackToCircuit,
}: VirtualProjectRailProps) {
  const codingLabel = codingMode === 'text' ? 'Text' : 'Blocks';
  const buildReady = componentCount > 0;
  const simulationReady = supportsSimulation && buildReady && hasCode;

  const railItems = useMemo(
    () => [
      {
        label: 'Build',
        active: activeView === 'circuit',
        subtle: !buildReady && activeView !== 'circuit',
        icon: <CircuitBoard size={13} />,
        onClick: activeView === 'code' ? onBackToCircuit : undefined,
      },
      {
        label: codingLabel,
        active: activeView === 'code',
        subtle: !hasCode && activeView !== 'code',
        icon: codingMode === 'text' ? <Code2 size={13} /> : <Blocks size={13} />,
        onClick: activeView === 'circuit' ? onOpenCode : undefined,
      },
      {
        label: isSimulationActive ? 'Live' : 'Simulate',
        active: isSimulationActive,
        subtle: !simulationReady && !isSimulationActive,
        icon: isSimulationActive ? <RadioTower size={13} /> : <PlayCircle size={13} />,
      },
    ],
    [activeView, buildReady, codingLabel, codingMode, hasCode, isSimulationActive, onBackToCircuit, onOpenCode, simulationReady]
  );

  const statusText = useMemo(() => {
    if (!buildReady) {
      return 'Place a board and a few parts.';
    }

    if (!hasCode) {
      return codingMode === 'text' ? 'Add code next.' : 'Add blocks next.';
    }

    if (isSimulationBusy) {
      return 'Preparing simulation...';
    }

    if (simulationReady) {
      return isSimulationActive ? 'Simulation is live.' : 'Ready to simulate.';
    }

    return 'Project context is linked.';
  }, [buildReady, codingMode, hasCode, isSimulationActive, isSimulationBusy, simulationReady]);

  return (
    <motion.section
      className="circuit-lab-flow mt-3 rounded-[16px] border border-white/7 bg-[#0b1017] px-4 py-2.5"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex flex-wrap items-center gap-3">
          <div className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 lg:block">
            Flow
          </div>
          <WorkspaceStageRail items={railItems} variant="dark" className="w-fit" />
          <p className="text-sm text-slate-400">{statusText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={chipClass}>{componentCount} parts</span>
          <span className={chipClass}>{netCount} nets</span>
          <span className={chipClass}>{mappedPinCount} linked pins</span>
        </div>
      </div>
    </motion.section>
  );
}
