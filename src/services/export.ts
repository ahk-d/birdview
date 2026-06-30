import JSZip from 'jszip';
import type { Database } from '@/types';
import { MODULE_LABELS } from '@/storage/schema';
import { toCSV } from './csv';
import { getImage } from '@/storage/images';

// ── Download helpers ───────────────────────────────────────────────────────────
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  downloadBlob(filename, new Blob([text], { type: `${mime};charset=utf-8` }));
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── JSON ───────────────────────────────────────────────────────────────────────
export function exportJSON(db: Database): void {
  downloadText(`birdview-${stamp()}.json`, JSON.stringify(db, null, 2), 'application/json');
}

// ── Markdown ─────────────────────────────────────────────────────────────────
export function databaseToMarkdown(db: Database): string {
  const lines: string[] = [`# Birdview export — ${stamp()}`, ''];
  (Object.keys(MODULE_LABELS) as (keyof typeof MODULE_LABELS)[]).forEach((key) => {
    const items = (db[key] as { title?: string; name?: string; company?: string; caption?: string }[]) ?? [];
    if (!items.length) return;
    lines.push(`## ${MODULE_LABELS[key]}`, '');
    items.forEach((it) => {
      const title = it.title ?? it.name ?? it.company ?? it.caption ?? '(untitled)';
      lines.push(`- ${title}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

export function exportMarkdown(db: Database): void {
  downloadText(`birdview-${stamp()}.md`, databaseToMarkdown(db), 'text/markdown');
}

// ── CSV (one combined workbook-style file per collection, zipped) ──────────────
const COLLECTION_KEYS = Object.keys(MODULE_LABELS) as (keyof typeof MODULE_LABELS)[];

export async function exportCSVZip(db: Database): Promise<void> {
  const zip = new JSZip();
  COLLECTION_KEYS.forEach((key) => {
    const rows = db[key] as unknown as Record<string, unknown>[];
    if (rows?.length) zip.file(`${key}.csv`, toCSV(rows));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(`birdview-csv-${stamp()}.zip`, blob);
}

// ── Notion (Markdown page + CSV databases, zipped for import) ──────────────────
export async function exportNotion(db: Database): Promise<void> {
  const zip = new JSZip();
  zip.file('Birdview.md', databaseToMarkdown(db));
  COLLECTION_KEYS.forEach((key) => {
    const rows = db[key] as unknown as Record<string, unknown>[];
    if (rows?.length) zip.file(`${MODULE_LABELS[key]}.csv`, toCSV(rows));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(`birdview-notion-${stamp()}.zip`, blob);
}

// ── Full ZIP backup (JSON + markdown + all images) ────────────────────────────
export async function exportZipBackup(db: Database): Promise<void> {
  const zip = new JSZip();
  zip.file('birdview.json', JSON.stringify(db, null, 2));
  zip.file('README.md', databaseToMarkdown(db));

  const imgFolder = zip.folder('images');
  const imageIds = new Set<string>();
  db.screenshots.forEach((s) => {
    imageIds.add(s.imageId);
    imageIds.add(s.thumbId);
  });
  db.projects.forEach((p) => p.attachments.forEach((id) => imageIds.add(id)));
  db.instagram.forEach((i) => i.images.forEach((id) => imageIds.add(id)));
  db.instagramPosts.forEach((i) => i.images.forEach((id) => imageIds.add(id)));

  await Promise.all(
    Array.from(imageIds).map(async (id) => {
      const blob = await getImage(id);
      if (blob && imgFolder) imgFolder.file(`${id}`, blob);
    }),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(`birdview-backup-${stamp()}.zip`, blob);
}

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'notion' | 'zip';

export async function runExport(format: ExportFormat, db: Database): Promise<void> {
  switch (format) {
    case 'json':
      return exportJSON(db);
    case 'markdown':
      return exportMarkdown(db);
    case 'csv':
      return exportCSVZip(db);
    case 'notion':
      return exportNotion(db);
    case 'zip':
      return exportZipBackup(db);
  }
}
