/**
 * Risk Scoring Engine
 * 综合风险评分引擎 - 融合多信号源计算0-100风险指数
 *
 * 信号源权重（依据 PHQ-9/GAD-7 自评量表的临床筛查地位 + 行为学文献综合设定）:
 * - 情绪分析 (30%): emotionRecords
 *   情绪记录由 ONNX + 关键词分析得出，是高频被动信号，权重最高。
 * - 行为异常 (25%): BehaviorAnalyzer输出
 *   连续无日记/低心情/任务下降/习惯中断/深夜活跃，参考 StudentLife 研究。
 * - 评估量表 (25%): assessments (PHQ-9/GAD-7/PSS-10)
 *   PHQ-9/GAD-7 为临床金标准自评量表，准确度最高，但需用户主动填写，
 *   数据稀疏，故与情绪信号等权（25%）而非更高，避免数据缺失时失分。
 * - 聊天情感 (10%): conversationSummaries
 *   AI 对话已移除，此通道当前无新数据，保留 10% 权重兼容历史数据。
 * - 日记情绪 (10%): diaries.mood
 *   日记心情评分为主观 1-5 分，参考价值次于量表，权重低。
 *
 * 风险等级（参考 PHQ-9 严重度分级映射）:
 *   0-25 低 / 26-50 中低 / 51-75 中 / 76-90 高 / 91-100 危急
 *
 * PHQ-9 cutoff（DSM-5 临床常用）:
 *   ≥5 轻度 / ≥10 中度 / ≥15 中重度 / ≥20 重度
 * GAD-7 cutoff:
 *   ≥5 轻度 / ≥10 中度 / ≥15 重度
 * PSS-10 cutoff（Cohen 1983）:
 *   ≥14 中等 / ≥27 高压力
 * SAD PERSONS（参考量表，用于自杀风险分层，未直接实现，仅作文档参考）
 */

const SentimentService = require('./SentimentService.cjs');

// ── 权重配置 ──────────────────────────────────────────────────

const WEIGHTS = {
  emotion: 0.30,      // 情绪分析（高频被动信号，权重最高）
  behavior: 0.25,     // 行为异常（无感识别核心通道）
  assessment: 0.25,   // 评估量表（PHQ-9/GAD-7 临床金标准，但数据稀疏）
  chat: 0.10,         // 聊天情感（对话已移除，兼容历史数据）
  diary: 0.10,        // 日记情绪（主观评分，参考价值次于量表）
};

// ── 风险等级映射 ──────────────────────────────────────────────

const RISK_LEVELS = {
  low: { min: 0, max: 25, label: '低', color: '#22C55E' },
  medium_low: { min: 26, max: 50, label: '中低', color: '#F59E0B' },
  medium: { min: 51, max: 75, label: '中', color: '#F97316' },
  high: { min: 76, max: 90, label: '高', color: '#EF4444' },
  critical: { min: 91, max: 100, label: '危急', color: '#DC2626' },
};

// ── 信号源评分函数 ────────────────────────────────────────────

/**
 * 计算情绪分析评分 (0-100, 越高越危险)
 * @param {Array} emotionRecords - 近期情绪记录
 * @returns {object} { score, factors }
 */
function calculateEmotionScore(emotionRecords) {
  if (!emotionRecords || emotionRecords.length === 0) {
    return { score: 0, factors: [] };
  }

  const factors = [];
  let totalScore = 0;

  // 1. 计算平均情感分数 (-1到1, 越低越危险)
  const avgSentiment = emotionRecords.reduce((sum, r) => sum + r.sentimentScore, 0) / emotionRecords.length;
  // 转换为0-100风险分: sentimentScore -1 → 100, 0 → 50, 1 → 0
  const sentimentRisk = Math.max(0, Math.min(100, (1 - avgSentiment) * 50));
  totalScore += sentimentRisk * 0.4;

  if (avgSentiment < -0.3) {
    factors.push({ type: 'negative_sentiment', weight: 15, description: '近期情感倾向负面' });
  }

  // 2. 检查高风险记录
  const highRiskRecords = emotionRecords.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
  if (highRiskRecords.length > 0) {
    totalScore += 30;
    factors.push({ type: 'high_risk_emotion', weight: 30, description: `${highRiskRecords.length}条高风险情绪记录` });
  }

  // 3. 检查情绪波动
  if (emotionRecords.length >= 3) {
    const scores = emotionRecords.map(r => r.sentimentScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);

    if (volatility > 0.4) {
      totalScore += 15;
      factors.push({ type: 'emotion_volatility', weight: 15, description: '情绪波动较大' });
    }
  }

  return { score: Math.min(100, totalScore), factors };
}

