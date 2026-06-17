import { useState, useCallback } from 'react';
import { db } from '../db';
import type { Assessment } from '../db/models';
import { useLiveQuery } from 'dexie-react-hooks';

/**
 * Hook for psychological assessments (PHQ-9, GAD-7, PSS-10)
 */
export function useAssessments() {
  const [loading, setLoading] = useState(false);

  // Get all assessments, sorted by date descending
  const assessments = useLiveQuery(async () => {
    return db.assessments.orderBy('date').reverse().toArray();
  }, []);

  // Get recent assessments by type
  const getAssessmentsByType = useCallback(async (type: Assessment['type'], limit = 10) => {
    try {
      return await db.assessments
        .where('type')
        .equals(type)
        .reverse()
        .limit(limit)
        .toArray();
    } catch (err) {
      console.error('[useAssessments] Failed to get assessments by type:', err);
      return [];
    }
  }, []);

  // Save a new assessment
  const saveAssessment = useCallback(async (assessment: Omit<Assessment, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      await db.assessments.add({
        ...assessment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error('[useAssessments] Failed to save assessment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete an assessment
  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await db.assessments.delete(id);
      return true;
    } catch (err) {
      console.error('[useAssessments] Failed to delete assessment:', err);
      return false;
    }
  }, []);

  return {
    assessments,
    loading,
    getAssessmentsByType,
    saveAssessment,
    deleteAssessment,
  };
}
