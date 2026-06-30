import JSZip from 'jszip';
import type { Database } from '@/types';
import { migrate } from '@/storage/schema';
import { putImage } from '@/storage/images';

/** Parse a JSON backup string into a complete, migrated Database. */
export function importJSON(text: string): Database {
  return migrate(JSON.parse(text));
}

/**
 * Restore a ZIP backup produced by exportZipBackup: reads birdview.json and re-inserts every image
 * blob under its original id so record references resolve again.
 */
export async function importZipBackup(file: File | Blob): Promise<Database> {
  const zip = await JSZip.loadAsync(file);
  const jsonEntry = zip.file('birdview.json');
  if (!jsonEntry) throw new Error('Not a Birdview backup (birdview.json missing)');
  const db = migrate(JSON.parse(await jsonEntry.async('string')));

  const imageFiles = zip.folder('images');
  if (imageFiles) {
    const entries: Promise<void>[] = [];
    imageFiles.forEach((relativePath, entry) => {
      if (entry.dir) return;
      entries.push(
        entry.async('blob').then(async (blob) => {
          // Preserve the original id by putting directly into the store.
          await putImageWithId(relativePath, blob);
        }),
      );
    });
    await Promise.all(entries);
  }
  return db;
}

// importZipBackup needs to keep ids stable; putImage generates new ones, so write directly.
async function putImageWithId(id: string, blob: Blob): Promise<void> {
  const { openDB } = await import('idb');
  const d = await openDB('birdview-images', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('images')) {
        database.createObjectStore('images', { keyPath: 'id' });
      }
    },
  });
  await d.put('images', { id, blob, createdAt: new Date().toISOString() });
}

export { putImage };

/** Detect file type and import; returns the new Database to merge/replace. */
export async function importFile(file: File): Promise<Database> {
  if (file.name.endsWith('.zip')) return importZipBackup(file);
  return importJSON(await file.text());
}
