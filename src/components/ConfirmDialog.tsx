import { create } from 'zustand';
import { Modal } from './Modal';
import { Button } from './ui';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  opts: ConfirmOptions;
  resolve?: (ok: boolean) => void;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  opts: { title: '' },
  ask: (opts) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, opts, resolve });
    }),
  close: (ok) => {
    get().resolve?.(ok);
    set({ open: false, resolve: undefined });
  },
}));

/** Imperative confirm: `if (await confirm({ title })) { … }`. */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().ask(opts);
}

export function ConfirmHost() {
  const { open, opts, close } = useConfirmStore();
  return (
    <Modal
      open={open}
      onClose={() => close(false)}
      title={opts.title}
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={opts.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {opts.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      {opts.message && <p className="text-sm text-muted">{opts.message}</p>}
    </Modal>
  );
}
