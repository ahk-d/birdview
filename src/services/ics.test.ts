import { describe, it, expect } from 'vitest';
import { generateICS, parseICS } from './ics';
import type { CalendarEvent } from '@/types';

describe('ics', () => {
  const events: CalendarEvent[] = [
    {
      id: 'a',
      createdAt: '',
      updatedAt: '',
      tags: [],
      title: 'Team sync, weekly',
      start: '2026-02-01T14:00:00.000Z',
      end: '2026-02-01T15:00:00.000Z',
      location: 'Zoom',
    },
  ];

  it('round-trips events through ICS', () => {
    const ics = generateICS(events);
    expect(ics).toContain('BEGIN:VEVENT');
    const parsed = parseICS(ics);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Team sync, weekly');
    expect(new Date(parsed[0].start).toISOString()).toBe('2026-02-01T14:00:00.000Z');
    expect(parsed[0].location).toBe('Zoom');
  });

  it('parses all-day DATE values', () => {
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260301\r\nSUMMARY:Holiday\r\nEND:VEVENT\r\nEND:VCALENDAR';
    const parsed = parseICS(ics);
    expect(parsed[0].allDay).toBe(true);
    expect(parsed[0].title).toBe('Holiday');
  });
});
