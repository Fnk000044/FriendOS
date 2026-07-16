import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import type { Task, SubTask } from '../db/models';
import { getToday, formatLocalDate } from '../utils/date';
import { contextService } from '../services/ai/ContextService';

function buildTask(data: {
  title: string;
  description?: string;
  priority?: Task['priority'];
  scheduledDate?: string;
  tags?: string[];
  estimatedMinutes?: number;
  repeatInterval?: number;
  repeatEnd?: string;
  dueTime?: string;
  reminderEnabled?: boolean;
  subtasks?: SubTask[];
  sortOrder?: number;
}, date?: string): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'medium',
    status: 'pending',
    scheduledDate: date || data.scheduledDate || getToday(),
    dueTime: data.dueTime,
    reminderEnabled: data.reminderEnabled ?? false,
    subtasks: data.subtasks || [],
    sortOrder: data.sortOrder ?? Date.now(),
    createdAt: now,
    updatedAt: now,
    isRollover: false,
    rolloverCount: 0,
    tags: data.tags || [],
    estimatedMinutes: data.estimatedMinutes,
    repeatInterval: data.repeatInterval,
    repeatEnd: data.repeatEnd,
  };
}

export function useTasks() {
  const createTask = useCallback(async (data: {
    title: string;
    description?: string;
    priority?: Task['priority'];
    scheduledDate?: string;
    tags?: string[];
    estimatedMinutes?: number;
    repeatInterval?: number;
    repeatEnd?: string;
    dueTime?: string;
    reminderEnabled?: boolean;
    subtasks?: SubTask[];
    sortOrder?: number;
  }) => {
    try {
      const task = buildTask(data);
      await db.tasks.add(task);
      contextService.clearCache();
      return task.id;
    } catch (err) {
      console.error('[useTasks] createTask error:', err);
      toast.error('创建任务失败');
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    try {
      await db.tasks.update(id, { ...data, updatedAt: new Date().toISOString() });
      contextService.clearCache();
    } catch (err) {
      console.error('[useTasks] updateTask error:', err);
      toast.error('更新任务失败');
    }
  }, []);

  const toggleTask = useCallback(async (id: string, currentStatus: Task['status']) => {
    try {
      // If completed or cancelled, go back to pending; otherwise mark as completed
      const newStatus: Task['status'] = (currentStatus === 'completed' || currentStatus === 'cancelled')
        ? 'pending'
        : 'completed';
      await db.tasks.update(id, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      });
      contextService.clearCache();
    } catch (err) {
      console.error('[useTasks] toggleTask error:', err);
      toast.error('更新任务状态失败');
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await db.tasks.delete(id);
      contextService.clearCache();
    } catch (err) {
      console.error('[useTasks] deleteTask error:', err);
      toast.error('删除任务失败');
    }
  }, []);

  // 子任务操作
  const addSubtask = useCallback(async (taskId: string, title: string) => {
    try {
      const task = await db.tasks.get(taskId);
      if (!task) return;
      const subtasks = task.subtasks || [];
      const newSub: SubTask = { id: crypto.randomUUID(), title, done: false };
      await db.tasks.update(taskId, {
        subtasks: [...subtasks, newSub],
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[useTasks] addSubtask error:', err);
      toast.error('添加子任务失败');
    }
  }, []);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    try {
      const task = await db.tasks.get(taskId);
      if (!task || !task.subtasks) return;
      const subtasks = task.subtasks.map(s =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      );
      await db.tasks.update(taskId, { subtasks, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('[useTasks] toggleSubtask error:', err);
    }
  }, []);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    try {
      const task = await db.tasks.get(taskId);
      if (!task || !task.subtasks) return;
      const subtasks = task.subtasks.filter(s => s.id !== subtaskId);
      await db.tasks.update(taskId, { subtasks, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('[useTasks] deleteSubtask error:', err);
    }
  }, []);

  // 拖拽重排：批量更新 sortOrder
  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    try {
      const now = Date.now();
      await db.transaction('rw', db.tasks, async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          await db.tasks.update(orderedIds[i], { sortOrder: now + i });
        }
      });
    } catch (err) {
      console.error('[useTasks] reorderTasks error:', err);
      toast.error('排序失败');
    }
  }, []);

  const createRecurringTasks = useCallback(async (data: {
    title: string;
    description?: string;
    priority?: Task['priority'];
    tags?: string[];
    estimatedMinutes?: number;
    dueTime?: string;
    reminderEnabled?: boolean;
    subtasks?: SubTask[];
  }, interval: number, startDate: string, endDate: string) => {
    // Guard against invalid interval
    if (interval <= 0) {
      console.error('[useTasks] createRecurringTasks: interval must be positive');
      toast.error('重复间隔必须大于 0');
      return 0;
    }

    try {
      const instances: Task[] = [];
      let currentDate = startDate;
      const maxIterations = 365; // Safety limit
      let iterations = 0;

      while (currentDate <= endDate && iterations < maxIterations) {
        instances.push(buildTask(data, currentDate));
        const d = new Date(currentDate);
        d.setDate(d.getDate() + interval);
        currentDate = formatLocalDate(d);
        iterations++;
      }

      if (instances.length > 0) {
        await db.tasks.bulkAdd(instances);
      }
      return instances.length;
    } catch (err) {
      console.error('[useTasks] createRecurringTasks error:', err);
      toast.error('创建重复任务失败');
      return 0;
    }
  }, []);

  return {
    createTask, updateTask, toggleTask, deleteTask,
    addSubtask, toggleSubtask, deleteSubtask, reorderTasks,
    createRecurringTasks,
  };
}
