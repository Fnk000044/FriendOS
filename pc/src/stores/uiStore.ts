import { create } from 'zustand';
import { getToday } from '../utils/date';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  quickCaptureOpen: boolean;
  aiAssistantOpen: boolean;
  currentDate: string;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  toggleAiAssistant: () => void;
  setCurrentDate: (date: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  quickCaptureOpen: false,
  aiAssistantOpen: false,
  currentDate: getToday(),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  openQuickCapture: () => set({ quickCaptureOpen: true }),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
  toggleAiAssistant: () => set((s) => ({ aiAssistantOpen: !s.aiAssistantOpen })),
  setCurrentDate: (date) => set({ currentDate: date }),
}));