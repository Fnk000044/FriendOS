import { db } from '../../db';
import type { RiskLevel } from '../../db/models';
import { useChatStore, genId, type ChatMessageState } from '../../stores/chatStore';
import { useCrisisStore } from '../../stores/crisisStore';
import { SYSTEM_PROMPT } from './prompts/system';
import { getDaysAgo, getToday, getNow } from '../../utils/date';
import { debounce } from '../../utils/debounce';

/**
 * ChatService — 渲染层对话编排
 *
 * 流程（参见比赛增强计划 1.2）：
 * 1. 写 user 消息到 store+DB
 * 2. 调 sentimentAnalyze（已有 IPC，ONNX）得情感
 * 3. crisis 级 → 立即触发 crisisStore.open('chat',...)，中断 LLM 调用
 * 4. 写 emotionRecords(source:'chat')
 * 5. 调 chat:send 流式累加 assistant 消息
 * 6. 超时/失败 → 自动切 ChatFallbackEngine，UI 显示"离线模式"提示
 * 7. 完成后存 conversations 表
 * 8. 每 10 轮生成 conversationSummaries（喂 RiskScoringEngine chat 通道 + 下次上下文）
 */

const API = typeof window !== 'undefined' ? window.electronAPI : undefined;

// 每会话每 10 轮生成一次摘要
const SUMMARY_EVERY_ROUNDS = 10;

/**
 * 聚合用户近况，注入 system prompt
 */
export async function buildContext(): Promise<ChatContext> {
  const ctx: ChatContext = {};

  try {
    // 近 7 天平均心情（日记 mood 1-5）
    const since = getDaysAgo(7);
    const diaries = await db.diaries.where('date').aboveOrEqual(since).toArray();
    if (diaries.length > 0) {
      ctx.avgMood7d = diaries.reduce((s, d) => s + d.mood, 0) / diaries.length;
      // 简单趋势：前半 vs 后半
      const half = Math.floor(diaries.length / 2);
      const first = diaries.slice(0, half);
      const second = diaries.slice(half);
      if (first.length && second.length) {
        const fa = first.reduce((s, d) => s + d.mood, 0) / first.length;
        const sa = second.reduce((s, d) => s + d.mood, 0) / second.length;
        ctx.moodTrend = sa > fa + 0.3 ? 'improving' : sa < fa - 0.3 ? 'declining' : 'stable';
      }
    }

    // 当前风险分（取最近一次计算结果缓存或重算；这里简化为读最近 healthProfile）
    const hp = await db.healthProfiles.orderBy('date').reverse().first();
    if (hp) {
      ctx.riskLevel = hp.riskLevel;
      // emotionalHealthIndex 0-100 近似风险分（反向）
      ctx.riskScore = Math.round(100 - hp.emotionalHealthIndex);
    }

    // 最近一次量表
    const lastAssessment = await db.assessments.orderBy('date').reverse().first();
    if (lastAssessment) {
      const daysAgo = Math.floor((Date.now() - new Date(lastAssessment.date).getTime()) / 86400000);
      ctx.lastAssessment = `${lastAssessment.type} ${lastAssessment.level}（${lastAssessment.totalScore}分，${daysAgo}天前）`;
    }

    // 深夜活跃提示
    const recentBehaviors = await db.behaviorRecords.where('date').aboveOrEqual(since).toArray();
    const lateNights = recentBehaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 5));
    if (lateNights.length >= 2) {
      ctx.lateNightHint = `近 7 天有 ${lateNights.length} 次深夜活跃`;
    }

    // 跨会话记忆：最近一次对话摘要
    const lastSummary = await db.conversationSummaries.orderBy('date').reverse().first();
    if (lastSummary) {
      ctx.lastSummary = lastSummary.summary;
    }
  } catch (e) {
    // 上下文构建失败不阻塞对话
    console.error('[ChatService] buildContext error:', e);
  }

  return ctx;
}

/**
 * 写入对话情感记录（source: 'chat'），喂给 RiskScoringEngine 的 chat 通道
 */
