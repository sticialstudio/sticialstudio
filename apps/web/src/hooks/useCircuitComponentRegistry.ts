"use client";

import { useMemo } from 'react';
import { getCircuitComponentRegistry } from '@/lib/wiring/circuitComponentRegistry';

export function useCircuitComponentRegistry() {
  return useMemo(() => getCircuitComponentRegistry(), []);
}
