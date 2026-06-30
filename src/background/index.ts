// Birdview background service worker (MV3). Handles alarms → notifications, the open-dashboard
// command, and a context-menu quick-save. Uses webextension-polyfill for cross-browser support.
import browser from 'webextension-polyfill';
import { loadDB, reloadDB } from '@/storage/db';
import { collectDue } from '@/services/notifications';

const ALARM = 'birdview-tick';
const fired = new Set<string>();

browser.runtime.onInstalled.addListener(async () => {
  // Check reminders every minute.
  await browser.alarms.create(ALARM, { periodInMinutes: 1 });
  try {
    await browser.contextMenus.create({
      id: 'birdview-save-selection',
      title: 'Save selection to Birdview',
      contexts: ['selection'],
    });
    await browser.contextMenus.create({
      id: 'birdview-save-link',
      title: 'Save link to Birdview',
      contexts: ['link'],
    });
  } catch {
    /* menus may already exist */
  }
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  const db = await reloadDB();
  if (!db.settings.notificationsEnabled) return;
  for (const notice of collectDue(db)) {
    if (fired.has(notice.key)) continue;
    fired.add(notice.key);
    try {
      await browser.notifications.create(notice.key, {
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon128.png'),
        title: notice.title,
        message: notice.body,
      });
    } catch (e) {
      console.error('[Birdview] notification failed', e);
    }
  }
});

browser.commands?.onCommand.addListener(async (command) => {
  if (command === 'open-dashboard') {
    await browser.tabs.create({ url: browser.runtime.getURL('src/pages/dashboard/index.html') });
  }
});

// Quick-save from the page context menu. We append directly to the stored JSON so the worker
// stays independent of the React app.
browser.contextMenus?.onClicked.addListener(async (info) => {
  const db = await loadDB();
  const ts = new Date().toISOString();
  const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  if (info.menuItemId === 'birdview-save-selection' && info.selectionText) {
    db.tasks.unshift({
      id,
      createdAt: ts,
      updatedAt: ts,
      tags: ['clipped'],
      title: info.selectionText.slice(0, 140),
      done: false,
      priority: 'medium',
      labels: ['note'],
      checklist: [],
      order: 0,
    });
  } else if (info.menuItemId === 'birdview-save-link' && info.linkUrl) {
    db.tasks.unshift({
      id,
      createdAt: ts,
      updatedAt: ts,
      tags: ['link'],
      title: info.linkUrl,
      notes: info.linkUrl,
      done: false,
      priority: 'low',
      labels: ['link'],
      checklist: [],
      order: 0,
    });
  } else {
    return;
  }
  await browser.storage.local.set({ 'birdview:db': JSON.stringify(db) });
});
