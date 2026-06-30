import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/services/store';
import { useUI, focusModule } from '@/services/ui';
import { useTheme } from '@/hooks/useTheme';
import { useHotkeys } from '@/hooks/useHotkeys';
import { TopBar } from '@/components/TopBar';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CommandPalette } from '@/command-palette/CommandPalette';
import { FAB } from '@/components/FAB';
import { Modal } from '@/components/Modal';
import { QuickCapture } from '@/components/QuickCapture';
import { Toaster } from '@/components/Toast';
import { ConfirmHost } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/ui';
import { SettingsModal } from '@/pages/settings/SettingsModal';

export function Dashboard() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const { add, undo, redo } = useStore();
  const setPalette = useUI((s) => s.setPalette);
  useTheme();

  const [capture, setCapture] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const hotkeys = useMemo(
    () => [
      { combo: 'mod+k', handler: () => setPalette(true), allowInInput: true },
      { combo: '/', handler: () => setPalette(true) },
      { combo: 'c', handler: () => setCapture(true) },
      { combo: 'n', handler: () => { add('tasks', { title: 'New task', done: false, priority: 'medium', labels: [], checklist: [] } as never); focusModule('tasks'); } },
      { combo: 'p', handler: () => { add('projects', { title: 'New project', column: 'backlog', subtasks: [], links: [], attachments: [] } as never); focusModule('projects'); } },
      { combo: 'j', handler: () => { add('jobs', { company: 'New company', role: '', status: 'Saved' } as never); focusModule('jobs'); } },
      { combo: 'mod+z', handler: () => undo(), allowInInput: true },
      { combo: 'mod+shift+z', handler: () => redo(), allowInInput: true },
    ],
    [add, redo, setPalette, undo],
  );
  useHotkeys(hotkeys);

  return (
    <div className="min-h-full bg-bg text-fg">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4">
        {hydrated ? (
          <DashboardLayout />
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mb-4 h-48 w-full" />
            ))}
          </div>
        )}
      </main>

      <FAB onClick={() => setCapture(true)} />

      <Modal open={capture} onClose={() => setCapture(false)} title="Quick capture">
        <QuickCapture onDone={() => setCapture(false)} />
      </Modal>

      <CommandPalette onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ConfirmHost />
      <Toaster />
    </div>
  );
}
