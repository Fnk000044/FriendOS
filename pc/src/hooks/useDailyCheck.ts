import { useEffect, useState, useCallback } from 'react';
import {
  runDailyCheck, startScheduler, stopScheduler, subscribeDailyCheck,
  getLatestDailyCheck, type DailyCheckResult,
} from '../services/emotion/DailyCheckScheduler';

/**
 * 每日健康检查 hook
 * 在组件挂载时启动调度器（引用计数），卸载时清理。
 * 订阅调度器的实时结果（修复：此前启动时跑出的检查结果被丢弃，
 * 预警横幅/行为洞察永远是空态）；同时暴露手动刷新方法。
 */
export function useDailyCheck() {
  const [result, setResult] = useState<DailyCheckResult | null>(() => getLatestDailyCheck());
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
    // 立即订阅：已完成的调度结果也会回放一次
    const unsubscribe = subscribeDailyCheck(setResult);
    return () => {
      unsubscribe();
      stopScheduler();
    };
  }, []);

  return { result, loading, refresh };
}
