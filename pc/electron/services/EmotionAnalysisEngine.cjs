/**
 * Emotion Analysis Engine
 * Background service for continuous emotion analysis and risk assessment
 * Runs in Electron main process, provides IPC methods for renderer
 *
 * 情绪维度模型：PANAS (Positive and Negative Affect Schedule)
 * 参考：Watson et al., 1988; PANAS-t (中文版)
 *
 * PANAS模型更适合文本情感分析，已被广泛验证用于心理健康评估
 * 原Ekman面部表情模型不适用于文本分析
 */

const SentimentService = require('./SentimentService.cjs');

// ── PANAS Emotion Keywords ───────────────────────────────────
// 参考：PANAS-t (中文版) - 适用于中国人群的情感量表
// 正面情感(PA)：感兴趣的、兴奋的、强壮的、热情的、自豪的、警觉的、受鼓舞的、坚定的、专注的、活跃的
// 负面情感(NA)：心烦的、苦恼的、内疚的、害怕的、敌意的、易怒的、羞愧的、紧张的、坐立不安的、恐惧的

const PANAS_KEYWORDS = {
  // 正面情感 (Positive Affect)
  interested: [
    { word: '感兴趣', weight: 1.0 },
    { word: '好奇', weight: 1.1 },
    { word: '专注', weight: 1.2 },
    { word: '投入', weight: 1.3 },
    { word: '着迷', weight: 1.5 },
    { word: '热衷', weight: 1.4 },
  ],
  excited: [
    { word: '兴奋', weight: 1.0 },
    { word: '激动', weight: 1.2 },
    { word: '振奋', weight: 1.3 },
    { word: '亢奋', weight: 1.5 },
    { word: '兴高采烈', weight: 1.8 },
    { word: '欣喜若狂', weight: 2.0 },
  ],
  strong: [
    { word: '强壮', weight: 1.0 },
    { word: '有力', weight: 1.1 },
    { word: '自信', weight: 1.2 },
    { word: '坚定', weight: 1.3 },
    { word: '坚强', weight: 1.4 },
    { word: '充满力量', weight: 1.6 },
  ],
  enthusiastic: [
    { word: '热情', weight: 1.0 },
    { word: '热心', weight: 1.1 },
    { word: '积极', weight: 1.2 },
    { word: '踊跃', weight: 1.3 },
    { word: '充满激情', weight: 1.5 },
  ],
  proud: [
    { word: '自豪', weight: 1.0 },
    { word: '骄傲', weight: 1.2 },
    { word: '得意', weight: 1.1 },
    { word: '成就感', weight: 1.4 },
    { word: '荣耀', weight: 1.5 },
  ],
  alert: [
    { word: '警觉', weight: 1.0 },
    { word: '清醒', weight: 1.1 },
    { word: '敏锐', weight: 1.2 },
    { word: '机警', weight: 1.3 },
  ],
  inspired: [
    { word: '受鼓舞', weight: 1.0 },
    { word: '鼓舞', weight: 1.1 },
    { word: '启发', weight: 1.2 },
    { word: '激励', weight: 1.3 },
    { word: '振奋人心', weight: 1.5 },
  ],
  determined: [
    { word: '坚定', weight: 1.0 },
    { word: '决心', weight: 1.1 },
    { word: '果断', weight: 1.2 },
    { word: '毅力', weight: 1.3 },
    { word: '矢志不渝', weight: 1.5 },
  ],
  attentive: [
    { word: '专注', weight: 1.0 },
    { word: '集中', weight: 1.1 },
    { word: '全神贯注', weight: 1.4 },
    { word: '聚精会神', weight: 1.5 },
  ],
  active: [
    { word: '活跃', weight: 1.0 },
    { word: '精力充沛', weight: 1.3 },
    { word: '充满活力', weight: 1.4 },
    { word: '生机勃勃', weight: 1.5 },
  ],

  // 负面情感 (Negative Affect)
  distressed: [
    { word: '心烦', weight: 1.0 },
    { word: '苦恼', weight: 1.2 },
    { word: '痛苦', weight: 1.5 },
    { word: '煎熬', weight: 1.6 },
    { word: '折磨', weight: 1.7 },
  ],
  upset: [
    { word: '心烦意乱', weight: 1.0 },
    { word: '不安', weight: 1.1 },
    { word: '焦虑', weight: 1.3 },
    { word: '烦躁', weight: 1.2 },
    { word: '坐立不安', weight: 1.5 },
  ],
  guilty: [
    { word: '内疚', weight: 1.0 },
    { word: '愧疚', weight: 1.2 },
    { word: '自责', weight: 1.3 },
    { word: '负罪感', weight: 1.5 },
    { word: '良心不安', weight: 1.4 },
  ],
  scared: [
    { word: '害怕', weight: 1.0 },
    { word: '恐惧', weight: 1.5 },
    { word: '惊恐', weight: 1.6 },
    { word: '胆怯', weight: 1.1 },
    { word: '畏惧', weight: 1.3 },
  ],
  hostile: [
    { word: '敌意', weight: 1.0 },
    { word: '敌对', weight: 1.2 },
    { word: '怨恨', weight: 1.4 },
    { word: '仇恨', weight: 1.6 },
    { word: '愤恨', weight: 1.5 },
  ],
  irritable: [
    { word: '易怒', weight: 1.0 },
    { word: '暴躁', weight: 1.3 },
    { word: '恼火', weight: 1.2 },
    { word: '烦躁', weight: 1.1 },
    { word: '怒火中烧', weight: 1.7 },
  ],
  ashamed: [
    { word: '羞耻', weight: 1.0 },
    { word: '羞愧', weight: 1.2 },
    { word: '惭愧', weight: 1.1 },
    { word: '丢脸', weight: 1.3 },
    { word: '无地自容', weight: 1.6 },
  ],
  nervous: [
    { word: '紧张', weight: 1.0 },
    { word: '忐忑', weight: 1.1 },
    { word: '不安', weight: 1.2 },
    { word: '提心吊胆', weight: 1.4 },
    { word: '战战兢兢', weight: 1.5 },
  ],
  jittery: [
    { word: '坐立不安', weight: 1.0 },
    { word: '心神不宁', weight: 1.2 },
    { word: '惶恐', weight: 1.3 },
    { word: '惊慌失措', weight: 1.6 },
  ],
  afraid: [
    { word: '恐惧', weight: 1.0 },
    { word: '害怕', weight: 1.0 },
    { word: '惊恐', weight: 1.4 },
    { word: '恐慌', weight: 1.5 },
    { word: '胆战心惊', weight: 1.7 },
  ],
};