/**
 * 计算行为异常评分 (0-100, 越高越危险)
 * @param {object} behaviorData - 行为分析数据
 * @returns {object} { score, factors }
 */
function calculateBehaviorScore(behaviorData) {
  if (!behaviorData) {
    return { score: 0, factors: [] };
  }

  const factors = [];
  let totalScore = 0;

  // 1. 连续无日记 - 阶梯式递增，体现严重程度（3天与14天不再同分）
  const noDiaryDays = behaviorData.consecutiveNoDiary || 0;
  if (noDiaryDays >= 14) {
    totalScore += 60;
    factors.push({ type: 'no_diary', weight: 60, description: `连续${noDiaryDays}天未写日记（严重忽视）` });
  } else if (noDiaryDays >= 7) {
    totalScore += 40;
    factors.push({ type: 'no_diary', weight: 40, description: `连续${noDiaryDays}天未写日记（明显忽视）` });
  } else if (noDiaryDays >= 3) {
    totalScore += 25;
    factors.push({ type: 'no_diary', weight: 25, description: `连续${noDiaryDays}天未写日记` });
  } else if (noDiaryDays >= 2) {
    totalScore += 10;
    factors.push({ type: 'no_diary', weight: 10, description: `连续${noDiaryDays}天未写日记` });
  }

  // 2. 连续低心情 - 阶梯式递增
  const lowMoodDays = behaviorData.consecutiveLowMood || 0;
  if (lowMoodDays >= 7) {
    totalScore += 45;
    factors.push({ type: 'low_mood', weight: 45, description: `连续${lowMoodDays}天心情低落（持续低迷）` });
  } else if (lowMoodDays >= 3) {
    totalScore += 30;
    factors.push({ type: 'low_mood', weight: 30, description: `连续${lowMoodDays}天心情低落` });
  } else if (lowMoodDays >= 2) {
    totalScore += 15;
    factors.push({ type: 'low_mood', weight: 15, description: `连续${lowMoodDays}天心情低落` });
  }

  // 3. 任务完成率下降
  if (behaviorData.taskCompletionDrop) {
    totalScore += 15;
    factors.push({ type: 'task_drop', weight: 15, description: '任务完成率明显下降' });
  }

  // 4. 习惯中断
  if (behaviorData.habitBreakDays >= 3) {
    totalScore += 15;
    factors.push({ type: 'habit_break', weight: 15, description: `习惯打卡中断${behaviorData.habitBreakDays}天` });
  }

  // 5. 深夜活跃
  if (behaviorData.lateNightRatio > 0.3) {
    totalScore += 10;
    factors.push({ type: 'late_night', weight: 10, description: '深夜活跃比例较高' });
  }

  return { score: Math.min(100, totalScore), factors };
}

/**
 * 计算评估量表评分 (0-100, 越高越危险)
 * @param {Array} assessments - 近期评估结果
 * @returns {object} { score, factors }
 */
