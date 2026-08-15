import { create } from 'zustand';

interface AppLockState {
  enabled: boolean;
  locked: boolean;
  passwordHash: string | null;
  salt: string | null;
  setEnabled: (enabled: boolean) => void;
  setPassword: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  initFromStorage: () => void;
}

const STORAGE_KEY = 'friendos_app_lock';

/**
 * 生成随机盐值
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 向后兼容：旧的SHA-256加盐哈希
 */
async function sha256WithSalt(str: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256_salted_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return 'pbkdf2_' + Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 向后兼容：旧的SHA-256哈希（无盐值）
 */
async function sha256Legacy(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  enabled: false,
  locked: false,
  passwordHash: null,
  salt: null,

  setEnabled: (enabled) => {
    set({ enabled });
    if (!enabled) {
      set({ locked: false });
    }
    const { passwordHash, salt } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, passwordHash, salt }));
  },

  setPassword: async (password) => {
    if (get().locked) throw new Error('Cannot change password while locked');
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const { enabled } = get();
    set({ passwordHash, salt });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, passwordHash, salt }));
  },

  unlock: async (password) => {
    const { passwordHash, salt } = get();
    if (!passwordHash) return true;

    // Windows Hello 解锁令牌：跳过密码验证（验证已由 WinRT 完成）
    if (password === '__windows_hello__') {
      set({ locked: false });
      return true;
    }

    let isValid = false;
    let needsUpgrade = false;

    if (salt && passwordHash.startsWith('pbkdf2_')) {
      isValid = (await hashPassword(password, salt)) === passwordHash;
    } else if (salt && passwordHash.startsWith('sha256_salted_')) {
      isValid = (await sha256WithSalt(password, salt)) === passwordHash;
      needsUpgrade = true;
    } else {
      isValid = (await sha256Legacy(password)) === passwordHash;
      needsUpgrade = true;
    }

    if (isValid && needsUpgrade) {
      const newSalt = generateSalt();
      const newHash = await hashPassword(password, newSalt);
      const { enabled } = get();
      set({ passwordHash: newHash, salt: newSalt });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, passwordHash: newHash, salt: newSalt }));
    }

    if (isValid) {
      set({ locked: false });
    }
    return isValid;
  },

  lock: () => {
    const { enabled } = get();
    if (enabled) {
      set({ locked: true });
    }
  },

  initFromStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        set({
          enabled: data.enabled || false,
          passwordHash: data.passwordHash || null,
          salt: data.salt || null,
          locked: data.enabled || false,
        });
      } catch {
        // ignore
      }
    }
  },
}));
