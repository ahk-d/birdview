import { describe, it, expect } from 'vitest';
import { advance, completeOccurrence } from './recurring';
import type { Recurring } from '@/types';

describe('recurring', () => {
  it('advances by unit', () => {
    const base = '2026-01-01T09:00:00.000Z';
    expect(advance(base, 'day', 1).slice(0, 10)).toBe('2026-01-02');
    expect(advance(base, 'week', 1).slice(0, 10)).toBe('2026-01-08');
    expect(advance(base, 'month', 1).slice(0, 10)).toBe('2026-02-01');
  });

  it('rolls a past due date forward to a future occurrence and bumps streak', () => {
    const r: Recurring = {
      id: '1',
      createdAt: '',
      updatedAt: '',
      tags: [],
      title: 'Exercise',
      unit: 'day',
      interval: 1,
      nextDue: '2000-01-01T09:00:00.000Z',
      streak: 2,
      order: 0,
    };
    const patch = completeOccurrence(r);
    expect(new Date(patch.nextDue!).getTime()).toBeGreaterThan(Date.now());
    expect(patch.streak).toBe(3);
    expect(patch.lastCompleted).toBeTruthy();
  });
});
