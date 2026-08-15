/**
 * Risk Trend Predictor — 7 日风险升级概率 + 情绪预测（P2-2）
 *
 * 方法学（详见 docs/risk_methodology.md 第 6 节）：
 * - **统计学习模型**（非神经网络）：
 *   - 7 日情绪预测：线性回归（最小二乘闭式解）外推每日情绪（1-5）
 *   - 风险升级概率：逻辑回归（纯 JS 梯度下降 + L2 正则）拟合个人历史窗口
 * - 特征（每 3 天滑动窗口）：moodMean, moodTrend(斜率), moodVolatility,
 *   diarySkipDays, taskRate, habitRate, lateNightFreq, riskScoreLevel
 * - 目标：未来 7 天风险等级上升 ≥1 档（用情绪恶化近似：next7d 平均情绪 < 窗口情绪 - 0.5）
 * - **样本不足回退**：带标签窗口 < 8 时回退启发式（趋势斜率 + 波动率 + 深夜频率），
 *   并在 method/note 中如实标注
 *
 * 诚实义务：method 与 note 必须随结果返回，UI 展示时必须引用 risk_methodology.md 并带免责。
 */

// ── 工具 ────────────────────────────────────────────────────

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  if (!arr || arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(v => Math.pow(v - m, 2))));
}

/** 线性回归（最小二乘）: y = slope * x + intercept */
function linearRegression(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: mean(ys), r2: 0 };
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += Math.pow(xs[i] - mx, 2);
  }
  const slope = den > 0 ? num / den : 0;
  const intercept = my - slope * mx;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += Math.pow(ys[i] - (slope * xs[i] + intercept), 2);
    ssTot += Math.pow(ys[i] - my, 2);
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/** logit(p) = ln(p/(1-p))，clip 防止 log(0) */
function logit(p) {
  const q = clamp(p, 1e-6, 1 - 1e-6);
  return Math.log(q / (1 - q));
}

/**
 * 归一化预测校准参数（防御越界 + 冷启动回退）。
 * - horizonBias：长度 7，缺失/样本不足 → 全 0
 * - probA ∈ [0.7, 1.4] / probB ∈ [-0.8, 0.8]，样本 < 8 → 保持 a=1,b=0（不改）
 */
function normalizeForecastCalibration(calibration) {
  const FORECAST_MIN_SAMPLES = 5;
  const PLAIN_MIN_SAMPLES = 8;
  if (!calibration) {
    return { horizonBias: [0, 0, 0, 0, 0, 0, 0], probA: 1, probB: 0, sampleCount: 0 };
  }
  const sampleCount = Number(calibration.sampleCount) || 0;
  let horizonBias = Array.isArray(calibration.horizonBias)
    ? calibration.horizonBias.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0))
    : [0, 0, 0, 0, 0, 0, 0];
  while (horizonBias.length < 7) horizonBias.push(0);
  horizonBias = horizonBias.slice(0, 7);
  if (sampleCount < FORECAST_MIN_SAMPLES) {
    horizonBias = [0, 0, 0, 0, 0, 0, 0];
  }

  let probA = 1;
  let probB = 0;
  if (sampleCount >= PLAIN_MIN_SAMPLES) {
    probA = clamp(Number(calibration.probA) || 1, 0.7, 1.4);
    probB = clamp(Number(calibration.probB) || 0, -0.8, 0.8);
  }
  return { horizonBias, probA, probB, sampleCount };
}

/**
 * 逻辑回归（梯度下降 + L2 正则）
 * @param {number[][]} features 每行 [x0=1, x1..xn]
 * @param {number[]} labels 0/1
 * @returns {number[]} 系数 w（含 bias w0）
 */
function fitLogistic(features, labels, opts) {
  const o = opts || {};
  const lr = o.lr || 0.3;
  const lambda = o.lambda || 0.02;
  const iters = o.iters || 300;
  const n = features.length;
  if (n === 0) return null;
  const dim = features[0].length;
  let w = new Array(dim).fill(0);

  for (let iter = 0; iter < iters; iter++) {
    const grad = new Array(dim).fill(0);
    for (let i = 0; i < n; i++) {
      const x = features[i];
      const p = sigmoid(x.reduce((s, xv, j) => s + w[j] * xv, 0));
      const err = p - labels[i];
      for (let j = 0; j < dim; j++) grad[j] += err * x[j];
    }
    for (let j = 0; j < dim; j++) {
      // L2 正则（bias 不惩罚）
      const reg = j === 0 ? 0 : lambda * w[j];
      w[j] -= lr * (grad[j] / n + reg);
    }
  }
  return w;
}

// ── 特征工程 ────────────────────────────────────────────────

/** 把单日点转成 1-5 情绪值（mood 优先，其次 sentimentScore 映射） */
function dayMood(point) {
  if (point == null) return null;
  if (typeof point.mood === 'number') return clamp(point.mood, 1, 5);
  if (typeof point.sentimentScore === 'number') {
    // -1..1 → 1..5
    return clamp(Math.round((point.sentimentScore + 1) * 2 + 1), 1, 5);
  }
  return null;
}

