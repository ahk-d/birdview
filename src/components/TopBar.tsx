import { useRef } from 'react';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  Undo2,
  Redo2,
  Settings as SettingsIcon,
  Download,
  Upload,
  FileText,
  Package,
  FileJson,
  Table,
} from 'lucide-react';
import { useStore } from '@/services/store';
import { useUI } from '@/services/ui';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './ui';
import { Menu } from './Menu';
import { runExport } from '@/services/export';
import { importFile } from '@/services/import';
import { confirm } from './ConfirmDialog';
import { toast } from './Toast';

export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { db, undo, redo, canUndo, canRedo, importDatabase } = useStore();
  const setPalette = useUI((s) => s.setPalette);
  const { resolved, theme, cycle } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const ThemeIcon = theme === 'system' ? Laptop : resolved === 'dark' ? Moon : Sun;

  const onImport = async (file: File) => {
    if (!(await confirm({ title: 'Import data?', message: 'This replaces your current workspace. Export a backup first if unsure.', confirmLabel: 'Import', danger: true }))) return;
    try {
      const next = await importFile(file);
      importDatabase(next);
      toast.success('Workspace imported');
    } catch (e) {
      toast.error(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-bg/80 px-3 py-2.5 backdrop-blur-md sm:px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-fg font-bold">B</div>
        <span className="hidden text-sm font-semibold sm:block">Birdview</span>
      </div>

      <button
        onClick={() => setPalette(true)}
        className="ml-2 flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted hover:border-accent/40 sm:max-w-md"
        aria-label="Search"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search everything…</span>
        <kbd className="hidden rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] sm:block">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={undo} disabled={!canUndo()} aria-label="Undo" title="Undo">
          <Undo2 size={16} />
        </Button>
        <Button size="icon" variant="ghost" onClick={redo} disabled={!canRedo()} aria-label="Redo" title="Redo">
          <Redo2 size={16} />
        </Button>
        <Button size="icon" variant="ghost" onClick={cycle} aria-label="Toggle theme" title={`Theme: ${theme}`}>
          <ThemeIcon size={16} />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} aria-label="Import" title="Import">
          <Upload size={16} />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.zip"
          hidden
          onChange={(e) => e.target.files?.[0] && void onImport(e.target.files[0])}
        />
        <Button size="icon" variant="ghost" onClick={onOpenSettings} aria-label="Settings" title="Settings">
          <SettingsIcon size={16} />
        </Button>

        {/* Persistent Export menu, always top-right (incl. one-click Notion export). */}
        <Menu
          trigger={
            <Button size="sm" variant="primary" className="ml-1">
              <Download size={15} /> Export
            </Button>
          }
          items={[
            { label: 'Export to Notion', icon: <FileText size={14} />, onClick: () => { void runExport('notion', db); toast.success('Exported for Notion'); } },
            'divider',
            { label: 'JSON', icon: <FileJson size={14} />, onClick: () => { void runExport('json', db); toast.success('Exported JSON'); } },
            { label: 'Markdown', icon: <FileText size={14} />, onClick: () => { void runExport('markdown', db); toast.success('Exported Markdown'); } },
            { label: 'CSV (zip)', icon: <Table size={14} />, onClick: () => { void runExport('csv', db); toast.success('Exported CSV'); } },
            { label: 'ZIP backup (with images)', icon: <Package size={14} />, onClick: () => { void runExport('zip', db); toast.success('Building ZIP backup…'); } },
          ]}
        />
      </div>
    </header>
  );
}
