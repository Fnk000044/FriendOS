import { useEffect, useRef } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

export function useKeyboardShortcut(key: string, handler: ShortcutHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const parts = key.split('+');
    const hasCtrl = parts.includes('Ctrl');
    const hasShift = parts.includes('Shift');
    const hasAlt = parts.includes('Alt');
    const mainKey = parts[parts.length - 1];

    const listener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return;
      }

      const ctrl = hasCtrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
      const shift = hasShift ? e.shiftKey : !e.shiftKey;
      const alt = hasAlt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === mainKey.toLowerCase();

      if (ctrl && shift && alt && keyMatch) {
        handlerRef.current(e);
      }
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key]);
}
