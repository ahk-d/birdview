import { type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical, Pin, EyeOff, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Menu } from './Menu';
import { InlineEdit } from './InlineEdit';
import { cn } from '@/utils/cn';

export interface DashboardCardProps {
  id: string;
  title: string;
  icon?: ReactNode;
  count?: number;
  accent?: 'default' | 'danger';
  collapsed: boolean;
  pinned: boolean;
  onToggleCollapse: () => void;
  onTogglePin: () => void;
  onHide: () => void;
  /** When provided, the header title becomes click-to-edit (used by custom cards). */
  onTitleChange?: (next: string) => void;
  /** When provided, the menu offers a permanent "Delete card" instead of reversible "Remove card". */
  onDelete?: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
}

/** Chrome for a single dashboard module: drag handle, collapse, pin, hide, overflow menu. */
export function DashboardCard({
  id,
  title,
  icon,
  count,
  accent = 'default',
  collapsed,
  pinned,
  onToggleCollapse,
  onTogglePin,
  onHide,
  onTitleChange,
  onDelete,
  headerAction,
  children,
}: DashboardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      data-module={id}
      className={cn(
        'group/card rounded-2xl border bg-surface shadow-card transition-shadow hover:shadow-card-hover',
        accent === 'danger' ? 'border-danger/30' : 'border-border',
        isDragging && 'opacity-80 shadow-pop',
      )}
      aria-label={title}
    >
      <header className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <button
          className="-ml-1 cursor-grab touch-none text-muted/50 opacity-0 transition-opacity group-hover/card:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
        <span className={cn('flex items-center', accent === 'danger' ? 'text-danger' : 'text-accent')}>
          {icon}
        </span>
        {onTitleChange ? (
          <InlineEdit
            as="h3"
            value={title}
            onChange={onTitleChange}
            placeholder="Card name"
            className="flex-1 truncate text-sm font-semibold text-fg"
          />
        ) : (
          <h3 className="flex-1 truncate text-sm font-semibold text-fg">{title}</h3>
        )}
        {typeof count === 'number' && (
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {count}
          </span>
        )}
        {pinned && <Pin size={13} className="text-accent" fill="currentColor" />}
        {headerAction}
        <button
          onClick={onToggleCollapse}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            size={15}
            className={cn('transition-transform', collapsed && '-rotate-90')}
          />
        </button>
        <Menu
          trigger={
            <button
              className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Card options"
            >
              <MoreHorizontal size={15} />
            </button>
          }
          items={[
            {
              label: pinned ? 'Unpin' : 'Pin to top',
              icon: <Pin size={14} />,
              onClick: onTogglePin,
            },
            {
              label: collapsed ? 'Expand' : 'Collapse',
              icon: <ChevronDown size={14} />,
              onClick: onToggleCollapse,
            },
            'divider',
            // Custom cards delete permanently; built-in cards are removed reversibly (data kept).
            onDelete
              ? { label: 'Delete card', icon: <Trash2 size={14} />, onClick: onDelete, danger: true }
              : { label: 'Remove card', icon: <EyeOff size={14} />, onClick: onHide },
          ]}
        />
      </header>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3.5 pb-3.5"
        >
          {children}
        </motion.div>
      )}
    </section>
  );
}
