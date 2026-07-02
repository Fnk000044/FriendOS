import { useCallback, useRef, useEffect } from 'react';
import { useAIStore } from '../stores/aiStore';
import { aiService } from '../services/ai/AIService';
import { useLanguage } from '../i18n/useLanguage';
import { saveConversationSummary } from '../services/ai/ConversationMemory';

const STREAM_FLUSH_INTERVAL = 16;

export function useAI() {
  const { t } = useLanguage();
  const messages = useAIStore((s) => s.messages);
  const loading = useAIStore((s) => s.loading);
  const error = useAIStore((s) => s.error);
  const clearMessages = useAIStore((s) => s.clearMessages);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessageStream = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (abortControllerRef.current) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const store = useAIStore.getState();
    store.addMessage({ role: 'user', content: text.trim() });
    const assistantMsgId = store.addMessage({ role: 'assistant', content: '' });
    store.setLoading(true);
    store.setError(null);

    let pendingChunk = '';
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushBuffer = () => {
      if (!pendingChunk) return;
      const chunk = pendingChunk;
      pendingChunk = '';
      useAIStore.setState((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
        ),
      }));
    };

    try {
      const currentConfig = useAIStore.getState().config;
      await aiService.initialize(currentConfig);
      // 本地模型懒初始化：首次发送时若未就绪，先初始化
      const { localModelReady, setLocalModelReady } = useAIStore.getState();
      if (!localModelReady && currentConfig.provider === 'local' && window.electronAPI?.localModelInit) {
        try {
          await window.electronAPI.localModelInit(currentConfig.localModelPath || '');
          setLocalModelReady(true);
        } catch (initErr) {
          console.warn('[useAI] local model init failed, will proceed anyway:', initErr);
        }
      }
      const currentMessages = useAIStore.getState().messages;

      const fullResponse = await aiService.sendMessageStream(text.trim(), currentMessages, (chunk) => {
        if (controller.signal.aborted) return;
        pendingChunk += chunk;
        if (!flushTimer) {
          flushTimer = setTimeout(() => {
            flushTimer = null;
            flushBuffer();
          }, STREAM_FLUSH_INTERVAL);
        }
      });

      // 兜底：如果 onChunk 从未被调用（如 StubProvider），用返回值填充
      if (fullResponse != null && fullResponse.length > 0) {
        flushBuffer();
        const msg = useAIStore.getState().messages.find(m => m.id === assistantMsgId);
        if (msg && msg.content.trim().length === 0) {
          useAIStore.setState((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullResponse } : m
            ),
          }));
        }
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg = err?.message || t('assistant.error');
      useAIStore.getState().setError(errorMsg);
      useAIStore.setState((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: `❌ ${errorMsg}` } : msg
        ),
      }));
    } finally {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushBuffer();
      // 检测空响应：如果助手消息仍为空，显示提示
      const finalMsg = useAIStore.getState().messages.find(m => m.id === assistantMsgId);
      if (finalMsg && finalMsg.content.trim().length === 0) {
        useAIStore.setState((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: '⚠️ AI 未能生成回复，请重试。' } : msg
          ),
        }));
      }
      // 保存对话摘要（尝试提取记忆候选）
      try {
        const msgs = useAIStore.getState().messages.map(m => ({ role: m.role, content: m.content || '' }));
        await saveConversationSummary(msgs);
      } catch (summaryErr) {
        console.warn('Failed to save conversation summary:', summaryErr);
      }
      abortControllerRef.current = null;
      useAIStore.getState().setLoading(false);
    }
  }, [t]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    // 本地模型使用流式输出
    return sendMessageStream(text);
  }, [sendMessageStream]);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const initService = useCallback(async () => {
    try {
      const currentConfig = useAIStore.getState().config;
      await aiService.initialize(currentConfig);
    } catch {
      // Service will be initialized on first send
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    sendMessageStream,
    cancelStream,
    clearMessages,
    initService,
  };
}