async function recordChatEmotion(text: string, sentiment: SentimentResult, messageId: string) {
  try {
    // sentimentScore -1..1（ONNX 给出的是 score，negative 高则负）
    // keyword 层 level 只有 negative/neutral/positive/crisis，映射回 -1..1
    const score = sentiment.method === 'onnx'
      ? (sentiment.positiveProb - sentiment.negativeProb)
      : (sentiment.level === 'crisis' ? -0.9 : sentiment.level === 'high' ? -0.6 : sentiment.level === 'medium' ? -0.3 : sentiment.level === 'low' ? 0 : 0);

    const riskLevel: RiskLevel =
      sentiment.level === 'crisis' ? 'critical'
      : sentiment.level === 'high' ? 'high'
      : sentiment.level === 'medium' ? 'medium'
      : 'medium_low';

    await db.emotionRecords.add({
      id: messageId,
      date: getToday(),
      source: 'chat',
      sourceId: messageId,
      sentimentScore: score,
      emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 },
      riskLevel,
      keywords: sentiment.keywords || [],
      analysis: text.slice(0, 200),
      createdAt: getNow(),
    });
  } catch (e) {
    console.error('[ChatService] recordChatEmotion error:', e);
  }
}

/**
 * 发送一条消息，完整走 sentiment → 危机判定 → LLM/降级 → 落库 流程
 */
export async function sendMessage(text: string): Promise<void> {
  const store = useChatStore.getState();
  if (store.isStreaming || !text.trim()) return;
  if (!API) return;

  const userMsg: ChatMessageState = {
    id: genId(),
    role: 'user',
    content: text,
    timestamp: Date.now(),
  };
  store.addMessage(userMsg);

  // 1. 情感分析（与日记同通道，ONNX）
  // debounce 防止用户快速连续发送时每次都跑 ONNX 推理
  let sentiment: SentimentResult | null = null;
  try {
    const analyzeDebounced = debounce(
      (text: string) => API.sentimentAnalyze(text),
      300
    );
    sentiment = await analyzeDebounced(text);
  } catch (e) {
    console.error('[ChatService] sentimentAnalyze error:', e);
  }

  const emotionLabel = sentiment?.level === 'crisis' ? 'crisis'
    : sentiment && sentiment.negativeProb > 0.5 ? 'negative'
    : sentiment && sentiment.positiveProb > 0.5 ? 'positive'
    : 'neutral';

  // 2. 危机判定：ONNX 判 crisis → 立即弹危机干预，不调 LLM
  if (sentiment?.level === 'crisis') {
    useCrisisStore.getState().show('critical', 'chat', text);
    await recordChatEmotion(text, sentiment, userMsg.id);

    const crisisReply: ChatMessageState = {
      id: genId(),
      role: 'assistant',
      content: '我注意到你现在可能很难受。我想先确认一件事——你现在安全吗？如果你正在经历很痛苦的时刻，可以拨打全国心理援助热线 400-161-9995，那里有人 24 小时愿意听你说。你不是一个人。',
      timestamp: Date.now(),
      method: 'fallback',
      emotionLabel,
      crisisFlag: true,
    };
    store.addMessage(crisisReply);
    store.setProviderStatus('fallback');
    await persistConversation([...store.messages, crisisReply]);
    return;
  }

  // 3. 写对话情感记录
  if (sentiment) {
    await recordChatEmotion(text, sentiment, userMsg.id);
  }

  // 4. 调 LLM（流式）
  store.setStreaming(true);
  store.setProviderStatus('connecting');

  const assistantMsg: ChatMessageState = {
    id: genId(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    streaming: true,
    emotionLabel,
  };
  store.addMessage(assistantMsg);

  const requestId = assistantMsg.id;
  const context = await buildContext();
  const history = useChatStore.getState().messages
    .filter(m => m.role !== 'system')
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }));

  // 流式 chunk 监听
  let chunkUnsub: (() => void) | null = null;
  try {
    chunkUnsub = API.onChatChunk((chunk) => {
      if (chunk.requestId === requestId) {
        useChatStore.getState().appendToLast(chunk.delta);
        const st = useChatStore.getState();
        if (st.providerStatus !== 'cloud') st.setProviderStatus('cloud');
      }
    });

    const result = await API.chatSend({
      requestId,
      messages: history,
      context,
      systemPrompt: SYSTEM_PROMPT,
    });

    if (result.ok && result.fullText) {
      useChatStore.getState().finalizeLast({
        method: 'cloud',
        streaming: false,
      });
      useChatStore.getState().setProviderStatus('cloud');
    } else {
      // 5. 降级：云失败/无 key/超时 → ChatFallbackEngine
      const fb = await API.chatFallback({ text, emotionLabel });
      useChatStore.getState().finalizeLast({
        content: fb.text,
        method: 'fallback',
        streaming: false,
        crisisFlag: fb.isCrisis,
      });
      useChatStore.getState().setProviderStatus('fallback', result.error || null);
      if (fb.isCrisis) {
        useCrisisStore.getState().show('critical', 'chat', text);
      }
    }
  } catch (e: any) {
    // 兜底降级
    try {
      const fb = await API.chatFallback({ text, emotionLabel });
      useChatStore.getState().finalizeLast({
        content: fb.text,
        method: 'fallback',
        streaming: false,
      });
      useChatStore.getState().setProviderStatus('fallback', e?.message || null);
    } catch {
      useChatStore.getState().finalizeLast({
        content: '抱歉，我暂时无法回应，稍后再试。',
        method: 'fallback',
        streaming: false,
      });
      useChatStore.getState().setProviderStatus('error', e?.message || null);
    }
  } finally {
    if (chunkUnsub) chunkUnsub();
    useChatStore.getState().setStreaming(false);
    // 6. 落库
    await persistConversation(useChatStore.getState().messages);
    // 7. 摘要
    await maybeSummarize();
  }
}

