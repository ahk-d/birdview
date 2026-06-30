import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import type { Project, ProjectColumn } from '@/types';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/ui';
import { useStore, useCollection } from '@/services/store';
import { dueLabel } from '@/utils/date';
import { cn } from '@/utils/cn';

const COLUMNS: { key: ProjectColumn; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export function KanbanBoard({
  onClose,
  onOpenProject,
}: {
  onClose: () => void;
  onOpenProject: (id: string) => void;
}) {
  const projects = useCollection('projects');
  const { update, add } = useStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byColumn = useMemo(() => {
    const map: Record<ProjectColumn, Project[]> = {
      backlog: [],
      'in-progress': [],
      review: [],
      done: [],
    };
    projects
      .filter((p) => !p.archived)
      .sort((a, b) => a.order - b.order)
      .forEach((p) => map[p.column].push(p));
    return map;
  }, [projects]);

  const onDragEnd = (e: DragEndEvent) => {
    const col = e.over?.id as ProjectColumn | undefined;
    if (col && COLUMNS.some((c) => c.key === col)) {
      update('projects', e.active.id as string, { column: col });
    }
  };

  return (
    <Modal open onClose={onClose} title="Projects Board" size="xl">
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              column={col.key}
              label={col.label}
              projects={byColumn[col.key]}
              onAdd={() =>
                add('projects', {
                  title: 'New project',
                  column: col.key,
                  subtasks: [],
                  links: [],
                  attachments: [],
                } as never)
              }
              onOpenProject={onOpenProject}
            />
          ))}
        </div>
      </DndContext>
    </Modal>
  );
}

function Column({
  column,
  label,
  projects,
  onAdd,
  onOpenProject,
}: {
  column: ProjectColumn;
  label: string;
  projects: Project[];
  onAdd: () => void;
  onOpenProject: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[200px] flex-col gap-2 rounded-xl border border-border bg-surface-2/50 p-2 transition-colors',
        isOver && 'ring-2 ring-accent',
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted">
          {label} <span className="text-muted/60">{projects.length}</span>
        </span>
        <button onClick={onAdd} className="text-muted hover:text-accent" aria-label={`Add to ${label}`}>
          <Plus size={14} />
        </button>
      </div>
      {projects.map((p) => (
        <KanbanCard key={p.id} project={p} onOpen={() => onOpenProject(p.id)} />
      ))}
    </div>
  );
}

function KanbanCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });
  const done = project.subtasks.filter((s) => s.done).length;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-surface p-2.5 shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-60',
      )}
      {...attributes}
      {...listeners}
    >
      <button onClick={onOpen} className="block w-full text-left text-sm font-medium text-fg">
        {project.title}
      </button>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {project.subtasks.length > 0 && (
          <Badge>
            {done}/{project.subtasks.length}
          </Badge>
        )}
        {project.dueDate && <Badge tone="accent">{dueLabel(project.dueDate)}</Badge>}
        {project.tags.slice(0, 2).map((t) => (
          <Badge key={t}>#{t}</Badge>
        ))}
      </div>
    </div>
  );
}
