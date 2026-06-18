import { useRef, useEffect, useCallback } from 'react';
import { useState } from 'react';
import { Send, Loader2, Trash2, Settings } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { useCrisisStore } from '../../stores/crisisStore';
import ChatMessageComponent from './ChatMessage';
import EmptyState from './EmptyState';
import AISettingsModal from '../ai/AISettingsModal';
import { useLanguage } from '../../i18n/useLanguage';
import { useAI } from '../../hooks/useAI';

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
  const { sendMessage, messages, loading } = useAI();
  const clearMessages = useAIStore((s) => s.clearMessages);
  const [showAISettings, setShowAISettings] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = useCallback(() => {
    const el = inputRef.current;
    if (!el || !el.value.trim() || loading) return;
    const text = el.value;

    // Crisis detection: use SentimentService 3-layer analysis via IPC
    const isExcluded = CRISIS_EXCLUSIONS.some(pattern => text.includes(pattern));
    if (!isExcluded && window.electronAPI?.sentimentAnalyze) {
      window.electronAPI.sentimentAnalyze(text).then((result: any) => {
        if (result?.level === 'high') {
          showCrisis('high', 'chat', text);
        }
      }).catch(() => {
        // Fallback: basic keyword check if IPC fails
        const basicCrisis = ['想死', '不想活', '自杀', '活不下去', '结束生命'].some(w => text.includes(w));
        if (basicCrisis) showCrisis('high', 'chat', text);
      });
    }

    sendMessage(text);
    el.value = '';
    el.style.height = 'auto';
  }, [loading, sendMessage, showCrisis]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1 py-2 border-b shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        {variant === 'floating' ? (
          <button
            onClick={() => setShowAISettings(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            title="AI 设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        ) : (
          <>
            <span className="text-sm font-medium text-text-primary">
              {hasMessages ? t('assistant.title') : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAISettings(true)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                title="AI 设置"
              >
                <Settings className="w-4 h-4" />
              </button>
              {hasMessages && (
                <button
                  onClick={clearMessages}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('assistant.clear')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <AISettingsModal open={showAISettings} onClose={() => setShowAISettings(false)} />

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
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - pinned at bottom */}
      <div className="pt-3 border-t shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-[10px] text-text-muted mb-1.5 text-center">
          Enter 发送 · Shift+Enter 换行
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
            onClick={handleSubmit}
            disabled={loading}
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
