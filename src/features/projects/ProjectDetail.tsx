import { nanoid } from 'nanoid';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import type { Project, ProjectColumn } from '@/types';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea, ProgressBar } from '@/components/ui';
import { TagInput } from '@/components/TagInput';
import { ImageDrop } from '@/features/screenshots/ImageDrop';
import { useStore } from '@/services/store';

const COLUMNS: { key: ProjectColumn; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const update = useStore((s) => s.update);
  const set = (patch: Partial<Project>) => update('projects', project.id, patch);
  const progress = project.subtasks.length
    ? (project.subtasks.filter((s) => s.done).length / project.subtasks.length) * 100
    : project.column === 'done'
      ? 100
      : 0;

  return (
    <Modal open onClose={onClose} title="Project" size="lg">
      <div className="space-y-4">
        <Input value={project.title} onChange={(e) => set({ title: e.target.value })} placeholder="Project title" />
        <Textarea
          value={project.description ?? ''}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Description…"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">
            Status
            <select
              value={project.column}
              onChange={(e) => set({ column: e.target.value as ProjectColumn })}
              className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              {COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Due date
            <Input
              type="date"
              value={project.dueDate?.slice(0, 10) ?? ''}
              onChange={(e) =>
                set({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className="mt-1"
            />
          </label>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Subtasks</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} className="mb-2" />
          <div className="space-y-1">
            {project.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() =>
                    set({
                      subtasks: project.subtasks.map((x) =>
                        x.id === s.id ? { ...x, done: !x.done } : x,
                      ),
                    })
                  }
                  className="h-4 w-4 accent-[rgb(var(--accent))]"
                />
                <span className={s.done ? 'flex-1 text-sm text-muted line-through' : 'flex-1 text-sm'}>
                  {s.text}
                </span>
                <button
                  onClick={() => set({ subtasks: project.subtasks.filter((x) => x.id !== s.id) })}
                  className="text-muted hover:text-danger"
                  aria-label="Remove subtask"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <AddRow
            placeholder="Add subtask…"
            onAdd={(text) => set({ subtasks: [...project.subtasks, { id: nanoid(), text, done: false }] })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Links</p>
          <div className="space-y-1">
            {project.links.map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <ExternalLink size={13} className="text-muted" />
                <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-accent hover:underline">
                  {l.label || l.url}
                </a>
                <button
                  onClick={() => set({ links: project.links.filter((x) => x.id !== l.id) })}
                  className="text-muted hover:text-danger"
                  aria-label="Remove link"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <AddRow
            placeholder="Paste a URL…"
            onAdd={(url) => set({ links: [...project.links, { id: nanoid(), label: '', url }] })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Attachments</p>
          <ImageDrop
            ids={project.attachments}
            onChange={(attachments) => set({ attachments })}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Tags</p>
          <TagInput tags={project.tags} onChange={(tags) => set({ tags })} />
        </div>
      </div>
    </Modal>
  );
}

export function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('row') as HTMLInputElement;
        if (input.value.trim()) onAdd(input.value.trim());
        input.value = '';
      }}
      className="mt-2 flex gap-2"
    >
      <Input name="row" placeholder={placeholder} className="h-8" />
      <Button type="submit" size="sm" variant="subtle">
        <Plus size={14} />
      </Button>
    </form>
  );
}
