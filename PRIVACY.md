# Privacy Policy — Birdview

_Last updated: 2026-06-30_

Birdview is a **local-first** browser extension. Your privacy is the default, not a setting.

## What we collect

**Nothing.** Birdview does not collect, transmit, sell, or share any personal data.

## Where your data lives

All content you create in Birdview — tasks, projects, jobs, contacts, notes, screenshots, calendar
events, and settings — is stored **locally on your device** using the browser's storage APIs
(`storage.local` and IndexedDB for images). It never leaves your machine and is never sent to any
server operated by us or anyone else.

## Network requests

Birdview has no first-party backend and makes no analytics or telemetry calls. The only outbound
requests are optional and contain no personal information:

- **YouTube thumbnails** — when you save a YouTube link, the public thumbnail image is loaded from
  `img.youtube.com`. No data about you is sent beyond a standard image request.

## Permissions

Birdview requests only the permissions needed to function locally:

| Permission | Why |
| --- | --- |
| `storage`, `unlimitedStorage` | Save your dashboard data on your device |
| `alarms` | Schedule local reminder checks |
| `notifications` | Show local reminders for due/recurring/follow-up items |
| `tabs` | Capture the visible tab on request; open the dashboard |
| `contextMenus` | Right-click "Save to Birdview" quick capture |

## Your control

You can export all of your data (JSON, Markdown, CSV, Notion, or a full ZIP backup) at any time, and
delete it by clearing the extension's storage or removing the extension.

## Contact

Questions? Open an issue at https://github.com/ahk-d/birdview/issues.
