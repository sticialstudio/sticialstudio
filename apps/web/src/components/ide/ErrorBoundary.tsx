"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, RefreshCcw, RotateCcw } from "lucide-react";
import { useBoard } from "@/contexts/BoardContext";
import { useProject } from "@/contexts/ProjectContext";
import { useEditorStore } from "@/stores/editorStore";
import { normalizeRuntimeError } from "@/lib/runtime/normalizeRuntimeError";
import { reportIdeBoundaryError, reportIdeResetError } from '@/lib/observability/ideLogger';

interface ErrorBoundaryContextValue {
  zone: string;
  board: string;
  mode: string;
  environment: string;
  activeFile: string;
  projectId: string;
  projectName: string;
  route: string;
}

interface NormalizedBoundaryError {
  name: string;
  message: string;
  stack: string;
  rawValue?: string;
  eventType?: string;
  targetUrl?: string;
  cause?: string;
}

interface ErrorBoundaryProps {
  title?: string;
  description?: string;
  compact?: boolean;
  zoneContext: ErrorBoundaryContextValue;
  onResetState?: () => void | Promise<void>;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: NormalizedBoundaryError | null;
  componentStack: string;
  retryNonce: number;
  isResetting: boolean;
}

function normalizeBoundaryError(error: unknown): NormalizedBoundaryError {
  return normalizeRuntimeError(error, "Something went wrong in this part of the IDE.");
}

function formatModeLabel(mode: string | null | undefined) {
  if (!mode) {
    return "Unknown mode";
  }

  return mode === "block" ? "Block Coding" : mode === "text" ? "Text Coding" : mode;
}

function formatEnvironmentLabel(environment: string | null | undefined) {
  if (!environment) {
    return "Unknown environment";
  }

  return environment === "virtual" ? "Virtual Hardware" : environment === "physical" ? "Physical Hardware" : environment;
}

function CompactFallback({
  title,
  message,
  onRetry,
  onResetState,
  isResetting,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onResetState: () => void;
  isResetting: boolean;
}) {
  return (
    <section className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-[24px] border border-rose-400/18 bg-[linear-gradient(180deg,rgba(33,11,19,0.98)_0%,rgba(15,9,16,0.98)_100%)] px-5 py-6 text-center shadow-[0_24px_60px_-42px_rgba(0,0,0,1)]">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/12 text-rose-100">
        <AlertTriangle size={20} />
      </span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-rose-50/72">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1]"
        >
          <RefreshCcw size={13} />
          Reload component
        </button>
        <button
          type="button"
          onClick={onResetState}
          disabled={isResetting}
          className="inline-flex items-center gap-2 rounded-[12px] border border-rose-300/20 bg-rose-400/12 px-3 py-2 text-xs font-semibold text-rose-50 transition-colors hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RotateCcw size={13} />
          {isResetting ? "Resetting..." : "Reset state"}
        </button>
      </div>
    </section>
  );
}

