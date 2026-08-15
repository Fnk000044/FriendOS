/**
 * Chat Fallback Engine — 情感感知多轮对话状态机（离线陪伴模式，云 LLM 不可用时降级）
 *
 * 设计要求（评委现场可能无网，降级模式 = 他们看到的全部）：
 * - **纯函数设计**：无模块级可变状态。会话状态由渲染层 chatStore.session 持有，
 *   随 respond(text, opts) 传入，引擎返回 sessionDelta 由渲染层合并回写。
 *   可单测、可序列化、断电不丢上下文。
 * - 状态机：init(0) → listen(1-2) → empathize(3-4) → support(5) → close(6+ 收束/建议)
 * - 情感强度分级：negativeProb>=0.8 强共情 / 0.55~0.8 中强度 / 否则轻触达
 * - 会话内模板去重（usedTemplates），同会话不连续重复
 * - 上下文摘要：extractTopics + buildSessionDelta → summary 随轮次增长
 * - 连贯性：reply = 时间段问候 × 强度共情 × 分支共情 × 追问（可引用历史主题）
 * - 危机恒走固定回复（热线 + 安全确认 + 不替代专业医疗），不允许模板随机化绕过
 *
 * 兼容旧签名：respond(text, emotionLabel, now) —— 渲染层旧调用自动识别。
 */

const { CRISIS_KEYWORDS, CRISIS_EXCLUSIONS, NEGATION_WORDS } = require('./crisisKeywords.cjs');

// ── 时间感知开场 ─────────────────────────────────────────────

function getTimeOfDay(date) {
  const h = date.getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 24) return 'evening';
  return 'lateNight'; // 0-6
}

const GREETINGS = {
  morning: ['早上好，', '早安，', '新的一天开始了，'],
  afternoon: ['下午好，', '午后啦，', '今天过得怎么样，'],
  evening: ['晚上好，', '今天辛苦了，', '夜幕降临，'],
  lateNight: ['这么晚了还没睡，', '夜深了，', '这个点还在，'],
};

// ── 情绪分支模板（每分支 ≥10 条共情 + 追问）───────────────────
const BRANCHES = {
  low: {
    empathies: [
      '听到你说这些，我能感受到你有些低落。',
      '听起来你最近有些提不起劲，这种感觉很真实。',
      '你说得出口，说明你在认真面对自己的状态。',
      '低落的时候能停下来看看自己，已经很不容易了。',
      '这种灰灰的感觉确实不好受，谢谢你愿意说出来。',
      '我在这儿，不用急着好起来。',
      '有时候情绪就像天气，会自己来也会自己走。',
      '你不必总是坚强的，允许自己低落一会儿也没关系。',
      '能告诉我更多吗？我会认真听。',
      '你不是一个人在面对这些。',
    ],
    followups: [
      '今天有什么事让你特别觉得累吗？',
      '这种感觉从什么时候开始的呢？',
      '要不要试着写下来？有时候写出来会清楚一点。',
      '如果给自己的状态打分，1 到 5 分你会给几分？',
      '要不要去情绪中心看看最近的记录？',
    ],
  },
  anxiety: {
    empathies: [
      '焦虑的时候，心里像绷着一根弦，确实很难受。',
      '听出来你有些紧张，这种紧绷感是真实的。',
      '担心的事情堆在一起时，谁都会喘不过气。',
      '你说的这些担忧，能具体跟我说说吗？',
      '焦虑不全是坏事，它在提醒你重视什么，但别让它压垮你。',
      '先深呼吸一下，我们慢慢来。',
      '你愿意把担心的事说出来，本身就是在减轻它的分量。',
      '未来的事还没发生，先把眼前这一刻稳住。',
      '我陪着你，一步一步来。',
      '这种时候，能停下来的你已经在照顾自己了。',
    ],
    followups: [
      '现在最让你揪心的是哪件事？',
      '要不要试试 4-7-8 呼吸？两分钟就能让心跳慢下来。',
      '这件事你能控制的部分有多少？',
      '上一次焦虑的时候，你是怎么过来的？',
      '要不要把担心的事列出来，一件件看？',
    ],
  },
  lonely: {
    empathies: [
      '孤独感有时候比想象中更沉，谢谢你愿意告诉我。',
      '即使身边有人，也可能会觉得孤单，这很正常。',
      '你愿意和我说说话，我就陪在这里。',
      '孤单不是因为你不好，只是暂时没遇到对的人。',
      '这种时刻会过去的，但不必硬撑着。',
      '我在听，慢慢说。',
      '能承认孤独，其实是一种诚实。',
      '你此刻不是一个人，我在陪着你。',
      '孤独的时候，先对自己温柔一点。',
      '有些路一个人走，但不必一个人扛。',
    ],
    followups: [
      '最近有和人好好聊过天吗？',
      '要不要去回忆里看看那些温暖的瞬间？',
      '有没有什么事是让你感到被理解的？',
      '要不要给自己安排一个小小的、期待的事？',
      '要不要和知己多聊聊？我随时都在。',
    ],
  },
  stress: {
    empathies: [
      '听出来你扛着不少东西，辛苦了。',
      '压力大到一定程度，会让人觉得转不动，这是真的。',
      '你已经在尽力了，别对自己太苛刻。',
      '一件事一件事来，不必一下子都解决。',
      '能停下来喘口气，是聪明的做法。',
      '这种紧绷感，身体也在替你记着呢。',
      '你说出来，就已经在分担它的重量了。',
      '先把背包放一放，歇会儿。',
      '你不是机器，允许自己有扛不住的时候。',
      '我陪着你，不急。',
    ],
    followups: [
      '现在压在你心头的，主要是哪一块？',
      '有没有可以暂时放一放的事？',
      '要不要把待办理一理，分个轻重？',
      '上一次彻底放松是什么时候？',
      '要不要试试做一次呼吸练习，先把状态调回来？',
    ],
  },
  neutral: {
    empathies: [
      '听到你了，今天状态看起来还算平稳。',
      '嗯，我在听，你继续。',
      '平稳的时候也值得被看见。',
      '不咸不淡的日子，也是日子。',
      '谢谢你和我说这些。',
      '今天的你，看起来在想些什么。',
      '慢慢说，不着急。',
      '我陪着你，想到什么说什么。',
      '平静也是一种力量。',
      '在这儿呢。',
    ],
    followups: [
      '今天有什么想和我分享的吗？',
      '要不要聊聊最近在忙的事？',
      '有没有什么小确幸值得记下来？',
      '要不要去写两句今天的日记？',
      '接下来想做什么？我陪你。',
    ],
  },
  positive: {
    empathies: [
      '听到你这样说，我也为你高兴。',
      '这种状态真好，要好好接住它。',
      '能感受到你眼里的光。',
      '值得记下来，这样的时刻很珍贵。',
      '你配得上这份开心。',
      '嘿嘿，替你开心。',
      '继续保持，但也别有压力。',
      '这种能量，可以分享给身边的人。',
      '听起来你最近过得不错。',
      '真好，今天是被点亮的一天。',
    ],
    followups: [
      '是什么让你今天状态这么好？',
      '要不要把这份好心情记进日记？',
      '有没有想分享给谁？',
      '接下来想做什么开心的事？',
      '这种状态你希望怎么保持？',
    ],
  },
};

