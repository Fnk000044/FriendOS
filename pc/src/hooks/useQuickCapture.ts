import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { classifyContent, type CaptureType } from '../utils/classification';

export function useQuickCapture() {
  const saveCapture = useCallback(async (content: string, typeOverride?: CaptureType) => {
    if (!content.trim()) return;

    try {
      const type = typeOverride || classifyContent(content);

      await db.quickCaptures.add({
        id: crypto.randomUUID(),
        content: content.trim(),
        type,
        processed: false,
        createdAt: new Date().toISOString(),
      });

      const typeLabels: Record<CaptureType, string> = {
        todo: '待办', diary: '日记', idea: '灵感', memory: '记忆', uncategorized: '未分类',
      };

      toast.success(`已记录到 ${typeLabels[type]}`);
      return { type, content: content.trim() };
    } catch (err) {
      console.error('[useQuickCapture] Failed to save:', err);
      toast.error('快速记录失败');
      return undefined;
    }
  }, []);

  return { saveCapture };
}
