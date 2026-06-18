import type { AIConfig, AIProvider, ChatMessage } from './types';
import { LocalModelProvider } from './providers/LocalModelProvider';
import { contextService } from './ContextService';
import { buildSystemPrompt } from './prompts';
import { getRecentSummaries, formatSummariesForContext } from './ConversationMemory';

/**
 * 用户输入消毒
 * 防止Prompt注入攻击
 * 参考：OWASP LLM Security Guidelines
 *
 * 策略：黑名单过滤 + Unicode规范化 + 长度限制 + 分隔符隔离
 * 黑名单无法完全阻止注入，但可增加攻击成本
 */
function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // 0. Unicode NFKC 规范化，防止 homoglyph 攻击（如 1gnore、ign0re）
  let sanitized = input.normalize('NFKC');

  // 1. 移除零宽字符（零宽空格、零宽连接符等）
  sanitized = sanitized.replace(/[​-‍﻿‎‏‪-‮]/g, '');

  // 2. 移除可能的Prompt注入尝试
  const injectionPatterns = [
    // 英文注入模式
    /ignore\s+(previous|all|above|earlier|prior)\s+(instructions?|prompts?|rules?|commands?)/gi,
    /you\s+are\s+now/gi,
    /forget\s+(everything|all|previous)/gi,
    /disregard\s+(previous|all|above)/gi,
    /new\s+(instructions?|role|identity)/gi,
    /override\s+(instructions?|system)/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /```system/gi,
    /```assistant/gi,
    // 中文注入模式
    /忽略(之前|上面|所有|以前)(的)?(指令|提示|要求|规则)/gi,
    /你现在是/gi,
    /忘记(之前|上面|所有)(的)?(指令|提示)/gi,
    /无视(之前|上面|所有)(的)?(指令|提示)/gi,
    /新的(指令|身份|角色)/gi,
    /系统\s*[:：]/gi,
    /助手\s*[:：]/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[已过滤]');
  }

  // 3. 限制输入长度
  const MAX_INPUT_LENGTH = 5000;
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH) + '...[已截断]';
  }

  return sanitized;
}

export class AIService {
  private provider: AIProvider | null = null;
  private config: AIConfig | null = null;

  async initialize(config: AIConfig): Promise<void> {
    this.config = config;

    const localProvider = new LocalModelProvider();
    await localProvider.initialize({
      apiKey: '',
      model: config.model,
      tone: config.tone,
      localModel: config.localModel,
    });
    if (await localProvider.isAvailable()) {
      this.provider = localProvider;
      return;
    }

    throw new Error('本地模型加载失败，请检查模型文件是否存在');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.provider) return false;
    return this.provider.isAvailable();
  }

  async sendMessage(userMessage: string, history: ChatMessage[] = []): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error('AI service not initialized');
    }

    // 用户输入消毒（防止Prompt注入）
    const sanitizedMessage = sanitizeUserInput(userMessage);

    // Gather context from local DB
    const context = await contextService.gatherContext();

    // Format context summary with real data
    const contextText = `## 今日任务
${context.todayTasks}

## 最近日记
${context.recentDiaries}

## 今日习惯
${context.todayHabits}

## 近期记忆
${context.recentMemories}

## 学期状态
${context.semesterInfo || '无法识别学期阶段'}
${context.implicitHints ? `\n## 含蓄表达提示\n${context.implicitHints}` : ''}`;

    // 获取对话历史摘要，传递给系统提示
    // 修复：AI无上下文记忆问题
    const summaries = await getRecentSummaries(5);
    const conversationHistory = formatSummariesForContext(summaries);

    // Build system prompt with tone, context and conversation history
    const systemPrompt = buildSystemPrompt(this.config.tone, contextText, conversationHistory);

    // Prepare messages: system prompt + history + sanitized user message
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.filter(m => m.content).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content || '' })),
      { role: 'user' as const, content: sanitizedMessage },
    ];

    // Call provider
    const response = await this.provider.chat(messages, contextText);
    return response;
  }

  async sendMessageStream(
    userMessage: string,
    history: ChatMessage[] = [],
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error('AI service not initialized');
    }

    // 用户输入消毒（防止Prompt注入）
    const sanitizedMessage = sanitizeUserInput(userMessage);

    let context;
    try {
      context = await contextService.gatherContext();
    } catch (err) {
      console.error('[AIService] gatherContext failed:', err);
      // 降级：使用空上下文继续
      context = { todayTasks: '无', recentDiaries: '无', todayHabits: '无', recentMemories: '无', semesterInfo: '', implicitHints: '' };
    }

    const contextText = `## 今日任务
${context.todayTasks}

## 最近日记
${context.recentDiaries}

## 今日习惯
${context.todayHabits}

## 近期记忆
${context.recentMemories}

## 学期状态
${context.semesterInfo || '无法识别学期阶段'}
${context.implicitHints ? `\n## 含蓄表达提示\n${context.implicitHints}` : ''}`;

    // 获取对话历史摘要，传递给系统提示
    let conversationHistory = '';
    try {
      const summaries = await getRecentSummaries(5);
      conversationHistory = formatSummariesForContext(summaries);
    } catch (err) {
      console.error('[AIService] getRecentSummaries failed:', err);
    }

    const systemPrompt = buildSystemPrompt(this.config.tone, contextText, conversationHistory);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.filter(m => m.content).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content || '' })),
      { role: 'user' as const, content: sanitizedMessage },
    ];

    if (this.provider.chatStream) {
      return this.provider.chatStream(messages, contextText, onChunk);
    }
    return this.provider.chat(messages, contextText);
  }
}

export const aiService = new AIService();