/**
 * 主动问候（每天首次打开 / 沉默后回归）
 */
export async function sendGreeting(silentDays: number, riskRising: boolean): Promise<void> {
  const store = useChatStore.getState();
  if (store.hasGreetedToday) return;
  if (!API) return;

  let greeting: ChatGreetingResult;
  try {
    greeting = await API.chatGreeting({ silentDays, riskRising });
  } catch {
    return;
  }

  const msg: ChatMessageState = {
    id: genId(),
    role: 'assistant',
    content: greeting.text,
    timestamp: Date.now(),
    method: 'greeting',
  };
  store.addMessage(msg);
  store.setHasGreetedToday(true);
  await persistConversation(useChatStore.getState().messages);
}

/**
 * 持久化对话到 conversations 表
 */
async function persistConversation(messages: ChatMessageState[]) {
  try {
    const store = useChatStore.getState();
    const sessionId = store.currentSessionId || `sess_${getToday()}`;
    if (!store.currentSessionId) store.setSessionId(sessionId);

    const dbMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    const existing = await db.conversations.get(sessionId);
    if (existing) {
      await db.conversations.update(sessionId, {
        messages: dbMessages,
        updatedAt: getNow(),
      });
    } else {
      await db.conversations.add({
        id: sessionId,
        title: messages[0]?.content.slice(0, 20) || '新对话',
        messages: dbMessages,
        createdAt: getNow(),
        updatedAt: getNow(),
      });
    }
  } catch (e) {
    console.error('[ChatService] persistConversation error:', e);
  }
}

/**
 * 每 10 轮生成一次摘要，喂给 RiskScoringEngine chat 通道 + 下次上下文
 */
async function maybeSummarize() {
  try {
    const msgs = useChatStore.getState().messages;
    const userTurns = msgs.filter(m => m.role === 'user').length;
    if (userTurns === 0 || userTurns % SUMMARY_EVERY_ROUNDS !== 0) return;

    // 简单摘要：取最近 10 轮的 user 消息 + assistant 关键词
    const recent = msgs.slice(-SUMMARY_EVERY_ROUNDS * 2);
    const userMsgs = recent.filter(m => m.role === 'user').map(m => m.content);
    const summary = userMsgs.slice(0, 3).map(s => s.slice(0, 30)).join('；');

    await db.conversationSummaries.add({
      id: `summary_${Date.now()}`,
      date: getToday(),
      summary: summary || '近期对话',
      keyTopics: [],
      emotionalState: 'neutral',
      createdAt: getNow(),
    });
  } catch (e) {
    console.error('[ChatService] maybeSummarize error:', e);
  }
}

/**
 * 加载历史会话
 */
export async function loadSession(sessionId: string) {
  try {
    const conv = await db.conversations.get(sessionId);
    if (!conv) return;
    const store = useChatStore.getState();
    store.setSessionId(sessionId);
    store.setMessages(conv.messages.map(m => ({
      id: genId(),
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || Date.now(),
    })));
  } catch (e) {
    console.error('[ChatService] loadSession error:', e);
  }
}

/**
 * 计算距上次对话天数（用于沉默感知）
 */
export async function getSilentDays(): Promise<number> {
  try {
    const last = await db.conversations.orderBy('updatedAt').reverse().first();
    if (!last) return 999;
    const days = Math.floor((Date.now() - new Date(last.updatedAt).getTime()) / 86400000);
    return days;
  } catch {
    return 0;
  }
}
