// ─────────────────────────────────────────────────────────────────────────────
// Birdview domain types. Every record is a plain JSON-serializable object so the
// whole database can round-trip through browser.storage.local and export files.
// ─────────────────────────────────────────────────────────────────────────────

export type ID = string;
/** ISO 8601 string. */
export type ISODate = string;

export type Priority = 'low' | 'medium' | 'high';

export interface BaseRecord {
  id: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
  tags: string[];
  archived?: boolean;
}

// ── Tasks ────────────────────────────────────────────────────────────────────
export interface ChecklistItem {
  id: ID;
  text: string;
  done: boolean;
}

export interface Task extends BaseRecord {
  title: string;
  notes?: string;
  done: boolean;
  priority: Priority;
  dueDate?: ISODate;
  reminderAt?: ISODate;
  labels: string[];
  checklist: ChecklistItem[];
  order: number;
}

// ── Urgent ───────────────────────────────────────────────────────────────────
export interface UrgentItem extends BaseRecord {
  title: string;
  notes?: string;
  deadline?: ISODate;
  done: boolean;
  order: number;
}

// ── Projects ─────────────────────────────────────────────────────────────────
export type ProjectColumn = 'backlog' | 'in-progress' | 'review' | 'done';

export interface SubTask {
  id: ID;
  text: string;
  done: boolean;
}

export interface ProjectLink {
  id: ID;
  label: string;
  url: string;
}

export interface Project extends BaseRecord {
  title: string;
  description?: string;
  column: ProjectColumn;
  dueDate?: ISODate;
  notes?: string;
  subtasks: SubTask[];
  links: ProjectLink[];
  /** IndexedDB image ids (attachments). */
  attachments: ID[];
  order: number;
}

// ── LinkedIn Jobs ────────────────────────────────────────────────────────────
export type JobStatus =
  | 'Saved'
  | 'Applied'
  | 'OA'
  | 'Interview'
  | 'Final Round'
  | 'Offer'
  | 'Rejected';

export const JOB_STATUSES: JobStatus[] = [
  'Saved',
  'Applied',
  'OA',
  'Interview',
  'Final Round',
  'Offer',
  'Rejected',
];

export interface Job extends BaseRecord {
  company: string;
  role: string;
  url?: string;
  status: JobStatus;
  salary?: string;
  recruiter?: string;
  interviewNotes?: string;
  followUpAt?: ISODate;
  order: number;
}

// ── Cold Email ───────────────────────────────────────────────────────────────
export type ColdEmailStatus =
  | 'Not Started'
  | 'Draft Ready'
  | 'Sent'
  | 'Follow-up 1'
  | 'Follow-up 2'
  | 'Replied'
  | 'Closed';

export const COLD_EMAIL_STATUSES: ColdEmailStatus[] = [
  'Not Started',
  'Draft Ready',
  'Sent',
  'Follow-up 1',
  'Follow-up 2',
  'Replied',
  'Closed',
];

export interface ColdEmail extends BaseRecord {
  name: string;
  company?: string;
  email?: string;
  website?: string;
  industry?: string;
  lastContact?: ISODate;
  status: ColdEmailStatus;
  notes?: string;
  order: number;
}

// ── YouTube watch list ───────────────────────────────────────────────────────
export interface Video extends BaseRecord {
  title: string;
  url: string;
  channel?: string;
  duration?: string;
  thumbnail?: string;
  watched: boolean;
  favorite: boolean;
  order: number;
}

// ── Instagram content ideas ──────────────────────────────────────────────────
export interface InstagramIdea extends BaseRecord {
  caption: string;
  hashtags: string[];
  images: ID[]; // IndexedDB image ids
  draft: boolean;
  order: number;
}

// ── Planner posts (LinkedIn + Instagram) ─────────────────────────────────────
export type LinkedInStatus = 'Idea' | 'Draft' | 'Ready' | 'Published';
export const LINKEDIN_STATUSES: LinkedInStatus[] = ['Idea', 'Draft', 'Ready', 'Published'];

export interface LinkedInPost extends BaseRecord {
  title: string;
  content?: string;
  publishDate?: ISODate;
  topic?: string;
  cta?: string;
  hashtags: string[];
  status: LinkedInStatus;
  order: number;
}

export type InstagramPostStatus = 'Idea' | 'Draft' | 'Ready' | 'Published';

export interface InstagramPost extends BaseRecord {
  title: string;
  caption?: string;
  hashtags: string[];
  images: ID[]; // carousel images, IndexedDB ids
  publishDate?: ISODate;
  reminderAt?: ISODate;
  status: InstagramPostStatus;
  order: number;
}

// ── Recurring tasks ──────────────────────────────────────────────────────────
export type RecurrenceUnit = 'day' | 'week' | 'month';

export interface Recurring extends BaseRecord {
  title: string;
  notes?: string;
  unit: RecurrenceUnit;
  interval: number; // every N units
  /** Next due occurrence. */
  nextDue: ISODate;
  /** Last completion timestamp. */
  lastCompleted?: ISODate;
  streak: number;
  order: number;
}

// ── Screenshots ──────────────────────────────────────────────────────────────
export interface Screenshot extends BaseRecord {
  filename: string;
  /** IndexedDB blob id. */
  imageId: ID;
  thumbId: ID;
  width?: number;
  height?: number;
  /** OCR text — left empty in v1 (hook in storage/images.ts). */
  ocrText?: string;
  order: number;
}

// ── Calendar ─────────────────────────────────────────────────────────────────
export interface CalendarEvent extends BaseRecord {
  title: string;
  start: ISODate;
  end?: ISODate;
  allDay?: boolean;
  location?: string;
  notes?: string;
  /** Set when this event was generated from a task drop. */
  sourceTaskId?: ID;
}

// ── Settings ─────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';

export interface CardLayout {
  /** Module key, e.g. 'tasks'. */
  key: ModuleKey;
  order: number;
  collapsed: boolean;
  hidden: boolean;
  pinned: boolean;
}

export interface Settings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  backupFrequency: 'off' | 'daily' | 'weekly';
  lastBackupAt?: ISODate;
  exportDefault: 'json' | 'markdown' | 'csv' | 'zip';
  layout: CardLayout[];
  onboarded: boolean;
}

// ── Database ─────────────────────────────────────────────────────────────────
export interface Database {
  __version: number;
  tasks: Task[];
  projects: Project[];
  jobs: Job[];
  coldEmails: ColdEmail[];
  youtube: Video[];
  instagram: InstagramIdea[];
  linkedinPosts: LinkedInPost[];
  instagramPosts: InstagramPost[];
  recurring: Recurring[];
  urgent: UrgentItem[];
  screenshots: Screenshot[];
  calendar: CalendarEvent[];
  settings: Settings;
}

/** Keys that hold record arrays (everything except settings + version). */
export type CollectionKey = Exclude<keyof Database, '__version' | 'settings'>;

/** Dashboard module identifiers (1:1 with collections that render a card). */
export type ModuleKey =
  | 'tasks'
  | 'urgent'
  | 'projects'
  | 'jobs'
  | 'coldEmails'
  | 'youtube'
  | 'instagram'
  | 'linkedinPosts'
  | 'instagramPosts'
  | 'recurring'
  | 'screenshots'
  | 'calendar';
