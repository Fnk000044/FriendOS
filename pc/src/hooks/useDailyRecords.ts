import { useCallback } from 'react';
import { db } from '../db';

export function useDailyRecords() {
  const computeDailyRecord = useCallback(async (date: string) => {
    try {
      const [todayTasks, diary, todayHabitLogs, allHabits] = await Promise.all([
        db.tasks.where('scheduledDate').equals(date).toArray(),
        db.diaries.where('date').equals(date).first(),
        db.habitLogs.where('date').equals(date).toArray(),
        db.habits.where('archived').equals(0).toArray(),
      ]);

      const tasksTotal = todayTasks.length;
      const tasksCompleted = todayTasks.filter((t) => t.status === 'completed').length;
      const habitsTotal = allHabits.length;
      const habitsCompleted = todayHabitLogs.length;

      const record = {
        id: date,
        date,
        tasksCompleted,
        tasksTotal,
        diaryWritten: !!diary,
        moodAvg: diary?.mood || undefined,
        habitsCompleted,
        habitsTotal,
        habitsCompletionRate: habitsTotal > 0 ? habitsCompleted / habitsTotal : 0,
        wordCount: diary?.content?.length || 0,
        createdAt: new Date().toISOString(),
      };

      await db.dailyRecords.put(record);
      return record;
    } catch (err) {
      console.error('[useDailyRecords] Failed to compute daily record:', err);
      return null;
    }
  }, []);

  return { computeDailyRecord };
}
