"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useCircuitStore } from '@/stores/circuitStore';
import type { CodingCircuitSnapshot } from '@/lib/blockly/circuitAwareness';
import type { CircuitNetlist, ComponentPinMapping } from '@/lib/wiring/NetlistEngine';
import type { MountedPlacement } from '@/lib/wiring/mountingTypes';

export interface ComponentData {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  state?: Record<string, any>;
  metadata?: Record<string, any>;
  mountedPlacement?: MountedPlacement | null;
}

export interface NetData {
  id: string;
  from: string;
  to: string;
  color: string;
  waypoints?: { x: number; y: number }[];
}

export interface CircuitData {
  components: ComponentData[];
  nets: NetData[];
}

export interface CircuitSimulationState {
  running: boolean;
  ready: boolean;
  error: string | null;
  digitalPins: Record<string, boolean>;
  pulseWidths: Record<string, number>;
  analogPins: Record<string, number>;
}

interface CircuitContextType {
  circuitData: CircuitData;
  netlist: CircuitNetlist;
  resolvedConnections: Record<string, ComponentPinMapping>;
  codingSnapshot: CodingCircuitSnapshot;
  simulationState: CircuitSimulationState;
  setCircuitData: (data: CircuitData, skipHistory?: boolean) => void;
  clearCircuit: () => void;
  addComponent: (component: ComponentData) => void;
  removeComponent: (id: string) => void;
  updateComponentPosition: (id: string, x: number, y: number, mountedPlacement?: MountedPlacement | null) => void;
  updateComponentState: (
    id: string,
    updater: Record<string, any> | ((previousState: Record<string, any>) => Record<string, any>)
  ) => void;
  rotateComponent: (id: string) => void;
  addNet: (net: NetData) => void;
  removeNet: (id: string) => void;
  updateNet: (id: string, updater: Partial<NetData>) => void;
  setSimulationState: (patch: Partial<CircuitSimulationState>) => void;
  resetSimulationState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedComponentId: string | null;
  selectComponent: (id: string | null) => void;
}

const CircuitContext = createContext<CircuitContextType | undefined>(undefined);

export const CircuitProvider = ({ children }: { children: ReactNode }) => {
  const components = useCircuitStore((state) => state.components);
  const nets = useCircuitStore((state) => state.nets);
  const netlist = useCircuitStore((state) => state.netlist);
  const resolvedConnections = useCircuitStore((state) => state.resolvedConnections);
  const codingSnapshot = useCircuitStore((state) => state.codingSnapshot);
  const simulationState = useCircuitStore((state) => state.simulationState);
  const canUndo = useCircuitStore((state) => state.past.length > 0);
  const canRedo = useCircuitStore((state) => state.future.length > 0);
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId);

  const {
    addComponent,
    removeComponent,
    updateComponentPosition,
    updateComponentState,
    rotateComponent,
    addNet,
    removeNet,
    updateNet,
    setCircuitData,
    clearCircuit,
    setSimulationState,
    resetSimulationState,
    selectComponent,
    undo,
    redo,
  } = useCircuitStore.getState();

  return (
    <CircuitContext.Provider
      value={{
        circuitData: { components, nets },
        netlist,
        resolvedConnections,
        codingSnapshot,
        simulationState,
        setCircuitData,
        clearCircuit,
        addComponent,
        removeComponent,
        updateComponentPosition,
        updateComponentState,
        rotateComponent,
        addNet,
        removeNet,
        updateNet,
        setSimulationState,
        resetSimulationState,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedComponentId,
        selectComponent,
      }}
    >
      {children}
    </CircuitContext.Provider>
  );
};

export const useCircuit = () => {
  const context = useContext(CircuitContext);
  if (!context) {
    throw new Error('useCircuit must be used within a CircuitProvider');
  }
  return context;
};