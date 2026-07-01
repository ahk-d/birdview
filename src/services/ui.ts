import { create } from 'zustand';
import { useStore } from './store';

interface UIState {
  paletteOpen: boolean;
  setPalette: (open: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  paletteOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen }),
}));

/** Make a card visible (un-hide, expand) and scroll it into view with a brief highlight. Accepts a
 * built-in ModuleKey or a custom-card id. */
export function focusModule(key: string): void {
  const { db, setSettings } = useStore.getState();
  const layout = db.settings.layout.map((l) =>
    l.key === key ? { ...l, hidden: false, collapsed: false } : l,
  );
  setSettings({ layout });
  // Wait a tick for the card to render before scrolling.
  setTimeout(() => {
    const el = document.querySelector(`[data-module="${key}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-accent');
      setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 1400);
    }
  }, 60);
}
