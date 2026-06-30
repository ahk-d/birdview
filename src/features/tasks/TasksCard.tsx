import { useMemo, useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import type { Task } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { SortableList } from '@/components/SortableList';
import { Input, ProgressBar, EmptyState, Badge } from '@/components/ui';
import { Tag } from '@/components/ui';
import { dueLabel, isOverdue } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { ModuleCardProps } from '../types';
import { TaskDetail } from './TaskDetail';

const priorityColor: Record<Task['priority'], string> = {
  low: 'bg-muted/40',
  medium: 'bg-warning',
  high: 'bg-danger',
};

export function TasksCard(props: ModuleCardProps) {
  const tasks = useCollection('tasks');
  const { add, update, reorder } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const sorted = useMemo(
    () => [...tasks].filter((t) => !t.archived).sort((a, b) => a.order - b.order),
    [tasks],
  );
  const active = sorted.filter((t) => !t.done);
  const progress = sorted.length ? (sorted.filter((t) => t.done).length / sorted.length) * 100 : 0;

  const quickAdd = () => {
    if (!draft.trim()) return;
    add('tasks', {
      title: draft.trim(),
      done: false,
      priority: 'medium',
      labels: [],
      checklist: [],
    } as never);
    setDraft('');
  };

  const openTask = openId ? tasks.find((t) => t.id === openId) : null;

  return (
    <DashboardCard
      {...props}
      title="Today's Tasks"
      icon={<CheckSquare size={16} />}
      count={active.length}
    >
      {sorted.length > 0 && <ProgressBar value={progress} className="mb-3" />}

      <div className="space-y-0.5">
        <SortableList
          items={sorted}
          onReorder={(ids) => reorder('tasks', ids)}
          renderItem={(task, handle) => (
            <div
              className={cn(
                'group/task flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface-2',
                task.done && 'opacity-55',
              )}
            >
              <span className="opacity-0 group-hover/task:opacity-100">{handle}</span>
              <button
                onClick={() => update('tasks', task.id, { done: !task.done })}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border',
                  task.done ? 'border-accent bg-accent text-accent-fg' : 'border-border',
                )}
                aria-label={task.done ? 'Mark incomplete' : 'Complete task'}
              >
                {task.done && <CheckSquare size={11} />}
              </button>
              <span className={cn('h-2 w-2 shrink-0 rounded-full', priorityColor[task.priority])} />
              <button
                onClick={() => setOpenId(task.id)}
                className={cn(
                  'flex-1 truncate text-left text-sm',
                  task.done && 'line-through',
                )}
              >
                {task.title}
              </button>
              {task.dueDate && (
                <Badge tone={isOverdue(task.dueDate) && !task.done ? 'danger' : 'neutral'}>
                  {dueLabel(task.dueDate)}
                </Badge>
              )}
              {task.tags.slice(0, 1).map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
          )}
        />
      </div>

      {sorted.length === 0 && (
        <EmptyState
          icon={<CheckSquare size={22} />}
          title="No tasks yet"
          hint="Add your first task below or press N."
        />
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
          placeholder="Quick add task…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>

      {openTask && <TaskDetail task={openTask} onClose={() => setOpenId(null)} />}
    </DashboardCard>
  );
}
