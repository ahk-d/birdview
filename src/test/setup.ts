import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// jsdom lacks matchMedia; provide a no-op so theme hooks don't throw in tests.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
