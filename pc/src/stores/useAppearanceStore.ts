import { create } from 'zustand';

/**
 * 6 个预设强调色
 * 每个 accent 对应一套 --color-primary 系列变量
 */
export type AccentColor = 'teal' | 'purple' | 'blue' | 'pink' | 'orange' | 'slate';

export type FontScale = 'small' | 'normal' | 'large' | 'xlarge';

interface AppearanceState {
  accent: AccentColor;
  fontScale: FontScale;
  reduceMotion: boolean;
  setAccent: (a: AccentColor) => void;
  setFontScale: (f: FontScale) => void;
  setReduceMotion: (r: boolean) => void;
}

const STORAGE_KEY = 'lifeos_appearance';

/** 预设强调色映射：覆盖 --color-primary 系列变量 */
export const ACCENT_PRESETS: Record<AccentColor, {
  primary: string;
  light: string;
  dark: string;
  glow: string;
  gradient: string;
}> = {
  teal: {
    primary: '#14B8A6', light: '#5EEAD4', dark: '#0F766E',
    glow: 'rgba(20, 184, 166, 0.15)',
    gradient: 'linear-gradient(135deg, #14B8A6, #5EEAD4)',
  },
  purple: {
    primary: '#8B5CF6', light: '#C4B5FD', dark: '#6D28D9',
    glow: 'rgba(139, 92, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)',
  },
  blue: {
    primary: '#3B82F6', light: '#93C5FD', dark: '#1D4ED8',
    glow: 'rgba(59, 130, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #3B82F6, #93C5FD)',
  },
  pink: {
    primary: '#EC4899', light: '#F9A8D4', dark: '#BE185D',
    glow: 'rgba(236, 72, 153, 0.15)',
    gradient: 'linear-gradient(135deg, #EC4899, #F9A8D4)',
  },
  orange: {
    primary: '#F97316', light: '#FDBA74', dark: '#C2410C',
    glow: 'rgba(249, 115, 22, 0.15)',
    gradient: 'linear-gradient(135deg, #F97316, #FDBA74)',
  },
  slate: {
    primary: '#64748B', light: '#CBD5E1', dark: '#475569',
    glow: 'rgba(100, 116, 139, 0.15)',
    gradient: 'linear-gradient(135deg, #64748B, #CBD5E1)',
  },
};

const FONT_SCALE_MAP: Record<FontScale, number> = {
  small: 0.9, normal: 1.0, large: 1.1, xlarge: 1.25,
};

/** 把外观偏好写到 documentElement，全局 CSS 变量响应 */
export function applyAppearance(state: Pick<AppearanceState,
  'accent' | 'fontScale' | 'reduceMotion'>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const preset = ACCENT_PRESETS[state.accent] || ACCENT_PRESETS.teal;

  root.style.setProperty('--color-primary', preset.primary);
  root.style.setProperty('--color-primary-light', preset.light);
  root.style.setProperty('--color-primary-dark', preset.dark);
  root.style.setProperty('--color-primary-glow', preset.glow);
  root.style.setProperty('--gradient-primary', preset.gradient);
  root.style.setProperty('--accent-color', preset.primary);

  const fontScale = FONT_SCALE_MAP[state.fontScale] ?? 1.0;
  root.style.setProperty('--font-scale', String(fontScale));

  // 圆角与玻璃模糊已不再对用户开放调节，写入固定默认值，
  // 让依赖 --radius-card/--radius-button/--glass-blur 的组件样式继续生效。
  root.style.setProperty('--radius-card', '16px');
  root.style.setProperty('--radius-button', '10px');
  root.style.setProperty('--glass-blur', '16px');

  if (state.reduceMotion) {
    root.dataset.reduceMotion = 'true';
  } else {
    delete root.dataset.reduceMotion;
  }
}

function getStored(): Partial<AppearanceState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      accent: ['teal', 'purple', 'blue', 'pink', 'orange', 'slate'].includes(parsed.accent) ? parsed.accent : 'teal',
      fontScale: ['small', 'normal', 'large', 'xlarge'].includes(parsed.fontScale) ? parsed.fontScale : 'normal',
      reduceMotion: typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : false,
    };
  } catch {
    return {};
  }
}

function persist(state: AppearanceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accent: state.accent,
      fontScale: state.fontScale,
      reduceMotion: state.reduceMotion,
    }));
  } catch {}
}

const stored = getStored();

export const useAppearanceStore = create<AppearanceState>((set, get) => {
  const initial = {
    accent: (stored.accent as AccentColor) || 'teal',
    fontScale: (stored.fontScale as FontScale) || 'normal',
    reduceMotion: stored.reduceMotion ?? false,
  };

  // 启动时同步应用到 DOM
  applyAppearance(initial);

  const update = (patch: Partial<AppearanceState>) => {
    set(patch);
    const next = { ...get(), ...patch };
    applyAppearance(next);
    persist(next);
  };

  return {
    ...initial,
    setAccent: (a) => update({ accent: a }),
    setFontScale: (f) => update({ fontScale: f }),
    setReduceMotion: (r) => update({ reduceMotion: r }),
  };
});
