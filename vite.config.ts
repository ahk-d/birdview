import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'node:path';
import manifest from './manifest.config';

// Two build modes:
//  - `vite build` (command === 'build'): full extension build via @crxjs — MV3 manifest,
//    background service worker, popup, side panel, dashboard.
//  - `vite dev`   (command === 'serve'): plain web app of the dashboard at `index.html`, used for
//    local preview / verification. Extension APIs are shimmed in src/services/browser.ts.
export default defineConfig(({ command }) => {
  const isExtensionBuild = command === 'build';
  return {
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    plugins: [react(), ...(isExtensionBuild ? [crx({ manifest })] : [])],
    build: {
      target: 'es2021',
      sourcemap: true,
    },
    server: { port: 5173, strictPort: false },
  };
});
