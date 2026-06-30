import { describe, it, expect } from 'vitest';
import { emptyDatabase, migrate, DB_VERSION, defaultLayout } from './schema';

describe('schema', () => {
  it('produces a complete empty database', () => {
    const db = emptyDatabase();
    expect(db.__version).toBe(DB_VERSION);
    expect(db.tasks).toEqual([]);
    expect(db.settings.layout.length).toBeGreaterThan(0);
  });

  it('migrate heals partial / corrupt payloads', () => {
    const db = migrate({ tasks: 'not-an-array', settings: { theme: 'dark' } });
    expect(Array.isArray(db.tasks)).toBe(true);
    expect(db.settings.theme).toBe('dark');
    expect(db.settings.layout.length).toBe(defaultLayout().length);
    expect(db.__version).toBe(DB_VERSION);
  });

  it('migrate handles non-object input', () => {
    expect(migrate(null).tasks).toEqual([]);
    expect(migrate('garbage').jobs).toEqual([]);
  });
});
