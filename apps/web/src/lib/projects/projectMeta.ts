import { BOARD_CONFIG } from "@/lib/boards/boardConfig";

export type PersistedCodingMode = "block" | "text";
export type PersistedHardwareEnvironment = "virtual" | "physical";

export interface ProjectMeta {
  version: 1;
  board: string;
  mode: PersistedCodingMode;
  language: string | null;
  generator: string | null;
  environment: PersistedHardwareEnvironment | null;
}

export interface ProjectMetaSource {
  board?: unknown;
  mode?: unknown;
  codingMode?: unknown;
  language?: unknown;
  generator?: unknown;
  environment?: unknown;
  description?: string | null;
}

const META_PREFIX = "EDTECH_META::";

function isCodingMode(value: unknown): value is PersistedCodingMode {
  return value === "block" || value === "text";
}

function isEnvironment(value: unknown): value is PersistedHardwareEnvironment {
  return value === "virtual" || value === "physical";
}

function normalizeBoard(board: unknown): string {
  if (typeof board === "string" && board in BOARD_CONFIG) {
    return board;
  }

  return "Arduino Uno";
}

function deriveEnvironment(board: string, environment: unknown): PersistedHardwareEnvironment {
  if (isEnvironment(environment)) {
    return environment;
  }

  return BOARD_CONFIG[board]?.supportsBrowserSimulation ? "virtual" : "physical";
}

function hasDirectMetaFields(source: ProjectMetaSource) {
  return [source.board, source.mode, source.codingMode, source.language, source.generator, source.environment].some(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function normalizeMeta(raw: Partial<ProjectMeta> | null | undefined): ProjectMeta | null {
  if (!raw) return null;

  const board = normalizeBoard(raw.board);
  const config = BOARD_CONFIG[board];
  const mode = isCodingMode(raw.mode) ? raw.mode : "block";
  const language = typeof raw.language === "string" && raw.language.length > 0 ? raw.language : config.language;
  const generator = typeof raw.generator === "string" && raw.generator.length > 0 ? raw.generator : config.generator;

  return {
    version: 1,
    board,
    mode,
    language,
    generator,
    environment: deriveEnvironment(board, raw.environment),
  };
}

function parseLegacyDescription(description: string): ProjectMeta | null {
  const boardMatch = description.match(/Board: (.*?) \|/);
  const modeMatch = description.match(/Mode: (.*?)$/);
  const board = boardMatch?.[1] === "Raspberry Pi 2W" ? "Raspberry Pi Pico 2W" : boardMatch?.[1];

  return normalizeMeta({
    board,
    mode: modeMatch?.[1] as PersistedCodingMode | undefined,
  });
}

function parseProjectMetaDescription(description?: string | null): ProjectMeta | null {
  if (!description || typeof description !== "string") {
    return null;
  }

  if (description.startsWith(META_PREFIX)) {
    try {
      const parsed = JSON.parse(description.slice(META_PREFIX.length)) as Partial<ProjectMeta>;
      return normalizeMeta(parsed);
    } catch {
      return null;
    }
  }

  return parseLegacyDescription(description);
}

export function buildProjectMetaPayload(meta: Omit<ProjectMeta, "version"> | ProjectMeta) {
  const normalized = normalizeMeta(meta);

  return {
    board: normalized?.board ?? null,
    codingMode: normalized?.mode ?? null,
    language: normalized?.language ?? null,
    generator: normalized?.generator ?? null,
    environment: normalized?.environment ?? null,
  };
}

export function serializeProjectMeta(meta: Omit<ProjectMeta, "version"> | ProjectMeta): string {
  const normalized = normalizeMeta(meta);

  if (!normalized) {
    return "";
  }

  return `${META_PREFIX}${JSON.stringify(normalized)}`;
}

export function parseProjectMeta(source?: string | null | ProjectMetaSource): ProjectMeta | null {
  if (typeof source === "string" || source == null) {
    return parseProjectMetaDescription(source);
  }

  const rawMode = source.mode ?? source.codingMode;
  const directMeta = hasDirectMetaFields(source)
    ? normalizeMeta({
        board: typeof source.board === "string" ? source.board : undefined,
        mode: isCodingMode(rawMode) ? rawMode : undefined,
        language: typeof source.language === "string" ? source.language : undefined,
        generator: typeof source.generator === "string" ? source.generator : undefined,
        environment: isEnvironment(source.environment) ? source.environment : undefined,
      })
    : null;

  if (directMeta) {
    return directMeta;
  }

  return parseProjectMetaDescription(source.description);
}

export function getProjectMetaSummary(meta: ProjectMeta | null): string {
  if (!meta) {
    return "Project settings will be configured when you open this workspace.";
  }

  const codingLabel =
    meta.mode === "block"
      ? "Block Coding"
      : meta.language === "python"
        ? "MicroPython"
        : "Arduino C++";

  const environmentLabel = meta.environment === "physical" ? "Physical Hardware" : "Virtual Simulator";

  return `${meta.board} · ${codingLabel} · ${environmentLabel}`;
}




