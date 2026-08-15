import { create } from 'zustand';

/**
 * demoModeStore — 演示模式状态
 *
 * - status: 'inactive' | 'active'；injectedAt：注入时间 ISO 字符串
 * - 持久化：localStorage['friendos_demo_mode'] = JSON.stringify({status, injectedAt})
 * - 启动时读回（模块加载即初始化），刷新后状态保持
 * - activate() / deactivate() 由 DataSettings 的"一键注入/清理演示数据"调用
 */

export const DEMO_MODE_STORAGE_KEY = 'friendos_demo_mode';

export type DemoModeStatus = 'inactive' | 'active';

interface PersistedDemoMode {
  status: DemoModeStatus;
  injectedAt: string;
}

interface DemoModeState {
  status: DemoModeStatus;
  injectedAt: string;
  activate: () => void;
  deactivate: () => void;
}

function readPersisted(): PersistedDemoMode {
  if (typeof window === 'undefined') {
    return { status: 'inactive', injectedAt: '' };
  }
  try {
    const raw = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (!raw) return { status: 'inactive', injectedAt: '' };
    const parsed = JSON.parse(raw) as Partial<PersistedDemoMode>;
    return {
      status: parsed.status === 'active' ? 'active' : 'inactive',
      injectedAt: typeof parsed.injectedAt === 'string' ? parsed.injectedAt : '',
    };
  } catch {
    return { status: 'inactive', injectedAt: '' };
  }
}

function persist(state: PersistedDemoMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级，演示状态仅内存生效
  }
}

const initial = readPersisted();

export const useDemoModeStore = create<DemoModeState>((set) => ({
  status: initial.status,
  injectedAt: initial.injectedAt,

  activate: () => {
    const next: PersistedDemoMode = { status: 'active', injectedAt: new Date().toISOString() };
    persist(next);
    set({ status: 'active', injectedAt: next.injectedAt });
  },

  deactivate: () => {
    const next: PersistedDemoMode = { status: 'inactive', injectedAt: '' };
    persist(next);
    set({ status: 'inactive', injectedAt: '' });
  },
}));
