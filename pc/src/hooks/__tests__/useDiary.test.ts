import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { db } from '../../db';
import { useDiary } from '../useDiary';

describe('hooks/useDiary', () => {
  beforeEach(async () => {
    await db.diaries.clear();
  });

  describe('createEntry', () => {
    it('创建日记成功，返回非空 id 并写入数据库', async () => {
      const { result } = renderHook(() => useDiary());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createEntry({
          date: '2026-07-27',
          title: '今天',
          content: '心情不错',
          mood: 4,
          weather: 'sunny',
          tags: ['日常'],
        });
      });

      expect(id).not.toBeNull();
      const stored = await db.diaries.get(id!);
      expect(stored).toBeDefined();
      expect(stored!.date).toBe('2026-07-27');
      expect(stored!.title).toBe('今天');
      expect(stored!.content).toBe('心情不错');
      expect(stored!.mood).toBe(4);
      expect(stored!.weather).toBe('sunny');
      expect(stored!.tags).toEqual(['日常']);
      expect(stored!.createdAt).toBe(stored!.updatedAt);
    });

    it('title 缺省为空字符串，tags 缺省为空数组', async () => {
      const { result } = renderHook(() => useDiary());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createEntry({
          date: '2026-07-27',
          content: '无标题',
          mood: 3,
        });
      });

      const stored = await db.diaries.get(id!);
      expect(stored!.title).toBe('');
      expect(stored!.tags).toEqual([]);
      expect(stored!.weather).toBeUndefined();
    });
  });

  describe('updateEntry', () => {
    it('更新日记字段，返回 true', async () => {
      const { result } = renderHook(() => useDiary());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createEntry({
          date: '2026-07-27',
          content: '初始',
          mood: 2,
        });
      });

      // 等待时间戳递增
      await new Promise(r => setTimeout(r, 5));

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.updateEntry(id!, {
          title: '新标题',
          mood: 5,
          tags: ['开心'],
        });
      });

      expect(ok).toBe(true);
      const stored = await db.diaries.get(id!);
      expect(stored!.title).toBe('新标题');
      expect(stored!.mood).toBe(5);
      expect(stored!.tags).toEqual(['开心']);
      // content 未传，保持不变
      expect(stored!.content).toBe('初始');
    });

    it('更新不存在的 id 返回 false', async () => {
      const { result } = renderHook(() => useDiary());

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.updateEntry('不存在的-id', { mood: 4 });
      });

      expect(ok).toBe(false);
    });
  });

  describe('deleteEntry', () => {
    it('删除后数据库中查不到，返回 true', async () => {
      const { result } = renderHook(() => useDiary());

      let id: string | null = null;
      await act(async () => {
        id = await result.current.createEntry({
          date: '2026-07-27',
          content: '要删的',
          mood: 1,
        });
      });

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.deleteEntry(id!);
      });

      expect(ok).toBe(true);
      const after = await db.diaries.get(id!);
      expect(after).toBeUndefined();
    });
  });
});
