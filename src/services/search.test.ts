import { describe, it, expect } from 'vitest';
import { searchDatabase } from './search';
import { emptyDatabase } from '@/storage/schema';
import { collectDue } from './notifications';

function dbWith() {
  const db = emptyDatabase();
  const ts = new Date().toISOString();
  db.tasks.push({ id: 't1', createdAt: ts, updatedAt: ts, tags: ['work'], title: 'Finish quarterly report', done: false, priority: 'high', labels: [], checklist: [], order: 0 });
  db.jobs.push({ id: 'j1', createdAt: ts, updatedAt: ts, tags: [], company: 'Vercel', role: 'Engineer', status: 'Applied', order: 0 });
  return db;
}

describe('search', () => {
  it('finds records fuzzily across modules', () => {
    const db = dbWith();
    expect(searchDatabase(db, 'quartely').some((h) => h.module === 'tasks')).toBe(true);
    expect(searchDatabase(db, 'vercel').some((h) => h.module === 'jobs')).toBe(true);
  });

  it('returns recent items for empty query', () => {
    expect(searchDatabase(dbWith(), '').length).toBeGreaterThan(0);
  });
});

describe('notifications', () => {
  it('collects items due within the window', () => {
    const db = emptyDatabase();
    const soon = new Date(Date.now() + 10_000).toISOString();
    db.urgent.push({ id: 'u1', createdAt: '', updatedAt: '', tags: [], title: 'Ship it', deadline: soon, done: false, order: 0 });
    const due = collectDue(db);
    expect(due.map((d) => d.body)).toContain('Ship it');
  });
});
