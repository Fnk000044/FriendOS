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
   * 对本地 0.6B 模型使用精简版提示词，避免模型混淆
   */
  private extractPromptParts(messages: { role: string; content: string }[]): {
    systemPrompt: string;
    userPrompt: string;
  } {
    // 提取非 system 消息
    const nonSystem = messages.filter(m => m.role !== 'system');

    // 最后一条 user 消息作为当前输入
    const userMessages = nonSystem.filter(m => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';

    // 历史对话（只保留最近 2 轮，0.6B 模型上下文有限）
    const historyMessages = nonSystem.filter(m => m !== userMessages[userMessages.length - 1]);
    let historyText = '';
    if (historyMessages.length > 0) {
      const recentHistory = historyMessages.slice(-4); // 最近 2 轮
      historyText = recentHistory.map(m =>
        `${m.role === 'user' ? '用户' : '助手'}：${m.content}`
      ).join('\n') + '\n\n';
    }

    // 精简版系统提示词（0.6B 模型专用）
    const systemPrompt = '你是一个友善的AI助手。用简短的中文回答用户问题，不要重复相同的话。';

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
      maxTokens: 512,
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
          reject(new Error('Local model stream timeout (120s)'));
        }
      }, 120000);

      window.electronAPI!.localModelCompleteStream(
        userPrompt,
        (data: any) => {
          if (settled) return;
          if (data.error) {
            settled = true;
            clearTimeout(timeout);
            reject(new Error(data.error));
          } else if (data.done) {
            settled = true;
            clearTimeout(timeout);
            resolve(fullResponse);
          } else {
            fullResponse += data.token;
            onChunk?.(data.token);
          }
        },
        { systemPrompt, temperature: 0.5, maxTokens: 200 }
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