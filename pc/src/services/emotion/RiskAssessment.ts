import type { RiskLevel, EmotionRecord, BehaviorRecord } from '../../db/models';

/**
 * Comprehensive risk assessment combining emotion + behavior data
 * This is the core "unobtrusive detection" algorithm
 *
 * 参考：C-SSRS (Columbia Suicide Severity Rating Scale)
 * C-SSRS是自杀风险评估的金标准，被FDA和WHO认可
 *
 * C-SSRS严重程度分级：
 * 1. Wish to be dead - 希望自己死去
 * 2. Non-specific active suicidal thoughts - 非特异性主动自杀想法
 * 3. Suicidal ideation with any methods (not plan) without intent to act - 有方法但无意图
 * 4. Suicidal ideation with some intent to act, without specific plan - 有意图但无计划
 * 5. Suicidal ideation with specific plan and intent - 有计划和意图
 * 6. Suicidal behavior - 自杀行为（实际、尝试、中断、中止）
 */

interface RiskAssessmentInput {
  recentEmotions: EmotionRecord[];
  behaviorRecord: BehaviorRecord | null;
  behaviorTrends: BehaviorTrends;
  crisisKeywords?: boolean;
  crisisLevel?: number; // 0-4, 对应C-SSRS级别
}

interface BehaviorTrends {
  consecutiveNoDiary: number;
  consecutiveLowMood: number;
  taskCompletionDrop: boolean;
  habitBreakDays: number;
  averageMood: number | null;
  averageTaskRate: number | null;
  averageHabitRate: number | null;
  moodVolatility: number;
  lateNightRatio: number;
}

interface RiskAssessmentResult {
  riskLevel: RiskLevel;
  riskScore: number;
  cssrsLevel: number; // C-SSRS级别 (0-6)
  factors: RiskFactor[];
  summary: string;
}

interface RiskFactor {
  type: string;
  weight: number;
  description: string;
  cssrsMapping?: number; // 映射到C-SSRS级别
}

/**
 * Map crisis level to C-SSRS severity
 * @param {number} crisisLevel - 0-4 from SentimentService
 * @returns {number} C-SSRS level (0-6)
 */
function mapCrisisToCSSRS(crisisLevel: number): number {
  // SentimentService crisis levels:
  // 0 = no crisis
  // 1 = passive ideation (想消失)
  // 2 = active ideation (想死)
  // 3 = active ideation + plan (想跳楼)
  // 4 = active ideation + intent (准备去死)

  // C-SSRS levels:
  // 0 = no ideation
  // 1 = wish to be dead
  // 2 = non-specific active suicidal thoughts
  // 3 = suicidal ideation with methods, without intent
  // 4 = suicidal ideation with some intent, without specific plan
  // 5 = suicidal ideation with specific plan and intent
  // 6 = suicidal behavior

  const mapping: Record<number, number> = {
    0: 0,
    1: 1, // 被动意念 → wish to be dead
    2: 2, // 主动意念 → non-specific active thoughts
    3: 3, // 有方法 → with methods, without intent
    4: 5, // 有意图 → with specific plan and intent
  };

  return mapping[crisisLevel] || 0;
}

/**
 * Perform comprehensive risk assessment based on C-SSRS framework
 */
