import type { Recurring, RecurrenceUnit } from '@/types';

/** Advance an ISO date by N units. */
export function advance(date: string, unit: RecurrenceUnit, interval: number): string {
  const d = new Date(date);
  if (unit === 'day') d.setDate(d.getDate() + interval);
  else if (unit === 'week') d.setDate(d.getDate() + interval * 7);
  else d.setMonth(d.getMonth() + interval);
  return d.toISOString();
}

/** Compute the next state after completing a recurring task: bump nextDue, streak, lastCompleted. */
export function completeOccurrence(r: Recurring): Partial<Recurring> {
  // Roll forward from now so a long-overdue item lands on the next future occurrence.
  let next = advance(r.nextDue, r.unit, r.interval);
  const nowMs = Date.now();
  while (new Date(next).getTime() < nowMs) {
    next = advance(next, r.unit, r.interval);
  }
  return {
    nextDue: next,
    lastCompleted: new Date().toISOString(),
    streak: (r.streak ?? 0) + 1,
  };
}

export function recurrenceLabel(r: Recurring): string {
  const unit = r.interval === 1 ? r.unit : `${r.interval} ${r.unit}s`;
  return r.interval === 1 ? `Every ${unit}` : `Every ${unit}`;
}
