"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Flame, MoonStar, RotateCcw, Settings2, Sparkles, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pageTransition } from "@/components/ui/motion";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ThemeMode } from "@/contexts/ThemeContext";

interface PreferencesDialogProps {
  open: boolean;
  theme: ThemeMode;
  autoSave: boolean;
  showAdvancedBlocks: boolean;
  onClose: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onAutoSaveChange: (value: boolean) => void;
  onShowAdvancedBlocksChange: (value: boolean) => void;
  onResetApp: () => void;
}

type PreferenceToggleProps = {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
};

const themeOptions: Array<{
  id: ThemeMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  {
    id: "light",
    label: "Light",
    description: "Clean canvas and lighter editor surfaces.",
    icon: SunMedium,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Cool contrast for longer coding sessions.",
    icon: MoonStar,
  },
  {
    id: "magma",
    label: "Magma",
    description: "Warm amber accents with a focused studio feel.",
    icon: Flame,
  },
];

function PreferenceToggle({ title, description, enabled, onToggle }: PreferenceToggleProps) {
  return (
    <div className="ui-foundation-panel-quiet flex items-center justify-between gap-4 rounded-[22px] px-4 py-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--ui-color-text)]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--ui-color-text-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-150 ${
          enabled
            ? "border-[color:var(--ui-color-primary)]/25 bg-[color:var(--ui-color-primary)]"
            : "border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)]"
        }`}
      >
        <span
          className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--ui-color-primary)] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)] transition-transform duration-150 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        >
          <Sparkles size={12} />
        </span>
      </button>
    </div>
  );
}

export default function PreferencesDialog({
  open,
  theme,
  autoSave,
  showAdvancedBlocks,
  onClose,
  onThemeChange,
  onAutoSaveChange,
  onShowAdvancedBlocksChange,
  onResetApp,
}: PreferencesDialogProps) {
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setConfirmResetOpen(false);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (confirmResetOpen) {
          setConfirmResetOpen(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmResetOpen, onClose, open]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[210] flex justify-end bg-slate-950/28 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: pageTransition }}
            exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
            onClick={onClose}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Preferences"
              className="ui-foundation-panel flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-none border-l border-[color:var(--ui-border-soft)] px-5 py-5 sm:px-6"
              initial={{ x: 36, opacity: 0.82 }}
              animate={{ x: 0, opacity: 1, transition: pageTransition }}
              exit={{ x: 28, opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[color:var(--ui-border-soft)] pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">
                    <Settings2 size={13} />
                    Preferences
                  </div>
                  <h2 className="mt-4 text-[1.65rem] font-semibold tracking-[-0.04em] text-[var(--ui-color-text)]">Studio controls</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--ui-color-text-muted)]">
                    Tune how the IDE behaves without leaving the workspace. Changes apply immediately.
                  </p>
                </div>
                <Button variant="ghost" onClick={onClose} className="min-h-10 rounded-[16px] px-3 text-sm">
                  Close
                </Button>
              </div>

              <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
                <section>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">Theme</h3>
                    <p className="mt-1 text-sm text-[var(--ui-color-text-muted)]">Preview the editor and Blockly workspace in one click.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = option.id === theme;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onThemeChange(option.id)}
                          className={`text-left transition-all ${
                            isActive
                              ? "ui-foundation-panel rounded-[24px] border-[color:var(--ui-color-primary)]/28 shadow-[0_28px_60px_-44px_rgba(24,39,75,0.35)]"
                              : "ui-foundation-panel-quiet rounded-[24px] hover:border-[color:var(--ui-border-strong)]"
                          } px-4 py-4`}
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-elevated)] text-[var(--ui-color-primary)]">
                            <Icon size={16} />
                          </span>
                          <div className="mt-4 text-sm font-semibold text-[var(--ui-color-text)]">{option.label}</div>
                          <div className="mt-1 text-xs leading-5 text-[var(--ui-color-text-muted)]">{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">Workflow</h3>
                    <p className="mt-1 text-sm text-[var(--ui-color-text-muted)]">Control save behavior and how much of the toolbox is exposed.</p>
                  </div>
                  <PreferenceToggle
                    title="Auto Save"
                    description="Save project changes in the background after edits settle. Manual save still works anytime."
                    enabled={autoSave}
                    onToggle={onAutoSaveChange}
                  />
                  <PreferenceToggle
                    title="Advanced Blocks"
                    description="Keep Messaging and Color visible. Turn this off for a simpler starter toolbox."
                    enabled={showAdvancedBlocks}
                    onToggle={onShowAdvancedBlocksChange}
                  />
                </section>

                <section className="ui-foundation-panel-quiet rounded-[26px] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-rose-200 bg-rose-50 text-rose-500">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--ui-color-text)]">Reset app state</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ui-color-text-muted)]">
                        Clear saved theme, board selection, active project memory, and the in-memory circuit workspace for a fresh start.
                      </p>
                      <Button
                        variant="secondary"
                        icon={<RotateCcw size={15} />}
                        onClick={() => setConfirmResetOpen(true)}
                        className="mt-4 min-h-10 rounded-[16px] border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 hover:border-rose-300 hover:bg-rose-100"
                      >
                        Reset App
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset the IDE state?"
        description="This clears local preferences, the remembered project and board context, and the current circuit workspace. Saved cloud projects are not deleted."
        confirmLabel="Reset app"
        confirmTone="danger"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false);
          onResetApp();
        }}
      />
    </>
  );
}
