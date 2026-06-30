import { nanoid } from 'nanoid';
import { Trash2, Plus } from 'lucide-react';
import type { Task, ChecklistItem, Priority } from '@/types';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea } from '@/components/ui';
import { TagInput } from '@/components/TagInput';
import { useStore } from '@/services/store';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const update = useStore((s) => s.update);
  const set = (patch: Partial<Task>) => update('tasks', task.id, patch);

  const toggleItem = (item: ChecklistItem) =>
    set({ checklist: task.checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)) });

  const addItem = (text: string) => {
    if (!text.trim()) return;
    set({ checklist: [...task.checklist, { id: nanoid(), text: text.trim(), done: false }] });
  };

  return (
    <Modal open onClose={onClose} title="Task" size="md">
      <div className="space-y-4">
        <Input value={task.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">
            Priority
            <select
              value={task.priority}
              onChange={(e) => set({ priority: e.target.value as Priority })}
              className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm capitalize text-fg"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Due date
            <Input
              type="date"
              value={task.dueDate?.slice(0, 10) ?? ''}
              onChange={(e) =>
                set({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className="mt-1"
            />
          </label>
        </div>

        <label className="block text-xs text-muted">
          Reminder
          <Input
            type="datetime-local"
            value={task.reminderAt ? task.reminderAt.slice(0, 16) : ''}
            onChange={(e) =>
              set({ reminderAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
            className="mt-1"
          />
        </label>

        <Textarea
          value={task.notes ?? ''}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Notes…"
        />

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Checklist</p>
          <div className="space-y-1">
            {task.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleItem(item)}
                  className="h-4 w-4 accent-[rgb(var(--accent))]"
                />
                <span className={item.done ? 'flex-1 text-sm text-muted line-through' : 'flex-1 text-sm'}>
                  {item.text}
                </span>
                <button
                  onClick={() => set({ checklist: task.checklist.filter((c) => c.id !== item.id) })}
                  className="text-muted hover:text-danger"
                  aria-label="Remove checklist item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <ChecklistAdd onAdd={addItem} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Tags</p>
          <TagInput tags={task.tags} onChange={(tags) => set({ tags })} />
        </div>
      </div>
    </Modal>
  );
}

function ChecklistAdd({ onAdd }: { onAdd: (text: string) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input = (e.currentTarget.elements.namedItem('ci') as HTMLInputElement);
        onAdd(input.value);
        input.value = '';
      }}
      className="mt-2 flex gap-2"
    >
      <Input name="ci" placeholder="Add checklist item…" className="h-8" />
      <Button type="submit" size="sm" variant="subtle">
        <Plus size={14} />
      </Button>
    </form>
  );
}
