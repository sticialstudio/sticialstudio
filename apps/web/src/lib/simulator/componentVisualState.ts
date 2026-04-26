import type { ComponentData } from '@/contexts/CircuitContext';
import type { CircuitSimulationState } from '@/stores/simulationStore';

export function mergeComponentVisualState(
  componentState: Record<string, any> | undefined,
  visualState: Record<string, unknown> | undefined
) {
  return {
    ...(componentState ?? {}),
    ...(visualState ?? {}),
  };
}

export function getComponentVisualState(
  component: Pick<ComponentData, 'id' | 'state'>,
  simulationState: Pick<CircuitSimulationState, 'componentVisuals'> | null | undefined
) {
  return mergeComponentVisualState(component.state, simulationState?.componentVisuals?.[component.id]);
}
