import { describe, it, expect } from 'vitest';
import { toCSV, fromCSV } from './csv';

describe('csv', () => {
  it('escapes and round-trips rows', () => {
    const rows = [
      { name: 'Jane, Doe', note: 'line1\nline2', status: 'Sent' },
      { name: 'Bob "B"', note: '', status: 'Replied' },
    ];
    const csv = toCSV(rows, ['name', 'note', 'status']);
    const parsed = fromCSV(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Jane, Doe');
    expect(parsed[0].note).toBe('line1\nline2');
    expect(parsed[1].name).toBe('Bob "B"');
    expect(parsed[1].status).toBe('Replied');
  });

  it('handles empty input', () => {
    expect(fromCSV('')).toEqual([]);
  });
});