// ── 情感强度分级（负面时叠加，强/中/轻 共情开场）──────────────
const INTENSITY_TIERS = {
  strong: [
    '我能感受到你现在真的很不好受。',
    '听出来你现在很难受，谢谢你愿意告诉我。',
    '这一定很辛苦吧，我在这儿陪着你。',
    '你现在的感受是真的，别一个人扛着。',
  ],
  medium: [
    '听起来你有些低落，这种感觉是真实的。',
    '你在经历一段不容易的时期，我懂。',
    '能感觉到你现在心里不太轻松。',
  ],
  light: [
    '嗯，我听到了。',
    '我在听，慢慢说。',
    '这样啊，愿意多说一点吗？',
  ],
};

// ── 危机检测（与关键词层一致；最终判定仍由 ONNX 完成）────────
function detectCrisis(text) {
  if (!text) return false;
  const lower = text;
  for (const ex of CRISIS_EXCLUSIONS) {
    if (lower.includes(ex)) return false;
  }
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) {
      const idx = lower.indexOf(kw);
      const window = lower.slice(Math.max(0, idx - 5), idx);
      const negated = NEGATION_WORDS.some(n => window.includes(n));
      if (!negated) return true;
    }
  }
  return false;
}

// 危机恒走固定回复（热线 + 安全确认 + 不替代专业医疗）
const CRISIS_RESPONSE =
  '我注意到你现在可能很难受。我想先确认一件事——你现在安全吗？' +
  '我不能替代专业医疗。如果你正在经历很痛苦的时刻，请拨打全国心理援助热线 400-161-9995 或 12356，' +
  '那里有人 24 小时愿意听你说。你不是一个人。';

// ── 主题提取（主题词表 + 情感关键词）──────────────────────────
const TOPIC_KEYWORDS = [
  '考试', '作业', '论文', '实习', '工作', '感情', '恋人', '分手', '家人', '父母', '朋友',
  '室友', '身体', '生病', '睡眠', '失眠', '未来', '毕业', '就业', '孤独', '焦虑', '压力',
  '失败', '成绩', '绩点', '挂科', 'deadline', '加班', '面试', '考研', '减肥', '运动', '学习',
];

