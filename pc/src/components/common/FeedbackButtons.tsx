import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { saveFeedback } from '../../services/FeedbackService';

interface FeedbackButtonsProps {
  type: 'sentiment' | 'ai_response' | 'recommendation';
  text: string;
  predicted: string;
  targetId?: string;
  compact?: boolean;
}

export default function FeedbackButtons({
  type,
  text,
  predicted,
  targetId,
  compact = false,
}: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (feedback: 'accurate' | 'inaccurate') => {
    await saveFeedback(type, text, predicted, feedback, targetId);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <span className="text-xs text-emerald-600 flex items-center gap-1">
        <ThumbsUp className="w-3 h-3" />
        感谢反馈
      </span>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback('accurate')}
          className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
          title="准确"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleFeedback('inaccurate')}
          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          title="不准确"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-text-muted">分析准确吗？</span>
      <button
        onClick={() => handleFeedback('accurate')}
        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
      >
        <ThumbsUp className="w-3 h-3" />
        准确
      </button>
      <button
        onClick={() => handleFeedback('inaccurate')}
        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
      >
        <ThumbsDown className="w-3 h-3" />
        不准
      </button>
    </div>
  );
}
