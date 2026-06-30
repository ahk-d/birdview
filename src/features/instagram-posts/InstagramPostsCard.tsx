import { useMemo, useState } from 'react';
import { Images, Plus, Trash2 } from 'lucide-react';
import { type InstagramPost, type InstagramPostStatus } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Modal } from '@/components/Modal';
import { Input, Textarea, EmptyState, Badge, Button } from '@/components/ui';
import { ImageDrop } from '@/features/screenshots/ImageDrop';
import { splitHashtags } from '@/utils/tags';
import { formatDate } from '@/utils/date';
import type { ModuleCardProps } from '../types';

const STATUSES: InstagramPostStatus[] = ['Idea', 'Draft', 'Ready', 'Published'];

export function InstagramPostsCard(props: ModuleCardProps) {
  const posts = useCollection('instagramPosts');
  const { add } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const sorted = useMemo(
    () => [...posts].filter((p) => !p.archived).sort((a, b) => a.order - b.order),
    [posts],
  );

  const quickAdd = () => {
    if (!title.trim()) return;
    add('instagramPosts', { title: title.trim(), hashtags: [], images: [], status: 'Idea' } as never);
    setTitle('');
  };

  const open = openId ? posts.find((p) => p.id === openId) : null;

  return (
    <DashboardCard {...props} title="Instagram Posts" icon={<Images size={16} />} count={sorted.length}>
      <div className="space-y-1.5">
        {sorted.map((p) => (
          <button
            key={p.id}
            onClick={() => setOpenId(p.id)}
            className="block w-full rounded-xl border border-border bg-surface-2/40 p-2.5 text-left hover:border-accent/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{p.title}</span>
              <Badge tone={p.status === 'Published' ? 'success' : 'accent'}>{p.status}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
              {p.images.length > 0 && <span>{p.images.length} img carousel</span>}
              {p.publishDate && <span>· {formatDate(p.publishDate)}</span>}
            </div>
          </button>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Images size={22} />} title="No posts planned" hint="Plan a carousel or reel." />
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
          placeholder="Add post…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>

      {open && <PostDetail post={open} onClose={() => setOpenId(null)} />}
    </DashboardCard>
  );
}

function PostDetail({ post, onClose }: { post: InstagramPost; onClose: () => void }) {
  const { update, remove } = useStore();
  const set = (patch: Partial<InstagramPost>) => update('instagramPosts', post.id, patch);
  return (
    <Modal
      open
      onClose={onClose}
      title="Instagram post"
      size="md"
      footer={
        <Button
          variant="danger"
          onClick={() => {
            remove('instagramPosts', post.id);
            onClose();
          }}
        >
          <Trash2 size={14} /> Delete
        </Button>
      }
    >
      <div className="space-y-3">
        <Input value={post.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" />
        <Textarea value={post.caption ?? ''} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption…" />
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Carousel images</p>
          <ImageDrop ids={post.images} onChange={(images) => set({ images })} />
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
              onChange={(e) => set({ status: e.target.value as InstagramPostStatus })}
              className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs text-muted">
          Publish reminder
          <Input
            type="datetime-local"
            value={post.reminderAt ? post.reminderAt.slice(0, 16) : ''}
            onChange={(e) =>
              set({ reminderAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
            className="mt-1"
          />
        </label>
        <label className="block text-xs text-muted">
          Hashtags
          <Input
            defaultValue={post.hashtags.join(' ')}
            onBlur={(e) => set({ hashtags: splitHashtags(e.target.value) })}
            placeholder="#reels #design"
            className="mt-1"
          />
        </label>
      </div>
    </Modal>
  );
}
