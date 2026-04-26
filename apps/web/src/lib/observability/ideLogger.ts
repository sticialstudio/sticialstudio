import { normalizeRuntimeError } from '@/lib/runtime/normalizeRuntimeError';

interface IdeLogPayload {
  zone: string;
  context: unknown;
  error: unknown;
  componentStack?: string | null;
  timestamp?: string;
}

export function reportIdeBoundaryError(payload: IdeLogPayload) {
  const normalizedError = normalizeRuntimeError(payload.error, 'An unexpected IDE error occurred.');
  const record = {
    zone: payload.zone,
    context: payload.context,
    error: normalizedError,
    componentStack: payload.componentStack || '',
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  console.error(`[IDE ErrorBoundary:${payload.zone}]`, record);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ide:error-boundary', { detail: record }));
  }

  return record;
}

export function reportIdeResetError(zone: string, context: unknown, error: unknown) {
  const normalizedError = normalizeRuntimeError(error, 'Failed to reset the IDE zone.');
  const record = {
    zone,
    context,
    error: normalizedError,
    timestamp: new Date().toISOString(),
  };

  console.error(`[IDE ErrorBoundary:${zone}] reset failed`, record);
  return record;
}
