import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { BaseRecord, CollectionKey, Database, Settings } from '@/types';
import { emptyDatabase } from '@/storage/schema';
import { loadDB, reloadDB, setDB } from '@/storage/db';
import { seedDatabase } from '@/storage/seed';
import { onExternalChange } from '@/services/browser';

// Single source of truth for the whole app. Mutations are synchronous + optimistic: they update the
// in-memory db, persist (debounced) via setDB, and push the previous db onto an undo stack.

const HISTORY_LIMIT = 60;

function clone<T>(v: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(v)
    : (JSON.parse(JSON.stringify(v)) as T);
}

function now(): string {
  return new Date().toISOString();
}

export interface FlowState {
  db: Database;
  hydrated: boolean;
  past: Database[];
  future: Database[];

  hydrate: () => Promise<void>;
  /** Apply an immutable update. `history:false` skips the undo snapshot (e.g. hydration). */
  apply: (updater: (draft: Database) => void, history?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  add: <K extends CollectionKey>(
    key: K,
    record: Omit<Database[K][number], keyof BaseRecord> & Partial<BaseRecord>,
  ) => string;
  update: <K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<Database[K][number]>,
  ) => void;
  remove: <K extends CollectionKey>(key: K, id: string) => void;
  reorder: <K extends CollectionKey>(key: K, ids: string[]) => void;
  setSettings: (patch: Partial<Settings>) => void;
  importDatabase: (db: Database) => void;
}

export const useStore = create<FlowState>((set, get) => ({
  db: emptyDatabase(),
  hydrated: false,
  past: [],
  future: [],

  hydrate: async () => {
    const db = await loadDB();
    // First run: populate friendly demo content so every module is visible.
    if (!db.settings.onboarded) {
      const seeded = clone(db);
      seedDatabase(seeded);
      setDB(seeded);
      set({ db: seeded, hydrated: true });
    } else {
      set({ db, hydrated: true });
    }
    // Keep contexts (popup/dashboard/side panel) in sync.
    onExternalChange(async () => {
      const fresh = await reloadDB();
      set({ db: fresh });
    });
  },

  apply: (updater, history = true) => {
    const prev = get().db;
    const next = clone(prev);
    updater(next);
    setDB(next);
    set((s) => ({
      db: next,
      past: history ? [...s.past, prev].slice(-HISTORY_LIMIT) : s.past,
      future: history ? [] : s.future,
    }));
  },

  undo: () => {
    const { past, db } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setDB(prev);
    set((s) => ({ db: prev, past: s.past.slice(0, -1), future: [db, ...s.future].slice(0, HISTORY_LIMIT) }));
  },

  redo: () => {
    const { future, db } = get();
    if (future.length === 0) return;
    const next = future[0];
    setDB(next);
    set((s) => ({ db: next, future: s.future.slice(1), past: [...s.past, db].slice(-HISTORY_LIMIT) }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  add: (key, record) => {
    const id = record.id ?? nanoid();
    const ts = now();
    const collection = get().db[key] as BaseRecord[];
    const maxOrder = collection.reduce((m, r) => Math.max(m, (r as any).order ?? 0), -1);
    const full = {
      id,
      createdAt: ts,
      updatedAt: ts,
      tags: [],
      ...(record as object),
    } as BaseRecord & { order?: number };
    if (full.order === undefined && collection.length >= 0) (full as any).order = maxOrder + 1;
    get().apply((draft) => {
      (draft[key] as BaseRecord[]).unshift(full);
    });
    return id;
  },

  update: (key, id, patch) => {
    get().apply((draft) => {
      const list = draft[key] as BaseRecord[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) list[idx] = { ...list[idx], ...(patch as object), updatedAt: now() };
    });
  },

  remove: (key, id) => {
    get().apply((draft) => {
      const list = draft[key] as BaseRecord[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) list.splice(idx, 1);
    });
  },

  reorder: (key, ids) => {
    get().apply((draft) => {
      const list = draft[key] as (BaseRecord & { order: number })[];
      const byId = new Map(list.map((r) => [r.id, r]));
      ids.forEach((id, i) => {
        const r = byId.get(id);
        if (r) r.order = i;
      });
      list.sort((a, b) => a.order - b.order);
    });
  },

  setSettings: (patch) => {
    get().apply((draft) => {
      draft.settings = { ...draft.settings, ...patch };
    }, false);
  },

  importDatabase: (db) => {
    get().apply((draft) => {
      Object.assign(draft, db);
    });
  },
}));

// Convenience selector hook for a single collection, kept sorted by `order` when present.
export function useCollection<K extends CollectionKey>(key: K): Database[K] {
  return useStore((s) => s.db[key]);
}

export function useSettings(): Settings {
  return useStore((s) => s.db.settings);
}