// 向后兼容：保留旧的EMOTION_KEYWORDS结构
// 将PANAS维度映射到旧的6维度
const EMOTION_KEYWORDS = {
  joy: [
    { word: '开心', weight: 1.0 },
    { word: '快乐', weight: 1.2 },
    { word: '高兴', weight: 1.0 },
    { word: '幸福', weight: 1.5 },
    { word: '满足', weight: 1.0 },
    { word: '喜悦', weight: 1.3 },
    { word: '兴奋', weight: 1.5 },
    { word: '愉快', weight: 1.0 },
    { word: '欣喜', weight: 1.3 },
    { word: '欣慰', weight: 1.1 },
    { word: '惊喜', weight: 1.4 },
    { word: '享受', weight: 1.2 },
    { word: '充实', weight: 1.1 },
    { word: '美好', weight: 1.3 },
    { word: '甜蜜', weight: 1.4 },
    { word: '温馨', weight: 1.2 },
    { word: '浪漫', weight: 1.3 },
    { word: '期待', weight: 1.0 },
    { word: '向往', weight: 1.1 },
    { word: '憧憬', weight: 1.2 },
    { word: '成就', weight: 1.4 },
    { word: '成功', weight: 1.3 },
    { word: '顺利', weight: 1.0 },
    { word: '好运', weight: 1.1 },
    { word: '狂喜', weight: 2.0 },
    { word: '欣喜若狂', weight: 2.0 },
    { word: '兴高采烈', weight: 1.8 },
    { word: '欢天喜地', weight: 1.8 },
    { word: '心花怒放', weight: 1.9 },
    { word: '喜出望外', weight: 1.7 },
  ],
  sadness: [
    { word: '难过', weight: 1.0 },
    { word: '悲伤', weight: 1.3 },
    { word: '伤心', weight: 1.1 },
    { word: '心碎', weight: 1.8 },
    { word: '失落', weight: 1.1 },
    { word: '沮丧', weight: 1.2 },
    { word: '惆怅', weight: 1.1 },
    { word: '黯然', weight: 1.0 },
    { word: '伤感', weight: 1.1 },
    { word: '悲痛', weight: 1.7 },
    { word: '哀伤', weight: 1.4 },
    { word: '心酸', weight: 1.3 },
    { word: '凄凉', weight: 1.4 },
    { word: '落寞', weight: 1.2 },
    { word: '孤独', weight: 1.2 },
    { word: '寂寞', weight: 1.1 },
    { word: '空虚', weight: 1.2 },
    { word: '无助', weight: 1.4 },
    { word: '绝望', weight: 1.9 },
    { word: '消沉', weight: 1.3 },
    { word: '颓废', weight: 1.4 },
    { word: '痛不欲生', weight: 2.0 },
    { word: '肝肠寸断', weight: 1.9 },
    { word: '撕心裂肺', weight: 1.9 },
    { word: '悲痛欲绝', weight: 2.0 },
    { word: '万念俱灰', weight: 2.0 },
  ],
  anger: [
    { word: '愤怒', weight: 1.5 },
    { word: '生气', weight: 1.0 },
    { word: '暴躁', weight: 1.4 },
    { word: '易怒', weight: 1.2 },
    { word: '烦躁', weight: 1.1 },
    { word: '恼火', weight: 1.2 },
    { word: '恼怒', weight: 1.3 },
    { word: '气愤', weight: 1.3 },
    { word: '怨恨', weight: 1.5 },
    { word: '厌倦', weight: 1.1 },
    { word: '反感', weight: 1.2 },
    { word: '排斥', weight: 1.1 },
    { word: '抗拒', weight: 1.2 },
    { word: '窝火', weight: 1.3 },
    { word: '憋屈', weight: 1.2 },
    { word: '堵心', weight: 1.1 },
    { word: '闹心', weight: 1.1 },
    { word: '糟心', weight: 1.2 },
    { word: '暴跳如雷', weight: 2.0 },
    { word: '怒不可遏', weight: 1.9 },
    { word: '怒火中烧', weight: 1.8 },
    { word: '火冒三丈', weight: 1.8 },
    { word: '义愤填膺', weight: 1.7 },
  ],
  fear: [
    { word: '害怕', weight: 1.0 },
    { word: '恐惧', weight: 1.5 },
    { word: '担心', weight: 1.0 },
    { word: '焦虑', weight: 1.3 },
    { word: '紧张', weight: 1.1 },
    { word: '不安', weight: 1.1 },
    { word: '忧虑', weight: 1.2 },
    { word: '恐慌', weight: 1.7 },
    { word: '畏惧', weight: 1.3 },
    { word: '胆怯', weight: 1.1 },
    { word: '心慌', weight: 1.2 },
    { word: '心虚', weight: 1.0 },
    { word: '提心吊胆', weight: 1.4 },
    { word: '战战兢兢', weight: 1.3 },
    { word: '忐忑', weight: 1.1 },
    { word: '惊恐万状', weight: 2.0 },
    { word: '胆战心惊', weight: 1.7 },
    { word: '心惊肉跳', weight: 1.6 },
    { word: '毛骨悚然', weight: 1.8 },
    { word: '不寒而栗', weight: 1.6 },
  ],
  surprise: [
    { word: '惊讶', weight: 1.0 },
    { word: '震惊', weight: 1.5 },
    { word: '意外', weight: 1.0 },
    { word: '吃惊', weight: 1.1 },
    { word: '惊喜', weight: 1.3 },
    { word: '惊吓', weight: 1.2 },
    { word: '意想不到', weight: 1.3 },
    { word: '出乎意料', weight: 1.3 },
    { word: '始料未及', weight: 1.2 },
    { word: '大吃一惊', weight: 1.6 },
    { word: '瞠目结舌', weight: 1.5 },
    { word: '目瞪口呆', weight: 1.5 },
  ],
  disgust: [
    { word: '厌恶', weight: 1.4 },
    { word: '恶心', weight: 1.3 },
    { word: '厌烦', weight: 1.2 },
    { word: '反感', weight: 1.1 },
    { word: '排斥', weight: 1.1 },
    { word: '抗拒', weight: 1.2 },
    { word: '嫌弃', weight: 1.2 },
    { word: '鄙视', weight: 1.4 },
    { word: '不屑', weight: 1.0 },
    { word: '厌弃', weight: 1.3 },
    { word: '深恶痛绝', weight: 2.0 },
    { word: '痛恨', weight: 1.8 },
    { word: '恨之入骨', weight: 1.9 },
  ],
};