function extractTopics(text) {
  if (!text) return [];
  const hits = [];
  for (const kw of TOPIC_KEYWORDS) {
    if (text.includes(kw)) hits.push(kw);
  }
  return [...new Set(hits)].slice(0, 5);
}

// ── 情感标签映射（中文展示）──────────────────────────────────
const EMOTION_LABEL_ZH = {
  negative: '低落',
  neutral: '平稳',
  positive: '积极',
  crisis: '危机',
};

// ── 状态机阶段 ──────────────────────────────────────────────
// init(0) → listen(1-2) → empathize(3-4) → support(5) → close(6+)
function stateStage(session) {
  const turn = (session && session.turnCount) || 0;
  if (turn === 0) return 'init';
  if (turn <= 2) return 'listen';
  if (turn <= 4) return 'empathize';
  if (turn === 5) return 'support';
  return 'close';
}

// 阶段收尾语（support 建议 / close 收束）
const STAGE_CLOSERS = {
  support: ['要不要先做个呼吸练习，把状态调回来？', '要不要试着写两句日记，把此刻的感觉记下来？', '要不要去情绪中心看看最近的趋势？'],
  close: ['今天就先聊到这里吧，记得照顾好自己。', '我一直在，需要的时候随时来找我。', '今天陪你聊了这些，希望你好受一点。'],
};

// ── 会话状态增量 ────────────────────────────────────────────

