import { useMemo, useState } from 'react';
import { Youtube, Plus, Star, Check, Archive, ExternalLink } from 'lucide-react';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Input, EmptyState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { youtubeThumb } from './youtube';
import type { ModuleCardProps } from '../types';

export function YouTubeCard(props: ModuleCardProps) {
  const videos = useCollection('youtube');
  const { add, update } = useStore();
  const [url, setUrl] = useState('');

  const sorted = useMemo(
    () => [...videos].filter((v) => !v.archived).sort((a, b) => a.order - b.order),
    [videos],
  );

  const quickAdd = () => {
    const value = url.trim();
    if (!value) return;
    add('youtube', {
      title: value,
      url: value,
      watched: false,
      favorite: false,
      thumbnail: youtubeThumb(value),
    } as never);
    setUrl('');
  };

  return (
    <DashboardCard {...props} title="YouTube" icon={<Youtube size={16} />} count={sorted.length}>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((v) => (
          <div
            key={v.id}
            className={cn(
              'group/v overflow-hidden rounded-xl border border-border bg-surface-2/40',
              v.watched && 'opacity-60',
            )}
          >
            <div className="relative aspect-video bg-surface-2">
              {v.thumbnail ? (
                <img src={v.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <Youtube size={20} />
                </div>
              )}
              <a
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/v:opacity-100"
                aria-label="Open video"
              >
                <ExternalLink size={18} className="text-white" />
              </a>
            </div>
            <div className="p-1.5">
              <p className="line-clamp-2 text-[11px] font-medium leading-tight">{v.title}</p>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => update('youtube', v.id, { favorite: !v.favorite })}
                  className={v.favorite ? 'text-warning' : 'text-muted hover:text-warning'}
                  aria-label="Favorite"
                >
                  <Star size={13} fill={v.favorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => update('youtube', v.id, { watched: !v.watched })}
                  className={v.watched ? 'text-success' : 'text-muted hover:text-success'}
                  aria-label="Mark watched"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => update('youtube', v.id, { archived: true })}
                  className="ml-auto text-muted hover:text-fg"
                  aria-label="Archive"
                >
                  <Archive size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Youtube size={22} />} title="No videos" hint="Paste a YouTube link to save it." />
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
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>
    </DashboardCard>
  );
}
