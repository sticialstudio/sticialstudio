"use client";

import React, { useState } from "react";
import { BotMessageSquare, Sparkles, SendHorizontal, Lock } from "lucide-react";

const SUGGESTIONS = [
  "Explain what setup() and loop() do",
  "How do I blink an LED on pin 13?",
  "What does Serial.begin(9600) do?",
  "How do I read a button press?",
];

export default function AiChatPanel() {
  const [input, setInput] = useState("");

  return (
    <div className="flex h-full flex-col overflow-hidden bg-transparent text-[var(--ui-color-text)]">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[color:var(--ui-border-soft)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[color:var(--ui-color-primary)]/24 bg-[color:var(--ui-color-primary)]/12 text-[var(--ui-color-primary)]">
            <BotMessageSquare size={15} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
              AI Assistant
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-elevated)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]">
          <Lock size={10} />
          Coming soon
        </span>
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-[color:var(--ui-border-soft)] px-4 py-4">
        <div className="rounded-[16px] border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-elevated)] p-3 shadow-[0_20px_36px_-30px_rgba(15,23,42,0.55)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-color-primary)]/24 bg-[color:var(--ui-color-primary)]/12 text-[var(--ui-color-primary)]">
              <Sparkles size={12} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--ui-color-text)]">
                Sticial AI is almost here
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--ui-color-text-muted)]">
                Your coding assistant will explain code, clarify Arduino concepts, and help debug projects in real time.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ui-color-text-soft)]">
          Try asking...
        </p>
        <div className="flex flex-col gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-[10px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] px-3 py-2 text-left text-[11px] text-[var(--ui-color-text-muted)] transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] text-[var(--ui-color-primary)]">
            <BotMessageSquare size={26} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ui-color-text-soft)]">
            No messages yet
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[color:var(--ui-border-soft)] px-4 py-3">
        <div className="flex items-center gap-2 rounded-[12px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] px-3 py-2">
          <input
            disabled
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask AI about your code..."
            className="flex-1 bg-transparent text-xs text-[var(--ui-color-text-soft)] outline-none placeholder:text-[var(--ui-color-text-soft)] disabled:opacity-100"
          />
          <button disabled type="button" className="flex-shrink-0 cursor-not-allowed text-[var(--ui-color-text-soft)]/70">
            <SendHorizontal size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