function computeDominantEmotion(history) {
  if (!history || history.length === 0) return 'neutral';
  const counts = {};
  for (const e of history) counts[e] = (counts[e] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

/**
 * 构建会话增量（渲染层合并回 chatStore.session）
 * @param {object} state 当前会话状态（可为 undefined/空）
 * @param {string} text 用户消息
 * @param {string} label 情感标签 negative/neutral/positive/crisis
 * @param {Array} usedTemplateKeys 本轮已用模板 key（含旧的，去重用）
 * @returns {object} ChatSessionDelta
 */
function buildSessionDelta(state, text, label, usedTemplateKeys) {
  const cur = state && typeof state === 'object' ? state : {};
  const prevTopics = Array.isArray(cur.topics) ? cur.topics : [];
  const prevHistory = Array.isArray(cur.emotionHistory) ? cur.emotionHistory : [];
  const prevTemplates = Array.isArray(cur.usedTemplates) ? cur.usedTemplates : [];

  const turnCount = (cur.turnCount || 0) + 1;
  const emotionHistory = [...prevHistory, label].slice(-10);
  const dominantEmotion = computeDominantEmotion(emotionHistory);
  const topics = [...new Set([...prevTopics, ...extractTopics(text)])].slice(0, 5);

  const topicText = topics.slice(0, 3).join('、') || '日常';
  const summary = `用户近况：${topicText}；情绪：${EMOTION_LABEL_ZH[dominantEmotion] || dominantEmotion}`.slice(0, 60);

  const usedTemplates = [...new Set([...prevTemplates, ...usedTemplateKeys])];

  return { turnCount, emotionHistory, topics, summary, usedTemplates, dominantEmotion };
}

// ── 简单情感分支判断（降级模式内部用；真正情感判定走 sentimentAnalyze IPC）──
function guessBranch(text, emotionLabel) {
  if (emotionLabel === 'crisis') return 'crisis';
  if (emotionLabel === 'negative') {
    if (/孤独|一个人|没人|没有朋友|没人懂/.test(text)) return 'lonely';
    if (/焦虑|紧张|担心|害怕|慌|压力|deadline|考试|绩点|挂科/.test(text)) {
      return /压力|deadline|考试|绩点|挂科|作业|论文|实习/.test(text) ? 'stress' : 'anxiety';
    }
    return 'low';
  }
  if (emotionLabel === 'positive') return 'positive';
  return 'neutral';
}

/**
 * 组合回复（纯函数；session 可选）
 * @param {string} text
 * @param {object} opts
 * @param {string} [opts.emotionLabel]
 * @param {number} [opts.negativeProb]
 * @param {number} [opts.positiveProb]
 * @param {number} [opts.crisisProb]
 * @param {object} [opts.session] 会话状态（渲染层传入）
 * @param {Date|string} [opts.now]
 * @returns {{text: string, branch: string, isCrisis: boolean, sessionDelta: object}}
 */
function respond(text, opts, legacyNow) {
  // 兼容旧签名 respond(text, emotionLabel, now)
  if (typeof opts === 'string' || typeof opts === 'undefined') {
    opts = { emotionLabel: opts, now: legacyNow };
  }
  const o = opts || {};
  const emotionLabel = o.emotionLabel;
  const now = o.now ? (o.now instanceof Date ? o.now : new Date(o.now)) : new Date();
  const session = o.session && typeof o.session === 'object' ? o.session : null;

  // 危机优先：固定回复，不随机，不进状态机
  if (detectCrisis(text) || emotionLabel === 'crisis') {
    const delta = buildSessionDelta(session, text, 'crisis', []);
    return { text: CRISIS_RESPONSE, branch: 'crisis', isCrisis: true, sessionDelta: delta };
  }

  const tod = getTimeOfDay(now);
  const branch = guessBranch(text, emotionLabel);
  const templates = BRANCHES[branch] || BRANCHES.neutral;

  // 情感强度分级（负面时叠加）
  const negativeProb = typeof o.negativeProb === 'number' ? o.negativeProb : (emotionLabel === 'negative' ? 0.6 : 0);
  const intensityKey =
    negativeProb >= 0.8 ? 'strong'
    : negativeProb >= 0.55 ? 'medium'
    : 'light';
  const intensitySet = emotionLabel === 'negative' ? INTENSITY_TIERS[intensityKey] : [];

  // 会话内去重：优先未用模板
  const usedKeys = new Set(Array.isArray(session && session.usedTemplates) ? session.usedTemplates : []);
  const pickUnused = (arr, prefix) => {
    const candidates = arr.map((item, i) => ({ item, key: `${prefix}:${i}` }))
      .filter(c => !usedKeys.has(c.key));
    const pool = candidates.length > 0 ? candidates : arr.map((item, i) => ({ item, key: `${prefix}:${i}` }));
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const greeting = pickUnused(GREETINGS[tod], `greet:${tod}`).item;
  const intensity = intensitySet.length > 0
    ? pickUnused(intensitySet, `int:${intensityKey}`).item
    : '';
  const empathy = pickUnused(templates.empathies, `${branch}:emp`).item;
  const followup = pickUnused(templates.followups, `${branch}:fup`).item;

  // 阶段化：support/close 阶段附加建议/收束语；并尽量引用历史主题
  const stage = stateStage(session);
  let tail = '';
  if (stage === 'support' && STAGE_CLOSERS.support.length > 0) {
    tail = pickUnused(STAGE_CLOSERS.support, 'stage:support').item;
  } else if (stage === 'close' && STAGE_CLOSERS.close.length > 0) {
    tail = pickUnused(STAGE_CLOSERS.close, 'stage:close').item;
  }

  // 引用历史主题（第 3 轮起）
  const topics = Array.isArray(session && session.topics) ? session.topics : [];
  let topicRef = '';
  if (topics.length > 0) {
    const stageIdx = (session && session.turnCount) || 0;
    if (stageIdx >= 2) {
      const refTopic = topics[Math.min(stageIdx - 2, topics.length - 1)];
      topicRef = `你刚才提到的${refTopic}，我们慢慢来，不着急。`;
    }
  }

  const parts = [greeting, intensity, empathy, followup, topicRef, tail].filter(Boolean);
  const reply = parts.join('').replace(/\s+/g, ' ').trim();

  // 记录本轮用掉的模板 key，供 buildSessionDelta 合并
  const usedThisRound = [
    `greet:${tod}:${GREETINGS[tod].indexOf(greeting)}`,
    intensitySet.length > 0 ? `int:${intensityKey}:${intensitySet.indexOf(intensity)}` : '',
    `${branch}:emp:${templates.empathies.indexOf(empathy)}`,
    `${branch}:fup:${templates.followups.indexOf(followup)}`,
    tail ? `stage:${stage}:${STAGE_CLOSERS[stage].indexOf(tail)}` : '',
  ].filter(Boolean);

  const sessionDelta = buildSessionDelta(session, text, emotionLabel || 'neutral', usedThisRound);

  return { text: reply, branch, isCrisis: false, sessionDelta };
}

/**
 * 主动问候（每天首次打开 / 沉默后回归）
 * @param {object} opts
 * @param {number} [opts.silentDays]
 * @param {boolean} [opts.riskRising]
 * @param {Date|string} [opts.now]
 */
function greeting(opts, now) {
  now = now || new Date();
  const tod = getTimeOfDay(now);
  const silentDays = opts?.silentDays ?? 0;

  if (silentDays >= 7 && opts?.riskRising) {
    return { text: '好久不见。我注意到你最近可能状态不太好，要不要聊聊？不急着说什么，我在这儿。', branch: 'greeting' };
  }
  if (silentDays >= 3) {
    return { text: '好久不见，这几天还好吗？不用特意回复，我只是想确认你还好。', branch: 'greeting' };
  }

  const lines = {
    morning: '早上好，今天感觉怎么样？',
    afternoon: '下午好，今天过得还行吗？',
    evening: '晚上好，今天辛苦了。想聊聊吗？',
    lateNight: '这么晚了还没睡，是有什么心事吗？',
  };
  return { text: lines[tod], branch: 'greeting' };
}

module.exports = {
  respond,
  greeting,
  detectCrisis,
  extractTopics,
  buildSessionDelta,
  stateStage,
  CRISIS_RESPONSE,
};
