import type { AIProvider, AIProviderConfig, OnlineProvider } from '../types';

// 各供应商 API URL 映射
const PROVIDER_URLS: Record<OnlineProvider, string> = {
  deepseek: 'https://api.deepseek.com/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
};

const PROVIDER_DEFAULT_MODELS: Record<OnlineProvider, string> = {
  deepseek: 'deepseek-v4-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
};

export class ApiProvider implements AIProvider {
  readonly name = 'API Provider';
  readonly type: OnlineProvider = 'deepseek';
  private apiKey = '';
  private model = 'deepseek-v4-flash';
  private tone = '';
  private onlineProvider: OnlineProvider = 'deepseek';
  private availabilityCache: { result: boolean; timestamp: number } | null = null;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  async initialize(config: AIProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
    this.onlineProvider = (config as any).onlineProvider || 'deepseek';
    this.model = config.model || PROVIDER_DEFAULT_MODELS[this.onlineProvider];
    this.tone = config.tone;
  }

  private get baseUrl(): string {
    return PROVIDER_URLS[this.onlineProvider];
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    // 检查缓存
    const now = Date.now();
    if (this.availabilityCache && (now - this.availabilityCache.timestamp) < ApiProvider.CACHE_TTL) {
      return this.availabilityCache.result;
    }

    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(5000),
      });
      const result = res.ok || res.status === 400; // 400 means valid key but bad request
      this.availabilityCache = { result, timestamp: now };
      return result;
    } catch {
      // 失败时缓存较短时间（30秒）避免频繁重试
      this.availabilityCache = { result: false, timestamp: now - ApiProvider.CACHE_TTL + 30000 };
      return false;
    }
  }

  async chat(messages: { role: string; content: string }[], context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    // 如果调用方已经提供了 system 消息，则不再重复注入
    const hasSystemMessage = messages.length > 0 && messages[0].role === 'system';
    const finalMessages = hasSystemMessage
      ? messages
      : [
          context
            ? { role: 'system', content: context }
            : { role: 'system', content: '你是一个有帮助的个人助理，回答简洁有用。' },
          ...messages,
        ];

    const body = {
      model: this.model,
      messages: finalMessages,
      stream: false,
    };

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API error: ${res.status} ${error}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
