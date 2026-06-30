import { COLD_EMAIL_STATUSES, type ColdEmail, type ColdEmailStatus } from '@/types';
import { Modal } from '@/components/Modal';
import { Input, Textarea, Button } from '@/components/ui';
import { TagInput } from '@/components/TagInput';
import { confirm } from '@/components/ConfirmDialog';
import { useStore } from '@/services/store';

export function ColdEmailDetail({ contact, onClose }: { contact: ColdEmail; onClose: () => void }) {
  const { update, remove } = useStore();
  const set = (patch: Partial<ColdEmail>) => update('coldEmails', contact.id, patch);

  return (
    <Modal
      open
      onClose={onClose}
      title="Contact"
      size="md"
      footer={
        <Button
          variant="danger"
          onClick={async () => {
            if (await confirm({ title: 'Delete contact?', danger: true, confirmLabel: 'Delete' })) {
              remove('coldEmails', contact.id);
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
          <Input value={contact.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name" />
          <Input value={contact.company ?? ''} onChange={(e) => set({ company: e.target.value })} placeholder="Company" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input value={contact.email ?? ''} onChange={(e) => set({ email: e.target.value })} placeholder="Email" />
          <Input value={contact.website ?? ''} onChange={(e) => set({ website: e.target.value })} placeholder="Website" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input value={contact.industry ?? ''} onChange={(e) => set({ industry: e.target.value })} placeholder="Industry" />
          <label className="text-xs text-muted">
            Last contact
            <Input
              type="date"
              value={contact.lastContact?.slice(0, 10) ?? ''}
              onChange={(e) =>
                set({ lastContact: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className="mt-1"
            />
          </label>
        </div>
        <label className="block text-xs text-muted">
          Status
          <select
            value={contact.status}
            onChange={(e) => set({ status: e.target.value as ColdEmailStatus })}
            className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm text-fg"
          >
            {COLD_EMAIL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Textarea value={contact.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Notes…" />
        <TagInput tags={contact.tags} onChange={(tags) => set({ tags })} />
      </div>
    </Modal>
  );
}
