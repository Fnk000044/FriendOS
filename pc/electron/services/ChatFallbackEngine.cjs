/**
 * Chat Fallback Engine — 离线陪伴模式（云 LLM 不可用时降级）
 *
 * 设计要求（评委现场可能无网，降级模式 = 他们看到的全部）：
 * - 每情绪分支 ≥10 条模板，回复 = 开场×共情×追问/建议 组合，避免连续两条雷同。
 * - 危机类不随机，固定返回安全确认 + 400-161-9995 热线 + 触发危机流程。
 * - 时间感知：早/午/晚/深夜不同开场。
 * - 不假装是 AI，自称"知己"。
 *
 * 输入：用户消息文本 + 当前情绪标签 + 时间
 * 输出：{ text, branch, isCrisis }
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

// ── 情绪分支模板 ─────────────────────────────────────────────
// 每分支 ≥10 条共情句 + 追问/建议，组合后单分支可达数百种

const BRANCHES = {
  low: {
    // 低落
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
    // 焦虑
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
    // 孤独
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
    // 压力
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
    // 中性/平静
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
    // 积极
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

// ── 危机检测（与关键词层一致，但此处只做兜底识别，最终判定由 ONNX 完成）──

function detectCrisis(text) {
  if (!text) return false;
  const lower = text;
  // 排除成语/网络误报
  for (const ex of CRISIS_EXCLUSIONS) {
    if (lower.includes(ex)) return false;
  }
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) {
      // 检查否定窗口（前 5 字符）
      const idx = lower.indexOf(kw);
      const window = lower.slice(Math.max(0, idx - 5), idx);
      const negated = NEGATION_WORDS.some(n => window.includes(n));
      if (!negated) return true;
    }
  }
  return false;
}

const CRISIS_RESPONSE = '我注意到你现在可能很难受。我想先确认一件事——你现在安全吗？如果你正在经历很痛苦的时刻，可以拨打全国心理援助热线 400-161-9995，那里有人 24 小时愿意听你说。你不是一个人。';

// ── 简单情感分支判断（降级模式内部用，与 ONNX 无关；真正的情感判定走 sentimentAnalyze IPC）──

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

// ── 组合回复 ─────────────────────────────────────────────────

// 简易去重：记录最近一次回复，避免连续雷同
let _lastText = '';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成降级回复
 * @param {string} text 用户消息
 * @param {string} [emotionLabel] 情感标签 negative/neutral/positive/crisis（来自 sentimentAnalyze）
 * @param {Date} [now]
 * @returns {{text: string, branch: string, isCrisis: boolean}}
 */
function respond(text, emotionLabel, now) {
  now = now || new Date();

  // 危机优先：固定回复，不随机
  if (detectCrisis(text) || emotionLabel === 'crisis') {
    return { text: CRISIS_RESPONSE, branch: 'crisis', isCrisis: true };
  }

  const tod = getTimeOfDay(now);
  const branch = guessBranch(text, emotionLabel);
  const templates = BRANCHES[branch] || BRANCHES.neutral;

  let attempt = 0;
  let reply = '';
  while (attempt < 3) {
    const greeting = pick(GREETINGS[tod]);
    const empathy = pick(templates.empathies);
    const followup = pick(templates.followups);
    reply = `${greeting}${empathy} ${followup}`;
    if (reply !== _lastText) break;
    attempt++;
  }
  _lastText = reply;

  return { text: reply, branch, isCrisis: false };
}

/**
 * 主动问候（每天首次打开 / 沉默后回归）
 * @param {object} opts
 * @param {number} [opts.silentDays] 距上次对话天数
 * @param {boolean} [opts.riskRising] 期间风险是否上升
 * @param {Date} [now]
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
  CRISIS_RESPONSE,
};
