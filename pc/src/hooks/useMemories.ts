import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import type { Memory } from '../db/models';
import { contextService } from '../services/ai/ContextService';

export function useMemories() {
  const createMemory = useCallback(async (data: {
    title: string;
    content: string;
    type?: Memory['type'];
    source?: string;
    tags?: string[];
    category?: string;
    pinned?: boolean;
  }) => {
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await db.memories.add({
        id,
        title: data.title,
        content: data.content,
        type: data.type || 'manual',
        source: data.source,
        tags: data.tags || [],
        category: data.category || '默认',
        archived: false,
        pinned: data.pinned || false,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('已保存到记忆库');
      contextService.clearCache();
      return id;
    } catch (err) {
      console.error('[useMemories] createMemory error:', err);
      toast.error('保存记忆失败');
      return null;
    }
  }, []);

  const updateMemory = useCallback(async (id: string, data: Partial<Memory>) => {
    try {
      const updated = await db.memories.update(id, { ...data, updatedAt: new Date().toISOString() });
      if (updated === 0) {
        toast.error('记忆不存在');
        return;
      }
      toast.success('记忆已更新');
      contextService.clearCache();
    } catch (err) {
      console.error('[useMemories] updateMemory error:', err);
      toast.error('更新记忆失败');
    }
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    try {
      await db.memories.delete(id);
      toast.success('记忆已删除');
      contextService.clearCache();
    } catch (err) {
      console.error('[useMemories] deleteMemory error:', err);
      toast.error('删除记忆失败');
    }
  }, []);

  const togglePin = useCallback(async (id: string, pinned: boolean) => {
    try {
      await db.memories.update(id, { pinned: !pinned, updatedAt: new Date().toISOString() });
      toast.success(pinned ? '已取消置顶' : '已置顶');
      contextService.clearCache();
    } catch (err) {
      console.error('[useMemories] togglePin error:', err);
      toast.error('操作失败');
    }
  }, []);

  return { createMemory, updateMemory, deleteMemory, togglePin };
}
