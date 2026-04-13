export interface PendingProjectIntent {
  source: "wizard" | "course";
  projectName?: string | null;
}

const PROJECT_INTENT_KEY = "edtech-project-intent";

export function readPendingProjectIntent(): PendingProjectIntent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROJECT_INTENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingProjectIntent;
  } catch {
    return null;
  }
}

export function writePendingProjectIntent(intent: PendingProjectIntent) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROJECT_INTENT_KEY, JSON.stringify(intent));
}

export function clearPendingProjectIntent() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PROJECT_INTENT_KEY);
}

