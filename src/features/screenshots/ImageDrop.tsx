import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { saveImageWithThumb, deleteImage } from '@/storage/images';
import { useImageURL } from '@/hooks/useImageURL';
import { cn } from '@/utils/cn';

/** Reusable image attachment widget: click / drop / paste images, stored in IndexedDB by id. */
export function ImageDrop({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const saved = await Promise.all(images.map((f) => saveImageWithThumb(f)));
    onChange([...ids, ...saved.map((s) => s.imageId)]);
  };

  const remove = async (id: string) => {
    await deleteImage(id);
    onChange(ids.filter((x) => x !== id));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void addFiles(e.dataTransfer.files);
      }}
      onPaste={(e) => {
        const files = Array.from(e.clipboardData.files);
        if (files.length) void addFiles(files);
      }}
      className={cn(
        'flex flex-wrap gap-2 rounded-xl border border-dashed p-2 transition-colors',
        over ? 'border-accent bg-accent/5' : 'border-border',
      )}
    >
      {ids.map((id) => (
        <Thumb key={id} id={id} onRemove={() => remove(id)} />
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg bg-surface-2 text-muted hover:text-accent"
        aria-label="Add image"
      >
        <ImagePlus size={18} />
        <span className="text-[10px]">Add</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && void addFiles(e.target.files)}
      />
    </div>
  );
}

function Thumb({ id, onRemove }: { id: string; onRemove: () => void }) {
  const url = useImageURL(id);
  return (
    <div className="group/thumb relative h-16 w-16 overflow-hidden rounded-lg bg-surface-2">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 rounded-md bg-black/50 p-0.5 text-white opacity-0 group-hover/thumb:opacity-100"
        aria-label="Remove image"
      >
        <X size={12} />
      </button>
    </div>
  );
}
