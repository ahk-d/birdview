import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Upload, Trash2, Download, X, Clipboard } from 'lucide-react';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { EmptyState } from '@/components/ui';
import { saveImageWithThumb, deleteImage, getImage } from '@/storage/images';
import { isExtension } from '@/services/browser';
import { useImageURL } from '@/hooks/useImageURL';
import { downloadBlob } from '@/services/export';
import { toast } from '@/components/Toast';
import { cn } from '@/utils/cn';
import type { ModuleCardProps } from '../types';

export function ScreenshotsCard(props: ModuleCardProps) {
  const shots = useCollection('screenshots');
  const { add, remove } = useStore();
  const [over, setOver] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...shots].filter((s) => !s.archived).sort((a, b) => a.order - b.order),
    [shots],
  );

  const saveFiles = async (files: File[] | FileList) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    for (const file of images) {
      const saved = await saveImageWithThumb(file);
      const now = new Date();
      add('screenshots', {
        filename: file.name || `screenshot-${now.getTime()}.png`,
        imageId: saved.imageId,
        thumbId: saved.thumbId,
        width: saved.width,
        height: saved.height,
        ocrText: '',
      } as never);
    }
    if (images.length) toast.success(`Saved ${images.length} screenshot${images.length > 1 ? 's' : ''}`);
  };

  // Global paste handler so Ctrl/Cmd+V drops a screenshot into the inbox from anywhere.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.some((f) => f.type.startsWith('image/'))) void saveFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = async () => {
    if (!isExtension) {
      toast.info('Tab capture works when running as the installed extension.');
      return;
    }
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab();
      const blob = await (await fetch(dataUrl)).blob();
      await saveFiles([new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' })]);
    } catch (err) {
      toast.error('Could not capture tab');
      console.error(err);
    }
  };

  const removeShot = async (id: string, imageId: string, thumbId: string) => {
    await Promise.all([deleteImage(imageId), deleteImage(thumbId)]);
    remove('screenshots', id);
  };

  const viewer = viewerId ? shots.find((s) => s.id === viewerId) : null;

  return (
    <DashboardCard
      {...props}
      title="Screenshots"
      icon={<Camera size={16} />}
      count={sorted.length}
      headerAction={
        <>
          <button onClick={capture} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Capture tab" title="Capture visible tab">
            <Camera size={14} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Upload" title="Upload images">
            <Upload size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && void saveFiles(e.target.files)}
          />
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void saveFiles(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl border-2 border-dashed p-3 transition-colors',
          over ? 'border-accent bg-accent/5' : 'border-border',
        )}
      >
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Clipboard size={22} />}
            title="Drop or paste screenshots"
            hint="Ctrl/Cmd+V to paste, drag files here, or capture the tab."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {sorted.map((s) => (
              <Thumb
                key={s.id}
                thumbId={s.thumbId}
                onOpen={() => setViewerId(s.id)}
                onDelete={() => removeShot(s.id, s.imageId, s.thumbId)}
              />
            ))}
          </div>
        )}
      </div>

      {viewer && (
        <Viewer
          imageId={viewer.imageId}
          filename={viewer.filename}
          onClose={() => setViewerId(null)}
        />
      )}
    </DashboardCard>
  );
}

function Thumb({
  thumbId,
  onOpen,
  onDelete,
}: {
  thumbId: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const url = useImageURL(thumbId);
  return (
    <div className="group/sc relative aspect-square overflow-hidden rounded-lg bg-surface-2">
      {url && (
        <button onClick={onOpen} className="h-full w-full" aria-label="Open screenshot">
          <img src={url} alt="" className="h-full w-full object-cover" />
        </button>
      )}
      <button
        onClick={onDelete}
        className="absolute right-1 top-1 rounded-md bg-black/55 p-1 text-white opacity-0 transition-opacity group-hover/sc:opacity-100"
        aria-label="Delete screenshot"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function Viewer({
  imageId,
  filename,
  onClose,
}: {
  imageId: string;
  filename: string;
  onClose: () => void;
}) {
  const url = useImageURL(imageId);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const blob = await getImage(imageId);
            if (blob) downloadBlob(filename, blob);
          }}
          className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Download"
        >
          <Download size={18} />
        </button>
        <button onClick={onClose} className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {url && (
        <img
          src={url}
          alt={filename}
          className="max-h-full max-w-full rounded-lg object-contain shadow-pop"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
