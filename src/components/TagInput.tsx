import { useState } from 'react';
import { Tag } from './ui';

/** Edit a list of tags. Type and press Enter/comma to add; backspace on empty removes the last. */
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = () => {
    const clean = input.replace(/^#/, '').trim().toLowerCase();
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setInput('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-2 py-1.5">
      {tags.map((t) => (
        <Tag key={t} label={t} onRemove={() => onChange(tags.filter((x) => x !== t))} />
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !input && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={tags.length ? '' : 'Add tags…'}
        className="min-w-[80px] flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
        aria-label="Add tag"
      />
    </div>
  );
}
