import { useState, useEffect } from 'react';
import { db } from '../db';
import type { SentimentResult } from './useSentiment';
import type { TypingMetrics } from './useTypingTracker';
import type { RiskLevel } from '../db/models';
import { calculateSocialScore } from '../utils/socialScore';

/**
 * 日记保存副作用 hook
 *
 * 从 DiaryEditor.tsx 抽出。日记保存成功后需要触发一长串副作用：
 *  1. 写入 emotionRecords（情感记录）
 *  2. 写入/更新 behaviorRecords（行为记录 + 打字指标）
 *  3. 异步生成健康画像（后台，不阻塞）
 *  4. 异步扫描记忆候选（后台）
 *  5. 高风险/危机时立即触发危机干预
 *
 * 这些副作用状态对调用方不可见，只需在保存成功后调 runDiarySaveEffects(...)。
 */
interface DiarySaveEffectsParams {
  date: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  diaryId?: string;  // 已存在日记的 id（更新场景），新建时 undefined
  sentimentResult: SentimentResult | null;
  typingMetrics: TypingMetrics | null;
  showCrisis: (level: 'high' | 'critical', source: 'diary' | 'chat', content: string) => void;
}

export function useDiarySaveEffects() {
  const [saving, setSaving] = useState(false);

  async function runDiarySaveEffects(params: DiarySaveEffectsParams) {
    const { date, content, mood, diaryId, sentimentResult, typingMetrics, showCrisis } = params;

    // 保存情感记录到数据库（仅在保存日记时写入，避免每 1.5s 重复写入）
    if (sentimentResult) {
      try {
        // 社交分数本地计算（P2-1 修复：原实现为取 socialScore 再跑一次
        // emotionAnalyzeDiary IPC → 内部重复一次 ONNX 推理；现与主进程
        // EmotionAnalysisEngine.calculateSocialScore 同算法纯本地完成）
        const socialScore = calculateSocialScore(content);

        await db.emotionRecords.put({
          id: `diary-${diaryId || date}`,
          date: date,
          source: 'diary',
          sourceId: diaryId,
          sentimentScore: sentimentResult.score,
          emotions: {
            joy: sentimentResult.score > 0.5 ? sentimentResult.score : 0,
            sadness: sentimentResult.score < 0.3 ? 1 - sentimentResult.score : 0,
            anger: 0,
            // fear：crisis（ONNX 明确判定）→ 1.0，high（关键词+ONNX 双重）→ 0.8
            fear: sentimentResult.level === 'crisis' ? 1.0 : sentimentResult.level === 'high' ? 0.8 : 0,
            surprise: 0,
            disgust: 0,
          },
          socialScore,
          // riskLevel 映射：SentimentResult.level='crisis'（UI 语义）→ riskLevel='critical'（数据/store 语义）
          riskLevel: sentimentResult.level === 'crisis' ? 'critical'
            : sentimentResult.level === 'high' ? 'high'
            : sentimentResult.level === 'medium' ? 'medium' : 'low',
          keywords: sentimentResult.keywords,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[DiaryEditor] Failed to save emotion record:', err);
        // 不抛出，让调用方决定是否提示（调用方已有 toast.error 兜底）
      }
    }

    // 保存行为记录（无感采集）
    try {
      const existingBehavior = await db.behaviorRecords.where('date').equals(date).first();

      const behaviorData = {
        id: existingBehavior?.id || crypto.randomUUID(),
        date,
        diaryWritten: true,
        diaryWordCount: content.length,
        moodRating: mood,
        tasksCompleted: existingBehavior?.tasksCompleted || 0,
        tasksTotal: existingBehavior?.tasksTotal || 0,
        habitsChecked: existingBehavior?.habitsChecked || 0,
        habitsTotal: existingBehavior?.habitsTotal || 0,
        activeHours: existingBehavior?.activeHours || [new Date().getHours()],
        chatMessages: existingBehavior?.chatMessages || 0,
        // 打字行为数据（无感识别创新）
        typingBehavior: typingMetrics || existingBehavior?.typingBehavior || null,
        createdAt: existingBehavior?.createdAt || new Date().toISOString(),
      };

      if (existingBehavior) {
        await db.behaviorRecords.update(existingBehavior.id, behaviorData);
      } else {
        await db.behaviorRecords.add(behaviorData);
      }

      // 调用行为分析引擎（如果可用）
      if (typingMetrics && window.electronAPI?.behaviorAnalyzeDaily) {
        try {
          await window.electronAPI.behaviorAnalyzeDaily(behaviorData, {});
        } catch (err) {
          console.error('[DiaryEditor] Behavior analysis error:', err);
        }
      }
    } catch (err) {
      console.error('[DiaryEditor] Failed to save behavior record:', err);
    }

    // 生成健康画像（后台异步，不阻塞保存）
    import('../services/emotion/HealthProfileService').then(({ generateHealthProfile }) => {
      generateHealthProfile().catch(err => {
        console.error('[DiaryEditor] Failed to generate health profile:', err);
      });
    });

    // 触发记忆候选扫描（后台异步，从日记中提取值得记住的内容）
    // 仅在非危机内容时执行（危机内容已在 scanForCandidates 内部过滤）
    import('../services/memory/MemoryCandidateService').then(({ memoryCandidateService }) => {
      memoryCandidateService.scanForCandidates().catch(err => {
        console.error('[DiaryEditor] Memory scan failed:', err);
      });
    });

    // 高风险/危机：立即触发危机干预（原 30s 延迟对真实危机有风险，改为立即）
    // 文案柔和，避免打断保存流程后的情绪
    // crisis（ONNX 明确判定）→ 'critical'（循环警报）；high（双重确认）→ 'high'（单次警报）
    if (sentimentResult?.level === 'high' || sentimentResult?.level === 'crisis') {
      const crisisLevel: RiskLevel = sentimentResult.level === 'crisis' ? 'critical' : 'high';
      showCrisis(crisisLevel, 'diary', content);
    }
  }

  return { saving, setSaving, runDiarySaveEffects };
}
