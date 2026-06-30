import { useMemo, useState } from 'react';
import { Instagram, Plus, Trash2 } from 'lucide-react';
import type { InstagramIdea } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Modal } from '@/components/Modal';
import { Input, Textarea, EmptyState, Badge, Button } from '@/components/ui';
import { ImageDrop } from '@/features/screenshots/ImageDrop';
import { splitHashtags } from '@/utils/tags';
import type { ModuleCardProps } from '../types';

export function InstagramIdeasCard(props: ModuleCardProps) {
  const ideas = useCollection('instagram');
  const { add } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const sorted = useMemo(
    () => [...ideas].filter((i) => !i.archived).sort((a, b) => a.order - b.order),
    [ideas],
  );

  const quickAdd = () => {
    if (!draft.trim()) return;
    add('instagram', { caption: draft.trim(), hashtags: [], images: [], draft: true } as never);
    setDraft('');
  };

  const open = openId ? ideas.find((i) => i.id === openId) : null;

  return (
    <DashboardCard {...props} title="Instagram Ideas" icon={<Instagram size={16} />} count={sorted.length}>
      <div className="space-y-1.5">
        {sorted.map((idea) => (
          <button
            key={idea.id}
            onClick={() => setOpenId(idea.id)}
            className="block w-full rounded-xl border border-border bg-surface-2/40 p-2.5 text-left hover:border-accent/40"
          >
            <p className="line-clamp-2 text-sm">{idea.caption || 'Untitled idea'}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {idea.draft && <Badge tone="warning">Draft</Badge>}
              {idea.images.length > 0 && <Badge tone="accent">{idea.images.length} img</Badge>}
              {idea.hashtags.slice(0, 3).map((h) => (
                <Badge key={h}>{h}</Badge>
              ))}
            </div>
          </button>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Instagram size={22} />} title="No ideas yet" hint="Capture a content idea." />
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Quick capture idea…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>

      {open && <IdeaDetail idea={open} onClose={() => setOpenId(null)} />}
    </DashboardCard>
  );
}

function IdeaDetail({ idea, onClose }: { idea: InstagramIdea; onClose: () => void }) {
  const { update, remove } = useStore();
  const set = (patch: Partial<InstagramIdea>) => update('instagram', idea.id, patch);
  return (
    <Modal
      open
      onClose={onClose}
      title="Instagram idea"
      footer={
        <Button
          variant="danger"
          onClick={() => {
            remove('instagram', idea.id);
            onClose();
          }}
        >
          <Trash2 size={14} /> Delete
        </Button>
      }
    >
      <div className="space-y-3">
        <Textarea value={idea.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption…" />
        <label className="block text-xs text-muted">
          Hashtags
          <Input
            defaultValue={idea.hashtags.join(' ')}
            onBlur={(e) => set({ hashtags: splitHashtags(e.target.value) })}
            placeholder="#design #ux"
            className="mt-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={idea.draft} onChange={(e) => set({ draft: e.target.checked })} className="accent-[rgb(var(--accent))]" />
          Mark as draft
        </label>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Inspiration images</p>
          <ImageDrop ids={idea.images} onChange={(images) => set({ images })} />
        </div>
      </div>
    </Modal>
  );
}
