import { create } from 'zustand';

export interface Reminder {
  id: string;
  type: 'diary' | 'habit' | 'custom';
  title: string;
  body: string;
  time: string; // HH:MM format
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (empty = every day)
  enabled: boolean;
  lastNotified?: string;
}

interface NotificationState {
  reminders: Reminder[];
  initialized: boolean;
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  initFromStorage: () => void;
}

const STORAGE_KEY = 'friendos_reminders';

// Debounced localStorage write
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(reminders: Reminder[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, 300);
}

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'diary-evening',
    type: 'diary',
    title: '写日记提醒',
    body: '今天过得怎么样？记录一下吧 ✍️',
    time: '21:00',
    days: [],
    enabled: true,
  },
  {
    id: 'habit-morning',
    type: 'habit',
    title: '习惯打卡',
    body: '新的一天开始了，别忘了完成今天的习惯哦 💪',
    time: '09:00',
    days: [],
    enabled: true,
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  reminders: [],
  initialized: false,

  setReminders: (reminders) => {
    set({ reminders });
    debouncedSave(reminders);
    window.electronAPI?.notificationSetReminders?.(reminders);
  },

  addReminder: (reminder) => {
    const { reminders } = get();
    const newReminders = [...reminders, reminder];
    set({ reminders: newReminders });
    debouncedSave(newReminders);
    window.electronAPI?.notificationAddReminder?.(reminder);
  },

  removeReminder: (id) => {
    const { reminders } = get();
    const newReminders = reminders.filter(r => r.id !== id);
    set({ reminders: newReminders });
    debouncedSave(newReminders);
    window.electronAPI?.notificationRemoveReminder?.(id);
  },

  toggleReminder: (id) => {
    const { reminders } = get();
    const newReminders = reminders.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    set({ reminders: newReminders });
    debouncedSave(newReminders);
    window.electronAPI?.notificationToggleReminder?.(id);
  },

  updateReminder: (id, updates) => {
    const { reminders } = get();
    const newReminders = reminders.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ reminders: newReminders });
    debouncedSave(newReminders);
    window.electronAPI?.notificationSetReminders?.(newReminders);
  },

  initFromStorage: () => {
    if (get().initialized) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    let reminders: Reminder[];

    if (stored) {
      try {
        reminders = JSON.parse(stored);
      } catch {
        reminders = DEFAULT_REMINDERS;
      }
    } else {
      reminders = DEFAULT_REMINDERS;
    }

    set({ reminders, initialized: true });
    window.electronAPI?.notificationSetReminders?.(reminders);
    window.electronAPI?.notificationStartCheck?.();
  },
}));