// ── Social Keywords ──────────────────────────────────────────

const SOCIAL_KEYWORDS = ['朋友', '家人', '同学', '同事', '聚会', '聊天', '见面', '约会', '社交', '交流', '陪伴', '关心', '支持', '理解', '包容', '信任', '亲密', '友好', '和睦', '融洽', '默契', '孤独', '寂寞', '孤立', '排斥'];

// ── Analysis Functions ────────────────────────────────────────

/**
 * Extract multi-dimensional emotion scores from text
 * @param {string} text - Input text
 * @returns {object} Emotion scores { joy, sadness, anger, fear, surprise, disgust }
 */
function extractEmotions(text) {
  if (!text) return { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 };

  const cleanText = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}<>]/g, '');
  const emotions = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 };

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const { word, weight } of keywords) {
      if (cleanText.includes(word)) {
        emotions[emotion] += weight;
      }
    }
  }

  // Normalize to 0-1 range
  const max = Math.max(...Object.values(emotions), 1);
  for (const key of Object.keys(emotions)) {
    emotions[key] = Math.round((emotions[key] / max) * 100) / 100;
  }

  return emotions;
}

/**
 * Extract PANAS (Positive and Negative Affect Schedule) scores from text
 * 参考：Watson et al., 1988; PANAS-t (中文版)
 *
 * PANAS是心理健康评估的金标准，比Ekman面部表情模型更适合文本分析
 *
 * @param {string} text - Input text
 * @returns {object} PANAS scores { positiveAffect, negativeAffect, dimensions }
 */
