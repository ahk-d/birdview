import type { Database } from '@/types';
import { kv } from '@/services/browser';
import { emptyDatabase, migrate } from './schema';

// JSON database abstraction over a single key/value slot. Reads parse + migrate (so corrupted or
// older payloads recover gracefully); writes are debounced so rapid mutations coalesce into one
// background persist.

let cache: Database | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: Database | null = null;
const WRITE_DEBOUNCE_MS = 250;

/** Load the database (cached after first read). Always returns a complete, migrated Database. */
export async function loadDB(): Promise<Database> {
  if (cache) return cache;
  const raw = await kv.get();
  if (!raw) {
    cache = emptyDatabase();
    return cache;
  }
  try {
    cache = migrate(JSON.parse(raw));
  } catch {
    // Corrupted JSON — keep a copy for recovery, then fall back to a clean db.
    try {
      await kv.set(JSON.stringify({ __corruptBackup: raw, at: new Date().toISOString() }));
    } catch {
      /* best effort */
    }
    cache = emptyDatabase();
  }
  return cache;
}

/** Snapshot of the in-memory cache (loads first if needed). */
export function peekDB(): Database | null {
  return cache;
}

function flush(): Promise<void> {
  if (!pending) return Promise.resolve();
  const payload = JSON.stringify(pending);
  pending = null;
  return kv.set(payload);
}

/** Replace the whole database and schedule a debounced write. */
export function setDB(next: Database): void {
  cache = next;
  pending = next;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    void flush();
  }, WRITE_DEBOUNCE_MS);
}

/** Force an immediate persist (used before export / on unload). */
export async function flushDB(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  await flush();
}

/** Replace the cache from an external change (e.g. another extension context wrote). */
export async function reloadDB(): Promise<Database> {
  cache = null;
  return loadDB();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => void flushDB());
}
