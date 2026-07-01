import type { Database, ModuleKey, Settings, CardLayout } from '@/types';

export const DB_VERSION = 1;

export const MODULE_ORDER: ModuleKey[] = [
  'tasks',
  'urgent',
  'recurring',
  'projects',
  'jobs',
  'coldEmails',
  'youtube',
  'instagram',
  'linkedinPosts',
  'instagramPosts',
  'screenshots',
  'calendar',
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  tasks: "Today's Tasks",
  urgent: 'Urgent',
  recurring: 'Recurring',
  projects: 'Projects',
  jobs: 'LinkedIn Jobs',
  coldEmails: 'Cold Email',
  youtube: 'YouTube',
  instagram: 'Instagram Ideas',
  linkedinPosts: 'LinkedIn Posts',
  instagramPosts: 'Instagram Posts',
  screenshots: 'Screenshots',
  calendar: 'Calendar',
};

export function defaultLayout(): CardLayout[] {
  return MODULE_ORDER.map((key, order) => ({
    key,
    order,
    collapsed: false,
    hidden: false,
    pinned: false,
  }));
}

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    notificationsEnabled: true,
    backupFrequency: 'weekly',
    exportDefault: 'json',
    layout: defaultLayout(),
    onboarded: false,
  };
}

export function emptyDatabase(): Database {
  return {
    __version: DB_VERSION,
    tasks: [],
    projects: [],
    jobs: [],
    coldEmails: [],
    youtube: [],
    instagram: [],
    linkedinPosts: [],
    instagramPosts: [],
    recurring: [],
    urgent: [],
    screenshots: [],
    calendar: [],
    customCards: [],
    settings: defaultSettings(),
  };
}

/**
 * Migrate a parsed database to the current version + heal missing keys. Runs on every load so a
 * partially-written or older payload always becomes a complete, current Database.
 */
export function migrate(input: unknown): Database {
  const base = emptyDatabase();
  if (!input || typeof input !== 'object') return base;
  const data = input as Partial<Database>;

  const merged: Database = {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    __version: DB_VERSION,
  };

  // Ensure every collection is an array (guards against corrupted/partial payloads).
  (Object.keys(base) as (keyof Database)[]).forEach((key) => {
    if (key === '__version' || key === 'settings') return;
    if (!Array.isArray((merged as any)[key])) (merged as any)[key] = [];
  });

  // Heal the layout so newly-added modules always have an entry.
  const known = new Set(merged.settings.layout.map((l) => l.key));
  MODULE_ORDER.forEach((key, i) => {
    if (!known.has(key)) {
      merged.settings.layout.push({
        key,
        order: merged.settings.layout.length + i,
        collapsed: false,
        hidden: false,
        pinned: false,
      });
    }
  });

  return merged;
}