function calculateAssessmentScore(assessments) {
  if (!assessments || assessments.length === 0) {
    return { score: 0, factors: [] };
  }

  const factors = [];
  let totalScore = 0;

  // 获取最新的每种量表结果
  const latestPHQ9 = assessments.find(a => a.type === 'PHQ9');
  const latestGAD7 = assessments.find(a => a.type === 'GAD7');
  const latestPSS10 = assessments.find(a => a.type === 'PSS10');
  const latestCSSRS = assessments.find(a => a.type === 'CSSRS');

  // PHQ-9 评分 (0-27, 越高越危险)
  // Cutoff 依据 DSM-5 临床常用分级：≥5 轻度 / ≥10 中度 / ≥15 中重度 / ≥20 重度
  if (latestPHQ9) {
    const phq9Score = latestPHQ9.totalScore;
    if (phq9Score >= 20) {
      totalScore += 35;
      factors.push({ type: 'phq9_severe', weight: 35, description: 'PHQ-9重度抑郁' });
    } else if (phq9Score >= 15) {
      totalScore += 25;
      factors.push({ type: 'phq9_moderate_severe', weight: 25, description: 'PHQ-9中重度抑郁' });
    } else if (phq9Score >= 10) {
      totalScore += 15;
      factors.push({ type: 'phq9_moderate', weight: 15, description: 'PHQ-9中度抑郁' });
    } else if (phq9Score >= 5) {
      totalScore += 5;
      factors.push({ type: 'phq9_mild', weight: 5, description: 'PHQ-9轻度抑郁' });
    }
  }

  // GAD-7 评分 (0-21, 越高越危险)
  // Cutoff：≥5 轻度 / ≥10 中度 / ≥15 重度（Spitzer 2006）
  if (latestGAD7) {
    const gad7Score = latestGAD7.totalScore;
    if (gad7Score >= 15) {
      totalScore += 30;
      factors.push({ type: 'gad7_severe', weight: 30, description: 'GAD-7重度焦虑' });
    } else if (gad7Score >= 10) {
      totalScore += 20;
      factors.push({ type: 'gad7_moderate', weight: 20, description: 'GAD-7中度焦虑' });
    } else if (gad7Score >= 5) {
      totalScore += 10;
      factors.push({ type: 'gad7_mild', weight: 10, description: 'GAD-7轻度焦虑' });
    }
  }

  // PSS-10 评分 (0-40, 越高越危险)
  // Cutoff：≥14 中等 / ≥27 高压力（Cohen 1983）
  if (latestPSS10) {
    const pss10Score = latestPSS10.totalScore;
    if (pss10Score >= 27) {
      totalScore += 25;
      factors.push({ type: 'pss10_high', weight: 25, description: 'PSS-10高压力' });
    } else if (pss10Score >= 14) {
      totalScore += 15;
      factors.push({ type: 'pss10_moderate', weight: 15, description: 'PSS-10中等压力' });
    }
  }

  // C-SSRS 评分（Columbia 自杀严重程度评定量表，临床自杀风险筛查金标准）
  // scores[0-4] = Q1-Q5（自杀意念/行为，0/1）；scores[5] = Q6（频率 0-4）
  // 等级判定：Q3/Q4/Q5 任一阳性 → critical；Q1/Q2 阳性 → high
  if (latestCSSRS) {
    const cssrsScores = latestCSSRS.scores || [];
    // 伴意图/计划/行为 → 最高权重，直接推到危急
    const hasHighRisk = cssrsScores.slice(2, 5).some(s => s >= 1);
    const hasIdeation = cssrsScores.slice(0, 2).some(s => s >= 1);
    if (hasHighRisk) {
      totalScore += 40;
      factors.push({ type: 'cssrs_high_risk', weight: 40, description: 'C-SSRS提示伴意图/计划/行为的自杀意念或自杀行为' });
    } else if (hasIdeation) {
      totalScore += 20;
      factors.push({ type: 'cssrs_ideation', weight: 20, description: 'C-SSRS提示存在自杀意念' });
    }
  }

  return { score: Math.min(100, totalScore), factors };
}

/**
 * 计算聊天情感评分 (0-100, 越高越危险)
 * @param {Array} conversationSummaries - 近期聊天摘要
 * @returns {object} { score, factors, exclusionsHit }
 */
function calculateChatScore(conversationSummaries) {
  if (!conversationSummaries || conversationSummaries.length === 0) {
    return { score: 0, factors: [], exclusionsHit: [] };
  }

  const factors = [];
  const exclusionsHit = [];
  let totalScore = 0;

  // 统一从 crisisKeywords.cjs 引用，避免与 SentimentService 词表不同步
  const { CRISIS_KEYWORDS, CRISIS_EXCLUSIONS, NEGATIVE_KEYWORDS } = require('./crisisKeywords.cjs');
  const negativeKeywords = NEGATIVE_KEYWORDS;
  const crisisKeywords = CRISIS_KEYWORDS;
  const crisisExclusions = CRISIS_EXCLUSIONS;

  for (const summary of conversationSummaries) {
    const state = summary.emotionalState || '';

    // 检查危机关键词（排除常见误报；被排除规则抑制的危机命中记入诊断，便于归因）
    if (crisisKeywords.some(k => state.includes(k))) {
      const matchedExclusions = crisisExclusions.filter(ex => state.includes(ex));
      if (matchedExclusions.length > 0) {
        matchedExclusions.forEach(rule => exclusionsHit.push({ source: 'chat', rule }));
      } else {
        totalScore += 40;
        factors.push({ type: 'crisis_in_chat', weight: 40, description: '聊天中出现危机内容' });
        break;
      }
    }

    // 检查负面情感关键词
    const negativeCount = negativeKeywords.filter(k => state.includes(k)).length;
    if (negativeCount >= 3) {
      totalScore += 20;
      factors.push({ type: 'negative_chat', weight: 20, description: '聊天情感倾向负面' });
    } else if (negativeCount >= 1) {
      totalScore += 10;
      factors.push({ type: 'negative_chat', weight: 10, description: '聊天中出现负面情感' });
    }
  }

  return { score: Math.min(100, totalScore), factors, exclusionsHit };
}

