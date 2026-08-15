import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { db } from '../../db';
import { useTasks } from '../useTasks';
<<<<<<< HEAD
import { formatLocalDate } from '../../utils/date';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import type { Task } from '../../db/models';

describe('hooks/useTasks', () => {
  beforeEach(async () => {
    // 每个用例前清空 tasks 表，避免相互污染
    await db.tasks.clear();
  });

  describe('createTask', () => {
    it('创建任务成功，返回非空 id 并写入数据库', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '买菜' });
      });

      expect(id).not.toBeNull();
      const stored = await db.tasks.get(id!);
      expect(stored).toBeDefined();
      expect(stored!.title).toBe('买菜');
      expect(stored!.status).toBe('pending');
      expect(stored!.priority).toBe('medium'); // 默认值
      expect(stored!.subtasks).toEqual([]);
      expect(stored!.isRollover).toBe(false);
      expect(stored!.rolloverCount).toBe(0);
    });

    it('带可选字段的任务被正确持久化', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({
          title: '写报告',
          description: 'Q3 季度报告',
          priority: 'high',
          tags: ['工作', '紧急'],
          estimatedMinutes: 120,
          dueTime: '18:00',
          reminderEnabled: true,
          subtasks: [{ id: 'sub-1', title: '收集数据', done: false }],
        });
      });

      const stored = await db.tasks.get(id!);
      expect(stored!.description).toBe('Q3 季度报告');
      expect(stored!.priority).toBe('high');
      expect(stored!.tags).toEqual(['工作', '紧急']);
      expect(stored!.estimatedMinutes).toBe(120);
      expect(stored!.dueTime).toBe('18:00');
      expect(stored!.reminderEnabled).toBe(true);
      expect(stored!.subtasks).toHaveLength(1);
      expect(stored!.subtasks![0].title).toBe('收集数据');
    });

    it('scheduledDate 默认为今天', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '今日任务' });
      });

      const stored = await db.tasks.get(id!);
<<<<<<< HEAD
      // 应用统一使用本地日期（formatLocalDate），不能用 UTC toISOString（时区午夜边界会漂移）
      const today = formatLocalDate(new Date());
