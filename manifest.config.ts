import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

const isFirefox = process.env.BIRDVIEW_TARGET === 'firefox';

// Manifest V3, shared across Chromium browsers (Chrome, Edge, Brave, Arc, Opera) and Firefox.
export default defineManifest(() => ({
  manifest_version: 3,
  name: 'Birdview — Local Productivity Dashboard',
  short_name: 'Birdview',
  version: pkg.version,
  description: pkg.description,
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_title: 'Birdview — Quick Capture',
    default_popup: 'src/pages/popup/index.html',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
    },
  },
  background: isFirefox
    ? { scripts: ['src/background/index.ts'], type: 'module' }
    : { service_worker: 'src/background/index.ts', type: 'module' },
  // Full dashboard opens in its own tab…
  options_page: 'src/pages/dashboard/index.html',
  // …and replaces the browser's New Tab page (works in Chromium + Firefox).
  chrome_url_overrides: { newtab: 'src/pages/dashboard/index.html' },
  ...(isFirefox
    ? {}
    : { side_panel: { default_path: 'src/pages/sidepanel/index.html' } }),
  permissions: ['storage', 'unlimitedStorage', 'alarms', 'notifications', 'tabs', 'contextMenus'],
  commands: {
    _execute_action: {
      suggested_key: { default: 'Ctrl+Shift+Y', mac: 'Command+Shift+Y' },
      description: 'Open Birdview Quick Capture',
    },
    'open-dashboard': {
      suggested_key: { default: 'Ctrl+Shift+U', mac: 'Command+Shift+U' },
      description: 'Open the Birdview dashboard',
    },
  },
  ...(isFirefox
    ? ({
        browser_specific_settings: {
          gecko: {
            id: 'birdview@portfolio.dev',
            // 126 is the first version supporting options_page under MV3 (clears AMO warnings).
            strict_min_version: '126.0',
            // Required by AMO: Birdview collects/transmits no user data.
            data_collection_permissions: { required: ['none'] },
          },
          // Declare Firefox for Android support (responsive dashboard works on mobile).
          gecko_android: { strict_min_version: '126.0' },
        },
      } as any)
    : {}),
}));