/**
 * 计算日记情绪评分 (0-100, 越高越危险)
 * @param {Array} diaries - 近期日记
 * @returns {object} { score, factors, exclusionsHit }
 */
function calculateDiaryScore(diaries) {
  if (!diaries || diaries.length === 0) {
    return { score: 0, factors: [], exclusionsHit: [] };
  }

  const factors = [];
  const exclusionsHit = [];
  let totalScore = 0;

  // 1. 平均心情评分 (1-5, 越低越危险)
  const moods = diaries.filter(d => d.mood).map(d => d.mood);
  if (moods.length > 0) {
    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    // 转换为风险分: mood 1 → 80, 2 → 60, 3 → 40, 4 → 20, 5 → 0
    const moodRisk = Math.max(0, (5 - avgMood) * 20);
    totalScore += moodRisk * 0.5;

    if (avgMood <= 2) {
      factors.push({ type: 'low_mood_diary', weight: 20, description: '日记心情评分较低' });
    }
  }

  // 2. 检查日记内容中的负面关键词 - 统一从 crisisKeywords.cjs 引用
  const { CRISIS_KEYWORDS, CRISIS_EXCLUSIONS, NEGATIVE_KEYWORDS } = require('./crisisKeywords.cjs');
  const negativeKeywords = NEGATIVE_KEYWORDS;
  const crisisKeywords = CRISIS_KEYWORDS;
  const crisisExclusions = CRISIS_EXCLUSIONS;

  for (const diary of diaries) {
    const content = diary.content || '';

    // 检查危机关键词（排除常见误报；被排除规则抑制的危机命中记入诊断，便于归因）
    if (crisisKeywords.some(k => content.includes(k))) {
      const matchedExclusions = crisisExclusions.filter(ex => content.includes(ex));
      if (matchedExclusions.length > 0) {
        matchedExclusions.forEach(rule => exclusionsHit.push({ source: 'diary', rule }));
      } else {
        totalScore += 40;
        factors.push({ type: 'crisis_in_diary', weight: 40, description: '日记中出现危机内容' });
        break;
      }
    }

    // 检查负面关键词
    const negativeCount = negativeKeywords.filter(k => content.includes(k)).length;
    if (negativeCount >= 3) {
      totalScore += 15;
      factors.push({ type: 'negative_diary', weight: 15, description: '日记内容倾向负面' });
    }
  }

  return { score: Math.min(100, totalScore), factors, exclusionsHit };
}

// ── 主要导出函数 ──────────────────────────────────────────────

/**
 * 计算综合风险评分
 * @param {object} data - 各信号源数据
 * @param {Array} data.emotionRecords - 情绪记录
 * @param {object} data.behaviorData - 行为分析数据
 * @param {Array} data.assessments - 评估量表结果
 * @param {Array} data.conversationSummaries - 聊天摘要
 * @param {Array} data.diaries - 日记
 * @returns {object} 综合风险评估结果
 */
