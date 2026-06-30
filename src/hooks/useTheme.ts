import { useEffect } from 'react';
import { useSettings, useStore } from '@/services/store';
import type { ThemeMode } from '@/types';

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/** Applies the persisted theme to <html> and keeps it in sync with the system preference. */
export function useTheme() {
  const { theme } = useSettings();
  const setSettings = useStore((s) => s.setSettings);

  useEffect(() => {
    const apply = () => {
      const resolved = resolve(theme);
      const root = document.documentElement;
      root.classList.add('theme-transition');
      root.classList.toggle('dark', resolved === 'dark');
      window.setTimeout(() => root.classList.remove('theme-transition'), 300);
    };
    apply();
    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
  }, [theme]);

  const cycle = () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setSettings({ theme: next });
  };

  const toggle = () => setSettings({ theme: resolve(theme) === 'dark' ? 'light' : 'dark' });

  return { theme, resolved: resolve(theme), cycle, toggle, setTheme: (m: ThemeMode) => setSettings({ theme: m }) };
}
