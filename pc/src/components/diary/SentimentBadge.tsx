import { AlertTriangle, Smile, Meh, Frown, Lightbulb, Heart, X, Siren } from 'lucide-react';
<<<<<<< HEAD
import SentimentCorrection from '../common/SentimentCorrection';
=======
import FeedbackButtons from '../common/FeedbackButtons';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

interface SentimentResult {
  level: 'low' | 'medium' | 'high' | 'crisis';
  score: number;
  positiveProb: number;
  negativeProb: number;
  crisisProb?: number;
<<<<<<< HEAD
  neutralProb?: number;
  predictedClass?: 'negative' | 'neutral' | 'positive' | 'crisis';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  keywords: string[];
  needCloud: boolean;
  timestamp: number;
  error?: string;
}

interface SentimentBadgeProps {
  result: SentimentResult;
  onShowDetail?: () => void;
  diaryContent?: string;
<<<<<<< HEAD
  refId?: string;
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}

interface SentimentDisplay {
  label: string;
  color: string;
  Icon: typeof AlertTriangle;
  pulse?: boolean;
}

/**
 * 根据 negativeProb 判断情感状态（而不是危机等级）
 * negativeProb: 0=正面, 1=负面
 * crisis（ONNX 4 分类明确判定危机）：最高优先级，循环警报（pulse 动画）
 */
function getSentimentDisplay(negativeProb: number, crisisLevel: string): SentimentDisplay {
  // 危机等级最高优先级：crisis 为 ONNX 明确判定的危机（循环警报级别）
  if (crisisLevel === 'crisis') {
    return {
      label: '危机',
      color: 'text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/50 dark:border-red-700 animate-pulse',
      Icon: Siren,
      pulse: true,
    };
  }
  // high：单次警报级别（关键词+ONNX 双重确认）
  if (crisisLevel === 'high') {
    return {
      label: '高风险',
      color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800',
      Icon: AlertTriangle,
    };
  }
  if (crisisLevel === 'medium') {
    return {
      label: '需关注',
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800',
      Icon: AlertTriangle,
    };
  }

  // 根据情感正负显示
  if (negativeProb < 0.3) {
    return {
      label: '积极',
      color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800',
      Icon: Smile,
    };
  }
  if (negativeProb < 0.5) {
    return {
      label: '平静',
      color: 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
      Icon: Meh,
    };
  }
  if (negativeProb < 0.7) {
    return {
      label: '低落',
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800',
      Icon: Frown,
    };
  }
  return {
    label: '伤心',
    color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800',
    Icon: Frown,
  };
}

<<<<<<< HEAD
export default function SentimentBadge({ result, onShowDetail, refId }: SentimentBadgeProps) {
  const display = getSentimentDisplay(result.negativeProb, result.level);
  const { Icon } = display;
  const isCrisis = result.level === 'crisis' || result.level === 'high';
=======
export default function SentimentBadge({ result, onShowDetail, diaryContent }: SentimentBadgeProps) {
  const display = getSentimentDisplay(result.negativeProb, result.level);
  const { Icon } = display;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  return (
    <div className="flex items-center gap-2">
      <div
        onClick={onShowDetail}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${display.color}`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{display.label}</span>
        {result.keywords.length > 0 && (
          <span className="opacity-60 text-[10px]">
            {result.keywords.slice(0, 2).join(',')}
          </span>
        )}
      </div>
<<<<<<< HEAD
      <SentimentCorrection
        predictedClass={result.predictedClass}
        crisis={isCrisis}
        refId={refId}
      />
=======
      {diaryContent && (
        <FeedbackButtons
          type="sentiment"
          text={diaryContent.slice(0, 200)}
          predicted={display.label}
          compact
        />
      )}
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    </div>
  );
}

interface CloudAnalysisBannerProps {
  suggestions: string[];
  crisisLevel: 'low' | 'medium' | 'high';
  onDismiss?: () => void;
}

export function CloudAnalysisBanner({ suggestions, crisisLevel, onDismiss }: CloudAnalysisBannerProps) {
  if (crisisLevel === 'low' || suggestions.length === 0) return null;

  const bannerConfig = {
    medium: {
      bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      Icon: Lightbulb as typeof Lightbulb,
      title: '小贴士',
    },
    high: {
      bg: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      Icon: Heart as typeof Heart,
      title: '希望你现在感觉好一些',
    },
  };

  const config = bannerConfig[crisisLevel];
  const { Icon } = config;

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${config.bg} ${config.text}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {config.title}
          </p>
          <ul className="text-xs space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="list-disc list-inside">{s}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="关闭"
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
