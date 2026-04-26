export interface NormalizedRuntimeError {
  name: string;
  message: string;
  stack: string;
  rawValue?: string;
  eventType?: string;
  targetUrl?: string;
  cause?: string;
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getEventTargetUrl(target: EventTarget | null): string | undefined {
  if (!target || typeof target !== "object") {
    return undefined;
  }

  const candidate = target as {
    currentSrc?: string;
    src?: string;
    href?: string;
    baseURI?: string;
  };

  return candidate.currentSrc || candidate.src || candidate.href || candidate.baseURI;
}

export function normalizeRuntimeError(
  error: unknown,
  fallbackMessage = "Something went wrong."
): NormalizedRuntimeError {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || fallbackMessage,
      stack: error.stack || "",
      cause: error.cause ? stringifyUnknown(error.cause) : undefined,
    };
  }

  if (typeof Event !== "undefined" && error instanceof Event) {
    const targetUrl = getEventTargetUrl(error.target);
    const eventType = error.type || "unknown";
    const suffix = targetUrl ? ` (${eventType} @ ${targetUrl})` : ` (${eventType})`;

    return {
      name: "Event",
      message: `${fallbackMessage}${suffix}`,
      stack: "",
      rawValue: stringifyUnknown({
        type: eventType,
        targetUrl,
      }),
      eventType,
      targetUrl,
    };
  }

  const rawValue = stringifyUnknown(error);
  return {
    name: "NonErrorThrown",
    message: rawValue && rawValue !== "[object Object]" ? rawValue : fallbackMessage,
    stack: "",
    rawValue,
  };
}

export function normalizedRuntimeErrorToError(
  error: unknown,
  fallbackMessage = "Something went wrong."
): Error {
  const normalized = normalizeRuntimeError(error, fallbackMessage);
  const wrapped = new Error(normalized.message);
  wrapped.name = normalized.name;
  if (normalized.stack) {
    wrapped.stack = normalized.stack;
  }
  (wrapped as Error & { details?: NormalizedRuntimeError }).details = normalized;
  return wrapped;
}
