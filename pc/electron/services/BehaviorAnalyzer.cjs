/**
 * Behavior Analyzer Service
 * Analyzes user behavior patterns for unobtrusive mental health detection
 * Runs in Electron main process, provides IPC methods for renderer
 *
 * 参考：数字表型研究 + StudentLife (2014)
 * 建立个人基线（至少7天数据后才分析），对比个人行为模式而非硬编码阈值
 *
 * 新增：打字行为分析（参考：Typing patterns as markers of mood）
 * - 打字速度：抑郁时打字速度通常变慢
 * - 删除频率：焦虑时删除重写频率增加
 * - 停顿时间：思考时间延长可能表示认知负荷增加
 */

// ── Personal Baseline Calculation ──────────────────────────────

const MIN_BASELINE_DAYS = 7; // 至少需要7天数据才能建立个人基线

/**
 * Calculate personal baseline from historical data
 * @param {Array} records - Array of behavior records (at least 7 days)
 * @returns {object} Personal baseline metrics
 */
function calculatePersonalBaseline(records) {
  if (!records || records.length < MIN_BASELINE_DAYS) {
    return null; // 数据不足，无法建立基线
  }

  const moodRecords = records.filter(r => r.moodRating !== null);
  const taskRecords = records.filter(r => r.tasksTotal > 0);
  const habitRecords = records.filter(r => r.habitsTotal > 0);

  const baseline = {
    hasBaseline: true,
    daysUsed: records.length,
    mood: {
      mean: moodRecords.length > 0
        ? moodRecords.reduce((s, r) => s + r.moodRating, 0) / moodRecords.length
        : 3,
      std: 0,
    },
    taskCompletion: {
      mean: taskRecords.length > 0
        ? taskRecords.reduce((s, r) => s + r.tasksCompleted / r.tasksTotal, 0) / taskRecords.length
        : 0.5,
      std: 0,
    },
    habitConsistency: {
      mean: habitRecords.length > 0
        ? habitRecords.reduce((s, r) => s + r.habitsChecked / r.habitsTotal, 0) / habitRecords.length
        : 0.5,
      std: 0,
    },
    diaryFrequency: {
      mean: records.filter(r => r.diaryWritten).length / records.length,
    },
  };

  // Calculate standard deviations
  if (moodRecords.length >= 2) {
    const mean = baseline.mood.mean;
    const squaredDiffs = moodRecords.map(r => Math.pow(r.moodRating - mean, 2));
    baseline.mood.std = Math.sqrt(squaredDiffs.reduce((s, d) => s + d, 0) / squaredDiffs.length);
  }

  if (taskRecords.length >= 2) {
    const mean = baseline.taskCompletion.mean;
    const rates = taskRecords.map(r => r.tasksCompleted / r.tasksTotal);
    const squaredDiffs = rates.map(r => Math.pow(r - mean, 2));
    baseline.taskCompletion.std = Math.sqrt(squaredDiffs.reduce((s, d) => s + d, 0) / squaredDiffs.length);
  }

  if (habitRecords.length >= 2) {
    const mean = baseline.habitConsistency.mean;
    const rates = habitRecords.map(r => r.habitsChecked / r.habitsTotal);
    const squaredDiffs = rates.map(r => Math.pow(r - mean, 2));
    baseline.habitConsistency.std = Math.sqrt(squaredDiffs.reduce((s, d) => s + d, 0) / squaredDiffs.length);
  }

  return baseline;
}

// ── Typing Behavior Analysis ──────────────────────────────────
// 参考：StudentLife (2014), Typing patterns as markers of mood
// 打字行为可以反映认知状态和情绪

/**
 * Analyze typing behavior patterns
 * @param {object} typingData - Typing session data
 * @param {number} typingData.avgSpeed - Average typing speed (chars/min)
 * @param {number} typingData.deleteRate - Deletion rate (deletes/total keystrokes)
 * @param {number} typingData.pauseRate - Pause rate (pauses > 2s / minute)
 * @param {number} typingData.sessionDuration - Session duration in minutes
 * @returns {object} Typing behavior analysis
 */
