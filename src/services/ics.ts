import { nanoid } from 'nanoid';
import type { CalendarEvent } from '@/types';

// RFC 5545 subset: enough to round-trip simple events with Google Calendar / Outlook / Apple.

function toICSDate(iso: string, allDay?: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }
  return d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

function escape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Birdview//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const e of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.id}@birdview`);
    lines.push(`DTSTAMP:${toICSDate(new Date().toISOString())}`);
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${toICSDate(e.start, true)}`);
    } else {
      lines.push(`DTSTART:${toICSDate(e.start)}`);
      if (e.end) lines.push(`DTEND:${toICSDate(e.end)}`);
    }
    lines.push(`SUMMARY:${escape(e.title)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.notes) lines.push(`DESCRIPTION:${escape(e.notes)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function parseICSDate(value: string): { iso: string; allDay: boolean } {
  // Forms: 20240131T090000Z, 20240131T090000, 20240131 (date only)
  const dateOnly = /^\d{8}$/.test(value);
  if (dateOnly) {
    const y = +value.slice(0, 4);
    const m = +value.slice(4, 6) - 1;
    const d = +value.slice(6, 8);
    return { iso: new Date(y, m, d).toISOString(), allDay: true };
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return { iso: new Date().toISOString(), allDay: false };
  const [, y, mo, d, h, mi, s, z] = m;
  const date = z
    ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
    : new Date(+y, +mo - 1, +d, +h, +mi, +s);
  return { iso: date.toISOString(), allDay: false };
}

function unescape(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

export function parseICS(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  // Unfold continuation lines (lines beginning with a space).
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);
  const ts = new Date().toISOString();
  for (const block of blocks) {
    const body = block.split('END:VEVENT')[0];
    const get = (key: string) => {
      const m = body.match(new RegExp(`^${key}[^:]*:(.*)$`, 'm'));
      return m ? m[1].trim() : undefined;
    };
    const startRaw = get('DTSTART');
    if (!startRaw) continue;
    const start = parseICSDate(startRaw);
    const endRaw = get('DTEND');
    events.push({
      id: nanoid(),
      title: unescape(get('SUMMARY') ?? 'Untitled event'),
      start: start.iso,
      end: endRaw ? parseICSDate(endRaw).iso : undefined,
      allDay: start.allDay,
      location: get('LOCATION') ? unescape(get('LOCATION')!) : undefined,
      notes: get('DESCRIPTION') ? unescape(get('DESCRIPTION')!) : undefined,
      tags: [],
      createdAt: ts,
      updatedAt: ts,
    });
  }
  return events;
}
