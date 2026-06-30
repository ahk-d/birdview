// Thin storage abstraction that works in three environments:
//   1. Extension (Chromium / Firefox) → chrome.storage.local (via webextension-polyfill).
//   2. Plain web app (vite dev / preview) → window.localStorage fallback.
//   3. Tests (jsdom) → localStorage fallback.
//
// Only the small surface Birdview needs (get/set one key) is exposed, keeping the rest of the
// codebase free of `chrome`/`browser` branching.

const STORAGE_KEY = 'birdview:db';

interface KeyValueStore {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
}

function hasExtensionStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.local &&
    typeof chrome.storage.local.get === 'function'
  );
}

const extensionStore: KeyValueStore = {
  async get() {
    const res = await chrome.storage.local.get(STORAGE_KEY);
    return (res?.[STORAGE_KEY] as string | undefined) ?? null;
  },
  async set(value) {
    await chrome.storage.local.set({ [STORAGE_KEY]: value });
  },
};

const localStore: KeyValueStore = {
  async get() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  async set(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Quota / private-mode failures are non-fatal for the in-memory cache.
    }
  },
};

export const kv: KeyValueStore = hasExtensionStorage() ? extensionStore : localStore;

export const isExtension = hasExtensionStorage();

/** Reactively notify other contexts (popup ↔ dashboard ↔ side panel) of DB changes. */
export function onExternalChange(cb: () => void): () => void {
  if (hasExtensionStorage() && chrome.storage.onChanged) {
    const handler = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && STORAGE_KEY in changes) cb();
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
  // Web fallback: cross-tab sync via the storage event.
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
