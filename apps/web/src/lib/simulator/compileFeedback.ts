export interface CompileDiagnostic {
  filePath: string | null;
  line: number | null;
  column: number | null;
  severity: 'error' | 'warning';
  message: string;
  raw: string;
}

export interface CompileFeedback {
  message: string;
  log: string;
  diagnostics: CompileDiagnostic[];
  line: number | null;
  column: number | null;
  filePath: string | null;
}

const DIAGNOSTIC_PATTERN = /((?:[A-Za-z]:)?[^:\r\n]+?\.[A-Za-z0-9]+):(\d+):(?:(\d+):)?\s*(fatal error|error|warning):\s*(.+)/g;

function normalizeCompileLog(rawLog: string | null | undefined) {
  return (rawLog ?? '').replace(/\r\n/g, '\n').trim();
}

function buildFallbackFeedback(message: string, rawLog: string) {
  const normalizedMessage = message.trim() || 'Compilation failed.';
  return {
    message: normalizedMessage,
    log: rawLog || normalizedMessage,
    diagnostics: [],
    line: null,
    column: null,
    filePath: null,
  } satisfies CompileFeedback;
}

export function extractCompileFeedback(rawLog: string | null | undefined, fallbackMessage = 'Compilation failed.') {
  const log = normalizeCompileLog(rawLog);
  if (!log) {
    return buildFallbackFeedback(fallbackMessage, '');
  }

  const diagnostics: CompileDiagnostic[] = [];
  const matches = log.matchAll(DIAGNOSTIC_PATTERN);
  for (const match of matches) {
    const line = Number.parseInt(match[2] || '', 10);
    const column = Number.parseInt(match[3] || '', 10);
    const severity = match[4] === 'warning' ? 'warning' : 'error';
    diagnostics.push({
      filePath: match[1] || null,
      line: Number.isFinite(line) ? line : null,
      column: Number.isFinite(column) ? column : null,
      severity,
      message: (match[5] || fallbackMessage).trim(),
      raw: match[0],
    });
  }

  const primaryDiagnostic = diagnostics.find((diagnostic) => diagnostic.severity === 'error') ?? diagnostics[0] ?? null;
  if (!primaryDiagnostic) {
    return buildFallbackFeedback(fallbackMessage, log);
  }

  return {
    message: primaryDiagnostic.message || fallbackMessage,
    log,
    diagnostics,
    line: primaryDiagnostic.line,
    column: primaryDiagnostic.column,
    filePath: primaryDiagnostic.filePath,
  } satisfies CompileFeedback;
}

export class CompileToHexError extends Error {
  feedback: CompileFeedback;

  constructor(feedback: CompileFeedback) {
    super(feedback.message);
    this.name = 'CompileToHexError';
    this.feedback = feedback;
  }
}
