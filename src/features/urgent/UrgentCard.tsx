import { useMemo, useState } from 'react';
import { Flame, Plus, Archive, Check } from 'lucide-react';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Input, EmptyState } from '@/components/ui';
import { Countdown } from '@/components/Countdown';
import { InlineEdit } from '@/components/InlineEdit';
import { isOverdue } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { ModuleCardProps } from '../types';

export function UrgentCard(props: ModuleCardProps) {
  const items = useCollection('urgent');
  const { add, update } = useStore();
  const [draft, setDraft] = useState('');

  const active = useMemo(
    () => [...items].filter((i) => !i.archived && !i.done).sort((a, b) => a.order - b.order),
    [items],
  );

  const quickAdd = () => {
    if (!draft.trim()) return;
    add('urgent', { title: draft.trim(), done: false } as never);
    setDraft('');
  };

  return (
    <DashboardCard
      {...props}
      title="Urgent"
      icon={<Flame size={16} />}
      accent="danger"
      count={active.length}
    >
      <div className="space-y-1.5">
        {active.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-xl border bg-danger/5 px-3 py-2',
              isOverdue(item.deadline) ? 'border-danger/40' : 'border-danger/20',
            )}
          >
            <div className="flex items-start gap-2">
              <InlineEdit
                value={item.title}
                onChange={(title) => update('urgent', item.id, { title })}
                className="flex-1 text-sm font-medium"
              />
              <button
                onClick={() => update('urgent', item.id, { done: true })}
                className="text-muted hover:text-success"
                aria-label="Complete"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => update('urgent', item.id, { archived: true })}
                className="text-muted hover:text-fg"
                aria-label="Archive"
              >
                <Archive size={14} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <input
                type="datetime-local"
                value={item.deadline ? item.deadline.slice(0, 16) : ''}
                onChange={(e) =>
                  update('urgent', item.id, {
                    deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                className="bg-transparent text-xs text-muted focus:outline-none"
                aria-label="Deadline"
              />
              <Countdown deadline={item.deadline} />
            </div>
          </div>
        ))}
      </div>

      {active.length === 0 && (
        <EmptyState icon={<Flame size={22} />} title="Nothing urgent" hint="You're all caught up." />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          quickAdd();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <Plus size={15} className="text-muted" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add urgent item…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>
    </DashboardCard>
  );
}
