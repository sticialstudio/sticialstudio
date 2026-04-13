/**
 * circuitSerializer.ts
 *
 * Pure helpers to serialize and deserialize the circuit canvas to/from JSON.
 * Stored as `circuit.json` inside the project, alongside `main.cpp` / `main.blockly`.
 */

import type { CircuitData, ComponentData, NetData } from '@/contexts/CircuitContext';
import type { MountedPlacement } from '@/lib/wiring/mountingTypes';

const CIRCUIT_FORMAT_VERSION = 1;

interface PersistedCircuit {
  version: number;
  components: ComponentData[];
  nets: NetData[];
}

function sanitizeMountedPlacement(value: unknown, componentId: string): MountedPlacement | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as MountedPlacement;
  if (candidate.componentId !== componentId || candidate.mounted !== true || !Array.isArray(candidate.pinMap)) {
    return null;
  }

  const safePinMap = candidate.pinMap.filter(
    (entry) => typeof entry?.pinId === 'string' && typeof entry?.nodeId === 'string'
  );

  if (safePinMap.length === 0) {
    return null;
  }

  return {
    componentId,
    mounted: true,
    footprintType: candidate.footprintType,
    rotation: typeof candidate.rotation === 'number' ? candidate.rotation : 0,
    pinMap: safePinMap,
  };
}

function sanitizeNet(value: unknown): NetData | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as NetData;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.from !== 'string' ||
    typeof candidate.to !== 'string'
  ) {
    return null;
  }

  const fromNodeId = typeof candidate.fromNodeId === 'string' ? candidate.fromNodeId : candidate.from;
  const toNodeId = typeof candidate.toNodeId === 'string' ? candidate.toNodeId : candidate.to;

  return {
    ...candidate,
    fromNodeId,
    toNodeId,
    fromAnchorId: typeof candidate.fromAnchorId === 'string' ? candidate.fromAnchorId : null,
    toAnchorId: typeof candidate.toAnchorId === 'string' ? candidate.toAnchorId : null,
    color: typeof candidate.color === 'string' ? candidate.color : '#3b82f6',
    waypoints: Array.isArray(candidate.waypoints)
      ? candidate.waypoints.filter(
          (point) => typeof point?.x === 'number' && typeof point?.y === 'number'
        )
      : undefined,
  };
}

export function serializeCircuit(data: CircuitData): string {
  const payload: PersistedCircuit = {
    version: CIRCUIT_FORMAT_VERSION,
    components: data.components,
    nets: data.nets,
  };
  return JSON.stringify(payload, null, 2);
}

export function deserializeCircuit(json: string): CircuitData {
  try {
    const parsed = JSON.parse(json) as unknown;

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as PersistedCircuit).components) ||
      !Array.isArray((parsed as PersistedCircuit).nets)
    ) {
      return { components: [], nets: [] };
    }

    const { components, nets } = parsed as PersistedCircuit;

    const safeComponents: ComponentData[] = components
      .filter(
        (c) =>
          typeof c === 'object' &&
          c !== null &&
          typeof c.id === 'string' &&
          typeof c.type === 'string' &&
          typeof c.x === 'number' &&
          typeof c.y === 'number'
      )
      .map((c) => ({
        ...c,
        rotation: typeof c.rotation === 'number' ? c.rotation : 0,
        state: typeof c.state === 'object' && c.state !== null ? c.state : {},
        mountedPlacement: sanitizeMountedPlacement((c as ComponentData).mountedPlacement, c.id),
      }));

    const safeNets: NetData[] = nets
      .map((net) => sanitizeNet(net))
      .filter((net): net is NetData => Boolean(net));

    return { components: safeComponents, nets: safeNets };
  } catch {
    return { components: [], nets: [] };
  }
}

export const CIRCUIT_FILE_NAME = 'circuit.json';
