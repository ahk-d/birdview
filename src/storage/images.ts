import { openDB, type IDBPDatabase } from 'idb';
import { nanoid } from 'nanoid';

// Binary blobs (screenshots, attachments, inspiration images) live in IndexedDB rather than the
// JSON db, keeping the JSON small and fast. Records reference blobs by id.

const DB_NAME = 'birdview-images';
const STORE = 'images';
const THUMB_MAX = 320;

interface StoredImage {
  id: string;
  blob: Blob;
  createdAt: string;
}

let dbp: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbp) {
    dbp = openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbp;
}

export async function putImage(blob: Blob): Promise<string> {
  const id = nanoid();
  const d = await db();
  await d.put(STORE, { id, blob, createdAt: new Date().toISOString() } satisfies StoredImage);
  return id;
}

export async function getImage(id: string): Promise<Blob | null> {
  const d = await db();
  const rec = (await d.get(STORE, id)) as StoredImage | undefined;
  return rec?.blob ?? null;
}

/** Resolve an image id to an object URL (caller revokes when done). */
export async function getImageURL(id: string): Promise<string | null> {
  const blob = await getImage(id);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteImage(id: string): Promise<void> {
  const d = await db();
  await d.delete(STORE, id);
}

/** Generate a downscaled JPEG thumbnail from a source blob. */
export async function makeThumbnail(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, THUMB_MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', 0.78);
  });
}

export interface SavedImage {
  imageId: string;
  thumbId: string;
  width: number;
  height: number;
}

/** Persist a full image + its thumbnail, returning both ids and dimensions. */
export async function saveImageWithThumb(blob: Blob): Promise<SavedImage> {
  const bitmap = await createImageBitmap(blob).catch(() => null);
  const width = bitmap?.width ?? 0;
  const height = bitmap?.height ?? 0;
  bitmap?.close();
  const thumb = await makeThumbnail(blob).catch(() => blob);
  const [imageId, thumbId] = await Promise.all([putImage(blob), putImage(thumb)]);
  return { imageId, thumbId, width, height };
}

/**
 * OCR hook — intentionally a no-op in v1. Wire a lazy-loaded Tesseract.js/WASM worker here to fill
 * `screenshot.ocrText`; the rest of the app (search) already reads that field.
 */
export async function runOcr(_imageId: string): Promise<string> {
  return '';
}

export async function estimateImageBytes(): Promise<number> {
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate();
    return est.usage ?? 0;
  }
  return 0;
}
