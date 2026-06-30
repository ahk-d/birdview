import { useEffect, useState } from 'react';
import { countdownTo } from '@/utils/date';
import { cn } from '@/utils/cn';

/** Live ticking countdown to a deadline; turns red + shows "overdue" when past. */
export function Countdown({ deadline, className }: { deadline?: string; className?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!deadline) return null;
  const c = countdownTo(deadline);
  const pad = (n: number) => String(n).padStart(2, '0');
  const text = c.days > 0 ? `${c.days}d ${pad(c.hours)}h ${pad(c.minutes)}m` : `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-xs tabular-nums',
        c.overdue ? 'text-danger' : c.days === 0 ? 'text-warning' : 'text-muted',
        className,
      )}
    >
      {c.overdue ? `${text} overdue` : text}
    </span>
  );
}
