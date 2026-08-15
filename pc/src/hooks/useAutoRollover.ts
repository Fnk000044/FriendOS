import { useEffect, useState, useCallback } from 'react';
import { runRollover } from '../utils/rollover';

export function useAutoRollover() {
  const [rolledCount, setRolledCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const count = await runRollover();
        if (!cancelled && count > 0) {
          setRolledCount(count);
          setShowBanner(true);
        }
      } catch (err) {
        console.error('[useAutoRollover] Rollover failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dismissBanner = useCallback(() => setShowBanner(false), []);

  return { rolledCount, showBanner, dismissBanner };
}
