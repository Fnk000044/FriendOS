import Dexie, { type EntityTable } from 'dexie';
import type {
  Task, DiaryEntry, Habit, HabitLog, Memory, MemoryCandidate,
  DailyRecord, QuickCapture, Category, SyncLog, Quote,
  EmotionRecord, BehaviorRecord, HealthProfile, CrisisLog,
  ConversationSummary, Conversation, Assessment, TherapyRecord, FeedbackLog
} from './models';

export class FriendOSDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  diaries!: EntityTable<DiaryEntry, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
  memories!: EntityTable<Memory, 'id'>;
  memoryCandidates!: EntityTable<MemoryCandidate, 'id'>;
  dailyRecords!: EntityTable<DailyRecord, 'id'>;
  quickCaptures!: EntityTable<QuickCapture, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  syncLogs!: EntityTable<SyncLog, 'id'>;
  quotes!: EntityTable<Quote, 'id'>;
  emotionRecords!: EntityTable<EmotionRecord, 'id'>;
  behaviorRecords!: EntityTable<BehaviorRecord, 'id'>;
  healthProfiles!: EntityTable<HealthProfile, 'id'>;
  crisisLogs!: EntityTable<CrisisLog, 'id'>;
  conversationSummaries!: EntityTable<ConversationSummary, 'id'>;
  conversations!: EntityTable<Conversation, 'id'>;
  assessments!: EntityTable<Assessment, 'id'>;
  therapyRecords!: EntityTable<TherapyRecord, 'id'>;
  feedbackLogs!: EntityTable<FeedbackLog, 'id'>;

  constructor() {
    super('FriendOS');

    // v1: 初始表结构
    this.version(1).stores({
      tasks: '&id, [status+scheduledDate], priority, scheduledDate, createdAt, *tags, isRollover',
      diaries: '&id, date, mood',
      habits: '&id, archived',
      habitLogs: '&id, [habitId+date], habitId, date',
      memories: '&id, type, category, archived, pinned',
      dailyRecords: '&id, date',
      quickCaptures: '&id, processed, createdAt',
      categories: '&id, type',
    });

    // v2: 添加 syncLogs 表
    this.version(2).stores({
      syncLogs: '&id, syncedAt, status',
    });

    // v3: 添加 memoryCandidates 表
    this.version(3).stores({
      memoryCandidates: '&id, sourceType, status, extractedAt, [sourceType+status]',
    });

    // v4: 添加 quotes 表
    this.version(4).stores({
      quotes: '&id, createdAt',
    });

    // v5: 添加情绪/行为/健康/危机/对话/评估/治疗表
    this.version(5).stores({
      emotionRecords: '&id, date, source, riskLevel, [date+source], createdAt',
      behaviorRecords: '&id, date, createdAt',
      healthProfiles: '&id, date, riskLevel, createdAt',
      crisisLogs: '&id, date, riskLevel, handled, [handled+date]',
      conversationSummaries: '&id, date',
      assessments: '&id, type, date, [type+date]',
      therapyRecords: '&id, type, date, createdAt',
    });

    // v6: 修复 conversationSummaries 缺少 createdAt 索引
    this.version(6).stores({
      conversationSummaries: '&id, date, createdAt',
    });

    // v7: 添加用户反馈表
    this.version(7).stores({
      feedbackLogs: '&id, type, feedback, createdAt',
    });

    // v8: 添加完整对话历史表
    this.version(8).stores({
      conversations: '&id, createdAt, updatedAt',
    });
  }
}

export const db = new FriendOSDatabase();
