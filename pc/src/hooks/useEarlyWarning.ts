import { useState, useEffect, useCallback } from 'react';
import { getEarlyWarning, type EarlyWarningResult } from '../services/emotion/EarlyWarningService';

/**
 * 早期风险预警 hook
 *
 * 调用 EarlyWarningService.getEarlyWarning()，按 5 分钟缓存。
 * 可通过 refresh() 主动刷新；在组件卸载时自动中止未完成请求。
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

export function useEarlyWarning() {
  const [result, setResult] = useState<EarlyWarningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getEarlyWarning();
      setResult(r);
      setLastFetched(Date.now());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to compute early warning');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    if (lastFetched > 0 && now - lastFetched < CACHE_TTL_MS) return;

    (async () => {
      if (cancelled) return;
      await refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh, lastFetched]);

  return { result, loading, error, refresh };
}