function dayTaskRate(point) {
  if (point == null || !point.tasksTotal) return null;
  return clamp(point.tasksCompleted / point.tasksTotal, 0, 1);
}

function dayHabitRate(point) {
  if (point == null || !point.habitsTotal) return null;
  return clamp(point.habitsChecked / point.habitsTotal, 0, 1);
}

/**
 * 3 天窗口特征
 * @returns {object} { moodMean, moodTrend, moodVolatility, diarySkipDays, taskRate, habitRate, lateNightFreq, riskScoreLevel }
 */
function windowFeatures(days) {
  const moods = days.map(dayMood).filter(v => v != null);
  const moodMean = moods.length > 0 ? mean(moods) : null;
  let moodTrend = 0;
  if (moods.length >= 2) {
    const lr = linearRegression(moods.map((_, i) => i), moods);
    moodTrend = lr.slope;
  }
  const moodVolatility = moods.length > 0 ? std(moods) : 0;
  const diarySkipDays = days.filter(d => !d.diaryWritten).length;
  const taskRates = days.map(dayTaskRate).filter(v => v != null);
  const taskRate = taskRates.length > 0 ? mean(taskRates) : null;
  const habitRates = days.map(dayHabitRate).filter(v => v != null);
  const habitRate = habitRates.length > 0 ? mean(habitRates) : null;
  const lateNightFreq = days.filter(d => d.lateNight).length;
  const riskScores = days.map(d => (typeof d.riskScore === 'number' ? d.riskScore : null)).filter(v => v != null);
  const riskScoreLevel = riskScores.length > 0 ? mean(riskScores) : null;

  return { moodMean, moodTrend, moodVolatility, diarySkipDays, taskRate, habitRate, lateNightFreq, riskScoreLevel };
}

/**
 * 把窗口特征映射成逻辑回归输入向量 [1, f1..f4]
 * f1 = (moodMean-3)/2 归一化；f2 = moodTrend（天斜率，clip ±1）；f3 = moodVolatility；f4 = lateNightFreq/3
 */
function featureVector(f) {
  return [
    1,
    f.moodMean == null ? 0 : clamp((f.moodMean - 3) / 2, -1, 1),
    clamp(f.moodTrend, -1, 1),
    clamp(f.moodVolatility, 0, 2) / 2,
    clamp(f.lateNightFreq / 3, 0, 1),
  ];
}

// ── 主入口 ──────────────────────────────────────────────────

/**
 * @param {object} input
 * @param {Array} input.dailySeries 每日点（按日期升序）
 * @param {object|null} [input.personalBaseline]
 * @returns {object} RiskPredictionResult
 */