=======
      const today = new Date().toISOString().slice(0, 10);
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
      expect(stored!.scheduledDate).toBe(today);
    });
  });

  describe('updateTask', () => {
    it('更新任务字段并写入 updatedAt', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '原标题' });
      });

      const before = await db.tasks.get(id!);
      // 隔开 5ms 确保 new Date().toISOString() 严格递增（避免同毫秒同时间戳导致断言失败）
      await new Promise(r => setTimeout(r, 5));
      await act(async () => {
        await result.current.updateTask(id!, { title: '新标题', priority: 'urgent' });
      });

      const after = await db.tasks.get(id!);
      expect(after!.title).toBe('新标题');
      expect(after!.priority).toBe('urgent');
      // updatedAt 应被覆盖为更晚的时间戳
      expect(new Date(after!.updatedAt).getTime()).toBeGreaterThan(new Date(before!.updatedAt).getTime());
    });
  });

  describe('toggleTask', () => {
    it('pending → completed，completedAt 被设置', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '待完成' });
      });

      await act(async () => {
        await result.current.toggleTask(id!, 'pending');
      });

      const after = await db.tasks.get(id!);
      expect(after!.status).toBe('completed');
      expect(after!.completedAt).toBeDefined();
    });

    it('completed → pending，completedAt 被清除', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '已完成' });
      });
      await act(async () => {
        await result.current.toggleTask(id!, 'pending');
      });

      await act(async () => {
        await result.current.toggleTask(id!, 'completed');
      });

      const after = await db.tasks.get(id!);
      expect(after!.status).toBe('pending');
      expect(after!.completedAt).toBeUndefined();
    });

    it('cancelled → pending（与 completed 一致，回退到 pending）', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '已取消' });
      });

      await act(async () => {
        await result.current.toggleTask(id!, 'cancelled');
      });

      const after = await db.tasks.get(id!);
      expect(after!.status).toBe('pending');
    });
  });

  describe('deleteTask', () => {
    it('删除后数据库中查不到', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '要删的' });
      });

      await act(async () => {
        await result.current.deleteTask(id!);
      });

      const after = await db.tasks.get(id!);
      expect(after).toBeUndefined();
    });
  });

  describe('子任务操作', () => {
    it('addSubtask 追加子任务到现有 task', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({ title: '父任务' });
      });

      await act(async () => {
        await result.current.addSubtask(id!, '子任务1');
        await result.current.addSubtask(id!, '子任务2');
      });

      const stored = await db.tasks.get(id!);
      expect(stored!.subtasks).toHaveLength(2);
      expect(stored!.subtasks![0].title).toBe('子任务1');
      expect(stored!.subtasks![1].title).toBe('子任务2');
      expect(stored!.subtasks!.every(s => !s.done)).toBe(true);
    });

    it('toggleSubtask 切换子任务完成态', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({
          title: '父',
          subtasks: [{ id: 's1', title: '子', done: false }],
        });
      });

      await act(async () => {
        await result.current.toggleSubtask(id!, 's1');
      });
      expect((await db.tasks.get(id!))!.subtasks![0].done).toBe(true);

      await act(async () => {
        await result.current.toggleSubtask(id!, 's1');
      });
      expect((await db.tasks.get(id!))!.subtasks![0].done).toBe(false);
    });

    it('deleteSubtask 按 id 移除子任务', async () => {
      const { result } = renderHook(() => useTasks());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createTask({
          title: '父',
          subtasks: [
            { id: 'keep', title: '保留', done: false },
            { id: 'drop', title: '删除', done: false },
          ],
        });
      });

      await act(async () => {
        await result.current.deleteSubtask(id!, 'drop');
      });

      const stored = await db.tasks.get(id!);
      expect(stored!.subtasks).toHaveLength(1);
      expect(stored!.subtasks![0].id).toBe('keep');
    });
  });

  describe('reorderTasks', () => {
    it('批量更新 sortOrder，按 reverse 后的顺序递增', async () => {
      const { result } = renderHook(() => useTasks());

      const ids: string[] = [];
      await act(async () => {
        ids.push((await result.current.createTask({ title: 'A' }))!);
        ids.push((await result.current.createTask({ title: 'B' }))!);
        ids.push((await result.current.createTask({ title: 'C' }))!);
      });

      // 反转顺序：C, B, A
      const reversed = [...ids].reverse();
      await act(async () => {
        await result.current.reorderTasks(reversed);
      });

      // 按 reversed 的顺序读 sortOrder：C < B < A（即先排序的 sortOrder 更小）
      const c = await db.tasks.get(reversed[0]);
      const b = await db.tasks.get(reversed[1]);
      const a = await db.tasks.get(reversed[2]);
      expect(a!.sortOrder!).toBeGreaterThan(b!.sortOrder!);
      expect(b!.sortOrder!).toBeGreaterThan(c!.sortOrder!);
    });
  });

  describe('createRecurringTasks', () => {
    it('非法 interval (<=0) 不创建任务，返回 0', async () => {
      const { result } = renderHook(() => useTasks());

      let count = -1;
      await act(async () => {
        count = await result.current.createRecurringTasks(
          { title: '重复' },
          0,
          '2026-01-01',
          '2026-01-31',
        );
      });

      expect(count).toBe(0);
      expect(await db.tasks.count()).toBe(0);
    });

    it('按 interval 在 [start, end] 区间内创建多个实例', async () => {
      const { result } = renderHook(() => useTasks());

      let count = -1;
      await act(async () => {
        // 每 7 天一次，从 2026-01-01 到 2026-01-22（含 1/1, 1/8, 1/15, 1/22 共 4 个）
        count = await result.current.createRecurringTasks(
          { title: '周会' },
          7,
          '2026-01-01',
          '2026-01-22',
        );
      });

      expect(count).toBe(4);
      const all = await db.tasks.toArray();
      expect(all).toHaveLength(4);
      expect(all.map(t => t.scheduledDate).sort()).toEqual([
        '2026-01-01', '2026-01-08', '2026-01-15', '2026-01-22',
      ]);
    });

    it('start === end 时只创建 1 个实例', async () => {
      const { result } = renderHook(() => useTasks());

      let count = -1;
      await act(async () => {
        count = await result.current.createRecurringTasks(
          { title: '单次' },
          7,
          '2026-01-01',
          '2026-01-01',
        );
      });

      expect(count).toBe(1);
    });
  });
});
