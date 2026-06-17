import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  destroy: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved;
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('lifeos_theme');
    if (stored === 'system' || stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'system';
}

export const useThemeStore = create<ThemeState>((set) => {
  const mode = getStoredMode();
  const resolved = resolveTheme(mode);
  applyTheme(resolved);

  // Listen for system theme changes
  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const handleChange = () => {
    const currentMode = useThemeStore.getState().mode;
    if (currentMode === 'system') {
      const newResolved = getSystemTheme();
      applyTheme(newResolved);
      set({ resolved: newResolved });
    }
  };
  if (mq) mq.addEventListener('change', handleChange);

  return {
    mode,
    resolved,
    setMode: (newMode: ThemeMode) => {
      localStorage.setItem('lifeos_theme', newMode);
      const newResolved = resolveTheme(newMode);
      applyTheme(newResolved);
      set({ mode: newMode, resolved: newResolved });
    },
    destroy: () => {
      if (mq) mq.removeEventListener('change', handleChange);
    },
  };
});