function extractPANAS(text) {
  if (!text) {
    return {
      positiveAffect: 0,
      negativeAffect: 0,
      dimensions: {},
    };
  }

  const cleanText = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}<>]/g, '');
  const dimensions = {};

  // 提取每个PANAS维度的分数
  for (const [dimension, keywords] of Object.entries(PANAS_KEYWORDS)) {
    let score = 0;
    for (const { word, weight } of keywords) {
      if (cleanText.includes(word)) {
        score += weight;
      }
    }
    dimensions[dimension] = score;
  }

  // 计算正面情感(PA)和负面情感(NA)总分
  const positiveDimensions = ['interested', 'excited', 'strong', 'enthusiastic', 'proud', 'alert', 'inspired', 'determined', 'attentive', 'active'];
  const negativeDimensions = ['distressed', 'upset', 'guilty', 'scared', 'hostile', 'irritable', 'ashamed', 'nervous', 'jittery', 'afraid'];

  let positiveAffect = 0;
  let negativeAffect = 0;

  for (const dim of positiveDimensions) {
    positiveAffect += dimensions[dim] || 0;
  }
  for (const dim of negativeDimensions) {
    negativeAffect += dimensions[dim] || 0;
  }

  // 归一化到0-1范围
  const maxPA = Math.max(positiveAffect, 1);
  const maxNA = Math.max(negativeAffect, 1);

  return {
    positiveAffect: Math.round((positiveAffect / maxPA) * 100) / 100,
    negativeAffect: Math.round((negativeAffect / maxNA) * 100) / 100,
    dimensions,
    // 向后兼容：映射到旧的6维度
    // 参考 PANAS 中文版文献：surprise 由 excited+enthusiastic 推导，disgust 由 hostile+irritable 推导
    legacy: {
      joy: dimensions.excited || dimensions.enthusiastic || 0,
      sadness: dimensions.distressed || dimensions.upset || 0,
      anger: dimensions.hostile || dimensions.irritable || 0,
      fear: dimensions.scared || dimensions.afraid || 0,
      surprise: Math.round((dimensions.interested || 0) * 0.5 + (dimensions.excited || 0) * 0.5),
      disgust: Math.round((dimensions.hostile || 0) * 0.5 + (dimensions.irritable || 0) * 0.3 + (dimensions.guilty || 0) * 0.2),
    },
  };
}

