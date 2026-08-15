import { memo } from 'react';
import { Sparkles, User } from 'lucide-react';
import type { ChatMessageState } from '../../stores/chatStore';
import { shouldReduceMotion } from '../../utils/reduceMotion';
<<<<<<< HEAD
import { useLanguage } from '../../i18n/useLanguage';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

interface Props {
  message: ChatMessageState;
  reduceMotion?: boolean;
}

function MessageBubbleBase({ message, reduceMotion }: Props) {
<<<<<<< HEAD
  const { t } = useLanguage();
  const isUser = message.role === 'user';
  const reduce = reduceMotion ?? shouldReduceMotion();
  const isCrisis = !!message.crisisFlag;
=======
  const isUser = message.role === 'user';
  const reduce = reduceMotion ?? shouldReduceMotion();
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  const emotionColor: Record<string, string> = {
    crisis: '#ef4444',
    negative: '#f59e0b',
    neutral: '#94a3b8',
    positive: '#10b981',
  };

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${reduce ? '' : 'transition-transform'}`}
        style={{
          background: isUser ? 'var(--bg-hover)' : 'var(--gradient-primary)',
        }}
      >
        {isUser ? (
          <User className="w-4 h-4 text-text-secondary" aria-hidden="true" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser ? 'text-white' : 'text-text-primary'
          } ${message.streaming && !reduce ? 'animate-pulse-subtle' : ''}`}
          style={{
<<<<<<< HEAD
            background: isUser
              ? 'var(--gradient-primary)'
              : isCrisis
                ? 'rgba(239,68,68,0.12)'
                : 'var(--bg-hover)',
            border: isCrisis ? '1px solid rgba(239,68,68,0.35)' : undefined,
=======
            background: isUser ? 'var(--gradient-primary)' : 'var(--bg-hover)',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
            borderTopRightRadius: isUser ? '6px' : undefined,
            borderTopLeftRadius: !isUser ? '6px' : undefined,
          }}
        >
          {message.content || (message.streaming ? '…' : '')}
          {message.streaming && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current align-middle animate-pulse" aria-hidden="true" />}
        </div>

<<<<<<< HEAD
        {/* Meta row: emotion dot + source badge */}
=======
        {/* Meta row: emotion dot + method tag */}
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
        <div className={`flex items-center gap-1.5 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          {message.emotionLabel && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: emotionColor[message.emotionLabel] || emotionColor.neutral }}
              title={message.emotionLabel}
              aria-label={`emotion: ${message.emotionLabel}`}
            />
          )}
<<<<<<< HEAD
          {!isUser && message.method === 'fallback' && (
            <span
              className="text-[9px] px-1 py-0.5 rounded font-medium"
              style={{
                color: isCrisis ? '#ef4444' : 'var(--text-muted)',
                background: isCrisis ? 'rgba(239,68,68,0.12)' : 'transparent',
              }}
            >
              {isCrisis ? '⚠ ' : ''}{t('chat.source_local')}
            </span>
          )}
          {!isUser && message.method === 'cloud' && (
            <span className="text-[9px] px-1 py-0.5 rounded font-medium text-text-muted">
              {t('chat.source_cloud')}
            </span>
          )}
          {!isUser && message.method === 'greeting' && (
=======
          {message.method === 'fallback' && !isUser && (
            <span className="text-[9px] text-text-muted">{message.crisisFlag ? '⚠' : '离线'}</span>
          )}
          {message.method === 'greeting' && !isUser && (
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
            <span className="text-[9px] text-text-muted">问候</span>
          )}
        </div>
      </div>
    </div>
  );
}

const MessageBubble = memo(MessageBubbleBase);
export default MessageBubble;
