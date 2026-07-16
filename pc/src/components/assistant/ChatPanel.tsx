import { useRef, useEffect, useCallback } from 'react';
import { useState } from 'react';
import { Send, Loader2, Trash2, Plus, History, RefreshCw } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { useCrisisStore } from '../../stores/crisisStore';
import ChatMessageComponent from './ChatMessage';
import EmptyState from './EmptyState';
import { useLanguage } from '../../i18n/useLanguage';
import { useAI } from '../../hooks/useAI';
import { db } from '../../db';

// 排除模式（不触发危机的常见表达）
const CRISIS_EXCLUSIONS = [
  '九死一生', '生不如死', '死心塌地', '死而后已',
  '笑死', '困死了', '无聊到想死', '热死了', '累死了',
  '饿死了', '烦死了', '笑死我了', '可爱死了',
];

interface ChatPanelProps {
  variant?: 'floating' | 'fullpage';
}

export default function ChatPanel({ variant = 'fullpage' }: ChatPanelProps) {
  const { t } = useLanguage();
  const { sendMessage, messages, loading, error } = useAI();
  const clearMessages = useAIStore((s) => s.clearMessages);
  const startNewConversation = useAIStore((s) => s.startNewConversation);
  const loadConversation = useAIStore((s) => s.loadConversation);
  const activeConversationId = useAIStore((s) => s.activeConversationId);
  const setError = useAIStore((s) => s.setError);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);

  // 最后一条用户消息，用于错误时重试
  const lastUserMessageRef = useRef<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 仅在用户发送消息后 focus 输入框（用 ref 标记避免流式时重复 focus）
  const prevMessagesLenRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current && !loading) {
      inputRef.current?.focus();
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages.length, loading]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, []);

  const showCrisis = useCrisisStore((s) => s.show);

  const handleSubmit = useCallback(async () => {
    const el = inputRef.current;
    if (!el || !el.value.trim() || loading) return;
    const text = el.value;

    // 记录最后一条用户消息，用于错误时重试
    lastUserMessageRef.current = text;

    // 清空输入框并立即发送，避免等待危机检测造成回车延迟
    sendMessage(text);
    el.value = '';
    el.style.height = 'auto';

    // 危机检测异步执行：不阻塞对话，若返回 high 再弹危机窗（可在 AI 回复中/后出现）
    const isExcluded = CRISIS_EXCLUSIONS.some(pattern => text.includes(pattern));
    if (!isExcluded && window.electronAPI?.sentimentAnalyze) {
      try {
        const result = await Promise.race([
          window.electronAPI.sentimentAnalyze(text),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
        if (result?.level === 'high') {
          showCrisis('high', 'chat', text);
        }
      } catch {
        // Fallback: basic keyword check if IPC fails
        const basicCrisis = ['想死', '不想活', '自杀', '活不下去', '结束生命'].some(w => text.includes(w));
        if (basicCrisis) showCrisis('high', 'chat', text);
      }
    }
  }, [loading, sendMessage, showCrisis]);

  // 重试上一次发送
  const handleRetry = useCallback(() => {
    const lastText = lastUserMessageRef.current;
    if (!lastText || loading) return;
    setError(null);
    sendMessage(lastText);
  }, [loading, sendMessage, setError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleQuickStart = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const hasMessages = messages.length > 0;

  // 加载历史会话列表
  const refreshHistory = useCallback(async () => {
    try {
      const list = await db.conversations
        .orderBy('updatedAt')
        .reverse()
        .limit(20)
        .toArray();
      setHistoryList(list.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })));
    } catch {
      // DB 尚未升级时表不存在，忽略
    }
  }, []);

  const historyDrawerRef = useRef<HTMLDivElement>(null);
  // 抽屉打开前聚焦的元素，关闭后恢复焦点（参考 CrisisInterventionModal）
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 统一关闭路径：恢复焦点到触发元素
  const closeHistory = useCallback(() => {
    setShowHistory(false);
    setTimeout(() => previouslyFocusedRef.current?.focus(), 0);
  }, []);

  const handleToggleHistory = useCallback(() => {
    if (!showHistory) refreshHistory();
    setShowHistory(v => !v);
  }, [showHistory, refreshHistory]);

  const handleLoadHistory = useCallback(async (id: string) => {
    await loadConversation(id);
    closeHistory();
  }, [loadConversation, closeHistory]);

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    closeHistory();
  }, [startNewConversation, closeHistory]);

  // 历史抽屉：Escape 关闭 + Tab 焦点循环 + 点击外部关闭 + 初始聚焦
  useEffect(() => {
    if (!showHistory) return;

    // 打开时保存触发元素焦点并聚焦抽屉
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    setTimeout(() => historyDrawerRef.current?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeHistory();
        return;
      }
      // Tab 循环：在抽屉内可聚焦元素间循环
      if (e.key === 'Tab' && historyDrawerRef.current) {
        const focusable = historyDrawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (historyDrawerRef.current && !historyDrawerRef.current.contains(e.target as Node)) {
        const toggleBtn = e.target as HTMLElement;
        // 避免点击切换按钮自身时立即关闭
        if (!toggleBtn.closest('[data-history-toggle]')) {
          closeHistory();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory, closeHistory]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1 py-2 border-b shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-sm font-medium text-text-primary">
          {hasMessages ? t('assistant.title') : ''}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewConversation}
            aria-label={t('assistant.clear')}
            title={t('assistant.clear')}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-history-toggle
            onClick={handleToggleHistory}
            aria-label={t('chat.history')}
            aria-expanded={showHistory}
            title={t('chat.history')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showHistory ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <History className="w-4 h-4" />
          </button>
          {hasMessages && (
            <button
              type="button"
              onClick={clearMessages}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('assistant.clear')}
            </button>
          )}
        </div>
      </div>


      {/* 历史会话抽屉 */}
      {showHistory && (
        <div
          ref={historyDrawerRef}
          role="dialog"
          aria-modal="false"
          aria-label={t('chat.history')}
          tabIndex={-1}
          className="absolute top-11 right-0 z-30 w-72 max-h-80 overflow-y-auto glass-card rounded-lg shadow-xl border focus:outline-none"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {historyList.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">{t('chat.no_history')}</p>
          ) : historyList.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleLoadHistory(c.id)}
              className={`w-full text-left px-3 py-2.5 border-b transition-colors cursor-pointer hover:bg-surface-hover ${
                c.id === activeConversationId ? 'bg-primary/5' : ''
              }`}
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <p className="text-sm text-text-primary truncate">{c.title || t('chat.no_title')}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{c.updatedAt?.slice(0, 16).replace('T', ' ')}</p>
            </button>
          ))}
        </div>
      )}

      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 py-4 px-1 space-y-4">
        {!hasMessages ? (
          <EmptyState onStart={handleQuickStart} />
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessageComponent
                key={msg.id}
                message={msg}
                isStreaming={loading && index === messages.length - 1 && msg.role === 'assistant' && !msg.content}
              />
            ))}
          </>
        )}
        {/* 错误重试条 */}
        {error && !loading && (
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
            <span className="text-xs text-text-muted">{t('assistant.error')}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              {t('error.retry')}
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - pinned at bottom */}
      <div className="pt-3 border-t shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-[10px] text-text-muted mb-1.5 text-center">
          {t('chat.input_hint')}
        </p>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3 border focus-within:border-primary/30 transition-all" style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--glass-border)' }}>
          <textarea
            ref={inputRef}
            onInput={adjustHeight}
            onKeyDown={handleKeyDown}
            placeholder={t('assistant.placeholder')}
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none outline-none max-h-[200px] min-h-[32px]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            aria-label={t('assistant.send')}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            ) : (
              <Send className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
