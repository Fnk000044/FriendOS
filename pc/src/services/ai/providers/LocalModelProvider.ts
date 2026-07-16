import type { AIProvider, AIProviderConfig, LocalModel } from '../types';

export class LocalModelProvider implements AIProvider {
  readonly name = 'Local Model';
  readonly type = 'local' as const;

  private model: LocalModel | null = null;
  private initialized = false;
  private tone = '';

  async initialize(config: AIProviderConfig): Promise<void> {
    this.tone = config.tone;
    this.model = config.localModel || null;

    // 始终尝试初始化本地模型
    // 即使 config.localModel 为 null，IPC handler 也会从注册表查找默认模型路径
    const modelPath = this.model?.path || '';
    await this.initModel(modelPath);
  }

  private async initModel(modelPath: string): Promise<void> {
    if (!window.electronAPI?.localModelInit) {
      console.warn('Electron API not available for local model');
      return;
    }

    const result = await window.electronAPI.localModelInit(modelPath);
    if (result.success) {
      this.initialized = true;
    } else {
      throw new Error(result.error || 'Failed to initialize local model');
    }
  }

  async isAvailable(): Promise<boolean> {
    // 只要初始化成功就可用，不需要前端持有 model 引用（模型在主进程加载）
    return this.initialized;
  }

  /**
   * 从消息数组中提取 systemPrompt 和用户消息
   * 使用 AIService 传入的完整系统提示词（含语气、上下文、对话历史）
   *
   * 注意：/no_think 由后端 LocalModelService.cjs 在 prompt 末尾和
   * systemPrompt 末尾双重追加，前端不再重复追加，避免干扰模型。
   */
  private extractPromptParts(messages: { role: string; content: string }[]): {
    systemPrompt: string;
    userPrompt: string;
  } {
    // 提取系统提示词（由 AIService 构建，含语气、上下文、对话历史）
    const systemMsg = messages.find(m => m.role === 'system');
    const systemPrompt = systemMsg?.content || '你是一个友善的AI助手。用简短的中文回答用户问题。';

    // 提取非 system 消息
    const nonSystem = messages.filter(m => m.role !== 'system');

    // 最后一条 user 消息作为当前输入
    const userMessages = nonSystem.filter(m => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';

    // 历史对话（保留最近 4 轮，上下文 2048 够用，提升多轮对话连贯性）
    const historyMessages = nonSystem.filter(m => m !== userMessages[userMessages.length - 1]);
    let historyText = '';
    if (historyMessages.length > 0) {
      const recentHistory = historyMessages.slice(-8); // 最近 4 轮（8 条消息）
      historyText = recentHistory.map(m =>
        `${m.role === 'user' ? '用户' : '助手'}：${m.content}`
      ).join('\n') + '\n\n';
    }

    return {
      systemPrompt,
      userPrompt: historyText + lastUserMsg,
    };
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.initialized || !window.electronAPI?.localModelComplete) {
      throw new Error('Local model not initialized');
    }

    const { systemPrompt, userPrompt } = this.extractPromptParts(messages);

    const result = await window.electronAPI.localModelComplete(userPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result.response || '';
  }

  async chatStream(
    messages: { role: string; content: string }[],
    _context?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.initialized || !window.electronAPI?.localModelCompleteStream) {
      throw new Error('Local model not initialized');
    }

    const { systemPrompt, userPrompt } = this.extractPromptParts(messages);
    let fullResponse = '';

    return new Promise((resolve, reject) => {
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('模型响应超时（180秒），请检查模型是否正常加载'));
        }
      }, 180000);

      // 保存 cleanup 函数引用，在 resolve/reject 时调用清理
      const cleanup = window.electronAPI!.localModelCompleteStream(
        userPrompt,
        (data: any) => {
          if (settled) return;
          if (data.error) {
            settled = true;
            clearTimeout(timeout);
            cleanup();
            reject(new Error(data.error));
          } else if (data.done) {
            settled = true;
            clearTimeout(timeout);
            cleanup();
            resolve(fullResponse);
          } else {
            fullResponse += data.token;
            onChunk?.(data.token);
          }
        },
        { systemPrompt, temperature: 0.7, maxTokens: 4096 }
      );
    });
  }

  async setModel(model: LocalModel): Promise<void> {
    this.model = model;
    await this.initModel(model.path);
  }

  async dispose(): Promise<void> {
    if (window.electronAPI?.localModelDispose) {
      await window.electronAPI.localModelDispose();
    }
    this.initialized = false;
    this.model = null;
  }
}