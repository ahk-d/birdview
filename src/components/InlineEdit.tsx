import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

/** Click-to-edit text that autosaves on blur / Enter. Esc cancels. */
export function InlineEdit({
  value,
  onChange,
  placeholder = 'Untitled',
  className,
  multiline = false,
  as = 'span',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  as?: 'span' | 'h3';
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) {
      // Focus and select all so the user can immediately type to replace the text.
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onChange(trimmed);
  };

  if (editing) {
    const sharedProps = {
      ref: ref as never,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
      },
      className: cn(
        'w-full rounded-md bg-surface-2 px-1.5 py-0.5 text-sm text-fg focus:outline-none ring-1 ring-accent',
        className,
      ),
    };
    return multiline ? <textarea rows={3} {...sharedProps} /> : <input {...sharedProps} />;
  }

  const Tag = as;
  return (
    <Tag
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setEditing(true);
      }}
      className={cn(
        'cursor-text rounded-md px-1.5 py-0.5 hover:bg-surface-2',
        !value && 'text-muted',
        className,
      )}
    >
      {value || placeholder}
    </Tag>
  );
}
