import { create } from 'zustand';
import { getToday } from '../utils/date';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  quickCaptureOpen: boolean;
  currentDate: string;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  setCurrentDate: (date: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  quickCaptureOpen: false,
  currentDate: getToday(),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  openQuickCapture: () => set({ quickCaptureOpen: true }),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
  setCurrentDate: (date) => set({ currentDate: date }),
}));