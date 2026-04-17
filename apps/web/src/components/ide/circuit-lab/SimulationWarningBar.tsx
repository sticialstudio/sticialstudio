import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';

export function SimulationWarningBar() {
  const warnings = useSimulationStore((s) => s.simulationState.warnings);
  if (!warnings.length) return null;

  return (
    <div className="flex w-full items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
      <ul className="space-y-0.5">
        {warnings.map((w, i) => (
          <li key={i} className="leading-snug">
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
