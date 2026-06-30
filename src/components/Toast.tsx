import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, X, Undo2 } from 'lucide-react';
import { nanoid } from 'nanoid';

// Global toast store so any module (or the command palette) can fire a toast without prop drilling.
type ToastTone = 'success' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nanoid();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

// Imperative helpers.
export const toast = {
  success: (message: string, action?: Toast['action']) =>
    useToasts.getState().push({ message, tone: 'success', action }),
  info: (message: string, action?: Toast['action']) =>
    useToasts.getState().push({ message, tone: 'info', action }),
  error: (message: string, action?: Toast['action']) =>
    useToasts.getState().push({ message, tone: 'error', action }),
};

const icons = {
  success: <CheckCircle2 size={16} className="text-success" />,
  info: <Info size={16} className="text-accent" />,
  error: <AlertTriangle size={16} className="text-danger" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-pop"
            role="status"
          >
            {icons[t.tone]}
            <span className="text-sm text-fg">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <Undo2 size={13} /> {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-muted hover:text-fg"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
