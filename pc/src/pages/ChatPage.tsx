import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import { useChatStore, type ChatMessageState } from '../stores/chatStore';
import { sendMessage, sendGreeting, getSilentDays, buildContext } from '../services/ai/ChatService';
import { useLanguage } from '../i18n/useLanguage';
import { shouldReduceMotion } from '../utils/reduceMotion';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import QuickReplySuggestions from '../components/chat/QuickReplySuggestions';

export default function ChatPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const providerStatus = useChatStore((s) => s.providerStatus);
  const hasGreetedToday = useChatStore((s) => s.hasGreetedToday);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingChecked = useRef(false);

  // 自动滚底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 主动问候：首次打开 / 沉默后回归
  useEffect(() => {
    if (greetingChecked.current) return;
    greetingChecked.current = true;
    (async () => {
      const silentDays = await getSilentDays();
      // 距上次对话 > 12 小时才问候
      if (silentDays >= 1) {
        let riskRising = false;
        try {
          const ctx = await buildContext();
          riskRising = ctx.riskLevel === 'high' || ctx.riskLevel === 'critical';
        } catch { /* ignore */ }
        await sendGreeting(silentDays, riskRising);
      }
    })();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await sendMessage(text);
  }, [input, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // 自动高度
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const isOffline = providerStatus === 'fallback' || providerStatus === 'error';
  const reduce = shouldReduceMotion();

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - var(--header-height) - 32px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">{t('nav.assistant')}</h1>
            <p className="text-xs text-text-muted flex items-center gap-1">
              {isOffline ? (
                <>
                  <WifiOff className="w-3 h-3" aria-hidden="true" />
                  {t('chat.offline_mode')}
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3" aria-hidden="true" />
                  {t('chat.cloud_mode')}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
            <MessageCircle className="w-12 h-12 mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm">{t('chat.welcome')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} reduceMotion={reduce} />
        ))}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
          <TypingIndicator reduceMotion={reduce} />
        )}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isStreaming && (
          <QuickReplySuggestions onNavigate={(path) => navigate(path)} />
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.input_placeholder')}
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl px-3 py-2 text-sm bg-[var(--bg-input)] border outline-none focus:border-primary transition-colors"
            style={{
              borderColor: 'var(--glass-border)',
              maxHeight: '120px',
            }}
            aria-label={t('chat.input_placeholder')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--gradient-primary)' }}
            aria-label={t('assistant.send')}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5 text-center">
          {t('chat.disclaimer')}
        </p>
      </div>
    </div>
  );
}
