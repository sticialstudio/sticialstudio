"use client";

import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { normalizeRuntimeError, normalizedRuntimeErrorToError } from "@/lib/runtime/normalizeRuntimeError";

let didConfigure = false;
let bootstrapPromise: Promise<typeof monaco> | null = null;

function configureMonacoLoader() {
  if (didConfigure) {
    return;
  }

  loader.config({ monaco });
  didConfigure = true;
}

configureMonacoLoader();

export function getConfiguredMonaco() {
  configureMonacoLoader();
  return monaco;
}

export async function ensureMonacoBootstrap() {
  configureMonacoLoader();

  if (!bootstrapPromise) {
    bootstrapPromise = loader.init().catch((error: unknown) => {
      const normalized = normalizeRuntimeError(error, "Monaco failed to load local editor assets.");
      console.error("Monaco initialization: error:", normalized);
      throw normalizedRuntimeErrorToError(error, "Monaco failed to load local editor assets.");
    });
  }

  return bootstrapPromise;
}