function predict(input) {
  const dailySeries = Array.isArray(input && input.dailySeries) ? input.dailySeries : [];
  const personalBaseline = input && input.personalBaseline ? input.personalBaseline : null;
  const forecastCalibration = input && input.forecastCalibration ? input.forecastCalibration : null;

  const empty = {
    riskUpgradeProb: 0.5,
    moodForecast7d: [],
    riskTrend: 'stable',
    confidence: 0,
    method: 'heuristic-fallback',
    note: '数据不足，暂不输出预测（至少需要 7 天数据）。',
  };

  if (dailySeries.length < 7) return empty;

  // ── 7 日情绪预测：线性回归外推 ────────────────────────────
  const moodSeries = dailySeries
    .map(dayMood)
    .filter(v => v != null);
  let moodForecast7d = [];
  let forecastByLinear = false;
  if (moodSeries.length >= 3) {
    const lr = linearRegression(moodSeries.map((_, i) => i), moodSeries);
    const lastIdx = moodSeries.length - 1;
    moodForecast7d = Array.from({ length: 7 }, (_, k) => {
      const v = lr.slope * (lastIdx + 1 + k) + lr.intercept;
      return Math.round(clamp(v, 1, 5) * 10) / 10;
    });
    forecastByLinear = true;
  } else {
    const last = moodSeries[moodSeries.length - 1];
    moodForecast7d = Array.from({ length: 7 }, () => last);
  }

  // ── 应用本地步长偏差校准（P1，冷启动 N<5 → b=0）────────────
  const calBias = normalizeForecastCalibration(forecastCalibration).horizonBias;
  moodForecast7d = moodForecast7d.map((f, i) =>
    Math.round(clamp(f + (calBias[i] || 0), 1, 5) * 10) / 10
  );

  // ── 风险升级概率 ─────────────────────────────────────────
  // 构建 3 天滑动窗口（step 1），标签 = 未来 7 天平均情绪比窗口低 ≥0.5 → 1
  const windows = [];
  const labels = [];
  for (let i = 0; i + 3 <= dailySeries.length; i++) {
    const win = dailySeries.slice(i, i + 3);
    const feats = windowFeatures(win);
    if (feats.moodMean == null) continue;
    const future = dailySeries.slice(i + 3, i + 3 + 7).map(dayMood).filter(v => v != null);
    if (future.length >= 2) {
      const nextMood = mean(future);
      const label = nextMood < feats.moodMean - 0.5 ? 1 : 0;
      windows.push(feats);
      labels.push(label);
    }
  }

  const labeledCount = windows.length;
  const latestWin = windows.length > 0 ? windows[windows.length - 1]
    : windowFeatures(dailySeries.slice(-3));

  let riskUpgradeProb;
  let method;
  let confidence;
  let note;

  // 带标签窗口 < 8 → 启发式回退（如实标注）
  if (labeledCount >= 8) {
    const features = windows.map(windowFeatures => featureVector(windowFeatures));
    const w = fitLogistic(features, labels);
    if (w) {
      const x = featureVector(latestWin);
      riskUpgradeProb = sigmoid(x.reduce((s, xv, j) => s + w[j] * xv, 0));
      method = 'logistic-regression';
      confidence = clamp(0.35 + labeledCount * 0.015, 0.35, 0.85);
      note = '风险升级概率由逻辑回归（统计学习）拟合个人历史窗口得到；' +
        '7 日情绪预测由线性回归外推。统计预测≠诊断，详见 docs/risk_methodology.md。';
    } else {
      // 拟合失败 → 启发式
      const h = heuristicProb(latestWin);
      riskUpgradeProb = h;
      method = 'heuristic-fallback';
      confidence = 0.35;
      note = '逻辑回归拟合失败，回退启发式（趋势斜率 + 波动率 + 深夜频率）。' +
        '统计预测≠诊断，详见 docs/risk_methodology.md。';
    }
  } else {
    riskUpgradeProb = heuristicProb(latestWin);
    method = 'heuristic-fallback';
    confidence = 0.35;
    note = '历史样本不足（<8 个带标签窗口），风险升级概率采用启发式回退' +
      '（趋势斜率 + 波动率 + 深夜频率）。7 日情绪预测' +
      (forecastByLinear ? '由线性回归外推。' : '取最近值。') +
      '统计预测≠诊断，详见 docs/risk_methodology.md。';
  }

  // ── 应用概率重标定（Platt）+ 情绪步长偏差已在上方应用 ─────
  const cal = normalizeForecastCalibration(forecastCalibration);
  if (method === 'logistic-regression' && cal.sampleCount >= 8) {
    riskUpgradeProb = sigmoid(cal.probA * logit(riskUpgradeProb) + cal.probB);
  }
  if (cal.sampleCount >= 5) {
    note += `已应用本地校准（${cal.sampleCount} 次预测反馈）。`;
  } else {
    note += '预测校准样本不足，未做本地修正。';
  }

  // 趋势方向（基于最近 3 天情绪斜率 + 预测首日）
  let riskTrend = 'stable';
  if (moodSeries.length >= 3) {
    const recent = moodSeries.slice(-3);
    const lr = linearRegression(recent.map((_, i) => i), recent);
    if (lr.slope < -0.2) riskTrend = 'rising';
    else if (lr.slope > 0.2) riskTrend = 'falling';
  }

  return {
    riskUpgradeProb: Math.round(clamp(riskUpgradeProb, 0, 1) * 100) / 100,
    moodForecast7d,
    riskTrend,
    confidence: Math.round(clamp(confidence, 0, 1) * 100) / 100,
    method,
    note,
  };
}

/**
 * 启发式风险升级概率：情绪斜率下降 + 波动率高 + 深夜频繁 → 概率高
 */
function heuristicProb(f) {
  if (!f || f.moodMean == null) return 0.5;
  const slopePenalty = clamp(-f.moodTrend * 1.5, -0.6, 0.6);      // 下降 → +概率
  const volatilityPenalty = clamp((f.moodVolatility - 0.5) * 0.3, 0, 0.2);
  const lateNightPenalty = clamp((f.lateNightFreq / 3) * 0.15, 0, 0.15);
  const diarySkipPenalty = clamp((f.diarySkipDays / 3) * 0.1, 0, 0.1);
  return clamp(0.5 + slopePenalty + volatilityPenalty + lateNightPenalty + diarySkipPenalty, 0.05, 0.95);
}

module.exports = {
  predict,
  fitLogistic,
  linearRegression,
  forecastMood: (series) => {
    // 便捷入口：给定情绪序列（1-5），返回 7 日线性外推
    const moods = series.filter(v => typeof v === 'number');
    if (moods.length < 2) return Array.from({ length: 7 }, () => moods[moods.length - 1] || 3);
    const lr = linearRegression(moods.map((_, i) => i), moods);
    const last = moods.length - 1;
    return Array.from({ length: 7 }, (_, k) => {
      const v = lr.slope * (last + 1 + k) + lr.intercept;
      return Math.round(clamp(v, 1, 5) * 10) / 10;
    });
  },
  windowFeatures,
  heuristicProb,
};
