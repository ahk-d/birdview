import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useSettings, useStore } from '@/services/store';
import { MODULE_REGISTRY } from '@/features/registry';
import { CustomCardView, addCustomCard } from '@/features/custom/CustomCardView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MODULE_LABELS } from '@/storage/schema';
import { focusModule } from '@/services/ui';

/**
 * Responsive masonry of module cards. Layout (order / collapsed / pinned / hidden) lives in
 * settings.layout; pinned cards always sort first. Built-in modules come from the registry; any
 * layout key that isn't a built-in resolves to a user-created custom card. Cards reorder via DnD.
 */
export function DashboardLayout() {
  const settings = useSettings();
  const customCards = useStore((s) => s.db.customCards);
  const setSettings = useStore((s) => s.setSettings);

  const visible = useMemo(
    () =>
      [...settings.layout]
        .filter((l) => !l.hidden)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order),
    [settings.layout],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const patchCard = (key: string, patch: Partial<(typeof settings.layout)[number]>) => {
    setSettings({ layout: settings.layout.map((l) => (l.key === key ? { ...l, ...patch } : l)) });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visible.map((l) => l.key);
    const reordered = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    setSettings({
      layout: settings.layout.map((l) => {
        const idx = reordered.indexOf(l.key);
        return idx >= 0 ? { ...l, order: idx } : l;
      }),
    });
  };

  const onAddCard = () => {
    const id = addCustomCard();
    focusModule(id);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visible.map((l) => l.key)} strategy={rectSortingStrategy}>
        <div className="masonry columns-1 sm:columns-2 lg:columns-3 2xl:columns-4">
          {visible.map((card) => {
            const chrome = {
              id: card.key,
              collapsed: card.collapsed,
              pinned: card.pinned,
              onToggleCollapse: () => patchCard(card.key, { collapsed: !card.collapsed }),
              onTogglePin: () => patchCard(card.key, { pinned: !card.pinned }),
              onHide: () => patchCard(card.key, { hidden: true }),
            };

            // Built-in module?
            if (card.key in MODULE_REGISTRY) {
              const Card = MODULE_REGISTRY[card.key as keyof typeof MODULE_REGISTRY];
              return (
                <ErrorBoundary key={card.key} label={MODULE_LABELS[card.key as keyof typeof MODULE_LABELS]}>
                  <Card {...chrome} />
                </ErrorBoundary>
              );
            }

            // Otherwise, a custom card.
            const custom = customCards.find((c) => c.id === card.key);
            if (!custom) return null; // stale layout entry
            return (
              <ErrorBoundary key={card.key} label={custom.title}>
                <CustomCardView {...chrome} card={custom} />
              </ErrorBoundary>
            );
          })}

          <button
            onClick={onAddCard}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 py-4 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
            aria-label="Add a new card"
          >
            <Plus size={16} /> Add card
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}
