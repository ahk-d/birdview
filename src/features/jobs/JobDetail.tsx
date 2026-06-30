import { JOB_STATUSES, type Job, type JobStatus } from '@/types';
import { Modal } from '@/components/Modal';
import { Input, Textarea, Button } from '@/components/ui';
import { TagInput } from '@/components/TagInput';
import { confirm } from '@/components/ConfirmDialog';
import { useStore } from '@/services/store';

export function JobDetail({ job, onClose }: { job: Job; onClose: () => void }) {
  const { update, remove } = useStore();
  const set = (patch: Partial<Job>) => update('jobs', job.id, patch);

  return (
    <Modal
      open
      onClose={onClose}
      title="Job"
      size="md"
      footer={
        <Button
          variant="danger"
          onClick={async () => {
            if (await confirm({ title: 'Delete job?', danger: true, confirmLabel: 'Delete' })) {
              remove('jobs', job.id);
              onClose();
            }
          }}
        >
          Delete
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input value={job.company} onChange={(e) => set({ company: e.target.value })} placeholder="Company" />
          <Input value={job.role} onChange={(e) => set({ role: e.target.value })} placeholder="Role" />
        </div>
        <Input value={job.url ?? ''} onChange={(e) => set({ url: e.target.value })} placeholder="Job URL" />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">
            Status
            <select
              value={job.status}
              onChange={(e) => set({ status: e.target.value as JobStatus })}
              className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
            >
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Input value={job.salary ?? ''} onChange={(e) => set({ salary: e.target.value })} placeholder="Salary" />
        </div>
        <Input value={job.recruiter ?? ''} onChange={(e) => set({ recruiter: e.target.value })} placeholder="Recruiter" />
        <label className="block text-xs text-muted">
          Follow-up reminder
          <Input
            type="datetime-local"
            value={job.followUpAt ? job.followUpAt.slice(0, 16) : ''}
            onChange={(e) =>
              set({ followUpAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
            className="mt-1"
          />
        </label>
        <Textarea
          value={job.interviewNotes ?? ''}
          onChange={(e) => set({ interviewNotes: e.target.value })}
          placeholder="Interview notes…"
        />
        <TagInput tags={job.tags} onChange={(tags) => set({ tags })} />
      </div>
    </Modal>
  );
}
