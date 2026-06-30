import { useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CalendarDays, Download, Upload, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { generateICS, parseICS } from '@/services/ics';
import { downloadText } from '@/services/export';
import { isSameDay, formatTime, startOfDay } from '@/utils/date';
import { toast } from '@/components/Toast';
import { cn } from '@/utils/cn';
import type { ModuleCardProps } from '../types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarCard(props: ModuleCardProps) {
  const events = useCollection('calendar');
  const { add } = useStore();
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const fileRef = useRef<HTMLInputElement>(null);

  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const days = useMemo(() => {
    const firstWeekday = monthStart.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [monthStart, cursor]);

  const eventsOn = (date: Date) => events.filter((e) => isSameDay(new Date(e.start), date));
  const selectedEvents = eventsOn(selected).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const exportIcs = () => {
    downloadText('birdview.ics', generateICS(events), 'text/calendar');
    toast.success('Exported calendar (.ics)');
  };

  const importIcs = async (file: File) => {
    const parsed = parseICS(await file.text());
    parsed.forEach((e) => add('calendar', e as never));
    toast.success(`Imported ${parsed.length} events`);
  };

  return (
    <DashboardCard
      {...props}
      title="Calendar"
      icon={<CalendarDays size={16} />}
      headerAction={
        <>
          <button onClick={exportIcs} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Export ICS" title="Export .ics">
            <Download size={14} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Import ICS" title="Import .ics">
            <Upload size={14} />
          </button>
          <input ref={fileRef} type="file" accept=".ics,text/calendar" hidden onChange={(e) => e.target.files?.[0] && void importIcs(e.target.files[0])} />
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg p-1 text-muted hover:bg-surface-2" aria-label="Previous month">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg p-1 text-muted hover:bg-surface-2" aria-label="Next month">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1 text-[10px] font-medium text-muted">
            {d}
          </span>
        ))}
        {days.map((day, i) =>
          day ? (
            <DayCell
              key={i}
              day={day}
              count={eventsOn(day).length}
              isSelected={isSameDay(day, selected)}
              isToday={isSameDay(day, new Date())}
              onSelect={() => setSelected(day)}
            />
          ) : (
            <span key={i} />
          ),
        )}
      </div>

      <div className="mt-3 border-t border-border pt-2">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">
            {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <button
            onClick={() =>
              add('calendar', {
                title: 'New event',
                start: new Date(selected.getTime() + 9 * 3600_000).toISOString(),
              } as never)
            }
            className="text-muted hover:text-accent"
            aria-label="Add event"
          >
            <Plus size={14} />
          </button>
        </div>
        {selectedEvents.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted">No events. Drag a task here or click +.</p>
        ) : (
          <div className="space-y-1">
            {selectedEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

function DayCell({
  day,
  count,
  isSelected,
  isToday,
  onSelect,
}: {
  day: Date;
  count: number;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
}) {
  // Droppable so a task dragged from the global search/command flow could attach (id encodes date).
  const { setNodeRef, isOver } = useDroppable({ id: `cal:${day.toISOString()}` });
  return (
    <button
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        'relative aspect-square rounded-lg text-xs transition-colors',
        isSelected ? 'bg-accent text-accent-fg' : 'hover:bg-surface-2',
        isToday && !isSelected && 'font-bold text-accent',
        isOver && 'ring-2 ring-accent',
      )}
    >
      {day.getDate()}
      {count > 0 && (
        <span
          className={cn(
            'absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
            isSelected ? 'bg-accent-fg' : 'bg-accent',
          )}
        />
      )}
    </button>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const { update, remove } = useStore();
  return (
    <div className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-2">
      <span className="w-12 shrink-0 text-[11px] text-muted">
        {event.allDay ? 'All day' : formatTime(event.start)}
      </span>
      <input
        value={event.title}
        onChange={(e) => update('calendar', event.id, { title: e.target.value })}
        className="flex-1 bg-transparent text-sm focus:outline-none"
        aria-label="Event title"
      />
      <button onClick={() => remove('calendar', event.id)} className="text-muted hover:text-danger" aria-label="Delete event">
        ×
      </button>
    </div>
  );
}
