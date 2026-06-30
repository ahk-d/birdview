import { useMemo, useRef, useState } from 'react';
import { Mail, Plus, Download, Upload } from 'lucide-react';
import { COLD_EMAIL_STATUSES, type ColdEmailStatus } from '@/types';
import { useStore, useCollection } from '@/services/store';
import { DashboardCard } from '@/components/DashboardCard';
import { Input, EmptyState } from '@/components/ui';
import { toCSV, fromCSV } from '@/services/csv';
import { downloadText } from '@/services/export';
import { toast } from '@/components/Toast';
import type { ModuleCardProps } from '../types';
import { ColdEmailDetail } from './ColdEmailDetail';

const CSV_COLUMNS = ['name', 'company', 'email', 'website', 'industry', 'status', 'lastContact', 'notes'];

export function ColdEmailCard(props: ModuleCardProps) {
  const contacts = useCollection('coldEmails');
  const { add, update } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...contacts].filter((c) => !c.archived).sort((a, b) => a.order - b.order),
    [contacts],
  );

  const quickAdd = () => {
    if (!name.trim()) return;
    add('coldEmails', { name: name.trim(), status: 'Not Started' } as never);
    setName('');
  };

  const exportCsv = () => {
    downloadText('cold-emails.csv', toCSV(sorted as unknown as Record<string, unknown>[], CSV_COLUMNS), 'text/csv');
    toast.success('Exported CSV');
  };

  const importCsv = async (file: File) => {
    const rows = fromCSV(await file.text());
    rows.forEach((r) => {
      if (!r.name) return;
      add('coldEmails', {
        name: r.name,
        company: r.company,
        email: r.email,
        website: r.website,
        industry: r.industry,
        notes: r.notes,
        lastContact: r.lastContact || undefined,
        status: (COLD_EMAIL_STATUSES.includes(r.status as ColdEmailStatus)
          ? r.status
          : 'Not Started') as ColdEmailStatus,
      } as never);
    });
    toast.success(`Imported ${rows.length} contacts`);
  };

  const openContact = openId ? contacts.find((c) => c.id === openId) : null;

  return (
    <DashboardCard
      {...props}
      title="Cold Email"
      icon={<Mail size={16} />}
      count={sorted.length}
      headerAction={
        <>
          <button onClick={exportCsv} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Export CSV" title="Export CSV">
            <Download size={14} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Import CSV" title="Import CSV">
            <Upload size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])}
          />
        </>
      }
    >
      <div className="space-y-1">
        {sorted.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-surface-2">
            <button onClick={() => setOpenId(c.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{c.name}</span>
              <span className="block truncate text-[11px] text-muted">{c.company || c.email || '—'}</span>
            </button>
            <select
              value={c.status}
              onChange={(e) => update('coldEmails', c.id, { status: e.target.value as ColdEmailStatus })}
              className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted focus:outline-none"
              aria-label="Status"
            >
              {COLD_EMAIL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <EmptyState icon={<Mail size={22} />} title="No contacts" hint="Add one or import a CSV." />
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add contact…"
          className="h-8 border-0 bg-transparent px-0 focus:ring-0"
        />
      </form>

      {openContact && <ColdEmailDetail contact={openContact} onClose={() => setOpenId(null)} />}
    </DashboardCard>
  );
}
