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
import type { ModuleKey } from '@/types';
import { useSettings, useStore } from '@/services/store';
import { MODULE_REGISTRY } from '@/features/registry';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MODULE_LABELS } from '@/storage/schema';

/**
 * Responsive masonry of module cards. Layout (order / collapsed / pinned / hidden) lives in
 * settings.layout; pinned cards always sort first. Cards reorder via drag-and-drop.
 */
export function DashboardLayout() {
  const settings = useSettings();
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

  const patchCard = (key: ModuleKey, patch: Partial<(typeof settings.layout)[number]>) => {
    setSettings({
      layout: settings.layout.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visible.map((l) => l.key);
    const reordered = arrayMove(ids, ids.indexOf(active.id as ModuleKey), ids.indexOf(over.id as ModuleKey));
    // Persist the new explicit order across all cards.
    setSettings({
      layout: settings.layout.map((l) => {
        const idx = reordered.indexOf(l.key);
        return idx >= 0 ? { ...l, order: idx } : l;
      }),
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visible.map((l) => l.key)} strategy={rectSortingStrategy}>
        <div className="masonry columns-1 sm:columns-2 lg:columns-3 2xl:columns-4">
          {visible.map((card) => {
            const Card = MODULE_REGISTRY[card.key];
            return (
              <ErrorBoundary key={card.key} label={MODULE_LABELS[card.key]}>
                <Card
                  id={card.key}
                  collapsed={card.collapsed}
                  pinned={card.pinned}
                  onToggleCollapse={() => patchCard(card.key, { collapsed: !card.collapsed })}
                  onTogglePin={() => patchCard(card.key, { pinned: !card.pinned })}
                  onHide={() => patchCard(card.key, { hidden: true })}
                />
              </ErrorBoundary>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
