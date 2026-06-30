import { useEffect, useState } from 'react';
import type { Settings, ThemeMode } from '@/types';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui';
import { useStore, useSettings } from '@/services/store';
import { defaultLayout, MODULE_LABELS } from '@/storage/schema';
import { estimateImageBytes } from '@/storage/images';
import { confirm } from '@/components/ConfirmDialog';
import { toast } from '@/components/Toast';

const SHORTCUTS: [string, string][] = [
  ['⌘/Ctrl + K', 'Search & command palette'],
  ['N', 'New task'],
  ['P', 'New project'],
  ['J', 'New job'],
  ['/', 'Focus search'],
  ['C', 'Quick capture'],
  ['⌘/Ctrl + Z', 'Undo'],
  ['⌘/Ctrl + Shift + Z', 'Redo'],
];

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const setSettings = useStore((s) => s.setSettings);
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    if (open) estimateImageBytes().then(setUsage);
  }, [open]);

  const set = (patch: Partial<Settings>) => setSettings(patch);

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="lg">
      <div className="space-y-6">
        <Section title="Appearance">
          <Field label="Theme">
            <select
              value={settings.theme}
              onChange={(e) => set({ theme: e.target.value as ThemeMode })}
              className="h-9 rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
        </Section>

        <Section title="Reminders & backups">
          <Field label="Notifications">
            <Toggle checked={settings.notificationsEnabled} onChange={(v) => set({ notificationsEnabled: v })} />
          </Field>
          <Field label="Auto-backup">
            <select
              value={settings.backupFrequency}
              onChange={(e) => set({ backupFrequency: e.target.value as Settings['backupFrequency'] })}
              className="h-9 rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label="Default export format">
            <select
              value={settings.exportDefault}
              onChange={(e) => set({ exportDefault: e.target.value as Settings['exportDefault'] })}
              className="h-9 rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="csv">CSV</option>
              <option value="zip">ZIP</option>
            </select>
          </Field>
        </Section>

        <Section title="Calendar">
          <p className="text-xs text-muted">
            Birdview is local-first. Use the calendar card to import / export <code>.ics</code> files
            for Google Calendar, Outlook, and Apple Calendar — no account required.
          </p>
        </Section>

        <Section title="Cards">
          <div className="grid grid-cols-2 gap-1.5">
            {settings.layout.map((l) => (
              <label key={l.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!l.hidden}
                  onChange={(e) =>
                    set({
                      layout: settings.layout.map((x) =>
                        x.key === l.key ? { ...x, hidden: !e.target.checked } : x,
                      ),
                    })
                  }
                  className="accent-[rgb(var(--accent))]"
                />
                {MODULE_LABELS[l.key]}
              </label>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={async () => {
              if (await confirm({ title: 'Reset layout?', message: 'Restore default card order and visibility.' })) {
                set({ layout: defaultLayout() });
                toast.success('Layout reset');
              }
            }}
          >
            Reset layout
          </Button>
        </Section>

        <Section title="Keyboard shortcuts">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted">{desc}</span>
                <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px]">{key}</kbd>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Storage">
          <p className="text-xs text-muted">Image storage (IndexedDB): {bytes(usage)}</p>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-fg">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}
