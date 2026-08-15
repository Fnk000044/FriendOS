import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import type { SyncPayloadItem, Task } from '../db/models';
import { getToday } from '../utils/date';

/** 清理同步数据中的潜在危险内容 */
function sanitizeString(value: unknown, maxLength = 1000): string {
  if (typeof value !== 'string') return '';
  // 移除 HTML 标签和危险字符
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === 'string')
    .map(t => sanitizeString(t, 50))
    .filter(Boolean)
    .slice(0, 20); // 最多 20 个标签
}

const VALID_PRIORITIES: Task['priority'][] = ['urgent', 'high', 'medium', 'low'];

function sanitizePriority(value: unknown): Task['priority'] {
  if (typeof value === 'string' && VALID_PRIORITIES.includes(value as Task['priority'])) {
    return value as Task['priority'];
  }
  return 'medium';
}

export function useSyncReceiver() {
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onSyncReceive) return;

    const handler = async (items: SyncPayloadItem[]) => {
      let savedCount = 0;

      try {
        await db.transaction('rw', [db.tasks, db.diaries, db.memories, db.syncLogs], async () => {
          for (const item of items) {
            if (item.type === 'task') {
              await db.tasks.add({
                id: crypto.randomUUID(),
                title: sanitizeString(item.title, 200),
                description: sanitizeString(item.description, 2000),
                priority: sanitizePriority(item.priority),
                status: 'pending',
                scheduledDate: item.scheduledDate || getToday(),
                tags: sanitizeTags(item.tags),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isRollover: false,
                rolloverCount: 0,
              });
              savedCount++;
            } else if (item.type === 'diary' && item.content) {
              await db.diaries.add({
                id: crypto.randomUUID(),
                date: item.scheduledDate || getToday(),
                title: sanitizeString(item.title, 200),
                content: sanitizeString(item.content, 10000),
                mood: 3 as const,
                weather: '',
                tags: sanitizeTags(item.tags),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              savedCount++;
            } else if (item.type === 'memory' && item.content) {
              await db.memories.add({
                id: crypto.randomUUID(),
                title: sanitizeString(item.title, 200),
                content: sanitizeString(item.content, 10000),
                type: 'manual' as const,
                category: sanitizeString(item.category, 50) || '其他',
                tags: sanitizeTags(item.tags),
                archived: false,
                pinned: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              savedCount++;
            }
          }

          // 存储清理后的日志（避免原始恶意内容持久化）
          const sanitizedItems = items.map(item => ({
            ...item,
            title: sanitizeString(item.title, 200),
            content: sanitizeString(item.content, 10000),
            description: sanitizeString(item.description, 2000),
          }));

          await db.syncLogs.add({
            id: crypto.randomUUID(),
            items: sanitizedItems,
            source: 'android',
            status: savedCount === items.length ? 'success' : 'partial',
            syncedAt: new Date().toISOString(),
          });
        });
      } catch (err) {
        console.error('[Sync] Transaction failed:', err);
      }

      if (savedCount > 0) {
        toast.success(`已从手机同步 ${savedCount} 条数据`);
      } else if (items.length > 0) {
        toast.error('同步失败，请检查数据格式');
      }
    };

    const cleanup = api.onSyncReceive(handler);
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);
}
