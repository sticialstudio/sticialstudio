import React, { useEffect, useRef, type ReactNode } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorStore } from '@/stores/editorStore';
import { useCircuitStore } from '@/stores/circuitStore';
import { useSimulationStore, type SimulationCanvasControls, type SimulationCanvasStatus } from '@/stores/simulationStore';
import { CIRCUIT_FILE_NAME, deserializeCircuit, serializeCircuit } from '@/lib/circuit/circuitSerializer';
import type { ComponentData, NetData } from '@/contexts/CircuitContext';
import { useSplitViewEventBus } from './SplitViewEventBus';

interface CircuitOrchestratorValue {
  virtualComponentCount: number;
  virtualNetCount: number;
  virtualMappedPinCount: number;
  simulationControls: SimulationCanvasControls | null;
  simulationStatus: SimulationCanvasStatus | null;
  isSimulationActive: boolean;
  setSimulationControls: (controls: SimulationCanvasControls | null) => void;
  setSimulationStatus: (status: SimulationCanvasStatus | null) => void;
  hasVisitedCodingEnvironment: boolean;
}

function buildCircuitSignature(components: ComponentData[], nets: NetData[]) {
  return serializeCircuit({ components, nets });
}

function useCircuitSyncEffects() {
  const eventBus = useSplitViewEventBus();
  const { projectId, hasLoadedProjectFiles } = useProject();
  const files = useEditorStore((state) => state.files);
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const createFile = useEditorStore((state) => state.createFile);
  const clearCircuit = useCircuitStore((state) => state.clearCircuit);
  const resetSimulationStore = useSimulationStore((state) => state.resetSimulationStore);
  const setHasVisitedCodingEnvironment = useSimulationStore((state) => state.setHasVisitedCodingEnvironment);
  const loadedCircuitProjectRef = useRef<string | null>(null);
  const projectRef = useRef({ files, updateFileContent, createFile });
  const lastCircuitSignatureRef = useRef(buildCircuitSignature([], []));

  useEffect(() => {
    projectRef.current = { files, updateFileContent, createFile };
  }, [createFile, files, updateFileContent]);

  useEffect(() => {
    if (!projectId || !hasLoadedProjectFiles || files.length === 0 || loadedCircuitProjectRef.current === projectId) {
      return;
    }

    const circuitFile = files.find((file) => file.name === CIRCUIT_FILE_NAME);
    if (circuitFile?.content) {
      const restored = deserializeCircuit(circuitFile.content);
      useCircuitStore.getState().setCircuitData(restored, true);
      const signature = buildCircuitSignature(restored.components, restored.nets);
      lastCircuitSignatureRef.current = signature;
      eventBus.emit('CIRCUIT_UPDATED', { signature });
    } else {
      useCircuitStore.getState().clearCircuit();
      const signature = buildCircuitSignature([], []);
      lastCircuitSignatureRef.current = signature;
      eventBus.emit('CIRCUIT_UPDATED', { signature });
    }

    loadedCircuitProjectRef.current = projectId;
  }, [eventBus, files, hasLoadedProjectFiles, projectId]);

  useEffect(() => {
    if (!projectId || loadedCircuitProjectRef.current !== projectId) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useCircuitStore.subscribe((state, prevState) => {
      if (state.components === prevState.components && state.nets === prevState.nets) {
        return;
      }

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const { files: currentFiles, updateFileContent: updateFn, createFile: createProjectFile } = projectRef.current;
        const circuitFile = currentFiles.find((file) => file.name === CIRCUIT_FILE_NAME);
        const signature = buildCircuitSignature(state.components, state.nets);

        if (circuitFile) {
          if (circuitFile.content !== signature) {
            updateFn(circuitFile.id, signature);
          }
        } else {
          createProjectFile(CIRCUIT_FILE_NAME, 'json', null, signature);
        }

        if (signature !== lastCircuitSignatureRef.current) {
          lastCircuitSignatureRef.current = signature;
          eventBus.emit('CIRCUIT_UPDATED', { signature });
        }
      }, 1000);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [eventBus, projectId]);

  useEffect(() => {
    return eventBus.on('layout:studio-view-changed', ({ view }) => {
      if (view === 'code') {
        setHasVisitedCodingEnvironment(true);
      }
    });
  }, [eventBus, setHasVisitedCodingEnvironment]);

  useEffect(() => {
    return eventBus.on('app:reset-request', () => {
      loadedCircuitProjectRef.current = null;
      lastCircuitSignatureRef.current = buildCircuitSignature([], []);
      clearCircuit();
      resetSimulationStore();
      eventBus.emit('CIRCUIT_UPDATED', { signature: lastCircuitSignatureRef.current });
    });
  }, [clearCircuit, eventBus, resetSimulationStore]);
}

export function useCircuitOrchestrator(): CircuitOrchestratorValue {
  const virtualComponentCount = useCircuitStore((state) => state.components.length);
  const virtualNetCount = useCircuitStore((state) => state.nets.length);
  const virtualMappedPinCount = useCircuitStore((state) => state.codingSnapshot.usedSignalPins.length);
  const simulationControls = useSimulationStore((state) => state.simulationControls);
  const simulationStatus = useSimulationStore((state) => state.simulationStatus);
  const hasVisitedCodingEnvironment = useSimulationStore((state) => state.hasVisitedCodingEnvironment);
  const setSimulationControls = useSimulationStore((state) => state.setSimulationControls);
  const setSimulationStatus = useSimulationStore((state) => state.setSimulationStatus);

  return {
    virtualComponentCount,
    virtualNetCount,
    virtualMappedPinCount,
    simulationControls,
    simulationStatus,
    isSimulationActive: Boolean(simulationStatus && (simulationStatus.isRunning || simulationStatus.isReady)),
    setSimulationControls,
    setSimulationStatus,
    hasVisitedCodingEnvironment,
  };
}

export function CircuitOrchestrator({ children }: { children: ReactNode }) {
  useCircuitSyncEffects();
  return <>{children}</>;
}

export const useCircuitSync = useCircuitOrchestrator;

