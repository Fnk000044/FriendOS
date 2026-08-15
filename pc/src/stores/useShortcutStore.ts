import { create } from 'zustand';

export type ShortcutAction = 'quickCapture' | 'exportData' | 'importData';

export type ShortcutMap = Record<ShortcutAction, string>;

const STORAGE_KEY = 'lifeos_shortcuts';

export const defaultShortcuts: ShortcutMap = {
  quickCapture: 'Ctrl+K',
  exportData: 'Ctrl+E',
  importData: 'Ctrl+I',
};

function loadShortcuts(): ShortcutMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultShortcuts, ...parsed };
    }
  } catch {}
  return { ...defaultShortcuts };
}

function saveShortcuts(shortcuts: ShortcutMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {}
}

interface ShortcutState {
  shortcuts: ShortcutMap;
  getShortcut: (action: ShortcutAction) => string;
  setShortcut: (action: ShortcutAction, keys: string) => void;
  resetAll: () => void;
}

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  shortcuts: loadShortcuts(),
  getShortcut: (action) => get().shortcuts[action] || defaultShortcuts[action],
  setShortcut: (action, keys) => {
    const newShortcuts = { ...get().shortcuts, [action]: keys };
    saveShortcuts(newShortcuts);
    set({ shortcuts: newShortcuts });
  },
  resetAll: () => {
    saveShortcuts(defaultShortcuts);
    set({ shortcuts: { ...defaultShortcuts } });
  },
}));
