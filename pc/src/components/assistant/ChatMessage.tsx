import { memo } from 'react';
import { User, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../services/ai/types';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const ChatMessageComponent = memo(function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showStreamingPlaceholder = isStreaming && !message.content;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-primary/10 text-primary'
            : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-md'
            : 'text-text-primary rounded-tl-md border'
        }`}
        style={isUser ? undefined : { background: 'var(--bg-card-solid)', borderColor: 'var(--glass-border)' }}
      >
        {showStreamingPlaceholder ? (
          <span className="text-text-muted animate-pulse">思考中<span className="inline-block animate-[ellipsis_1.4s_infinite]">...</span></span>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
});

export default ChatMessageComponent;
