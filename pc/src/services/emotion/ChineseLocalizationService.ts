/**
 * Chinese Localization Service
 * 中文本土化服务，处理含蓄表达、网络用语、方言等
 *
 * 参考：
 * - 中国微博自杀意念检测研究
 * - 中文情感分析本土化研究
 */

// ── 含蓄表达理解 ──────────────────────────────────────────────
// 中国文化中，人们往往不会直接表达负面情绪
// "我没事"可能意味着"我很不好"

interface ImplicitExpression {
  expression: string;
  possibleMeanings: string[];
  contextClues: string[];
  suggestedResponse: string;
}

const IMPLICIT_EXPRESSIONS: ImplicitExpression[] = [
  {
    expression: '我没事',
    possibleMeanings: ['可能在掩饰真实感受', '不想让别人担心', '习惯性回应'],
    contextClues: ['语气低落', '回避话题', '简短回应'],
    suggestedResponse: '你说"没事"，但我感觉你可能有些心事。如果你想聊聊，我在这里。',
  },
  {
    expression: '还好',
    possibleMeanings: ['不太好但不想说', '一般般', '勉强应付'],
    contextClues: ['缺乏热情', '没有展开说', '转移话题'],
    suggestedResponse: '"还好"听起来不太确定，最近有什么让你不太舒心的事吗？',
  },
  {
    expression: '随便',
    possibleMeanings: ['失去兴趣', '感到无力', '不想做决定'],
    contextClues: ['多次使用', '对很多事情都无所谓', '缺乏动力'],
    suggestedResponse: '我注意到你对很多事情都说"随便"，是不是最近有些疲惫或迷茫？',
  },
  {
    expression: '都可以',
    possibleMeanings: ['无所谓', '放弃选择', '不想麻烦别人'],
    contextClues: ['被动回应', '没有偏好表达', '配合但不积极'],
    suggestedResponse: '你的感受很重要，有什么是你真正想要的吗？',
  },
  {
    expression: '算了',
    possibleMeanings: ['放弃', '感到无力', '不想继续'],
    contextClues: ['终止话题', '表达挫败', '失去希望'],
    suggestedResponse: '"算了"有时候是一种保护，但也可以是一种逃避。你想聊聊发生了什么吗？',
  },
  {
    expression: '你忙吧',
    possibleMeanings: ['不想打扰你', '感到孤独', '测试你是否真的关心'],
    contextClues: ['对话结束时', '语气失落', '主动结束交流'],
    suggestedResponse: '我不忙，你的事情对我来说很重要。有什么想说的吗？',
  },
  {
    expression: '没什么',
    possibleMeanings: ['不想说', '不知道怎么表达', '觉得说了也没用'],
    contextClues: ['被问到感受时', '回避直接回答', '沉默'],
    suggestedResponse: '有时候"没什么"其实"有什么"。如果你愿意，可以试着说说看。',
  },
];

/**
 * 检测含蓄表达
 * @param {string} text - 用户文本
 * @returns {ImplicitExpression | null} 匹配的含蓄表达
 */
export function detectImplicitExpression(text: string): ImplicitExpression | null {
  if (!text) return null;

  for (const expr of IMPLICIT_EXPRESSIONS) {
    if (text.includes(expr.expression)) {
      return expr;
    }
  }

  return null;
}

// ── 网络用语词典 ──────────────────────────────────────────────
// 年轻人常用网络用语的情感映射

interface SlangEntry {
  term: string;
  meaning: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number; // 0-1
}

const SLANG_DICTIONARY: SlangEntry[] = [
  // 正面
  { term: 'yyds', meaning: '永远的神', sentiment: 'positive', intensity: 0.9 },
  { term: '绝绝子', meaning: '太绝了', sentiment: 'positive', intensity: 0.85 },
  { term: '太强了', meaning: '很厉害', sentiment: 'positive', intensity: 0.8 },
  { term: '666', meaning: '厉害', sentiment: 'positive', intensity: 0.7 },
  { term: 'nice', meaning: '好', sentiment: 'positive', intensity: 0.6 },
  { term: 'awsl', meaning: '啊我死了（太可爱）', sentiment: 'positive', intensity: 0.85 },
  { term: '好家伙', meaning: '惊讶/赞叹', sentiment: 'positive', intensity: 0.6 },
  { term: '破防了', meaning: '被感动', sentiment: 'positive', intensity: 0.7 },
  { term: '上头', meaning: '很兴奋/沉迷', sentiment: 'positive', intensity: 0.75 },
  { term: '真香', meaning: '打脸（原来很好）', sentiment: 'positive', intensity: 0.65 },

  // 负面
  { term: 'emo', meaning: '情绪低落', sentiment: 'negative', intensity: 0.7 },
  { term: '破防', meaning: '心理防线被突破', sentiment: 'negative', intensity: 0.8 },
  { term: '摆烂', meaning: '放弃努力', sentiment: 'negative', intensity: 0.75 },
  { term: '躺平', meaning: '不想奋斗', sentiment: 'negative', intensity: 0.7 },
  { term: '裂开', meaning: '崩溃', sentiment: 'negative', intensity: 0.85 },
  { term: '无语', meaning: '不知道说什么', sentiment: 'negative', intensity: 0.6 },
  { term: '芭比Q', meaning: '完了', sentiment: 'negative', intensity: 0.7 },
  { term: '寄', meaning: '完了/失败', sentiment: 'negative', intensity: 0.75 },
  { term: '绷不住', meaning: '忍不住（负面）', sentiment: 'negative', intensity: 0.7 },
  { term: '麻了', meaning: '无语/无奈', sentiment: 'negative', intensity: 0.65 },

  // 中性
  { term: '哈哈', meaning: '笑', sentiment: 'neutral', intensity: 0.3 },
  { term: 'hhh', meaning: '哈哈哈', sentiment: 'neutral', intensity: 0.3 },
  { term: 'xswl', meaning: '笑死我了', sentiment: 'positive', intensity: 0.5 },
  { term: 'dbq', meaning: '对不起', sentiment: 'neutral', intensity: 0.4 },
  { term: 'nsdd', meaning: '你说得对', sentiment: 'neutral', intensity: 0.4 },
  { term: 'zqsg', meaning: '真情实感', sentiment: 'neutral', intensity: 0.5 },
  { term: 'u1s1', meaning: '有一说一', sentiment: 'neutral', intensity: 0.3 },
];