function analyzeTypingBehavior(typingData) {
  if (!typingData) return { anomalies: [], indicators: {} };

  const anomalies = [];
  const indicators = {};

  // 打字速度分析
  // 正常范围：40-80 chars/min (中文)
  // 抑郁时可能降到 20-40 chars/min
  if (typingData.avgSpeed !== undefined) {
    indicators.speed = typingData.avgSpeed;
    if (typingData.avgSpeed < 20) {
      anomalies.push({
        type: 'very_slow_typing',
        severity: 'medium',
        value: typingData.avgSpeed,
        description: '打字速度异常缓慢，可能表示疲劳或情绪低落',
      });
    } else if (typingData.avgSpeed < 30) {
      anomalies.push({
        type: 'slow_typing',
        severity: 'low',
        value: typingData.avgSpeed,
        description: '打字速度较慢',
      });
    }
  }

  // 删除频率分析
  // 正常范围：5-15%
  // 焦虑时可能升到 20-30%
  if (typingData.deleteRate !== undefined) {
    indicators.deleteRate = typingData.deleteRate;
    if (typingData.deleteRate > 0.25) {
      anomalies.push({
        type: 'high_delete_rate',
        severity: 'medium',
        value: typingData.deleteRate,
        description: '删除重写频率高，可能表示犹豫不决或焦虑',
      });
    } else if (typingData.deleteRate > 0.15) {
      anomalies.push({
        type: 'elevated_delete_rate',
        severity: 'low',
        value: typingData.deleteRate,
        description: '删除频率略高',
      });
    }
  }

  // 停顿时间分析
  // 正常范围：2-5 pauses/min
  // 认知负荷高时可能升到 8-10 pauses/min
  if (typingData.pauseRate !== undefined) {
    indicators.pauseRate = typingData.pauseRate;
    if (typingData.pauseRate > 8) {
      anomalies.push({
        type: 'high_pause_rate',
        severity: 'medium',
        value: typingData.pauseRate,
        description: '停顿频率高，可能表示思考困难或注意力分散',
      });
    }
  }

  return { anomalies, indicators };
}

/**
 * Calculate typing behavior baseline from historical data
 * @param {Array} typingSessions - Array of typing session data
 * @returns {object} Typing baseline metrics
 */
function calculateTypingBaseline(typingSessions) {
  if (!typingSessions || typingSessions.length < 3) {
    return null;
  }

  const speeds = typingSessions.map(s => s.avgSpeed).filter(s => s !== undefined);
  const deleteRates = typingSessions.map(s => s.deleteRate).filter(r => r !== undefined);

  const baseline = {
    hasBaseline: true,
    sessionsUsed: typingSessions.length,
    speed: {
      mean: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 50,
      std: 0,
    },
    deleteRate: {
      mean: deleteRates.length > 0 ? deleteRates.reduce((a, b) => a + b, 0) / deleteRates.length : 0.1,
      std: 0,
    },
  };

  // Calculate standard deviations
  if (speeds.length >= 2) {
    const mean = baseline.speed.mean;
    baseline.speed.std = Math.sqrt(
      speeds.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / speeds.length
    );
  }

  if (deleteRates.length >= 2) {
    const mean = baseline.deleteRate.mean;
    baseline.deleteRate.std = Math.sqrt(
      deleteRates.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / deleteRates.length
    );
  }

  return baseline;
}

// ── Behavior Pattern Analysis ──────────────────────────────────

/**
 * Analyze a single day's behavior record for anomalies
 * @param {object} record - Behavior record for one day
 * @param {object} context - Recent behavior context for trend analysis
 * @param {object} baseline - Personal baseline (optional)
 * @returns {object} Behavior analysis result
 */
