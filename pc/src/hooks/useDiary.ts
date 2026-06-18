import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { contextService } from '../services/ai/ContextService';

export function useDiary() {
  const createEntry = useCallback(async (data: {
    date: string;
    title?: string;
    content: string;
    mood: 1 | 2 | 3 | 4 | 5;
    weather?: string;
    tags?: string[];
  }) => {
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await db.diaries.add({
        id,
        date: data.date,
        title: data.title || '',
        content: data.content,
        mood: data.mood,
        weather: data.weather,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      toast.success('日记已保存');
      contextService.clearCache();
      return id;
    } catch (err) {
      console.error('[useDiary] createEntry error:', err);
      toast.error('保存失败，请重试');
      return null;
    }
  }, []);

  const updateEntry = useCallback(async (id: string, data: {
    title?: string;
    content?: string;
    mood?: 1 | 2 | 3 | 4 | 5;
    weather?: string;
    tags?: string[];
  }) => {
    try {
      const updated = await db.diaries.update(id, { ...data, updatedAt: new Date().toISOString() });
      if (updated === 0) {
        toast.error('日记不存在');
        return false;
      }
      toast.success('日记已更新');
      contextService.clearCache();
      return true;
    } catch (err) {
      console.error('[useDiary] updateEntry error:', err);
      toast.error('更新失败，请重试');
      return false;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await db.diaries.delete(id);
      toast.success('日记已删除');
      contextService.clearCache();
      return true;
    } catch (err) {
      console.error('[useDiary] deleteEntry error:', err);
      toast.error('删除失败，请重试');
      return false;
    }
  }, []);

  return { createEntry, updateEntry, deleteEntry };
}
