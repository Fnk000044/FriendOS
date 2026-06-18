export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled';
  categoryId?: string;
  scheduledDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isRollover: boolean;
  originalDate?: string;
  rolloverCount: number;
  tags: string[];
  estimatedMinutes?: number;
  repeatInterval?: number;
  repeatEnd?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  weather?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  unit?: string;
  reminderTime?: string;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
  note?: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'diary_extract' | 'manual' | 'idea' | 'insight' | 'bookmark' | 'other';
  source?: string;
  sourceId?: string;
  tags: string[];
  category: string;
  archived: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryCandidate {
  id: string;
  sourceType: 'diary' | 'task' | 'quick_capture';
  sourceId: string;
  sourceDate: string;
  extractedTitle: string;
  extractedContent: string;
  suggestedCategory: string;
  suggestedTags: string[];
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedMemoryId?: string;
  extractedAt: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  diaryWritten: boolean;
  moodAvg?: number;
  habitsCompleted: number;
  habitsTotal: number;
  habitsCompletionRate: number;
  wordCount: number;
  createdAt: string;
}

export interface QuickCapture {
  id: string;
  content: string;
  type: 'diary' | 'todo' | 'idea' | 'memory' | 'uncategorized';
  processed: boolean;
  processedInto?: {
    diaryId?: string;
    taskId?: string;
    memoryId?: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'task' | 'memory' | 'diary';
  color: string;
  icon: string;
  order: number;
}

export interface SyncPayloadItem {
  type: 'task' | 'diary' | 'memory';
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  scheduledDate?: string;
  content?: string;
  category?: string;
}

export interface SyncLog {
  id: string;
  items: SyncPayloadItem[];
  source: string;
  status: 'success' | 'partial' | 'error';
  syncedAt: string;
}

export interface Quote {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
}

// ── Emotion & Risk Detection Models ────────────────────────────

export type RiskLevel = 'low' | 'medium_low' | 'medium' | 'high' | 'critical';

export interface EmotionRecord {
  id: string;
  date: string;
  source: 'diary' | 'chat' | 'combined';
  sourceId?: string;
  sentimentScore: number; // -1 到 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  riskLevel: RiskLevel;
  keywords: string[];
  analysis?: string;
  createdAt: string;
}

export interface TypingBehavior {
  avgSpeed: number;        // 平均打字速度 (字符/分钟)
  deleteRate: number;      // 删除键比例 (0-1)
  pauseRate: number;       // 停顿次数/分钟
  sessionDuration: number; // 会话时长 (分钟)
}

export interface BehaviorRecord {
  id: string;
  date: string;
  diaryWritten: boolean;
  diaryWordCount: number;
  moodRating: number | null;
  tasksCompleted: number;
  tasksTotal: number;
  habitsChecked: number;
  habitsTotal: number;
  activeHours: number[];
  chatMessages: number;
  typingBehavior?: TypingBehavior | null; // 打字行为数据（无感识别）
  createdAt: string;
}

export interface HealthProfile {
  id: string;
  date: string;
  emotionalHealthIndex: number; // 0-100
  emotionalVolatility: number;
  riskLevel: RiskLevel;
  dimensions: {
    mood: number;
    stress: number;
    energy: number;
    social: number;
    sleep: number;
    selfCare: number;
  };
  insights: string[];
  suggestions: string[];
  createdAt: string;
}

export interface CrisisLog {
  id: string;
  date: string;
  triggerSource: 'diary' | 'chat';
  triggerContent: string;
  riskLevel: 'high' | 'critical';
  handled: boolean;
  action: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  date: string;
  summary: string;
  keyTopics: string[];
  emotionalState: string;
  createdAt: string;
}

export interface Assessment {
  id: string;
  type: 'PHQ9' | 'GAD7' | 'PSS10';
  date: string;
  scores: number[];
  totalScore: number;
  level: string;
  suggestions: string;
  createdAt: string;
}

export interface TherapyRecord {
  id: string;
  type: 'thought_record' | 'breathing' | 'mindfulness';
  date: string;
  data: Record<string, unknown>;
  moodBefore: number;
  moodAfter: number;
  createdAt: string;
}

export interface FeedbackLog {
  id: string;
  type: 'sentiment' | 'ai_response' | 'recommendation';
  targetId?: string;
  text: string;
  predicted: string;
  feedback: 'accurate' | 'inaccurate';
  createdAt: string;
}