function analyzeDailyBehavior(record, context = {}, baseline = null) {
  if (!record) return { anomalies: [], riskFactors: [] };

  const anomalies = [];
  const riskFactors = [];

  // 如果有个人基线，使用基线对比；否则使用默认阈值
  if (baseline && baseline.hasBaseline) {
    // 1. Mood check - 对比个人基线
    if (record.moodRating !== null) {
      const deviation = baseline.mood.mean - record.moodRating;
      const threshold = Math.max(baseline.mood.std * 1.5, 1); // 至少1分的阈值
      if (deviation >= threshold) {
        anomalies.push({
          type: 'low_mood',
          severity: deviation >= threshold * 2 ? 'high' : 'medium',
          value: record.moodRating,
          baseline: baseline.mood.mean,
          deviation: Math.round(deviation * 10) / 10,
        });
      }
    }

    // 2. Task completion check - 对比个人基线
    if (record.tasksTotal > 0) {
      const rate = record.tasksCompleted / record.tasksTotal;
      const deviation = baseline.taskCompletion.mean - rate;
      const threshold = Math.max(baseline.taskCompletion.std * 1.5, 0.2); // 至少20%的阈值
      if (deviation >= threshold) {
        anomalies.push({
          type: 'low_task_completion',
          severity: deviation >= threshold * 2 ? 'medium' : 'low',
          value: rate,
          baseline: baseline.taskCompletion.mean,
        });
      }
    }

    // 3. Habit consistency check - 对比个人基线
    if (record.habitsTotal > 0) {
      const rate = record.habitsChecked / record.habitsTotal;
      const deviation = baseline.habitConsistency.mean - rate;
      const threshold = Math.max(baseline.habitConsistency.std * 1.5, 0.2);
      if (deviation >= threshold) {
        anomalies.push({
          type: 'habit_break',
          severity: deviation >= threshold * 2 ? 'medium' : 'low',
          value: rate,
          baseline: baseline.habitConsistency.mean,
        });
      }
    }
  } else {
    // 没有基线时使用默认阈值（向后兼容）
    if (record.moodRating !== null && record.moodRating <= 2) {
      anomalies.push({ type: 'low_mood', severity: record.moodRating === 1 ? 'high' : 'medium', value: record.moodRating });
    }

    if (record.tasksTotal > 3 && record.tasksCompleted === 0) {
      anomalies.push({ type: 'zero_task_completion', severity: 'medium' });
    } else if (record.tasksTotal > 0) {
      const rate = record.tasksCompleted / record.tasksTotal;
      if (rate < 0.2) {
        anomalies.push({ type: 'low_task_completion', severity: 'low', value: rate });
      }
    }

    if (record.habitsTotal > 0) {
      const rate = record.habitsChecked / record.habitsTotal;
      if (rate < 0.2) {
        anomalies.push({ type: 'habit_break', severity: 'medium', value: rate });
      }
    }
  }

  // 1. Diary frequency check
  if (!record.diaryWritten) {
    anomalies.push({ type: 'no_diary', severity: 'low' });
  }

  // 5. Late night activity check
  if (record.activeHours && record.activeHours.some(h => h >= 0 && h < 5)) {
    anomalies.push({ type: 'late_night_activity', severity: 'low' });
  }

  // 6. Word count check (very short diary may indicate low engagement)
  if (record.diaryWritten && record.diaryWordCount < 20) {
    anomalies.push({ type: 'short_diary', severity: 'low', value: record.diaryWordCount });
  }

  // Calculate risk factors from trends
  if (context.consecutiveNoDiary >= 3) {
    riskFactors.push({ type: 'consecutive_no_diary', days: context.consecutiveNoDiary, weight: 15 });
  }

  if (context.consecutiveLowMood >= 2) {
    riskFactors.push({ type: 'consecutive_low_mood', days: context.consecutiveLowMood, weight: 20 });
  }

  if (context.taskCompletionDrop) {
    riskFactors.push({ type: 'task_completion_drop', weight: 10 });
  }

  if (context.habitBreakDays >= 3) {
    riskFactors.push({ type: 'habit_break_streak', days: context.habitBreakDays, weight: 10 });
  }

  return { anomalies, riskFactors };
}

/**
 * Analyze behavior trends over multiple days
 * @param {Array} records - Array of behavior records (sorted by date ascending)
 * @returns {object} Trend analysis result
 */
function analyzeBehaviorTrends(records) {
  if (!records || records.length === 0) {
    return {
      consecutiveNoDiary: 0,
      consecutiveLowMood: 0,
      taskCompletionDrop: false,
      habitBreakDays: 0,
      averageMood: null,
      averageTaskRate: null,
      averageHabitRate: null,
      moodVolatility: 0,
      lateNightRatio: 0,
    };
  }

  // Consecutive no diary (from most recent)
  let consecutiveNoDiary = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (!records[i].diaryWritten) {
      consecutiveNoDiary++;
    } else {
      break;
    }
  }

  // Consecutive low mood (from most recent)
  let consecutiveLowMood = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].moodRating !== null && records[i].moodRating <= 2) {
      consecutiveLowMood++;
    } else if (records[i].moodRating !== null) {
      break;
    }
  }

  // Task completion drop (recent 3 days vs previous 3 days)
  let taskCompletionDrop = false;
  if (records.length >= 6) {
    const recent3 = records.slice(-3);
    const prev3 = records.slice(-6, -3);
    const recentRate = recent3.reduce((s, r) => s + (r.tasksTotal > 0 ? r.tasksCompleted / r.tasksTotal : 0), 0) / 3;
    const prevRate = prev3.reduce((s, r) => s + (r.tasksTotal > 0 ? r.tasksCompleted / r.tasksTotal : 0), 0) / 3;
    taskCompletionDrop = prevRate > 0.5 && recentRate < prevRate * 0.5;
  }

  // Habit break streak
  let habitBreakDays = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].habitsTotal > 0 && records[i].habitsChecked / records[i].habitsTotal < 0.3) {
      habitBreakDays++;
    } else {
      break;
    }
  }

  // Averages
  const moodRecords = records.filter(r => r.moodRating !== null);
  const averageMood = moodRecords.length > 0
    ? moodRecords.reduce((s, r) => s + r.moodRating, 0) / moodRecords.length
    : null;

  const taskRecords = records.filter(r => r.tasksTotal > 0);
  const averageTaskRate = taskRecords.length > 0
    ? taskRecords.reduce((s, r) => s + r.tasksCompleted / r.tasksTotal, 0) / taskRecords.length
    : null;

  const habitRecords = records.filter(r => r.habitsTotal > 0);
  const averageHabitRate = habitRecords.length > 0
    ? habitRecords.reduce((s, r) => s + r.habitsChecked / r.habitsTotal, 0) / habitRecords.length
    : null;

  // Mood volatility (standard deviation)
  let moodVolatility = 0;
  if (moodRecords.length >= 2) {
    const mean = averageMood;
    const squaredDiffs = moodRecords.map(r => Math.pow(r.moodRating - mean, 2));
    const variance = squaredDiffs.reduce((s, d) => s + d, 0) / squaredDiffs.length;
    moodVolatility = Math.round(Math.sqrt(variance) * 100) / 100;
  }

  // Late night activity ratio
  const lateNightCount = records.filter(r =>
    r.activeHours && r.activeHours.some(h => h >= 0 && h < 5)
  ).length;
  const lateNightRatio = records.length > 0 ? lateNightCount / records.length : 0;

  return {
    consecutiveNoDiary,
    consecutiveLowMood,
    taskCompletionDrop,
    habitBreakDays,
    averageMood: averageMood ? Math.round(averageMood * 10) / 10 : null,
    averageTaskRate: averageTaskRate ? Math.round(averageTaskRate * 100) / 100 : null,
    averageHabitRate: averageHabitRate ? Math.round(averageHabitRate * 100) / 100 : null,
    moodVolatility,
    lateNightRatio: Math.round(lateNightRatio * 100) / 100,
  };
}

