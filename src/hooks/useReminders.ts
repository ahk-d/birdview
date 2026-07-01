import { useEffect, useRef } from 'react';
import { useStore } from '@/services/store';
import { collectDue } from '@/services/notifications';
import { toast } from '@/components/Toast';
import { playChime } from '@/services/sound';
import { focusModule } from '@/services/ui';

const MODULE_OF: Record<string, string> = {
  task: 'tasks',
  urgent: 'urgent',
  rec: 'recurring',
  job: 'jobs',
  ig: 'instagramPosts',
  cal: 'calendar',
};

/**
 * While the app is open, polls for due reminders and surfaces them as an in-app toast (+ optional
 * chime). Complements the background service worker, which fires OS notifications when closed, and
 * makes reminders work in the web/preview build where no service worker runs.
 */
export function useReminders(): void {
  const fired = useRef<Set<string>>(new Set());
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return; // wait until the database is loaded before checking
    const check = () => {
      const { db } = useStore.getState();
      if (!db.settings.notificationsEnabled) return;
      for (const notice of collectDue(db)) {
        if (fired.current.has(notice.key)) continue;
        fired.current.add(notice.key);
        const module = MODULE_OF[notice.key.split(':')[0]];
        toast.info(
          `${notice.title}: ${notice.body}`,
          module ? { label: 'View', onClick: () => focusModule(module) } : undefined,
        );
        if (db.settings.soundEnabled) playChime();
      }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [hydrated]);
}
