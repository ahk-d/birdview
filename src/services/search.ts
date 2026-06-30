import Fuse from 'fuse.js';
import type { Database, ModuleKey } from '@/types';
import { MODULE_LABELS } from '@/storage/schema';

export interface SearchHit {
  id: string;
  module: ModuleKey;
  moduleLabel: string;
  title: string;
  subtitle?: string;
}

/** Flatten the whole database into a uniform, searchable shape (incl. screenshot OCR text). */
export function buildSearchIndex(db: Database): SearchHit[] {
  const hits: SearchHit[] = [];
  const push = (module: ModuleKey, id: string, title: string, subtitle?: string, extra?: string) =>
    hits.push({
      id,
      module,
      moduleLabel: MODULE_LABELS[module],
      title: `${title}${extra ? ` ${extra}` : ''}`.trim() || '(untitled)',
      subtitle,
    });

  db.tasks.forEach((t) => push('tasks', t.id, t.title, t.notes, t.tags.join(' ')));
  db.urgent.forEach((u) => push('urgent', u.id, u.title, u.notes));
  db.recurring.forEach((r) => push('recurring', r.id, r.title, r.notes));
  db.projects.forEach((p) => push('projects', p.id, p.title, p.description, p.tags.join(' ')));
  db.jobs.forEach((j) => push('jobs', j.id, `${j.company} — ${j.role}`, j.status, j.recruiter));
  db.coldEmails.forEach((c) => push('coldEmails', c.id, c.name, c.company ?? c.email));
  db.youtube.forEach((v) => push('youtube', v.id, v.title, v.channel, v.tags.join(' ')));
  db.instagram.forEach((i) => push('instagram', i.id, i.caption, i.hashtags.join(' ')));
  db.linkedinPosts.forEach((p) => push('linkedinPosts', p.id, p.title, p.topic, p.content));
  db.instagramPosts.forEach((p) => push('instagramPosts', p.id, p.title, p.caption));
  db.screenshots.forEach((s) => push('screenshots', s.id, s.filename, undefined, s.ocrText));
  db.calendar.forEach((e) => push('calendar', e.id, e.title, e.location));

  return hits;
}

export function searchDatabase(db: Database, query: string, limit = 12): SearchHit[] {
  const index = buildSearchIndex(db);
  if (!query.trim()) return index.slice(0, limit);
  const fuse = new Fuse(index, {
    keys: ['title', 'subtitle', 'moduleLabel'],
    threshold: 0.4,
    ignoreLocation: true,
  });
  return fuse.search(query, { limit }).map((r) => r.item);
}
