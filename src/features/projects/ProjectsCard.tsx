import { useMemo, useState } from 'react';
import { FolderKanban, Plus, LayoutGrid } from 'lucide-react';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { ProgressBar, EmptyState, Badge, Button } from '@/components/ui';
import { dueLabel } from '@/utils/date';
import type { ModuleCardProps } from '../types';
import { ProjectDetail } from './ProjectDetail';
import { KanbanBoard } from './KanbanBoard';

const COLUMN_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  'in-progress': 'In progress',
  review: 'Review',
  done: 'Done',
};

export function ProjectsCard(props: ModuleCardProps) {
  const projects = useCollection('projects');
  const add = useStore((s) => s.add);
  const [openId, setOpenId] = useState<string | null>(null);
  const [board, setBoard] = useState(false);

  const sorted = useMemo(
    () => [...projects].filter((p) => !p.archived).sort((a, b) => a.order - b.order),
    [projects],
  );

  const openProject = openId ? projects.find((p) => p.id === openId) : null;

  return (
    <DashboardCard
      {...props}
      title="Projects"
      icon={<FolderKanban size={16} />}
      count={sorted.length}
      headerAction={
        <button
          onClick={() => setBoard(true)}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Open board"
          title="Open Kanban board"
        >
          <LayoutGrid size={15} />
        </button>
      }
    >
      <div className="space-y-2">
        {sorted.slice(0, 6).map((p) => {
          const progress = p.subtasks.length
            ? (p.subtasks.filter((s) => s.done).length / p.subtasks.length) * 100
            : p.column === 'done'
              ? 100
              : 0;
          return (
            <button
              key={p.id}
              onClick={() => setOpenId(p.id)}
              className="block w-full rounded-xl border border-border bg-surface-2/40 p-2.5 text-left hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{p.title}</span>
                <Badge tone="accent">{COLUMN_LABEL[p.column]}</Badge>
              </div>
              <ProgressBar value={progress} className="mt-2" />
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                <span>
                  {p.subtasks.filter((s) => s.done).length}/{p.subtasks.length} subtasks
                </span>
                {p.dueDate && <span>· {dueLabel(p.dueDate)}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <EmptyState
          icon={<FolderKanban size={22} />}
          title="No projects"
          hint="Create a project to track progress."
          action={
            <Button
              size="sm"
              variant="subtle"
              onClick={() =>
                add('projects', {
                  title: 'New project',
                  column: 'backlog',
                  subtasks: [],
                  links: [],
                  attachments: [],
                } as never)
              }
            >
              <Plus size={14} /> New project
            </Button>
          }
        />
      )}

      {sorted.length > 0 && (
        <button
          onClick={() =>
            add('projects', {
              title: 'New project',
              column: 'backlog',
              subtasks: [],
              links: [],
              attachments: [],
            } as never)
          }
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-muted hover:text-accent"
        >
          <Plus size={15} /> New project
        </button>
      )}

      {openProject && <ProjectDetail project={openProject} onClose={() => setOpenId(null)} />}
      {board && <KanbanBoard onClose={() => setBoard(false)} onOpenProject={(id) => setOpenId(id)} />}
    </DashboardCard>
  );
}
