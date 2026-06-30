import { useMemo, useState } from 'react';
import { Repeat, Plus, Check, Flame } from 'lucide-react';
import type { RecurrenceUnit } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { completeOccurrence, recurrenceLabel, advance } from '@/services/recurring';
import { DashboardCard } from '@/components/DashboardCard';
import { Input, EmptyState, Badge } from '@/components/ui';
import { InlineEdit } from '@/components/InlineEdit';
import { dueLabel } from '@/utils/date';
import { toast } from '@/components/Toast';
import type { ModuleCardProps } from '../types';

export function RecurringCard(props: ModuleCardProps) {
  const items = useCollection('recurring');
  const { add, update } = useStore();
  const [draft, setDraft] = useState('');

  const sorted = useMemo(
    () => [...items].filter((i) => !i.archived).sort((a, b) => a.order - b.order),
    [items],
  );

  const quickAdd = () => {
    if (!draft.trim()) return;
    add('recurring', {
      title: draft.trim(),
      unit: 'day' as RecurrenceUnit,
      interval: 1,
      nextDue: advance(new Date().toISOString(), 'day', 1),
      streak: 0,
    } as never);
    setDraft('');
  };

  const complete = (id: string) => {
    const r = items.find((x) => x.id === id);
    if (!r) return;
    update('recurring', id, completeOccurrence(r));
    toast.success(`Nice! Next ${r.title} ${dueLabel(completeOccurrence(r).nextDue)}`);
  };

  return (
    <DashboardCard {...props} title="Recurring" icon={<Repeat size={16} />} count={sorted.length}>
      <div className="space-y-1">
        {sorted.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface-2">
            <button
              onClick={() => complete(r.id)}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted hover:border-success hover:text-success"
              aria-label={`Complete ${r.title}`}
            >
              <Check size={12} />
            </button>
            <div className="min-w-0 flex-1">
              <InlineEdit
                value={r.title}
                onChange={(title) => update('recurring', r.id, { title })}
                className="block truncate text-sm"
              />
              <div className="flex items-center gap-2 px-1.5 text-[11px] text-muted">
                <span>{recurrenceLabel(r)}</span>
                <span>·</span>
                <span>{dueLabel(r.nextDue)}</span>
              </div>
            </div>
            <select
              value={`${r.interval}:${r.unit}`}
              onChange={(e) => {
                const [interval, unit] = e.target.value.split(':');
                update('recurring', r.id, { interval: Number(interval), unit: unit as RecurrenceUnit });
              }}
              className="rounded-md bg-surface-2 px-1 py-0.5 text-[11px] text-muted focus:outline-none"
              aria-label="Frequency"
            >
              <option value="1:day">Daily</option>
              <option value="1:week">Weekly</option>
              <option value="1:month">Monthly</option>
              <option value="2:week">Biweekly</option>
            </select>
            {r.streak > 0 && (
              <Badge tone="warning">
                <Flame size={10} className="mr-0.5" />
                {r.streak}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Repeat size={22} />} title="No habits yet" hint="Add a recurring routine." />
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
          placeholder="Add recurring task…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>
    </DashboardCard>
  );
}
