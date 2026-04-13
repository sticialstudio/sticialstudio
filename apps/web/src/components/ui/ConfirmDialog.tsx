"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { pageTransition } from "./motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger";
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "primary",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onCancel, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: pageTransition }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
          onClick={() => {
            if (!isBusy) {
              onCancel();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="ui-foundation-panel w-full max-w-md overflow-hidden rounded-[28px] p-6 sm:p-7"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: pageTransition }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18, ease: "easeOut" } }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-amber-200 bg-amber-50 text-[var(--ui-color-warning)]">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">{title}</h2>
                <p className="text-sm leading-6 text-[var(--ui-color-text-muted)]">{description}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isBusy}
                className={
                  confirmTone === "danger"
                    ? "border-transparent bg-rose-500 text-white shadow-[0_20px_36px_-24px_rgba(244,63,94,0.55)] hover:bg-rose-600"
                    : undefined
                }
              >
                {isBusy ? "Working..." : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
