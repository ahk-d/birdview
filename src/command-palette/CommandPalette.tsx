import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  Search,
  CheckSquare,
  FolderKanban,
  Briefcase,
  Flame,
  Moon,
  Settings as SettingsIcon,
  Download,
  Package,
  FileText,
  Eye,
  CornerDownLeft,
} from 'lucide-react';
import type { ModuleKey } from '@/types';
import { useStore } from '@/services/store';
import { useUI, focusModule } from '@/services/ui';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { searchDatabase, type SearchHit } from '@/services/search';
import { runExport } from '@/services/export';
import { toast } from '@/components/Toast';
import { cn } from '@/utils/cn';
import { MODULE_ORDER } from '@/storage/schema';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  hint?: string;
  run: () => void;
}

export function CommandPalette({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { paletteOpen, setPalette } = useUI();
  const { db, add, setSettings } = useStore();
  const { cycle } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 120);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCommandMode = query.startsWith('>');
  const commandQuery = isCommandMode ? query.slice(1).trim().toLowerCase() : '';

  const close = () => {
    setPalette(false);
    setQuery('');
  };

  const commands: Command[] = useMemo(
    () => [
      { id: 'new-task', label: 'New task', icon: <CheckSquare size={16} />, run: () => { add('tasks', { title: 'New task', done: false, priority: 'medium', labels: [], checklist: [] } as never); focusModule('tasks'); } },
      { id: 'new-project', label: 'New project', icon: <FolderKanban size={16} />, run: () => { add('projects', { title: 'New project', column: 'backlog', subtasks: [], links: [], attachments: [] } as never); focusModule('projects'); } },
      { id: 'new-job', label: 'New job', icon: <Briefcase size={16} />, run: () => { add('jobs', { company: 'New company', role: '', status: 'Saved' } as never); focusModule('jobs'); } },
      { id: 'new-urgent', label: 'New urgent item', icon: <Flame size={16} />, run: () => { add('urgent', { title: 'Urgent', done: false } as never); focusModule('urgent'); } },
      { id: 'theme', label: 'Toggle theme', icon: <Moon size={16} />, run: () => cycle() },
      { id: 'settings', label: 'Open settings', icon: <SettingsIcon size={16} />, run: () => onOpenSettings() },
      { id: 'export-json', label: 'Export workspace (JSON)', icon: <Download size={16} />, run: () => { void runExport('json', db); toast.success('Exported JSON'); } },
      { id: 'export-zip', label: 'Export ZIP backup (with images)', icon: <Package size={16} />, run: () => { void runExport('zip', db); toast.success('Building ZIP backup…'); } },
      { id: 'export-notion', label: 'Export to Notion', icon: <FileText size={16} />, run: () => { void runExport('notion', db); toast.success('Exported for Notion'); } },
      { id: 'show-all', label: 'Show all hidden cards', icon: <Eye size={16} />, run: () => setSettings({ layout: db.settings.layout.map((l) => ({ ...l, hidden: false })) }) },
    ],
    [add, cycle, db, onOpenSettings, setSettings],
  );

  const filteredCommands = useMemo(
    () => (isCommandMode ? commands.filter((c) => c.label.toLowerCase().includes(commandQuery)) : []),
    [commands, commandQuery, isCommandMode],
  );

  const hits: SearchHit[] = useMemo(
    () => (isCommandMode ? [] : searchDatabase(db, debounced, 14)),
    [db, debounced, isCommandMode],
  );

  const total = isCommandMode ? filteredCommands.length : hits.length;

  useEffect(() => setActiveIndex(0), [query]);
  useEffect(() => {
    if (paletteOpen) setTimeout(() => inputRef.current?.focus(), 30);
  }, [paletteOpen]);

  const runActive = () => {
    if (isCommandMode) {
      filteredCommands[activeIndex]?.run();
      close();
    } else {
      const hit = hits[activeIndex];
      if (hit) {
        focusModule(hit.module as ModuleKey);
        close();
      }
    }
  };

  return (
    <Transition show={paletteOpen} as={Fragment} afterLeave={() => setQuery('')}>
      <Dialog onClose={close} className="relative z-[90]">
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-start justify-center p-4 pt-[12vh]">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search size={17} className="text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveIndex((i) => Math.min(i + 1, total - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveIndex((i) => Math.max(i - 1, 0));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      runActive();
                    }
                  }}
                  placeholder="Search everything…  (type > for commands)"
                  className="h-13 flex-1 bg-transparent py-3.5 text-sm text-fg placeholder:text-muted focus:outline-none"
                  aria-label="Search or run a command"
                />
                <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted">esc</kbd>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-1.5">
                {isCommandMode ? (
                  filteredCommands.length === 0 ? (
                    <Empty label="No commands" />
                  ) : (
                    filteredCommands.map((c, i) => (
                      <Row key={c.id} active={i === activeIndex} onClick={() => { c.run(); close(); }} onHover={() => setActiveIndex(i)} icon={c.icon} title={c.label} />
                    ))
                  )
                ) : hits.length === 0 ? (
                  <Empty label={query ? 'No results' : 'Type to search across all modules'} />
                ) : (
                  hits.map((h, i) => (
                    <Row key={`${h.module}:${h.id}`} active={i === activeIndex} onClick={() => { focusModule(h.module as ModuleKey); close(); }} onHover={() => setActiveIndex(i)} icon={<span className="text-[10px] font-semibold uppercase text-muted">{h.moduleLabel.slice(0, 2)}</span>} title={h.title} subtitle={h.moduleLabel} />
                  ))
                )}
              </div>

              <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted">
                <span className="flex items-center gap-1"><CornerDownLeft size={11} /> open</span>
                <span>↑↓ navigate</span>
                <span>› commands</span>
                <span className="ml-auto">{MODULE_ORDER.length} modules</span>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function Row({
  active,
  onClick,
  onHover,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  onHover: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      onClick={onClick}
      onMouseMove={onHover}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
        active ? 'bg-accent/12 text-fg' : 'text-fg/90',
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center text-accent">{icon}</span>
      <span className="flex-1 truncate text-sm">{title}</span>
      {subtitle && <span className="text-[11px] text-muted">{subtitle}</span>}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="px-3 py-8 text-center text-sm text-muted">{label}</p>;
}
