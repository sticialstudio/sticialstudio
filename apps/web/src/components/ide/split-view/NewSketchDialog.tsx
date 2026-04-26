import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NewSketchDialogProps {
  open: boolean;
  isSavingFirst: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveFirst: () => void;
}

export default function NewSketchDialog({
  open,
  isSavingFirst,
  onCancel,
  onDiscard,
  onSaveFirst,
}: NewSketchDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSavingFirst) {
              onCancel();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="ui-foundation-panel w-full max-w-md overflow-hidden rounded-[28px] p-6 sm:p-7"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-surface-quiet)] text-[var(--ui-color-primary)]">
                <Plus size={18} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">Start a new sketch?</h2>
                <p className="text-sm leading-6 text-[var(--ui-color-text-muted)]">
                  Your current workspace has unsaved changes. Save them first, or start fresh and discard what is in the editor now.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={onSaveFirst} disabled={isSavingFirst}>
                {isSavingFirst ? 'Saving...' : 'Save & Start New Sketch'}
              </Button>
              <Button variant="secondary" onClick={onDiscard} disabled={isSavingFirst}>
                Discard & Start Fresh
              </Button>
              <Button variant="ghost" onClick={onCancel} disabled={isSavingFirst}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

