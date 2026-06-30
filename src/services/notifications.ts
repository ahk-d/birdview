import type { Database } from '@/types';

export interface DueNotice {
  key: string;
  title: string;
  body: string;
  when: number;
}

/**
 * Collect items whose reminder/deadline/follow-up falls within [now - lookbehind, now + window].
 * Pure + side-effect free so it can be unit-tested; the background worker fires the results.
 */
export function collectDue(db: Database, now = Date.now(), windowMs = 60_000): DueNotice[] {
  const out: DueNotice[] = [];
  const within = (iso?: string) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= now - windowMs && t <= now + windowMs;
  };

  db.tasks.forEach((t) => {
    if (!t.done && within(t.reminderAt))
      out.push({ key: `task:${t.id}`, title: 'Task reminder', body: t.title, when: new Date(t.reminderAt!).getTime() });
  });
  db.urgent.forEach((u) => {
    if (!u.done && within(u.deadline))
      out.push({ key: `urgent:${u.id}`, title: '🔥 Urgent due', body: u.title, when: new Date(u.deadline!).getTime() });
  });
  db.recurring.forEach((r) => {
    if (within(r.nextDue))
      out.push({ key: `rec:${r.id}:${r.nextDue}`, title: 'Recurring task', body: r.title, when: new Date(r.nextDue).getTime() });
  });
  db.jobs.forEach((j) => {
    if (within(j.followUpAt))
      out.push({ key: `job:${j.id}`, title: 'Follow up', body: `${j.company} — ${j.role}`, when: new Date(j.followUpAt!).getTime() });
  });
  db.instagramPosts.forEach((p) => {
    if (within(p.reminderAt))
      out.push({ key: `ig:${p.id}`, title: 'Publish reminder', body: p.title, when: new Date(p.reminderAt!).getTime() });
  });
  db.calendar.forEach((e) => {
    if (within(e.start))
      out.push({ key: `cal:${e.id}`, title: 'Event', body: e.title, when: new Date(e.start).getTime() });
  });

  return out;
}
