import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { useLanguage } from '../i18n/useLanguage';
import type { MemoryCandidate } from '../db/models';
import { useMemories } from './useMemories';

export function useMemoryCandidates() {
  const { t } = useLanguage();
  const { createMemory } = useMemories();

  const confirmSelected = useCallback(async (candidates: MemoryCandidate[]) => {
    let confirmed = 0;
    for (const candidate of candidates) {
      try {
        const memoryId = await createMemory({
          title: candidate.extractedTitle,
          content: candidate.extractedContent,
          type: 'diary_extract',
          source: t(`memory.candidates_source_${candidate.sourceType}` as any),
          tags: candidate.suggestedTags,
          category: candidate.suggestedCategory,
        });

        if (!memoryId) {
          console.error('[useMemoryCandidates] Failed to create memory for candidate');
          continue;
        }

        await db.memoryCandidates.update(candidate.id, {
          status: 'confirmed',
          confirmedMemoryId: memoryId,
        });

        if (candidate.sourceType === 'quick_capture') {
          await db.quickCaptures.update(candidate.sourceId, { processed: true });
        }

        confirmed++;
      } catch (err) {
        console.error('[useMemoryCandidates] Failed to confirm candidate:', err);
      }
    }
    if (confirmed > 0) {
      toast.success(`已确认 ${confirmed} 条记忆`);
    }
    if (confirmed < candidates.length) {
      toast.error(`${candidates.length - confirmed} 条记忆确认失败`);
    }
    return confirmed;
  }, [createMemory, t]);

  const rejectSelected = useCallback(async (candidates: MemoryCandidate[]) => {
    let rejected = 0;
    for (const candidate of candidates) {
      try {
        await db.memoryCandidates.update(candidate.id, { status: 'rejected' });
        rejected++;
      } catch (err) {
        console.error('[useMemoryCandidates] Failed to reject candidate:', err);
      }
    }
    return rejected;
  }, []);

  const scanForCandidates = useCallback(async () => {
    const { memoryCandidateService } = await import('../services/memory/MemoryCandidateService');
    return memoryCandidateService.scanForCandidates();
  }, []);

  const scanWithAI = useCallback(async (model?: string) => {
    const { memoryCandidateService } = await import('../services/memory/MemoryCandidateService');
    return memoryCandidateService.scanWithAI({ model });
  }, []);

  return { confirmSelected, rejectSelected, scanForCandidates, scanWithAI };
}
