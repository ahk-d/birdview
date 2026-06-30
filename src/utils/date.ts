import type { ISODate } from '@/types';

const DAY = 86_400_000;

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
}

/** Human-friendly relative due label, e.g. "Today", "Tomorrow", "in 3d", "2d overdue". */
export function dueLabel(date?: ISODate): string {
  if (!date) return '';
  const diff = daysBetween(new Date(), new Date(date));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff <= 7) return `in ${diff}d`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function isOverdue(date?: ISODate): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export function formatDate(date?: ISODate): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date?: ISODate): string {
  if (!date) return '';
  return new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  overdue: boolean;
  total: number;
}

export function countdownTo(date?: ISODate): Countdown {
  const ms = date ? new Date(date).getTime() - Date.now() : 0;
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  return {
    days: Math.floor(abs / DAY),
    hours: Math.floor((abs % DAY) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
    overdue,
    total: ms,
  };
}

export function smartFilterMatch(
  filter: string,
  record: { dueDate?: ISODate; deadline?: ISODate; done?: boolean; archived?: boolean; tags?: string[] },
): boolean {
  const date = record.dueDate ?? record.deadline;
  const diff = date ? daysBetween(new Date(), new Date(date)) : null;
  switch (filter) {
    case 'today':
      return diff === 0;
    case 'tomorrow':
      return diff === 1;
    case 'week':
      return diff !== null && diff >= 0 && diff <= 7;
    case 'overdue':
      return diff !== null && diff < 0 && !record.done;
    case 'completed':
      return !!record.done;
    case 'archived':
      return !!record.archived;
    case 'notags':
      return !record.tags || record.tags.length === 0;
    default:
      return true;
  }
}
