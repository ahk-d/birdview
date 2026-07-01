import { useMemo, useState } from 'react';
import { Link2, Plus, ExternalLink, Pencil, Trash2, Check } from 'lucide-react';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Input, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { parseLinkInput } from '@/utils/url';
import type { ModuleCardProps } from '../types';

/**
 * Quick Links — paste any URL (or "Label | https://…") and it becomes a saved, clickable link.
 * Bare domains like "github.com" get https:// added automatically.
 */
export function LinksCard(props: ModuleCardProps) {
  const links = useCollection('links');
  const { add, update, remove } = useStore();
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const sorted = useMemo(() => [...links].sort((a, b) => a.order - b.order), [links]);

  const quickAdd = () => {
    const parsed = parseLinkInput(input);
    if (!parsed) {
      toast.error('Enter a valid link, e.g. github.com or https://…');
      return;
    }
    add('links', { title: parsed.label, url: parsed.url } as never);
    setInput('');
  };

  const commitEdit = (id: string) => {
    update('links', id, { title: draft.trim() || 'Link' });
    setEditingId(null);
  };

  return (
    <DashboardCard {...props} title="Quick Links" icon={<Link2 size={16} />} count={sorted.length}>
      <div className="space-y-0.5">
        {sorted.map((l) => (
          <div
            key={l.id}
            className="group/l flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface-2"
          >
            <Link2 size={14} className="shrink-0 text-muted" />
            {editingId === l.id ? (
              <>
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitEdit(l.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(l.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-7 flex-1"
                  aria-label="Link label"
                />
                <button
                  onClick={() => commitEdit(l.id)}
                  className="text-muted hover:text-success"
                  aria-label="Save label"
                >
                  <Check size={14} />
                </button>
              </>
            ) : (
              <>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  title={l.url}
                  className="flex-1 truncate text-sm font-medium text-accent hover:underline"
                >
                  {l.title}
                </a>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted opacity-0 transition-opacity hover:text-fg group-hover/l:opacity-100"
                  aria-label="Open link"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => {
                    setEditingId(l.id);
                    setDraft(l.title);
                  }}
                  className="text-muted opacity-0 transition-opacity hover:text-fg group-hover/l:opacity-100"
                  aria-label="Edit label"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => remove('links', l.id)}
                  className="text-muted opacity-0 transition-opacity hover:text-danger group-hover/l:opacity-100"
                  aria-label="Delete link"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState
          icon={<Link2 size={22} />}
          title="No links yet"
          hint="Paste a URL to save a quick link."
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          quickAdd();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <Plus size={15} className="text-muted" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a link…  (or 'Label | https://…')"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
          aria-label="Add a quick link"
        />
      </form>
    </DashboardCard>
  );
}