function calculateRiskScore(data) {
  const emotionResult = calculateEmotionScore(data.emotionRecords || []);
  const behaviorResult = calculateBehaviorScore(data.behaviorData || {});
  const assessmentResult = calculateAssessmentScore(data.assessments || []);
  const chatResult = calculateChatScore(data.conversationSummaries || []);
  const diaryResult = calculateDiaryScore(data.diaries || []);

  // 加权计算总分
  const weightedScore =
    emotionResult.score * WEIGHTS.emotion +
    behaviorResult.score * WEIGHTS.behavior +
    assessmentResult.score * WEIGHTS.assessment +
    chatResult.score * WEIGHTS.chat +
    diaryResult.score * WEIGHTS.diary;

  const totalScore = Math.round(Math.min(100, Math.max(0, weightedScore)));

  // 收集所有因素（提前计算，供临床升级逻辑使用）
  const allFactors = [
    ...emotionResult.factors,
    ...behaviorResult.factors,
    ...assessmentResult.factors,
    ...chatResult.factors,
    ...diaryResult.factors,
  ].sort((a, b) => b.weight - a.weight);

  // ── 临床升级（safety net，参考 C-SSRS 急性风险判定）──────────────
  // 触发条件（任一满足即 critical）:
  //   1. totalScore >= 91（原始阈值，保留）
  //   2. C-SSRS Q3/Q4/Q5 任一阳性（伴意图/计划/行为 → 临床急性风险）
  //   3. totalScore >= 76（已达 high）且 >= 2 个危机信号源（多通道危机收敛）
  const cssrs = (data.assessments || []).find(a => a.type === 'CSSRS');
  const cssrsAcute = cssrs && (cssrs.scores || []).slice(2, 5).some(s => s >= 1);
  const crisisFactorCount = allFactors.filter(f =>
    ['cssrs_high_risk', 'crisis_in_chat', 'crisis_in_diary'].includes(f.type)
  ).length;

  // 升级触发原因（可归因诊断：记录哪条规则把等级推到 critical）
  const escalationReasons = [];
  if (totalScore >= 91) escalationReasons.push('score_threshold');
  if (cssrsAcute) escalationReasons.push('cssrs_acute');
  if (totalScore >= 76 && crisisFactorCount >= 2) escalationReasons.push('multi_channel_crisis');

  // 确定风险等级
  let riskLevel = 'low';
  if (escalationReasons.length > 0) {
    riskLevel = 'critical';
  } else if (totalScore >= 76) {
    riskLevel = 'high';
  } else if (totalScore >= 51) {
    riskLevel = 'medium';
  } else if (totalScore >= 26) {
    riskLevel = 'medium_low';
  }

  // 生成摘要
  let summary = '当前心理状态良好';
  if (riskLevel === 'critical') {
    summary = '检测到高风险信号，建议立即寻求专业帮助';
  } else if (riskLevel === 'high') {
    summary = '近期状态需要关注，建议进行心理评估或咨询';
  } else if (riskLevel === 'medium') {
    summary = '部分指标显示压力，建议关注自我调节';
  } else if (riskLevel === 'medium_low') {
    summary = '整体状态稳定，个别指标需留意';
  }

  return {
    totalScore,
    riskLevel,
    riskLevelInfo: RISK_LEVELS[riskLevel],
    breakdown: {
      emotion: { score: Math.round(emotionResult.score), weight: WEIGHTS.emotion },
      behavior: { score: Math.round(behaviorResult.score), weight: WEIGHTS.behavior },
      assessment: { score: Math.round(assessmentResult.score), weight: WEIGHTS.assessment },
      chat: { score: Math.round(chatResult.score), weight: WEIGHTS.chat },
      diary: { score: Math.round(diaryResult.score), weight: WEIGHTS.diary },
    },
    factors: allFactors.slice(0, 10), // 最多返回10个因素
    // 可归因诊断：命中的排除规则（rule 为词表静态词条，非日记原文）与升级触发原因
    diagnostics: {
      exclusionsHit: [...chatResult.exclusionsHit, ...diaryResult.exclusionsHit],
      escalation: {
        escalated: riskLevel === 'critical',
        reasons: escalationReasons,
        crisisFactorCount,
      },
    },
    summary,
    timestamp: Date.now(),
  };
}

/**
 * 计算风险趋势
 * @param {Array} dailyScores - 每日风险分数数组 [{ date, score }]
 * @param {number} days - 天数 (7或30)
 * @returns {object} 趋势数据
 */
function calculateRiskTrend(dailyScores, days = 7) {
  if (!dailyScores || dailyScores.length === 0) {
    return { trend: 'stable', change: 0, data: [] };
  }

  const recent = dailyScores.slice(-days);
  const scores = recent.map(d => d.score);

  // 计算趋势方向
  let trend = 'stable';
  let change = 0;

  if (scores.length >= 3) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    change = Math.round(avgSecond - avgFirst);

    if (change > 5) trend = 'rising';
    else if (change < -5) trend = 'falling';
  }

  return {
    trend,
    change,
    data: recent,
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  };
}

module.exports = {
  calculateRiskScore,
  calculateRiskTrend,
  RISK_LEVELS,
  WEIGHTS,
};
