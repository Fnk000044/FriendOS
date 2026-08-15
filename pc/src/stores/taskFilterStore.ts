import { create } from 'zustand';

export type TaskFilterStatus = 'all' | 'pending' | 'completed' | 'overdue';
export type TaskFilterPriority = 'all' | 'urgent' | 'high' | 'medium' | 'low';

interface TaskFilterState {
  status: TaskFilterStatus;
  priority: TaskFilterPriority;
  search: string;
  dateRange: [string, string] | null;
  setStatus: (s: TaskFilterStatus) => void;
  setPriority: (p: TaskFilterPriority) => void;
  setSearch: (s: string) => void;
  setDateRange: (range: [string, string] | null) => void;
}

export const useTaskFilterStore = create<TaskFilterState>((set) => ({
  status: 'all',
  priority: 'all',
  search: '',
  dateRange: null,
  setStatus: (status) => set({ status }),
  setPriority: (priority) => set({ priority }),
  setSearch: (search) => set({ search }),
  setDateRange: (dateRange) => set({ dateRange }),
}));
