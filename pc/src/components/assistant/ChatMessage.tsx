import { memo, useState, useEffect } from 'react';
import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../../services/ai/types';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const ChatMessageComponent = memo(function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const content = message.content || '';
  const showStreamingPlaceholder = isStreaming && !content;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex gap-3 transition-all duration-300 ease-out ${
        isUser ? 'flex-row-reverse' : ''
      } ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : isUser
            ? 'opacity-0 translate-x-4'
            : 'opacity-0 translate-y-2'
      }`}
    >
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
          <span className="text-text-muted animate-pulse">
            思考中
            <span className="inline-block animate-[ellipsis_1.4s_infinite]">...</span>
          </span>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">
            {content}
          </p>
        ) : (
          <div className="chat-markdown prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            {isStreaming && content && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-primary/60 animate-[blink_1s_infinite]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessageComponent;