export function assessRisk(input: RiskAssessmentInput): RiskAssessmentResult {
  const factors: RiskFactor[] = [];
  let riskScore = 0;
  let cssrsLevel = 0;

  // 1. Crisis keywords → C-SSRS level mapping
  if (input.crisisKeywords || (input.crisisLevel && input.crisisLevel > 0)) {
    cssrsLevel = mapCrisisToCSSRS(input.crisisLevel || 2);

    // C-SSRS Level 5-6 → immediate critical
    if (cssrsLevel >= 5) {
      return {
        riskLevel: 'critical',
        riskScore: 100,
        cssrsLevel,
        factors: [{
          type: 'crisis_level_5_6',
          weight: 100,
          description: '检测到高风险危机内容（C-SSRS Level 5-6）',
          cssrsMapping: cssrsLevel,
        }],
        summary: '检测到高风险内容，建议立即寻求帮助',
      };
    }

    // C-SSRS Level 3-4 → high risk
    else if (cssrsLevel >= 3) {
      riskScore += 60;
      factors.push({
        type: 'crisis_level_3_4',
        weight: 60,
        description: '检测到危机内容（C-SSRS Level 3-4）',
        cssrsMapping: cssrsLevel,
      });
    }
    // C-SSRS Level 1-2 → medium-high risk
    else if (cssrsLevel >= 1) {
      riskScore += 30;
      factors.push({
        type: 'crisis_level_1_2',
        weight: 30,
        description: '检测到潜在危机内容（C-SSRS Level 1-2）',
        cssrsMapping: cssrsLevel,
      });
    }
  }

  // 2. Emotion analysis risk
  const highRiskEmotions = input.recentEmotions.filter(e => e.riskLevel === 'high');
  const mediumRiskEmotions = input.recentEmotions.filter(e => e.riskLevel === 'medium');

  if (highRiskEmotions.length > 0) {
    riskScore += 40;
    factors.push({
      type: 'high_risk_emotion',
      weight: 40,
      description: '近期存在高风险情感分析结果',
      cssrsMapping: 2, // 映射到C-SSRS Level 2
    });
  } else if (mediumRiskEmotions.length >= 2) {
    riskScore += 25;
    factors.push({
      type: 'medium_risk_emotions',
      weight: 25,
      description: '近期多次检测到中等风险情感',
    });
  } else if (mediumRiskEmotions.length === 1) {
    riskScore += 15;
    factors.push({
      type: 'single_medium_risk',
      weight: 15,
      description: '近期有一次中等风险情感',
    });
  }

  // 3. Consecutive low mood
  if (input.behaviorTrends.consecutiveLowMood >= 3) {
    riskScore += 30;
    factors.push({
      type: 'consecutive_low_mood',
      weight: 30,
      description: `连续${input.behaviorTrends.consecutiveLowMood}天心情评分偏低`,
    });
  } else if (input.behaviorTrends.consecutiveLowMood >= 2) {
    riskScore += 15;
    factors.push({
      type: 'consecutive_low_mood',
      weight: 15,
      description: `连续${input.behaviorTrends.consecutiveLowMood}天心情评分偏低`,
    });
  }

  // 4. Mood volatility
  if (input.behaviorTrends.moodVolatility > 1.5) {
    riskScore += 15;
    factors.push({
      type: 'mood_volatility',
      weight: 15,
      description: '情绪波动较大',
    });
  }

  // 5. Consecutive no diary
  if (input.behaviorTrends.consecutiveNoDiary >= 5) {
    riskScore += 15;
    factors.push({
      type: 'consecutive_no_diary',
      weight: 15,
      description: `已经${input.behaviorTrends.consecutiveNoDiary}天没写日记`,
    });
  } else if (input.behaviorTrends.consecutiveNoDiary >= 3) {
    riskScore += 8;
    factors.push({
      type: 'consecutive_no_diary',
      weight: 8,
      description: `已经${input.behaviorTrends.consecutiveNoDiary}天没写日记`,
    });
  }

  // 6. Task completion drop
  if (input.behaviorTrends.taskCompletionDrop) {
    riskScore += 10;
    factors.push({
      type: 'task_completion_drop',
      weight: 10,
      description: '最近任务完成率明显下降',
    });
  }

  // 7. Habit break
  if (input.behaviorTrends.habitBreakDays >= 5) {
    riskScore += 12;
    factors.push({
      type: 'habit_break',
      weight: 12,
      description: `习惯打卡已中断${input.behaviorTrends.habitBreakDays}天`,
    });
  } else if (input.behaviorTrends.habitBreakDays >= 3) {
    riskScore += 6;
    factors.push({
      type: 'habit_break',
      weight: 6,
      description: `习惯打卡已中断${input.behaviorTrends.habitBreakDays}天`,
    });
  }

  // 8. Late night activity
  if (input.behaviorTrends.lateNightRatio > 0.6) {
    riskScore += 10;
    factors.push({
      type: 'late_night',
      weight: 10,
      description: '近期频繁深夜活跃，可能存在睡眠问题',
    });
  }

  // Determine risk level based on C-SSRS framework
  let riskLevel: RiskLevel;

  // Crisis-driven classification (based on actual crisis content)
  if (cssrsLevel >= 5) {
    riskLevel = 'critical';
  }
  else if (cssrsLevel >= 3) {
    riskLevel = 'high';
  }
  else if (cssrsLevel >= 1) {
    riskLevel = riskScore >= 60 ? 'high' : 'medium';
  }
  // Behavior-driven classification (no crisis content)
  else if (riskScore >= 80) {
    riskLevel = 'high';
  }
  else if (riskScore >= 40) {
    riskLevel = 'medium';
  }
  else if (riskScore >= 10) {
    riskLevel = 'medium_low';
  }
  else {
    riskLevel = 'low';
  }

  // Generate summary
  const summary = generateRiskSummary(riskLevel, factors, cssrsLevel);

  return { riskLevel, riskScore, cssrsLevel, factors, summary };
}

/**
 * Generate human-readable risk summary with C-SSRS context
 */
function generateRiskSummary(riskLevel: RiskLevel, factors: RiskFactor[], cssrsLevel: number): string {
  if (factors.length === 0) {
    return '近期状态良好，未检测到明显风险因素。';
  }

  const levelText: Record<RiskLevel, string> = {
    low: '低风险',
    medium_low: '中低风险',
    medium: '中等风险',
    high: '高风险',
    critical: '极高风险',
  };

  // C-SSRS级别描述
  const cssrsDescriptions: Record<number, string> = {
    0: '无自杀意念',
    1: '希望死去',
    2: '非特异性自杀想法',
    3: '有自杀方法但无意图',
    4: '有自杀意图但无计划',
    5: '有自杀计划和意图',
    6: '自杀行为',
  };

  const descriptions = factors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(f => f.description);

  let summary = `当前评估：${levelText[riskLevel]}`;

  // 添加C-SSRS级别信息
  if (cssrsLevel > 0) {
    summary += `（C-SSRS: ${cssrsDescriptions[cssrsLevel] || '未知'}）`;
  }

  summary += `。主要因素：${descriptions.join('；')}。`;

  return summary;
}

/**
 * Get risk level color for UI display
 */
export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10B981',
    medium_low: '#F59E0B',
    medium: '#F97316',
    high: '#EF4444',
    critical: '#DC2626',
  };
  return colors[level] || '#6B7280';
}

/**
 * Get risk level label for UI display
 */
export function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: '低风险',
    medium_low: '中低风险',
    medium: '中等风险',
    high: '高风险',
    critical: '极高风险',
  };
  return labels[level] || '未知';
}
