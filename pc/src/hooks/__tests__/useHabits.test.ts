import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { db } from '../../db';
import { useHabits } from '../useHabits';
import { getToday, getDaysAgo, formatLocalDate } from '../../utils/date';

describe('hooks/useHabits', () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.habitLogs.clear();
  });

  describe('createHabit', () => {
    it('创建习惯成功，返回非空 id 并写入数据库', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({
          name: '冥想',
          description: '每天 10 分钟',
          color: '#14B8A6',
          icon: 'heart',
          frequency: 'daily',
          targetCount: 1,
          unit: '次',
        });
      });

      expect(id).not.toBeNull();
      const stored = await db.habits.get(id!);
      expect(stored).toBeDefined();
      expect(stored!.name).toBe('冥想');
      expect(stored!.description).toBe('每天 10 分钟');
      expect(stored!.color).toBe('#14B8A6');
      expect(stored!.icon).toBe('heart');
      expect(stored!.frequency).toBe('daily');
      expect(stored!.targetCount).toBe(1);
      expect(stored!.unit).toBe('次');
      expect(stored!.archived).toBe(false);
    });

    it('缺省字段：color/icon/frequency/targetCount 取默认值', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '阅读' });
      });

      const stored = await db.habits.get(id!);
      expect(stored!.color).toBe('#14B8A6');
      expect(stored!.icon).toBe('target');
      expect(stored!.frequency).toBe('daily');
      expect(stored!.targetCount).toBe(1);
      expect(stored!.description).toBe('');
      expect(stored!.unit).toBeUndefined();
    });
  });

  describe('updateHabit', () => {
    it('更新习惯字段并持久化', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '运动' });
      });

      await act(async () => {
        await result.current.updateHabit(id!, {
          name: '每日运动',
          targetCount: 3,
          archived: true,
        });
      });

      const stored = await db.habits.get(id!);
      expect(stored!.name).toBe('每日运动');
      expect(stored!.targetCount).toBe(3);
      expect(stored!.archived).toBe(true);
    });
  });

  describe('deleteHabit', () => {
    it('删除习惯同时级联删除关联 habitLogs', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '早睡' });
      });

      // 注入两条关联日志
      await db.habitLogs.bulkAdd([
        { id: 'log-1', habitId: id!, date: '2026-07-26', count: 1, createdAt: new Date().toISOString() },
        { id: 'log-2', habitId: id!, date: '2026-07-27', count: 1, createdAt: new Date().toISOString() },
        { id: 'log-3', habitId: '其他', date: '2026-07-27', count: 1, createdAt: new Date().toISOString() },
      ]);

      await act(async () => {
        await result.current.deleteHabit(id!);
      });

      const habit = await db.habits.get(id!);
      expect(habit).toBeUndefined();

      // 关联日志应被清空
      const remaining = await db.habitLogs.where('habitId').equals(id!).toArray();
      expect(remaining).toHaveLength(0);

      // 其他习惯的日志保留
      const others = await db.habitLogs.where('habitId').equals('其他').toArray();
      expect(others).toHaveLength(1);
    });
  });

  describe('toggleLog', () => {
    it('无日志时创建一条，返回 true', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '喝水' });
      });

      let created: boolean | null = null;
      await act(async () => {
        created = await result.current.toggleLog(id!, '2026-07-27');
      });

      expect(created).toBe(true);
      const logs = await db.habitLogs.where({ habitId: id!, date: '2026-07-27' }).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].count).toBe(1);
    });

    it('已存在日志时删除并返回 false（再次打卡为取消）', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '跑步' });
      });

      await act(async () => {
        await result.current.toggleLog(id!, '2026-07-27');
      });

      let removed: boolean | null = null;
      await act(async () => {
        removed = await result.current.toggleLog(id!, '2026-07-27');
      });

      expect(removed).toBe(false);
      const logs = await db.habitLogs.where({ habitId: id!, date: '2026-07-27' }).toArray();
      expect(logs).toHaveLength(0);
    });
  });

  describe('getStreak', () => {
    it('无任何日志返回 0', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(0);
    });

    it('今天打卡但昨天没打 → streak = 1', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      const today = getToday();
      await db.habitLogs.add({
        id: 's-1', habitId: id!, date: today, count: 1, createdAt: new Date().toISOString(),
      });

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(1);
    });

    it('今天和昨天都打卡 → streak = 2', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      const today = getToday();
      const yesterday = getDaysAgo(1);
      await db.habitLogs.bulkAdd([
        { id: 's-y', habitId: id!, date: yesterday, count: 1, createdAt: new Date().toISOString() },
        { id: 's-t', habitId: id!, date: today, count: 1, createdAt: new Date().toISOString() },
      ]);

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(2);
    });

    it('连续 5 天打卡（含今天）→ streak = 5', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      const today = getToday();
      const logs = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        logs.push({
          id: `streak-${i}`, habitId: id!, date: formatLocalDate(d),
          count: 1, createdAt: new Date().toISOString(),
        });
      }
      await db.habitLogs.bulkAdd(logs);

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(5);
    });

    it('最近一次打卡既不是今天也不是昨天 → streak = 0', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      // 3 天前打卡，断签
      const threeDaysAgo = getDaysAgo(3);
      await db.habitLogs.add({
        id: 's-gap', habitId: id!, date: threeDaysAgo, count: 1, createdAt: new Date().toISOString(),
      });

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(0);
    });

    it('最近一次打卡是昨天，且昨天往前连续 3 天 → streak = 3（今天未打卡仍算）', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      // 构造：昨天、2 天前、3 天前各 1 条，今天未打卡
      const yesterday = getDaysAgo(1);
      const twoDaysAgo = getDaysAgo(2);
      const threeDaysAgo = getDaysAgo(3);
      const dates = [yesterday, twoDaysAgo, threeDaysAgo];
      await db.habitLogs.bulkAdd(
        dates.map((date, i) => ({
          id: `streak-y-${i}`, habitId: id!, date, count: 1, createdAt: new Date().toISOString(),
        }))
      );

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(3);
    });

    it('重复日志不虚高 streak（同日去重）', async () => {
      const { result } = renderHook(() => useHabits());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createHabit({ name: '冥想' });
      });

      const today = getToday();
      // 同一天注入 3 条重复日志
      await db.habitLogs.bulkAdd([
        { id: 'dup-1', habitId: id!, date: today, count: 1, createdAt: new Date().toISOString() },
        { id: 'dup-2', habitId: id!, date: today, count: 1, createdAt: new Date().toISOString() },
        { id: 'dup-3', habitId: id!, date: today, count: 1, createdAt: new Date().toISOString() },
      ]);

      let streak = -1;
      await act(async () => {
        streak = await result.current.getStreak(id!);
      });
      expect(streak).toBe(1);
    });
  });
});
