export type ToneType = 'professional' | 'friendly' | 'concise' | 'encouraging' | 'counselor';

export type ProviderType = 'local' | 'online';
export type OnlineProvider = 'deepseek' | 'openai' | 'anthropic';

export interface LocalModel {
  id: string;
  name: string;
  size: string;
  path: string;
  blobPath: string;
}

export interface AIConfig {
  provider: ProviderType;
  tone: ToneType;
  apiKey: string;
  onlineProvider: OnlineProvider;
  model: string;
  localModel: LocalModel | null;
  localModelPath: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  tone: ToneType;
  localModel?: LocalModel | null;
}

export interface AIProvider {
  readonly name: string;
  readonly type: string;
  initialize(config: AIProviderConfig): Promise<void>;
  chat(messages: { role: string; content: string }[], context?: string): Promise<string>;
  chatStream?(messages: { role: string; content: string }[], context?: string, onChunk?: (chunk: string) => void): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface ContextSummary {
  date: string;
  todayTasks: { pending: number; completed: number; total: number };
  recentDiaries: number;
  habitCompletion: { completed: number; total: number; rate: number };
  moodTrend: string;
  recentMemories: number;
  overdueTasks: number;
}

export const TONE_LABELS: Record<ToneType, string> = {
  professional: 'settings.ai_tone_professional',
  friendly: 'settings.ai_tone_friendly',
  concise: 'settings.ai_tone_concise',
  encouraging: 'settings.ai_tone_encouraging',
  counselor: 'settings.ai_tone_counselor',
};

export const ONLINE_PROVIDER_LABELS: Record<OnlineProvider, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};
