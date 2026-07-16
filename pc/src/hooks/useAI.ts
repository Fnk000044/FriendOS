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

    // 若正在流式，先 abort 上一次再开始新的，避免连点无反馈（原逻辑静默丢弃）
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

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

    const onChunkCallback = (chunk: string) => {
      if (controller.signal.aborted) return;
      pendingChunk += chunk;
      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          flushTimer = null;
          flushBuffer();
        }, STREAM_FLUSH_INTERVAL);
      }
    };

    try {
      const currentConfig = useAIStore.getState().config;
      await aiService.initialize(currentConfig);

      // 本地模型懒初始化已由 AIService.initialize 内部处理，
      // 此处仅验证状态，不重复调用 init（避免双重初始化）
      if (currentConfig.provider === 'local' && window.electronAPI?.localModelInit) {
        const modelList = await window.electronAPI.localModelList().catch(() => []);
        const anyAvailable = modelList.some((m: any) => m.available);
        if (!anyAvailable) {
          store.setError('本地模型未就绪，请检查 Qwen3.5 模型文件是否已安装');
          store.setLoading(false);
          return;
        }
      }
      const currentMessages = useAIStore.getState().messages;

      // 首 token 超时计时：超过 3s 仍无任何输出则视为模型异常，标记需重试
      let hasFirstToken = false;
      const firstTokenTimer = setTimeout(() => {
        if (!hasFirstToken) {
          console.warn('[useAI] No first token after 3s, will retry on completion if empty');
        }
      }, 3000);
      const wrappedOnChunk = (chunk: string) => {
        hasFirstToken = true;
        onChunkCallback(chunk);
      };

      let fullResponse: string = '';
      fullResponse = await aiService.sendMessageStream(text.trim(), currentMessages, wrappedOnChunk);
      clearTimeout(firstTokenTimer);

      // 兜底：如果 onChunk 从未被调用（如 StubProvider），用返回值填充
      if (fullResponse.length > 0) {
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

      // 首次空响应自动重试一次：dispose + 重新 initialize + 重新发送
      const afterFirst = useAIStore.getState().messages.find(m => m.id === assistantMsgId);
      if (afterFirst && afterFirst.content.trim().length === 0) {
        console.warn('[useAI] First attempt produced empty response, retrying...');
        try {
          if (window.electronAPI?.localModelDispose) {
            await window.electronAPI.localModelDispose();
          }
        } catch { /* ignore */ }

        // 重新初始化并重试
        await aiService.initialize(currentConfig);
        hasFirstToken = false;
        fullResponse = await aiService.sendMessageStream(text.trim(), currentMessages, wrappedOnChunk);

        if (fullResponse.length > 0) {
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
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') return;
      let errorMsg = err?.message || t('assistant.error');
      const currentConfig = useAIStore.getState().config;
      // 友好化本地模型初始化失败的错误提示
      if (errorMsg.includes('Failed to initialize local model') || errorMsg.includes('模型文件不存在')) {
        errorMsg = '本地模型未就绪，请检查 Qwen3.5 模型文件是否已安装';
      }
      // 超时错误的友好提示
      if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        errorMsg = '模型响应超时，请重试或检查模型状态';
      }
      // 空响应错误的友好提示
      if (errorMsg.includes('空响应') || errorMsg.includes('未生成任何内容')) {
        errorMsg = '模型未能生成内容，请在AI设置中点击"重新初始化"';
      }
      // Eval 失败错误：后端已自动 dispose，提示用户重试即可
      if (errorMsg.includes('Eval has failed') || errorMsg.includes('KV slot') || errorMsg.includes('模型推理失败')) {
        errorMsg = '模型推理遇到异常，已自动重置，请重试';
      }
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
            msg.id === assistantMsgId ? { ...msg, content: '⚠️ AI 未能生成回复，请重试。如持续出现此问题，请在AI设置中点击"重新初始化"。' } : msg
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
