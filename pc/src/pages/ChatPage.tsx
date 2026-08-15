<<<<<<< HEAD
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Wifi, WifiOff, MessageCircle, Activity, Hash, Plus, History, ChevronDown, Trash2, Lightbulb } from 'lucide-react';
import { useChatStore, type ChatMessageState } from '../stores/chatStore';
import { sendMessage, sendGreeting, getSilentDays, buildContext, listSessions, newConversation, deleteSession, switchSession } from '../services/ai/ChatService';
import { searchKnowledge } from '../services/knowledge/psychKnowledge';
import { useLanguage } from '../i18n/useLanguage';
import type { TranslationKey } from '../i18n/translations';
=======
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import { useChatStore, type ChatMessageState } from '../stores/chatStore';
import { sendMessage, sendGreeting, getSilentDays, buildContext } from '../services/ai/ChatService';
import { useLanguage } from '../i18n/useLanguage';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { shouldReduceMotion } from '../utils/reduceMotion';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import QuickReplySuggestions from '../components/chat/QuickReplySuggestions';
<<<<<<< HEAD
import ConfirmDialog from '../components/common/ConfirmDialog';

// 会话情绪 → i18n key
const EMOTION_KEY: Record<string, TranslationKey> = {
  negative: 'chat.emotion_negative',
  neutral: 'chat.emotion_neutral',
  positive: 'chat.emotion_positive',
  crisis: 'chat.emotion_crisis',
};

/** 按更新时间把会话分组：今天 / 昨天 / 更早 */
function groupSessions(
  sessions: Array<{ id: string; title: string; updatedAt: string }>,
  t: (k: TranslationKey) => string,
) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const groups: Array<{ label: string; items: typeof sessions }> = [
    { label: t('chat.today'), items: [] },
    { label: t('chat.yesterday'), items: [] },
    { label: t('chat.earlier'), items: [] },
  ];
  for (const s of sessions) {
    const ts = new Date(s.updatedAt).getTime();
    if (ts >= startOfToday) groups[0].items.push(s);
    else if (ts >= startOfYesterday) groups[1].items.push(s);
    else groups[2].items.push(s);
  }
  return groups.filter((g) => g.items.length > 0);
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  // P2-8：window.confirm → ConfirmDialog（删除会话）
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
=======

export default function ChatPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [input, setInput] = useState('');
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const providerStatus = useChatStore((s) => s.providerStatus);
  const hasGreetedToday = useChatStore((s) => s.hasGreetedToday);
<<<<<<< HEAD
  const session = useChatStore((s) => s.session);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingChecked = useRef(false);
  const historyRef = useRef<HTMLDivElement>(null);
=======
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingChecked = useRef(false);
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  // 自动滚底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

<<<<<<< HEAD
  // 加载历史会话列表
  useEffect(() => {
    listSessions();
  }, []);

  // 发送完成（isStreaming 结束）后恢复输入框焦点
  useEffect(() => {
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  // 点击外部关闭会话列表
  useEffect(() => {
    if (!showHistory) return;
    const onClick = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showHistory]);

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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
<<<<<<< HEAD
    // 兜底恢复焦点（部分浏览器在受控组件清空后失焦）
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [input, isStreaming]);

  const handleNew = useCallback(async () => {
    setShowHistory(false);
    await newConversation();
  }, []);

  const handleSwitch = useCallback(async (id: string) => {
    setShowHistory(false);
    await switchSession(id);
  }, []);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteSession(id);
  }, [pendingDeleteId]);

=======
  }, [input, isStreaming]);

>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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
<<<<<<< HEAD
  const groups = groupSessions(sessions, t);
  const currentTitle = sessions.find((s) => s.id === currentSessionId)?.title || t('chat.new_conversation');

  // 科普库联动：最近一条用户消息若命中知识话题，给出直达链接
  const knowledgeMatch = useMemo(() => {
    if (isStreaming) return null;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser || lastUser.content.length < 4) return null;
    const matches = searchKnowledge(lastUser.content, 1);
    return matches.length > 0 ? matches[0] : null;
  }, [messages, isStreaming]);
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

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
<<<<<<< HEAD
        <div className="flex items-center gap-2">
          {/* 新对话 */}
          <button
            onClick={handleNew}
            className="shrink-0 h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium text-text-primary transition-colors"
            style={{ background: 'var(--bg-hover)' }}
            aria-label={t('chat.new_conversation')}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {t('chat.new_conversation')}
          </button>
          {/* 历史会话下拉 */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="shrink-0 h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium text-text-primary transition-colors"
              style={{ background: 'var(--bg-hover)' }}
              aria-expanded={showHistory}
            >
              <History className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="max-w-[120px] truncate">{currentTitle}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {showHistory && (
              <div
                className="absolute right-0 mt-1.5 w-72 rounded-xl border shadow-lg z-50 overflow-hidden"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-panel)', backdropFilter: 'blur(12px)' }}
              >
                <div className="max-h-80 overflow-y-auto py-1">
                  {groups.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-text-muted">{t('chat.no_history')}</p>
                  ) : (
                    groups.map((g) => (
                      <div key={g.label}>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{g.label}</p>
                        {g.items.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSwitch(s.id)}
                            className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-xs transition-colors ${
                              s.id === currentSessionId ? 'text-primary' : 'text-text-primary hover:bg-[var(--bg-hover)]'
                            }`}
                            role="button"
                            tabIndex={0}
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0 opacity-60" aria-hidden="true" />
                            <span className="flex-1 truncate">{s.title || t('chat.no_title')}</span>
                            <button
                              onClick={(e) => handleDelete(s.id, e)}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5"
                              aria-label={t('task.delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 会话状态提示：当前轮数 + 主导情绪 + 话题（session 为渲染层权威） */}
      {session.turnCount > 0 && (
        <div
          className="px-4 py-2 border-b flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted"
          style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-hover)' }}
        >
          <span className="inline-flex items-center gap-1">
            <Activity className="w-3 h-3" aria-hidden="true" />
            {t('chat.session_turns', { count: session.turnCount })}
          </span>
          {session.dominantEmotion && (
            <span className="inline-flex items-center gap-1">
              {t('chat.emotion_label')}: {t(EMOTION_KEY[session.dominantEmotion] ?? 'chat.emotion_neutral')}
            </span>
          )}
          {session.topics.length > 0 && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Hash className="w-3 h-3 shrink-0" aria-hidden="true" />
              {session.topics.slice(0, 3).join('、')}
            </span>
          )}
        </div>
      )}
      {isOffline && (
        <div
          className="px-4 py-1.5 border-b text-[11px] text-text-muted flex items-center gap-1.5"
          style={{ borderColor: 'var(--glass-border)', background: 'rgba(245,158,11,0.06)' }}
        >
          <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />
          {t('chat.degraded_path')}
        </div>
      )}

=======
      </div>

>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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
<<<<<<< HEAD
        {knowledgeMatch && messages[messages.length - 1].role === 'assistant' && !isStreaming && (
          <div className="pl-9">
            <button
              type="button"
              onClick={() => navigate(`/knowledge?topic=${knowledgeMatch.id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary border hover:bg-primary/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
              {t('chat.knowledge_hint')}「{lang === 'zh-CN' ? knowledgeMatch.title.zh : knowledgeMatch.title.en}」↗
            </button>
          </div>
        )}
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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
<<<<<<< HEAD

      {/* P2-8：删除会话确认弹窗 */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title={t('common.delete_confirm_title')}
        message={t('chat.delete_confirm')}
      />
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    </div>
  );
}
