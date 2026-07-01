import { useState } from 'react';
import { nanoid } from 'nanoid';
import { LayoutList, Plus, Trash2, CheckSquare } from 'lucide-react';
import type { CustomCard } from '@/types';
import { useStore } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { SortableList } from '@/components/SortableList';
import { Input, ProgressBar, EmptyState } from '@/components/ui';
import { Menu } from '@/components/Menu';
import { confirm } from '@/components/ConfirmDialog';
import { cn } from '@/utils/cn';
import type { ModuleCardProps } from '../types';

/** Renders a user-created card: an editable title + a simple checklist of items. */
export function CustomCardView({ card, ...props }: ModuleCardProps & { card: CustomCard }) {
  const { update, remove, setSettings, db } = useStore();
  const [draft, setDraft] = useState('');

  const items = card.items ?? [];
  const progress = items.length ? (items.filter((i) => i.done).length / items.length) * 100 : 0;

  const patch = (next: Partial<CustomCard>) => update('customCards', card.id, next);

  const addItem = () => {
    if (!draft.trim()) return;
    patch({ items: [...items, { id: nanoid(), text: draft.trim(), done: false }] });
    setDraft('');
  };

  const deleteCard = async () => {
    if (!(await confirm({ title: `Delete "${card.title}"?`, danger: true, confirmLabel: 'Delete' }))) return;
    remove('customCards', card.id);
    setSettings({ layout: db.settings.layout.filter((l) => l.key !== card.id) });
  };

  const reorder = (ids: string[]) =>
    patch({ items: ids.map((id) => items.find((i) => i.id === id)!).filter(Boolean) });

  return (
    <DashboardCard
      {...props}
      title={card.title}
      onTitleChange={(title) => patch({ title: title || 'Untitled' })}
      icon={<LayoutList size={16} />}
      count={items.filter((i) => !i.done).length}
      headerAction={
        <Menu
          trigger={
            <button
              className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Custom card options"
            >
              <Trash2 size={14} />
            </button>
          }
          items={[{ label: 'Delete card', icon: <Trash2 size={14} />, onClick: deleteCard, danger: true }]}
        />
      }
    >
      {items.length > 0 && <ProgressBar value={progress} className="mb-3" />}

      <div className="space-y-0.5">
        <SortableList
          items={items}
          onReorder={reorder}
          renderItem={(item, handle) => (
            <div
              className={cn(
                'group/ci flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface-2',
                item.done && 'opacity-55',
              )}
            >
              <span className="opacity-0 group-hover/ci:opacity-100">{handle}</span>
              <button
                onClick={() =>
                  patch({ items: items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) })
                }
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border',
                  item.done ? 'border-accent bg-accent text-accent-fg' : 'border-border',
                )}
                aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.done && <CheckSquare size={11} />}
              </button>
              <span className={cn('flex-1 truncate text-sm', item.done && 'line-through')}>{item.text}</span>
              <button
                onClick={() => patch({ items: items.filter((i) => i.id !== item.id) })}
                className="text-muted opacity-0 hover:text-danger group-hover/ci:opacity-100"
                aria-label="Delete item"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        />
      </div>

      {items.length === 0 && (
        <EmptyState icon={<LayoutList size={22} />} title="Empty card" hint="Add your first item below." />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addItem();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <Plus size={15} className="text-muted" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add item…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>
    </DashboardCard>
  );
}

/** Create a new custom card + its dashboard layout entry, and reveal it. */
export function addCustomCard(title = 'New card'): string {
  const { add, db, setSettings } = useStore.getState();
  const id = add('customCards', { title, items: [] } as never);
  const maxOrder = db.settings.layout.reduce((m, l) => Math.max(m, l.order), -1);
  setSettings({
    layout: [...db.settings.layout, { key: id, order: maxOrder + 1, collapsed: false, hidden: false, pinned: false }],
  });
  return id;
}
