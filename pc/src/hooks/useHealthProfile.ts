/**
 * useHealthProfile Hook
 * Provides reactive access to health profile data with auto-generation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateHealthProfile } from '../services/emotion/HealthProfileService';
import { getDaysAgo } from '../utils/date';
import type { HealthProfile } from '../db/models';

export function useHealthProfile() {
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);

  // Live query for the latest health profile
  const healthProfile = useLiveQuery(
    () => db.healthProfiles.orderBy('date').last() ?? null,
    []
  );

  // Auto-generate profile if none exists (用 ref 防止并发调用)
  useEffect(() => {
    if (healthProfile === null && !generatingRef.current) {
      generatingRef.current = true;
      setGenerating(true);
      generateHealthProfile()
        .catch(err => console.error('[useHealthProfile] Auto-generate failed:', err))
        .finally(() => { generatingRef.current = false; setGenerating(false); });
    }
  }, [healthProfile]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setGenerating(true);
    try {
      return await generateHealthProfile();
    } catch (err) {
      console.error('[useHealthProfile] Refresh failed:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  // Get recent health profiles (for trend)
  const recentProfiles = useLiveQuery(async () => {
    return db.healthProfiles
      .where('date')
      .aboveOrEqual(getDaysAgo(30))
      .sortBy('date');
  }, []);

  return {
    healthProfile: healthProfile ?? undefined,
    recentProfiles: recentProfiles ?? [],
    generating,
    refresh,
  };
}
