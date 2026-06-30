import { useMemo, useState } from 'react';
import { Briefcase, Plus, ExternalLink } from 'lucide-react';
import { JOB_STATUSES, type JobStatus } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Input, EmptyState } from '@/components/ui';
import type { ModuleCardProps } from '../types';
import { JobDetail } from './JobDetail';

const STATUS_TONE: Record<JobStatus, string> = {
  Saved: 'bg-muted/20 text-muted',
  Applied: 'bg-accent/15 text-accent',
  OA: 'bg-warning/15 text-warning',
  Interview: 'bg-warning/15 text-warning',
  'Final Round': 'bg-success/15 text-success',
  Offer: 'bg-success/20 text-success',
  Rejected: 'bg-danger/15 text-danger',
};

export function JobsCard(props: ModuleCardProps) {
  const jobs = useCollection('jobs');
  const { add, update } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [company, setCompany] = useState('');

  const sorted = useMemo(
    () => [...jobs].filter((j) => !j.archived).sort((a, b) => a.order - b.order),
    [jobs],
  );

  const quickAdd = () => {
    if (!company.trim()) return;
    add('jobs', { company: company.trim(), role: '', status: 'Saved' } as never);
    setCompany('');
  };

  const openJob = openId ? jobs.find((j) => j.id === openId) : null;

  return (
    <DashboardCard {...props} title="LinkedIn Jobs" icon={<Briefcase size={16} />} count={sorted.length}>
      <div className="space-y-1">
        {sorted.map((job) => (
          <div key={job.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface-2">
            <button onClick={() => setOpenId(job.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{job.company}</span>
              <span className="block truncate text-[11px] text-muted">{job.role || 'No role'}</span>
            </button>
            {job.url && (
              <a href={job.url} target="_blank" rel="noreferrer" className="text-muted hover:text-accent" aria-label="Open job link">
                <ExternalLink size={13} />
              </a>
            )}
            <select
              value={job.status}
              onChange={(e) => update('jobs', job.id, { status: e.target.value as JobStatus })}
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium focus:outline-none ${STATUS_TONE[job.status]}`}
              aria-label="Job status"
            >
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Briefcase size={22} />} title="No jobs tracked" hint="Add a company to start." />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          quickAdd();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <Plus size={15} className="text-muted" />
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Add company…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>

      {openJob && <JobDetail job={openJob} onClose={() => setOpenId(null)} />}
    </DashboardCard>
  );
}
