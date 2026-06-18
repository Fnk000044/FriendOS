import { db } from '../../db';
import { getToday, getDaysAgo } from '../../utils/date';
import { getRecentSummaries, formatSummariesForContext } from './ConversationMemory';
import { detectSemesterPhase } from '../emotion/StudentAdaptationService';
import { detectImplicitExpression } from '../emotion/ChineseLocalizationService';

interface UserContext {
  date: string;
  todayTasks: string;
  recentDiaries: string;
  todayHabits: string;
  recentMemories: string;
  conversationHistory: string;
  semesterInfo?: string;
  implicitHints?: string;
}

// TTL缓存配置
// 避免每次AI消息都查询数据库
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟缓存

export class ContextService {
  private cache: UserContext | null = null;
  private cacheTimestamp: number = 0;

  /**
   * 获取用户上下文（带缓存）
   * 缓存5分钟，避免频繁查询数据库
   */
  async gatherContext(): Promise<UserContext> {
    // 检查缓存是否有效
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < CACHE_TTL_MS) {
      // 检查日期是否变化（跨天时清除缓存）
      const today = getToday();
      if (this.cache.date === today) {
        return this.cache;
      }
    }

    // 缓存失效，重新查询
    const context = await this.fetchContext();
    this.cache = context;
    this.cacheTimestamp = now;
    return context;
  }

  /**
   * 清除缓存（在数据变化时调用）
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  private async fetchContext(): Promise<UserContext> {
    try {
      const today = getToday();
      const sevenDaysAgo = getDaysAgo(7);

      // Parallelize all database queries for better performance
      const [todayTasks, overdueTasksRaw, recentDiariesRaw, allHabits, todayLogs, recentMemoriesRaw, recentSummaries] = await Promise.all([
        db.tasks.where('scheduledDate').equals(today).toArray(),
        db.tasks.where('status').equals('pending').filter(t => t.scheduledDate < today).limit(3).toArray(),
        db.diaries.where('date').between(sevenDaysAgo, today, true, true).toArray(),
        db.habits.where('archived').equals(0).limit(8).toArray(),
        db.habitLogs.where('date').equals(today).toArray(),
        db.memories.filter(m => !m.archived).reverse().limit(5).toArray(),
        getRecentSummaries(10),
      ]);

      // Process tasks
      const pendingTasks = todayTasks
        .filter(t => t.status === 'pending')
        .slice(0, 5)
        .map(t => {
          const priorityLabel = t.priority === 'urgent' ? '(紧急)' : t.priority === 'high' ? '(重要)' : '';
          return `- [ ] ${t.title} ${priorityLabel}`;
        });

      const completedTasks = todayTasks
        .filter(t => t.status === 'completed')
        .slice(0, 3)
        .map(t => `- [x] ${t.title}`);

      const overdueTasks = overdueTasksRaw.map(t => `- 逾期: ${t.title}`);

      const tasksSection = [
        ...pendingTasks,
        ...completedTasks,
        ...overdueTasks,
      ].join('\n');

      // Process diaries
      const recentDiaries = recentDiariesRaw.reverse().slice(0, 3);
      const moodLabels: Record<number, string> = { 1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '😄' };
      const diariesSection = recentDiaries.length > 0
        ? recentDiaries.map(d => {
            const mood = d.mood ? moodLabels[d.mood] : '😐';
            const summary = d.content.slice(0, 40).replace(/\n/g, ' ');
            return `- ${d.date.slice(5)} ${mood} ${d.title || summary}...`;
          }).join('\n')
        : '- 暂无日记';

      // Process habits
      const completedHabitIds = new Set(todayLogs.map(l => l.habitId));
      const habitList = allHabits.map(h => {
        const done = completedHabitIds.has(h.id);
        return done ? `- [x] ${h.name}` : `- [ ] ${h.name}`;
      });

      const habitSummary = habitList.length > 0
        ? habitList.join('\n')
        : '- 暂无习惯';

      // Process memories
      const memoriesSection = recentMemoriesRaw.length > 0
        ? recentMemoriesRaw.map(m => `- "${m.title}" - ${m.content.slice(0, 30)}...`).join('\n')
        : '- 暂无记忆';

      // Process conversation history
      const conversationHistory = formatSummariesForContext(recentSummaries);

      // 学期阶段识别
      const semester = detectSemesterPhase();
      const semesterInfo = `当前处于${semester.label}阶段（压力指数：${semester.stressLevel}/100），${semester.description}`;

      // 含蓄表达检测（检查最新日记）
      let implicitHints = '';
      if (recentDiariesRaw.length > 0) {
        const latestDiary = recentDiariesRaw[recentDiariesRaw.length - 1];
        const implicit = detectImplicitExpression(latestDiary.content);
        if (implicit) {
          implicitHints = `用户最新日记中可能有含蓄表达："${implicit.expression}"，${implicit.possibleMeanings[0]}。建议回应：${implicit.suggestedResponse}`;
        }
      }

      return {
        date: today,
        todayTasks: tasksSection || '- 暂无任务',
        recentDiaries: diariesSection,
        todayHabits: habitSummary,
        recentMemories: memoriesSection,
        conversationHistory: conversationHistory || '- 暂无对话历史',
        semesterInfo,
        implicitHints,
      };
    } catch (err) {
      console.error('[ContextService] gatherContext error:', err);
      // Return safe defaults on error
      return {
        date: getToday(),
        todayTasks: '- 暂无任务',
        recentDiaries: '- 暂无日记',
        todayHabits: '- 暂无习惯',
        recentMemories: '- 暂无记忆',
        conversationHistory: '- 暂无对话历史',
      };
    }
  }
}

export const contextService = new ContextService();
