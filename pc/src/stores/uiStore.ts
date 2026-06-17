import { create } from 'zustand';
import { getToday } from '../utils/date';

interface UIState {
  sidebarOpen: boolean;
  quickCaptureOpen: boolean;
  aiAssistantOpen: boolean;
  currentDate: string;
  toggleSidebar: () => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  toggleAiAssistant: () => void;
  setCurrentDate: (date: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  quickCaptureOpen: false,
  aiAssistantOpen: false,
  currentDate: getToday(),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openQuickCapture: () => set({ quickCaptureOpen: true }),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
  toggleAiAssistant: () => set((s) => ({ aiAssistantOpen: !s.aiAssistantOpen })),
  setCurrentDate: (date) => set({ currentDate: date }),
}));