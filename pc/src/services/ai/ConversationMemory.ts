import { db } from '../../db';
import type { ConversationSummary } from '../../db/models';
import { getToday } from '../../utils/date';

const MAX_SUMMARIES = 20; // Keep last 20 conversation summaries

/**
 * 消毒用户输入，防止 XSS 和注入
 * 安全修复：存储前调用 sanitizeUserInput
 */
function sanitizeUserInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .trim();
}

/**
 * Save a conversation summary
 * Called when a conversation ends or after significant messages
 */
export async function saveConversationSummary(
  messages: Array<{ role: string; content: string }>,
  emotionalState?: string
): Promise<boolean> {
  try {
    // Only analyze user messages for summary
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return false;

    // Generate summary from user messages（存储前消毒）
    const summary = sanitizeUserInput(generateSummary(userMessages.map(m => m.content)));
    const keyTopics = extractKeyTopics(userMessages.map(m => m.content)).map(sanitizeUserInput);

    // Save to database
    await db.conversationSummaries.add({
      id: crypto.randomUUID(),
      date: getToday(),
      summary,
      keyTopics,
      emotionalState: emotionalState || detectEmotionalState(userMessages.map(m => m.content)),
      createdAt: new Date().toISOString(),
    });

    // Cleanup old summaries (keep only MAX_SUMMARIES)
    await cleanupOldSummaries();

    return true;
  } catch (err) {
    console.error('[ConversationMemory] Failed to save summary:', err);
    return false;
  }
}

/**
 * Get recent conversation summaries for AI context
 */
export async function getRecentSummaries(limit: number = 10): Promise<ConversationSummary[]> {
  try {
    return await db.conversationSummaries
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  } catch (err) {
    console.error('[ConversationMemory] Failed to get summaries:', err);
    return [];
  }
}

/**
 * Format summaries for AI context
 */
export function formatSummariesForContext(summaries: ConversationSummary[]): string {
  if (summaries.length === 0) return '';

  const lines = summaries.map(s => {
    const date = s.date;
    const emotion = s.emotionalState ? `[${s.emotionalState}]` : '';
    const topics = s.keyTopics.length > 0 ? `(${s.keyTopics.join(', ')})` : '';
    return `- ${date}: ${emotion} ${s.summary} ${topics}`.trim();
  });

  return `用户近期对话摘要：\n${lines.join('\n')}`;
}

/**
 * Generate a summary from messages
 * 改进：提取关键信息生成更有意义的摘要
 */
function generateSummary(messages: string[]): string {
  if (messages.length === 0) return '用户进行了对话';

  // 提取关键句（最长的、包含情感词的、包含主题词的）
  const keyMessages: string[] = [];

  // 1. 包含情感表达的消息
  const emotionKeywords = ['开心', '难过', '焦虑', '压力', '累', '烦', '高兴', '伤心', '生气', '害怕'];
  for (const msg of messages) {
    if (emotionKeywords.some(kw => msg.includes(kw))) {
      keyMessages.push(msg);
      break; // 只取第一个
    }
  }

  // 2. 包含具体事件的消息
  const eventKeywords = ['今天', '昨天', '明天', '刚才', '最近', '这个'];
  for (const msg of messages) {
    if (eventKeywords.some(kw => msg.includes(kw)) && !keyMessages.includes(msg)) {
      keyMessages.push(msg);
      break;
    }
  }

  // 3. 如果还没有关键消息，用最长的
  if (keyMessages.length === 0) {
    const longest = messages.reduce((a, b) => a.length > b.length ? a : b, '');
    keyMessages.push(longest);
  }

  // 生成摘要
  const summary = keyMessages.join('；');

  // 截断到合理长度
  if (summary.length > 100) {
    return summary.substring(0, 97) + '...';
  }

  return summary || '用户进行了对话';
}

/**
 * Extract key topics from messages
 */
function extractKeyTopics(messages: string[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    '工作': ['工作', '上班', '加班', '项目', '任务', '领导', '同事', '公司'],
    '学习': ['学习', '考试', '作业', '上课', '老师', '大学', '成绩'],
    '情感': ['感情', '恋爱', '分手', '喜欢', '爱', '男朋友', '女朋友', '对象'],
    '家庭': ['家人', '父母', '爸爸', '妈妈', '家里', '回家'],
    '健康': ['身体', '生病', '医院', '睡不着', '失眠', '头疼', '累'],
    '社交': ['朋友', '聚会', '社交', '聊天', '见面'],
    '压力': ['压力', '焦虑', '紧张', '烦躁', '崩溃', '受不了'],
    '心情': ['心情', '开心', '难过', '高兴', '伤心', '快乐'],
  };

  const topics: string[] = [];
  const combinedText = messages.join(' ');

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => combinedText.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics.slice(0, 3); // Max 3 topics
}

/**
 * Detect emotional state from messages
 */
function detectEmotionalState(messages: string[]): string {
  const combinedText = messages.join(' ');

  const positiveWords = ['开心', '快乐', '高兴', '满足', '幸福', '愉快'];
  const negativeWords = ['难过', '焦虑', '烦躁', '疲惫', '压力', '伤心'];
  const neutralWords = ['普通', '正常', '一般', '还行'];

  const posCount = positiveWords.filter(w => combinedText.includes(w)).length;
  const negCount = negativeWords.filter(w => combinedText.includes(w)).length;
  const neuCount = neutralWords.filter(w => combinedText.includes(w)).length;

  if (posCount > negCount && posCount > neuCount) return '积极';
  if (negCount > posCount && negCount > neuCount) return '消极';
  if (neuCount > 0) return '平静';
  return '一般';
}

/**
 * Cleanup old summaries
 */
async function cleanupOldSummaries(): Promise<void> {
  try {
    const count = await db.conversationSummaries.count();
    if (count > MAX_SUMMARIES) {
      const toDelete = await db.conversationSummaries
        .orderBy('createdAt')
        .limit(count - MAX_SUMMARIES)
        .primaryKeys();

      await db.conversationSummaries.bulkDelete(toDelete);
    }
  } catch (err) {
    console.error('[ConversationMemory] Cleanup error:', err);
  }
}
