import { db } from '../../db';
import { suggestCategory, suggestTags } from './CategorySuggester';
import { getToday, getDaysAgo } from '../../utils/date';

const insightKeywords = [
  '发现', '学到', '原来', '方法', '技巧', '技能', '知识', '原理',
  '总结', '经验', '收获', '感悟', '体会', '领悟', '反思', '教训',
  'learn', 'found', 'discovered', 'realized', 'lesson', 'tip',
];

const taskKnowledgeTags = ['知识', '学习', '经验', '研究', '调研', '文档', '读书', '教程'];

const MIN_CONTENT_LENGTH = 50;

/**
 * 使用 ONNX 情感分析模型判断内容是否包含危机信号
 * 返回 true 表示内容有危机风险，不应提取为记忆
 */
async function isCrisisContent(text: string): Promise<boolean> {
  try {
    const api = window.electronAPI;
    if (!api?.sentimentAnalyze) return false;
    const result = await api.sentimentAnalyze(text);
    return result?.level === 'high';
  } catch {
    return false;
  }
}

function scoreDiaryInsight(content: string): number {
  const lower = content.toLowerCase();
  let score = 0;
  for (const kw of insightKeywords) {
    if (lower.includes(kw)) score += 1;
  }
  return score;
}

function hasKnowledgeTags(tags: string[]): boolean {
  return tags.some(t => taskKnowledgeTags.some(kw => t.includes(kw)));
}

function truncateContent(content: string, maxLength = 200): string {
  return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
}

function extractTitle(content: string): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const cleaned = line.replace(/^#+\s*/, '').replace(/[*`]/g, '').trim();
    if (cleaned.length > 3 && cleaned.length < 80) return cleaned;
  }
  return content.slice(0, 40).replace(/[*#`]/g, '').trim() + '...';
}

export class MemoryCandidateService {
  async scanForCandidates(): Promise<number> {
    let count = 0;

    // 1. Extract from recent diaries (last 7 days)
    const sevenDaysAgo = getDaysAgo(7);
    const today = getToday();
    const allDiaries = await db.diaries.toArray();
    const diaries = allDiaries.filter(d => d.date >= sevenDaysAgo && d.date <= today);

    const allMemoryCandidates = await db.memoryCandidates.toArray();

    for (const diary of diaries) {
      const existing = allMemoryCandidates.find(
        c => c.sourceType === 'diary' && c.sourceId === diary.id
      );
      if (existing) continue;

      if (!diary.content || diary.content.length < MIN_CONTENT_LENGTH) continue;
      if (await isCrisisContent(diary.content)) continue;
      if (scoreDiaryInsight(diary.content) < 2) continue;

      const content = truncateContent(diary.content);
      const title = diary.title || extractTitle(diary.content);

      count++;
      await db.memoryCandidates.add({
        id: crypto.randomUUID(),
        sourceType: 'diary',
        sourceId: diary.id,
        sourceDate: diary.date,
        extractedTitle: title,
        extractedContent: content,
        suggestedCategory: suggestCategory(content, diary.title),
        suggestedTags: suggestTags(content),
        status: 'pending',
        extractedAt: new Date().toISOString(),
      });
    }

    // 2. Extract from completed tasks (last 7 days)
    const allTasks = await db.tasks.toArray();
    const recentTasks = allTasks.filter(t => {
      if (t.status !== 'completed') return false;
      if (!t.completedAt) return false;
      return t.completedAt >= sevenDaysAgo;
    });

    for (const task of recentTasks) {
      if (!task.description && !hasKnowledgeTags(task.tags)) continue;

      const existing = allMemoryCandidates.find(
        c => c.sourceType === 'task' && c.sourceId === task.id
      );
      if (existing) continue;

      const content = task.description || task.title;
      if (!content || (content.length < MIN_CONTENT_LENGTH && !hasKnowledgeTags(task.tags))) continue;

      count++;
      await db.memoryCandidates.add({
        id: crypto.randomUUID(),
        sourceType: 'task',
        sourceId: task.id,
        sourceDate: task.scheduledDate,
        extractedTitle: task.title,
        extractedContent: truncateContent(content),
        suggestedCategory: suggestCategory(content, task.title),
        suggestedTags: suggestTags(content),
        status: 'pending',
        extractedAt: new Date().toISOString(),
      });
    }

    // 3. Extract from unprocessed quick captures of type 'memory'
    const allCaptures = await db.quickCaptures.toArray();
    const captures = allCaptures.filter(c => !c.processed && c.type === 'memory');

    for (const cap of captures) {
      const existing = allMemoryCandidates.find(
        c => c.sourceType === 'quick_capture' && c.sourceId === cap.id
      );
      if (existing) continue;

      count++;
      await db.memoryCandidates.add({
        id: crypto.randomUUID(),
        sourceType: 'quick_capture',
        sourceId: cap.id,
        sourceDate: cap.createdAt.slice(0, 10),
        extractedTitle: cap.content.slice(0, 40).replace(/[*#`]/g, '').trim(),
        extractedContent: truncateContent(cap.content),
        suggestedCategory: suggestCategory(cap.content),
        suggestedTags: suggestTags(cap.content),
        status: 'pending',
        extractedAt: new Date().toISOString(),
      });
    }

    return count;
  }

  async scanWithAI(_options: { model?: string } = {}): Promise<number> {
    let count = 0;
    const sevenDaysAgo = getDaysAgo(7);
    const today = getToday();
    const allDiaries = await db.diaries.toArray();
    const diaries = allDiaries.filter(d => d.date >= sevenDaysAgo && d.date <= today && d.content?.length >= 20);

    const allMemoryCandidates = await db.memoryCandidates.toArray();

    for (const diary of diaries) {
      const existing = allMemoryCandidates.find(
        c => c.sourceType === 'diary' && c.sourceId === diary.id
      );
      if (existing) continue;

      // 使用 ONNX 模型检测危机内容，跳过有风险的日记
      if (await isCrisisContent(diary.content)) continue;

      const systemPrompt = '你是一位知识提取助手。判断用户日记是否包含值得记录的知识、感悟或经验。只返回JSON格式。';
      const userPrompt = `判断以下日记是否包含值得记录的知识、感悟或经验。
标题：${diary.title || ''}
内容：${diary.content.slice(0, 500)}
输出JSON：{"extract":true/false,"title":"标题","category":"分类"}`;

      try {
        const result = await window.electronAPI?.localModelComplete(userPrompt, {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 128,
        });

        if (result?.error) {
          console.error('AI extraction failed for diary', diary.id, result.error);
          continue;
        }

        const parsedResult = JSON.parse(result?.response || '{}');
        if (!parsedResult.extract) continue;

        count++;
        await db.memoryCandidates.add({
          id: crypto.randomUUID(),
          sourceType: 'diary',
          sourceId: diary.id,
          sourceDate: diary.date,
          extractedTitle: parsedResult.title || diary.title || diary.content.slice(0, 40),
          extractedContent: diary.content.slice(0, 200) + (diary.content.length > 200 ? '...' : ''),
          suggestedCategory: parsedResult.category || suggestCategory(diary.content, diary.title),
          suggestedTags: suggestTags(diary.content),
          status: 'pending',
          extractedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('AI extraction failed for diary', diary.id, e);
        continue;
      }
    }

    return count;
  }
}

export const memoryCandidateService = new MemoryCandidateService();
