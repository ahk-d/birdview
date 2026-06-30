import { useState } from 'react';
import { CheckSquare, StickyNote, Briefcase, Youtube, FolderKanban, Flame, Camera } from 'lucide-react';
import { useStore } from '@/services/store';
import { Button, Input, Textarea } from './ui';
import { youtubeThumb } from '@/features/youtube/youtube';
import { saveImageWithThumb } from '@/storage/images';
import { parseTags } from '@/utils/tags';
import { toast } from './Toast';
import { cn } from '@/utils/cn';

type CaptureType = 'task' | 'urgent' | 'note' | 'job' | 'youtube' | 'project' | 'screenshot';

const TYPES: { key: CaptureType; label: string; icon: React.ReactNode }[] = [
  { key: 'task', label: 'Task', icon: <CheckSquare size={15} /> },
  { key: 'urgent', label: 'Urgent', icon: <Flame size={15} /> },
  { key: 'note', label: 'Note', icon: <StickyNote size={15} /> },
  { key: 'job', label: 'Job', icon: <Briefcase size={15} /> },
  { key: 'youtube', label: 'Video', icon: <Youtube size={15} /> },
  { key: 'project', label: 'Project', icon: <FolderKanban size={15} /> },
  { key: 'screenshot', label: 'Image', icon: <Camera size={15} /> },
];

/** Compact capture form used in the toolbar popup and the dashboard FAB. */
export function QuickCapture({ onDone, autoFocus = true }: { onDone?: () => void; autoFocus?: boolean }) {
  const add = useStore((s) => s.add);
  const [type, setType] = useState<CaptureType>('task');
  const [value, setValue] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text && type !== 'screenshot') return;
    const tags = parseTags(text);

    switch (type) {
      case 'task':
        add('tasks', { title: text, done: false, priority: 'medium', labels: [], checklist: [], tags } as never);
        break;
      case 'urgent':
        add('urgent', { title: text, done: false, tags } as never);
        break;
      case 'note':
        add('tasks', { title: text, notes: text, done: false, priority: 'low', labels: ['note'], checklist: [], tags } as never);
        break;
      case 'job':
        add('jobs', { company: text, role: '', status: 'Saved', tags } as never);
        break;
      case 'youtube':
        add('youtube', { title: text, url: text, watched: false, favorite: false, thumbnail: youtubeThumb(text), tags } as never);
        break;
      case 'project':
        add('projects', { title: text, column: 'backlog', subtasks: [], links: [], attachments: [], tags } as never);
        break;
      case 'screenshot':
        toast.info('Paste an image (Ctrl/Cmd+V) on the dashboard to capture.');
        break;
    }
    toast.success(`Added ${type}`);
    setValue('');
    onDone?.();
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    if (type !== 'screenshot') return;
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const saved = await saveImageWithThumb(file);
    add('screenshots', {
      filename: file.name || `capture-${Date.now()}.png`,
      imageId: saved.imageId,
      thumbId: saved.thumbId,
      width: saved.width,
      height: saved.height,
      ocrText: '',
    } as never);
    toast.success('Screenshot saved');
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="flex flex-wrap gap-1">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
              type === t.key ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-muted hover:text-fg',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {type === 'note' ? (
        <Textarea autoFocus={autoFocus} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a note… #tags" />
      ) : type === 'screenshot' ? (
        <div onPaste={onPaste} className="rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">
          Press Ctrl/Cmd+V to paste an image
        </div>
      ) : (
        <Input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            type === 'youtube'
              ? 'Paste a YouTube URL…'
              : type === 'job'
                ? 'Company name…'
                : `New ${type}… #tags`
          }
        />
      )}

      <Button type="submit" variant="primary" className="w-full justify-center">
        Add {type}
      </Button>
    </form>
  );
}
