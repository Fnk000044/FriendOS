import { useEffect, useState, useCallback } from 'react';
import { runDailyCheck, startScheduler, stopScheduler, type DailyCheckResult } from '../services/emotion/DailyCheckScheduler';

/**
 * 每日健康检查 hook
 * 在 AppLayout 挂载时启动调度器，卸载时清理。
 * 暴露最新检查结果 + 手动刷新方法。
 */
export function useDailyCheck() {
  const [result, setResult] = useState<DailyCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await runDailyCheck();
      setResult(r);
    } catch (e) {
      console.error('[useDailyCheck] refresh error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startScheduler();
    return () => {
      stopScheduler();
    };
  }, []);

  return { result, loading, refresh };
}
