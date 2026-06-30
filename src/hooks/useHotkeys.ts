import { useEffect } from 'react';

export interface Hotkey {
  /** e.g. 'mod+k', 'n', 'shift+/', 'space', 'delete'. `mod` = ⌘ on mac, Ctrl elsewhere. */
  combo: string;
  handler: (e: KeyboardEvent) => void;
  /** Allow firing while focused in an input/textarea/contenteditable. Default false. */
  allowInInput?: boolean;
  preventDefault?: boolean;
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function matches(combo: string, e: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const needMod = parts.includes('mod');
  const needShift = parts.includes('shift');
  const needAlt = parts.includes('alt');

  const mod = e.metaKey || e.ctrlKey;
  if (needMod !== mod) return false;
  if (needShift !== e.shiftKey) return false;
  if (needAlt !== e.altKey) return false;

  const pressed = e.key.toLowerCase();
  const normalized = key === 'space' ? ' ' : key === 'esc' ? 'escape' : key;
  return pressed === normalized;
}

/** Bind a set of global hotkeys for the lifetime of the component. */
export function useHotkeys(hotkeys: Hotkey[]): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      for (const hk of hotkeys) {
        if (!hk.allowInInput && isEditable(e.target)) continue;
        if (matches(hk.combo, e)) {
          if (hk.preventDefault !== false) e.preventDefault();
          hk.handler(e);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeys]);
}
