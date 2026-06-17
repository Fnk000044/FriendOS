import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import type { Task } from '../db/models';
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
}, date?: string): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'medium',
    status: 'pending',
    scheduledDate: date || data.scheduledDate || getToday(),
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

  const createRecurringTasks = useCallback(async (data: {
    title: string;
    description?: string;
    priority?: Task['priority'];
    tags?: string[];
    estimatedMinutes?: number;
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

  return { createTask, updateTask, toggleTask, deleteTask, createRecurringTasks };
}