/**
 * Generate a behavior summary text
 * @param {object} trends - Trend analysis result
 * @returns {string} Human-readable summary
 */
function generateBehaviorSummary(trends) {
  const parts = [];

  if (trends.consecutiveNoDiary >= 3) {
    parts.push(`已经${trends.consecutiveNoDiary}天没写日记了`);
  }

  if (trends.consecutiveLowMood >= 2) {
    parts.push(`连续${trends.consecutiveLowMood}天心情评分偏低`);
  }

  if (trends.taskCompletionDrop) {
    parts.push('最近任务完成率明显下降');
  }

  if (trends.habitBreakDays >= 3) {
    parts.push(`习惯打卡已中断${trends.habitBreakDays}天`);
  }

  if (trends.moodVolatility > 1.5) {
    parts.push('情绪波动较大');
  }

  if (trends.lateNightRatio > 0.5) {
    parts.push('近期频繁深夜活跃');
  }

  if (parts.length === 0) {
    if (trends.averageMood && trends.averageMood >= 4) {
      return '最近状态不错，继续保持！';
    }
    return '近期行为模式正常，无明显异常。';
  }

  return parts.join('；');
}

// ── IPC Handlers ──────────────────────────────────────────────

function registerHandlers(ipcMain) {
  ipcMain.handle('behavior:analyzeDaily', async (_event, record, context, baseline) => {
    try {
      return analyzeDailyBehavior(record, context, baseline);
    } catch (err) {
      console.error('[BehaviorAnalyzer] analyzeDaily error:', err);
      return { anomalies: [], riskFactors: [] };
    }
  });

  ipcMain.handle('behavior:analyzeTrends', async (_event, records) => {
    try {
      return analyzeBehaviorTrends(records);
    } catch (err) {
      console.error('[BehaviorAnalyzer] analyzeTrends error:', err);
      return {
        consecutiveNoDiary: 0,
        consecutiveLowMood: 0,
        taskCompletionDrop: false,
        habitBreakDays: 0,
        averageMood: null,
        averageTaskRate: null,
        averageHabitRate: null,
        moodVolatility: 0,
        lateNightRatio: 0,
      };
    }
  });

  ipcMain.handle('behavior:calculateBaseline', async (_event, records) => {
    try {
      return calculatePersonalBaseline(records);
    } catch (err) {
      console.error('[BehaviorAnalyzer] calculateBaseline error:', err);
      return null;
    }
  });

  ipcMain.handle('behavior:generateSummary', async (_event, trends) => {
    try {
      return generateBehaviorSummary(trends);
    } catch (err) {
      console.error('[BehaviorAnalyzer] generateSummary error:', err);
      return '无法生成行为分析摘要';
    }
  });
}

module.exports = {
  analyzeDailyBehavior,
  analyzeBehaviorTrends,
  calculatePersonalBaseline,
  analyzeTypingBehavior,
  calculateTypingBaseline,
  generateBehaviorSummary,
  registerHandlers,
};