/**
 * Calculate social activity score from text
 * @param {string} text - Input text
 * @returns {number} Social score 0-100
 */
function calculateSocialScore(text) {
  if (!text) return 0;

  const cleanText = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}<>]/g, '');
  let score = 0;

  for (const keyword of SOCIAL_KEYWORDS) {
    if (cleanText.includes(keyword)) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Analyze sleep pattern from diary writing time
 * @param {string} isoDate - ISO datetime string
 * @returns {object} { hour, isLateNight }
 */
function analyzeSleepPattern(isoDate) {
  if (!isoDate) return { hour: 12, isLateNight: false };

  const date = new Date(isoDate);
  const hour = date.getHours();
  return {
    hour,
    isLateNight: hour >= 0 && hour < 6, // midnight to 6am
  };
}

/**
 * Analyze a single diary entry and return comprehensive emotion data
 * @param {object} diary - { id, date, content, mood, createdAt }
 * @returns {object} Emotion analysis result with PANAS scores
 */
async function analyzeDiary(diary) {
  if (!diary || !diary.content) {
    return null;
  }

  // Sentiment analysis (ONNX model)
  const sentiment = await SentimentService.analyzeWithONNX(diary.content);

  // Multi-dimensional emotion extraction (legacy 6-dimension)
  const emotions = extractEmotions(diary.content);

  // PANAS extraction (更科学的情绪维度模型)
  const panas = extractPANAS(diary.content);

  // Social activity score
  const socialScore = calculateSocialScore(diary.content);

  // Sleep pattern from writing time
  const sleepPattern = analyzeSleepPattern(diary.createdAt);

  // Determine risk level (combine ONNX sentiment + PANAS negative affect)
  let riskLevel = sentiment?.level || 'low';
  if (panas.negativeAffect > 0.7 || emotions.sadness > 0.7 || emotions.fear > 0.7) {
    riskLevel = 'medium_low';
  }

  return {
    date: diary.date,
    sourceId: diary.id,
    sentimentScore: sentiment?.score || 0,
    emotions,
    panas, // 新增：PANAS维度
    riskLevel,
    keywords: sentiment?.keywords || [],
    socialScore,
    sleepPattern,
    wordCount: diary.content.length,
    moodRating: diary.mood,
  };
}

/**
 * Analyze conversation messages
 * @param {Array} messages - Array of { role, content }
 * @returns {object} Emotion analysis result
 */
async function analyzeConversation(messages) {
  if (!messages || messages.length === 0) return null;

  // Only analyze user messages
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return null;

  const combinedText = userMessages.map(m => m.content).join('\n');
  const sentiment = await SentimentService.analyzeWithONNX(combinedText);
  const emotions = extractEmotions(combinedText);

  return {
    sentimentScore: sentiment?.score || 0,
    emotions,
    riskLevel: sentiment?.level || 'low',
    keywords: sentiment?.keywords || [],
    messageCount: userMessages.length,
  };
}

/**
 * Calculate emotional health index (0-100)
 * @param {object} params
 * @returns {number} Health index 0-100
 */
function calculateHealthIndex({
  sentimentScore = 0.5,
  moodRating = 3,
  taskCompletionRate = 0.5,
  habitConsistency = 0.5,
  socialScore = 50,
  sleepScore = 80,
}) {
  // Normalize mood rating to 0-1 (1-5 scale)
  const normalizedMood = (moodRating - 1) / 4;

  // Weighted average — 更新权重，参考 Loneliness_Depression_Passive_Sensing_2023.pdf
  // social 上调到 0.15（社交孤立是心理健康的重要指标）
  const index = (
    sentimentScore * 0.20 +
    normalizedMood * 0.20 +
    taskCompletionRate * 0.15 +
    habitConsistency * 0.15 +
    (socialScore / 100) * 0.15 +
    (sleepScore / 100) * 0.15
  ) * 100;

  return Math.round(Math.max(0, Math.min(100, index)));
}

/**
 * Calculate emotional volatility from recent mood scores
 * @param {Array<number>} moodScores - Array of recent mood ratings
 * @returns {number} Volatility score (higher = more volatile)
 */
function calculateVolatility(moodScores) {
  if (!moodScores || moodScores.length < 2) return 0;

  const mean = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
  const squaredDiffs = moodScores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;

  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Calculate risk level from multiple factors
 *
 * 职责边界（0.0.6 统一口径）：
 * - RiskScoringEngine.cjs 是综合风险评分的权威来源（五通道加权 0-100 + 临床升级）。
 * - 本函数只做情绪维度的快速分档，供 EmotionAnalysisEngine 在没有完整五通道数据时
 *   给出一个近似情绪风险等级，不用于最终风险判定。
 * - EarlyWarningService 做趋势预测（距临界点天数），不做当前评分。
 * - 三者口径以 RiskScoringEngine 为准；若需最终风险分，请调 risk:calculate IPC。
 *
 * @param {object} factors
 * @returns {string} Risk level
 */
function calculateRiskLevel({
  recentEmotions = [],
  behaviorRecord = null,
  moodTrend = [],
  crisisKeywords = false,
}) {
  let riskScore = 0;

  // 1. Crisis keywords → immediate high risk
  if (crisisKeywords) {
    return 'critical';
  }

  // 2. Emotion analysis risk
  const highRiskEmotions = recentEmotions.filter(e => e.riskLevel === 'high');
  const mediumRiskEmotions = recentEmotions.filter(e => e.riskLevel === 'medium');

  if (highRiskEmotions.length > 0) {
    riskScore += 40;
  } else if (mediumRiskEmotions.length >= 2) {
    riskScore += 25;
  } else if (mediumRiskEmotions.length === 1) {
    riskScore += 15;
  }

  // 3. Mood trend risk (consecutive low moods)
  if (moodTrend.length >= 3) {
    const recent = moodTrend.slice(-3);
    if (recent.every(m => m <= 2)) {
      riskScore += 30; // 3 consecutive low moods
    } else if (recent.filter(m => m <= 2).length >= 2) {
      riskScore += 15; // 2 out of 3 low moods
    }
  }

  // 4. Volatility risk
  const volatility = calculateVolatility(moodTrend);
  if (volatility > 1.5) {
    riskScore += 15;
  }

  // 5. Behavior anomaly risk
  if (behaviorRecord) {
    // No diary for multiple days
    if (!behaviorRecord.diaryWritten) {
      riskScore += 5;
    }

    // Very low task completion
    if (behaviorRecord.tasksTotal > 3 && behaviorRecord.tasksCompleted === 0) {
      riskScore += 10;
    }

    // Habit breakdown
    if (behaviorRecord.habitsTotal > 0) {
      const habitRate = behaviorRecord.habitsChecked / behaviorRecord.habitsTotal;
      if (habitRate < 0.2) {
        riskScore += 10;
      }
    }
  }

  // 6. Late night activity risk
  if (behaviorRecord?.activeHours?.some(h => h >= 0 && h < 5)) {
    riskScore += 10;
  }

  // Determine risk level
  if (riskScore >= 60) return 'critical';
  if (riskScore >= 40) return 'high';
  if (riskScore >= 25) return 'medium';
  if (riskScore >= 10) return 'medium_low';
  return 'low';
}

/**
 * Generate insights from emotion data
 * @param {object} profile - Health profile data
 * @returns {Array<string>} Insights
 */
function generateInsights(profile) {
  const insights = [];

  if (profile.emotionalHealthIndex >= 80) {
    insights.push('你最近的心理状态很好，继续保持！');
  } else if (profile.emotionalHealthIndex >= 60) {
    insights.push('你的心理状态整体良好，偶尔有些小波动是正常的。');
  } else if (profile.emotionalHealthIndex >= 40) {
    insights.push('你最近可能面临一些压力，建议适当放松和休息。');
  } else {
    insights.push('你最近的状态需要关注，建议尝试一些放松练习或与人倾诉。');
  }

  if (profile.dimensions.mood < 40) {
    insights.push('情绪维度偏低，可能需要一些积极的活动来调节。');
  }

  if (profile.dimensions.stress > 70) {
    insights.push('压力感知较高，建议尝试呼吸练习或正念冥想。');
  }

  if (profile.dimensions.sleep < 50) {
    insights.push('作息不太规律，保持良好的睡眠对心理健康很重要。');
  }

  if (profile.dimensions.social < 30) {
    insights.push('社交活跃度较低，适当与朋友交流有助于情绪调节。');
  }

  return insights;
}

/**
 * Generate suggestions based on risk level and dimensions
 * @param {object} profile - Health profile data
 * @returns {Array<string>} Suggestions
 */
function generateSuggestions(profile) {
  const suggestions = [];

  if (profile.riskLevel === 'high' || profile.riskLevel === 'critical') {
    // 热线放在最后（不必要时不展现），先给可操作的自助建议
    suggestions.push('与信任的人分享你的感受');
    suggestions.push('尝试做一些让自己放松的事情');
    suggestions.push('建议拨打心理援助热线：400-161-9995');
  } else if (profile.riskLevel === 'medium') {
    suggestions.push('尝试写一篇感恩日记，记录今天值得感恩的事');
    suggestions.push('做一次 4-7-8 呼吸练习');
    suggestions.push('与朋友或家人聊聊天');
  } else {
    if (profile.dimensions.stress > 60) {
      suggestions.push('适当休息，做一些自己喜欢的事情');
    }
    if (profile.dimensions.energy < 40) {
      suggestions.push('保持规律的作息和适度运动');
    }
    if (profile.dimensions.selfCare < 40) {
      suggestions.push('关注自己的需求，做一些自我关怀的活动');
    }
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

// ── IPC Handlers ──────────────────────────────────────────────

/**
 * Register IPC handlers for emotion analysis
 * @param {Electron.IpcMain} ipcMain
 */
function registerHandlers(ipcMain) {
  ipcMain.handle('emotion:analyzeDiary', async (_event, diary) => {
    try {
      return await analyzeDiary(diary);
    } catch (err) {
      console.error('[EmotionEngine] analyzeDiary error:', err);
      return null;
    }
  });

  ipcMain.handle('emotion:analyzeConversation', async (_event, messages) => {
    try {
      return await analyzeConversation(messages);
    } catch (err) {
      console.error('[EmotionEngine] analyzeConversation error:', err);
      return null;
    }
  });

  ipcMain.handle('emotion:calculateHealthIndex', async (_event, params) => {
    try {
      return calculateHealthIndex(params);
    } catch (err) {
      console.error('[EmotionEngine] calculateHealthIndex error:', err);
      return 50;
    }
  });

  ipcMain.handle('emotion:calculateRiskLevel', async (_event, factors) => {
    try {
      return calculateRiskLevel(factors);
    } catch (err) {
      console.error('[EmotionEngine] calculateRiskLevel error:', err);
      return 'low';
    }
  });

  ipcMain.handle('emotion:generateInsights', async (_event, profile) => {
    try {
      return generateInsights(profile);
    } catch (err) {
      console.error('[EmotionEngine] generateInsights error:', err);
      return [];
    }
  });

  ipcMain.handle('emotion:generateSuggestions', async (_event, profile) => {
    try {
      return generateSuggestions(profile);
    } catch (err) {
      console.error('[EmotionEngine] generateSuggestions error:', err);
      return [];
    }
  });
}

module.exports = {
  analyzeDiary,
  analyzeConversation,
  extractEmotions,
  extractPANAS,
  calculateSocialScore,
  analyzeSleepPattern,
  calculateHealthIndex,
  calculateVolatility,
  calculateRiskLevel,
  generateInsights,
  generateSuggestions,
  registerHandlers,
};
