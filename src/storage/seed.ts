import { nanoid } from 'nanoid';
import type { Database } from '@/types';

// Friendly first-run content so the dashboard demonstrates every module immediately.
// Only applied when the database is brand-new (no records + not onboarded).

function iso(daysFromNow: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const ts = new Date().toISOString();
const base = () => ({ id: nanoid(), createdAt: ts, updatedAt: ts, tags: [] as string[] });

export function seedDatabase(db: Database): void {
  db.tasks = [
    {
      ...base(),
      title: 'Welcome to Birdview — try editing me ✨',
      notes: 'Click any text to edit inline. Press N for a new task.',
      done: false,
      priority: 'high',
      dueDate: iso(0, 17),
      labels: ['onboarding'],
      tags: ['learning'],
      checklist: [
        { id: nanoid(), text: 'Open the command palette (⌘K)', done: false },
        { id: nanoid(), text: 'Drag a card to reorder it', done: false },
        { id: nanoid(), text: 'Toggle dark mode', done: true },
      ],
      order: 0,
    },
    {
      ...base(),
      title: 'Review weekly goals',
      done: false,
      priority: 'medium',
      dueDate: iso(1),
      labels: [],
      tags: ['work'],
      checklist: [],
      order: 1,
    },
  ];

  db.urgent = [
    {
      ...base(),
      title: 'Submit grant application',
      notes: 'Portal closes at midnight',
      deadline: iso(0, 23),
      done: false,
      tags: ['startup'],
      order: 0,
    },
  ];

  db.recurring = [
    { ...base(), title: 'Exercise', unit: 'day', interval: 1, nextDue: iso(0, 7), streak: 3, order: 0, tags: ['personal'] },
    { ...base(), title: 'Apply to 5 jobs', unit: 'week', interval: 1, nextDue: iso(2), streak: 1, order: 1, tags: ['jobhunt'] },
  ];

  db.projects = [
    {
      ...base(),
      title: 'Portfolio site revamp',
      description: 'Ship the new case studies and dark theme.',
      column: 'in-progress',
      dueDate: iso(7),
      subtasks: [
        { id: nanoid(), text: 'Design hero', done: true },
        { id: nanoid(), text: 'Write copy', done: false },
      ],
      links: [{ id: nanoid(), label: 'Figma', url: 'https://figma.com' }],
      attachments: [],
      tags: ['content'],
      order: 0,
    },
    { ...base(), title: 'Launch newsletter', column: 'backlog', subtasks: [], links: [], attachments: [], tags: ['content'], order: 1 },
  ];

  db.jobs = [
    { ...base(), company: 'Vercel', role: 'Frontend Engineer', url: 'https://vercel.com/careers', status: 'Applied', followUpAt: iso(3), tags: ['jobhunt'], order: 0 },
    { ...base(), company: 'Linear', role: 'Product Engineer', status: 'Interview', salary: '$160k', recruiter: 'Sam', tags: ['jobhunt'], order: 1 },
  ];

  db.coldEmails = [
    { ...base(), name: 'Jane Doe', company: 'Acme', email: 'jane@acme.com', industry: 'SaaS', status: 'Sent', lastContact: iso(-2), tags: ['startup'], order: 0 },
  ];

  db.youtube = [
    { ...base(), title: 'Build a design system', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'Theo', watched: false, favorite: true, tags: ['learning'], order: 0 },
  ];

  db.instagram = [
    { ...base(), caption: '3 productivity tips I actually use', hashtags: ['#productivity', '#notion'], images: [], draft: true, tags: ['content'], order: 0 },
  ];

  db.linkedinPosts = [
    { ...base(), title: 'Lessons from shipping a side project', topic: 'Career', cta: 'What did you ship this month?', hashtags: ['#buildinpublic'], status: 'Draft', publishDate: iso(2), tags: ['content'], order: 0 },
  ];

  db.instagramPosts = [
    { ...base(), title: 'Behind the scenes carousel', caption: 'Swipe to see the process →', hashtags: ['#design'], images: [], status: 'Idea', tags: ['content'], order: 0 },
  ];

  db.calendar = [
    { ...base(), title: 'Team sync', start: iso(0, 14), end: iso(0, 15), tags: ['work'] },
    { ...base(), title: 'Dentist', start: iso(3, 11), allDay: false, tags: ['personal'] },
  ];

  db.links = [
    { ...base(), title: 'GitHub', url: 'https://github.com/', order: 0, tags: ['work'] },
    { ...base(), title: 'Gmail', url: 'https://mail.google.com/', order: 1, tags: ['personal'] },
  ];

  db.settings.onboarded = true;
}
