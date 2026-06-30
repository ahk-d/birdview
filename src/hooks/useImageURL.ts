import { useEffect, useState } from 'react';
import { getImageURL } from '@/storage/images';

/** Resolve an IndexedDB image id to a usable object URL, revoking it on unmount. */
export function useImageURL(id?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let current: string | null = null;
    if (!id) {
      setUrl(null);
      return;
    }
    getImageURL(id).then((u) => {
      if (active) {
        current = u;
        setUrl(u);
      } else if (u) {
        URL.revokeObjectURL(u);
      }
    });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [id]);
  return url;
}
