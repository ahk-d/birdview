import { useMemo, useState } from 'react';
import { Linkedin, Plus, Trash2 } from 'lucide-react';
import { LINKEDIN_STATUSES, type LinkedInPost, type LinkedInStatus } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Modal } from '@/components/Modal';
import { Input, Textarea, EmptyState, Button } from '@/components/ui';
import { splitHashtags } from '@/utils/tags';
import { formatDate } from '@/utils/date';
import type { ModuleCardProps } from '../types';

const STATUS_TONE: Record<LinkedInStatus, string> = {
  Idea: 'bg-muted/20 text-muted',
  Draft: 'bg-warning/15 text-warning',
  Ready: 'bg-accent/15 text-accent',
  Published: 'bg-success/15 text-success',
};

export function LinkedInPostsCard(props: ModuleCardProps) {
  const posts = useCollection('linkedinPosts');
  const { add, update } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const sorted = useMemo(
    () => [...posts].filter((p) => !p.archived).sort((a, b) => a.order - b.order),
    [posts],
  );

  const quickAdd = () => {
    if (!title.trim()) return;
    add('linkedinPosts', { title: title.trim(), hashtags: [], status: 'Idea' } as never);
    setTitle('');
  };

  const open = openId ? posts.find((p) => p.id === openId) : null;

  return (
    <DashboardCard {...props} title="LinkedIn Posts" icon={<Linkedin size={16} />} count={sorted.length}>
      <div className="space-y-1">
        {sorted.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface-2">
            <button onClick={() => setOpenId(p.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{p.title}</span>
              {p.publishDate && (
                <span className="block text-[11px] text-muted">{formatDate(p.publishDate)}</span>
              )}
            </button>
            <select
              value={p.status}
              onChange={(e) => update('linkedinPosts', p.id, { status: e.target.value as LinkedInStatus })}
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium focus:outline-none ${STATUS_TONE[p.status]}`}
              aria-label="Status"
            >
              {LINKEDIN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Linkedin size={22} />} title="No posts planned" hint="Add a post idea." />
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add post idea…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>

      {open && <PostDetail post={open} onClose={() => setOpenId(null)} />}
    </DashboardCard>
  );
}

function PostDetail({ post, onClose }: { post: LinkedInPost; onClose: () => void }) {
  const { update, remove } = useStore();
  const set = (patch: Partial<LinkedInPost>) => update('linkedinPosts', post.id, patch);
  return (
    <Modal
      open
      onClose={onClose}
      title="LinkedIn post"
      size="md"
      footer={
        <Button
          variant="danger"
          onClick={() => {
            remove('linkedinPosts', post.id);
            onClose();
          }}
        >
          <Trash2 size={14} /> Delete
        </Button>
      }
    >
      <div className="space-y-3">
        <Input value={post.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" />
        <Textarea
          value={post.content ?? ''}
          onChange={(e) => set({ content: e.target.value })}
          placeholder="Post content…"
          className="min-h-[120px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input value={post.topic ?? ''} onChange={(e) => set({ topic: e.target.value })} placeholder="Topic" />
          <Input value={post.cta ?? ''} onChange={(e) => set({ cta: e.target.value })} placeholder="Call to action" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">
            Publish date
            <Input
              type="date"
              value={post.publishDate?.slice(0, 10) ?? ''}
              onChange={(e) =>
                set({ publishDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className="mt-1"
            />
          </label>
          <label className="text-xs text-muted">
            Status
            <select
              value={post.status}
              onChange={(e) => set({ status: e.target.value as LinkedInStatus })}
              className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              {LINKEDIN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs text-muted">
          Hashtags
          <Input
            defaultValue={post.hashtags.join(' ')}
            onBlur={(e) => set({ hashtags: splitHashtags(e.target.value) })}
            placeholder="#buildinpublic"
            className="mt-1"
          />
        </label>
      </div>
    </Modal>
  );
}