function FullFallback({
  title,
  description,
  error,
  componentStack,
  zoneContext,
  onRetry,
  onResetState,
  isResetting,
}: {
  title: string;
  description: string;
  error: NormalizedBoundaryError;
  componentStack: string;
  zoneContext: ErrorBoundaryContextValue;
  onRetry: () => void;
  onResetState: () => void;
  isResetting: boolean;
}) {
  return (
    <section className="flex h-full min-h-[280px] w-full flex-col justify-center rounded-[28px] border border-rose-400/18 bg-[linear-gradient(180deg,rgba(30,11,19,0.98)_0%,rgba(13,10,17,0.98)_100%)] px-6 py-7 shadow-[0_28px_70px_-48px_rgba(0,0,0,1)]">
      <div className="flex flex-wrap items-start gap-4">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-rose-300/18 bg-rose-400/12 text-rose-100">
          <AlertTriangle size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200/70">IDE recovery</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-50/72">{description}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-100/55">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Board: {zoneContext.board}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Mode: {zoneContext.mode}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Environment: {zoneContext.environment}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">File: {zoneContext.activeFile}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
            >
              <RefreshCcw size={15} />
              Reload component
            </button>
            <button
              type="button"
              onClick={onResetState}
              disabled={isResetting}
              className="inline-flex items-center gap-2 rounded-[14px] border border-rose-300/20 bg-rose-400/12 px-4 py-2.5 text-sm font-semibold text-rose-50 transition-colors hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RotateCcw size={15} />
              {isResetting ? "Resetting..." : "Reset state"}
            </button>
          </div>
        </div>
      </div>

      <details className="mt-6 rounded-[18px] border border-white/10 bg-black/20">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white">
          Show technical details
        </summary>
        <div className="space-y-4 border-t border-white/10 px-4 py-4 text-xs text-rose-50/72">
          <div>
            <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Message</p>
            <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
              {error.message}
            </pre>
          </div>
          {error.eventType ? (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Event type</p>
              <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
                {error.eventType}
              </pre>
            </div>
          ) : null}
          {error.targetUrl ? (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Target URL</p>
              <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
                {error.targetUrl}
              </pre>
            </div>
          ) : null}
          {error.cause ? (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Cause</p>
              <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
                {error.cause}
              </pre>
            </div>
          ) : null}
          {error.rawValue ? (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Raw value</p>
              <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
                {error.rawValue}
              </pre>
            </div>
          ) : null}
          {error.stack ? (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Stack trace</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
                {error.stack}
              </pre>
            </div>
          ) : null}
          {componentStack ? (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">Component stack</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
                {componentStack}
              </pre>
            </div>
          ) : null}
          <div>
            <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-rose-100/60">IDE context</p>
            <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-white/8 bg-black/25 p-3 font-mono">
              {JSON.stringify(zoneContext, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </section>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    componentStack: "",
    retryNonce: 0,
    isResetting: false,
  };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return {
      error: normalizeBoundaryError(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    reportIdeBoundaryError({
      zone: this.props.zoneContext.zone,
      context: this.props.zoneContext,
      error,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({ componentStack: info.componentStack || "" });
  }

  private resetBoundary = () => {
    this.setState((previousState) => ({
      error: null,
      componentStack: "",
      retryNonce: previousState.retryNonce + 1,
      isResetting: false,
    }));
  };

  private handleResetState = async () => {
    if (!this.props.onResetState) {
      this.resetBoundary();
      return;
    }

    this.setState({ isResetting: true });

    try {
      await this.props.onResetState();
    } catch (resetError) {
      reportIdeResetError(this.props.zoneContext.zone, this.props.zoneContext, resetError);
    } finally {
      this.resetBoundary();
    }
  };

  render() {
    const {
      title = `${this.props.zoneContext.zone} hit a problem`,
      description = "This section of the IDE crashed, but the rest of your project is still open. You can reload just this component or reset its local state.",
      compact = false,
      children,
      zoneContext,
    } = this.props;
    const { error, componentStack, retryNonce, isResetting } = this.state;

    if (error) {
      const fallbackMessage =
        error.message && error.message !== "[object Object]"
          ? error.message
          : "We caught an unexpected runtime error and isolated it to this part of the IDE.";

      if (compact) {
        return (
          <CompactFallback
            title={title}
            message={fallbackMessage}
            onRetry={this.resetBoundary}
            onResetState={this.handleResetState}
            isResetting={isResetting}
          />
        );
      }

      return (
        <FullFallback
          title={title}
          description={description}
          error={error}
          componentStack={componentStack}
          zoneContext={zoneContext}
          onRetry={this.resetBoundary}
          onResetState={this.handleResetState}
          isResetting={isResetting}
        />
      );
    }

    return <React.Fragment key={retryNonce}>{children}</React.Fragment>;
  }
}

export function IDEErrorBoundary({
  zone,
  title,
  description,
  compact = false,
  onResetState,
  children,
}: {
  zone: string;
  title?: string;
  description?: string;
  compact?: boolean;
  onResetState?: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentBoard, codingMode, environment } = useBoard();
  const { projectId, projectName } = useProject();
  const activeFileName = useEditorStore((state) => {
    const activeFile = state.files.find((file) => file.id === state.activeFileId);
    return activeFile?.name ?? "No file selected";
  });

  return (
    <ErrorBoundary
      title={title}
      description={description}
      compact={compact}
      onResetState={onResetState}
      zoneContext={{
        zone,
        board: currentBoard,
        mode: formatModeLabel(codingMode),
        environment: formatEnvironmentLabel(environment),
        activeFile: activeFileName,
        projectId: projectId ?? "scratch",
        projectName: projectName.trim() || "Untitled Project",
        route: pathname,
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