/**
 * 检测网络用语并返回情感分析
 * @param {string} text - 用户文本
 * @returns {object} 网络用语分析结果
 */
export function analyzeSlang(text: string): {
  detectedSlang: SlangEntry[];
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
} {
  if (!text) {
    return {
      detectedSlang: [],
      overallSentiment: 'neutral',
      sentimentScore: 0,
    };
  }

  const cleanText = text.toLowerCase();
  const detected: SlangEntry[] = [];

  for (const slang of SLANG_DICTIONARY) {
    if (cleanText.includes(slang.term)) {
      detected.push(slang);
    }
  }

  if (detected.length === 0) {
    return {
      detectedSlang: [],
      overallSentiment: 'neutral',
      sentimentScore: 0,
    };
  }

  // 计算整体情感
  let positiveSum = 0;
  let negativeSum = 0;

  for (const slang of detected) {
    if (slang.sentiment === 'positive') {
      positiveSum += slang.intensity;
    } else if (slang.sentiment === 'negative') {
      negativeSum += slang.intensity;
    }
  }

  const sentimentScore = positiveSum - negativeSum;
  let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (sentimentScore > 0.2) overallSentiment = 'positive';
  else if (sentimentScore < -0.2) overallSentiment = 'negative';

  return {
    detectedSlang: detected,
    overallSentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
  };
}

// ── 方言情感词典 ──────────────────────────────────────────────
// 不同地区的情感表达方式

interface DialectEntry {
  term: string;
  region: string;
  meaning: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const DIALECT_ENTRIES: DialectEntry[] = [
  // 东北方言
  { term: '整', region: '东北', meaning: '做/弄', sentiment: 'neutral' },
  { term: '贼好', region: '东北', meaning: '非常好', sentiment: 'positive' },
  { term: '得劲', region: '东北', meaning: '舒服/满意', sentiment: 'positive' },
  { term: '闹心', region: '东北', meaning: '烦心', sentiment: 'negative' },
  { term: '憋屈', region: '东北', meaning: '委屈/不爽', sentiment: 'negative' },

  // 四川方言
  { term: '巴适', region: '四川', meaning: '舒服/好', sentiment: 'positive' },
  { term: '安逸', region: '四川', meaning: '舒服/满意', sentiment: 'positive' },
  { term: '瓜兮兮', region: '四川', meaning: '傻', sentiment: 'negative' },
  { term: '恼火', region: '四川', meaning: '烦/困难', sentiment: 'negative' },

  // 粤语
  { term: '好嘢', region: '粤语', meaning: '好东西/太好了', sentiment: 'positive' },
  { term: '开心', region: '粤语', meaning: '高兴', sentiment: 'positive' },
  { term: '烦死', region: '粤语', meaning: '很烦', sentiment: 'negative' },
  { term: '冇瘾', region: '粤语', meaning: '无聊/没意思', sentiment: 'negative' },

  // 上海方言
  { term: '嗲', region: '上海', meaning: '好/棒', sentiment: 'positive' },
  { term: '灵', region: '上海', meaning: '好/棒', sentiment: 'positive' },
  { term: '戆', region: '上海', meaning: '傻', sentiment: 'negative' },
  { term: '作', region: '上海', meaning: '折腾/闹', sentiment: 'negative' },
];

/**
 * 检测方言词汇
 * @param {string} text - 用户文本
 * @returns {DialectEntry[]} 匹配的方言词汇
 */
export function detectDialect(text: string): DialectEntry[] {
  if (!text) return [];

  const detected: DialectEntry[] = [];

  for (const entry of DIALECT_ENTRIES) {
    if (text.includes(entry.term)) {
      detected.push(entry);
    }
  }

  return detected;
}

// ── 综合中文情感分析 ──────────────────────────────────────────

/**
 * 综合中文情感分析
 * 结合标准情感词典、网络用语、含蓄表达、方言
 */
export function comprehensiveChineseSentiment(text: string): {
  standardScore: number;
  slangScore: number;
  hasImplicitExpression: boolean;
  implicitSuggestion: string | null;
  dialectDetected: DialectEntry[];
  adjustedScore: number;
} {
  const slangResult = analyzeSlang(text);
  const implicitExpr = detectImplicitExpression(text);
  const dialectResult = detectDialect(text);

  // 标准情感分数（由SentimentService提供，这里用0作为默认）
  const standardScore = 0;

  // 网络用语调整
  const slangAdjustment = slangResult.sentimentScore * 0.3;

  // 含蓄表达调整（如果检测到含蓄表达，可能需要更关注）
  const implicitAdjustment = implicitExpr ? -0.2 : 0;

  // 综合调整后的分数
  const adjustedScore = standardScore + slangAdjustment + implicitAdjustment;

  return {
    standardScore,
    slangScore: slangResult.sentimentScore,
    hasImplicitExpression: implicitExpr !== null,
    implicitSuggestion: implicitExpr?.suggestedResponse || null,
    dialectDetected: dialectResult,
    adjustedScore: Math.round(adjustedScore * 100) / 100,
  };
}
