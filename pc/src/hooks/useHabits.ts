import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import type { Habit } from '../db/models';
import { getToday, getDaysAgo, formatLocalDate } from '../utils/date';
import { contextService } from '../services/ai/ContextService';

export function useHabits() {
  const createHabit = useCallback(async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    targetCount?: number;
    unit?: string;
  }) => {
    try {
      const id = crypto.randomUUID();
      await db.habits.add({
        id,
        name: data.name,
        description: data.description || '',
        color: data.color || '#14B8A6',
        icon: data.icon || 'target',
        frequency: data.frequency || 'daily',
        targetCount: data.targetCount || 1,
        unit: data.unit,
        archived: false,
        createdAt: new Date().toISOString(),
      });
      toast.success('习惯已创建');
      contextService.clearCache();
      return id;
    } catch (err) {
      console.error('[useHabits] createHabit error:', err);
      toast.error('创建习惯失败');
      return null;
    }
  }, []);

  const updateHabit = useCallback(async (id: string, data: Partial<Habit>) => {
    try {
      await db.habits.update(id, data);
      contextService.clearCache();
    } catch (err) {
      console.error('[useHabits] updateHabit error:', err);
      toast.error('更新习惯失败');
    }
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      // Use Dexie transaction for atomicity
      await db.transaction('rw', db.habits, db.habitLogs, async () => {
        await db.habits.delete(id);
        await db.habitLogs.where('habitId').equals(id).delete();
      });
      toast.success('习惯已删除');
      contextService.clearCache();
    } catch (err) {
      console.error('[useHabits] deleteHabit error:', err);
      toast.error('删除习惯失败');
    }
  }, []);

  const toggleLog = useCallback(async (habitId: string, date: string) => {
    try {
      let result = false;
      await db.transaction('rw', db.habitLogs, async () => {
        const existing = await db.habitLogs
          .where({ habitId, date })
          .first();

        if (existing) {
          await db.habitLogs.delete(existing.id);
          result = false;
        } else {
          await db.habitLogs.add({
            id: crypto.randomUUID(),
            habitId,
            date,
            count: 1,
            createdAt: new Date().toISOString(),
          });
          result = true;
        }
      });
      contextService.clearCache();
      return result;
    } catch (err) {
      console.error('[useHabits] toggleLog error:', err);
      toast.error('打卡失败');
      return null;
    }
  }, []);

  const getStreak = useCallback(async (habitId: string): Promise<number> => {
    try {
      const logs = await db.habitLogs
        .where('habitId')
        .equals(habitId)
        .sortBy('date');

      if (logs.length === 0) return 0;

      // 按日期去重，防止重复日志导致连续天数虚高
      const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse();
      const today = getToday();
      const yesterday = getDaysAgo(1);

      // Start from the most recent log
      let streak = 0;
      let expectedDate = today;

      // If the most recent log is not today or yesterday, streak is 0
      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
      }

      // If most recent is yesterday, start counting from yesterday
      if (uniqueDates[0] === yesterday) {
        expectedDate = yesterday;
      }

      for (const date of uniqueDates) {
        if (date === expectedDate) {
          streak++;
          // Move to previous day
          const d = new Date(expectedDate);
          d.setDate(d.getDate() - 1);
          expectedDate = formatLocalDate(d);
        } else if (date < expectedDate) {
          // Gap found, streak ends
          break;
        }
      }

      return streak;
    } catch (err) {
      console.error('[useHabits] getStreak error:', err);
      return 0;
    }
  }, []);

  return { createHabit, updateHabit, deleteHabit, toggleLog, getStreak };
}
