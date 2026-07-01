import type { FC } from 'react';
import type { ModuleKey } from '@/types';
import type { ModuleCardProps } from './types';
import { TasksCard } from './tasks/TasksCard';
import { UrgentCard } from './urgent/UrgentCard';
import { RecurringCard } from './recurring/RecurringCard';
import { ProjectsCard } from './projects/ProjectsCard';
import { JobsCard } from './jobs/JobsCard';
import { ColdEmailCard } from './coldemail/ColdEmailCard';
import { YouTubeCard } from './youtube/YouTubeCard';
import { InstagramIdeasCard } from './instagram/InstagramIdeasCard';
import { LinkedInPostsCard } from './linkedin-posts/LinkedInPostsCard';
import { InstagramPostsCard } from './instagram-posts/InstagramPostsCard';
import { ScreenshotsCard } from './screenshots/ScreenshotsCard';
import { CalendarCard } from './calendar/CalendarCard';
import { LinksCard } from './links/LinksCard';

/** Maps each dashboard module to its card component. */
export const MODULE_REGISTRY: Record<ModuleKey, FC<ModuleCardProps>> = {
  tasks: TasksCard,
  urgent: UrgentCard,
  recurring: RecurringCard,
  projects: ProjectsCard,
  jobs: JobsCard,
  coldEmails: ColdEmailCard,
  youtube: YouTubeCard,
  instagram: InstagramIdeasCard,
  linkedinPosts: LinkedInPostsCard,
  instagramPosts: InstagramPostsCard,
  screenshots: ScreenshotsCard,
  calendar: CalendarCard,
  links: LinksCard,
};
