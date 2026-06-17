interface SentimentResult {
  level: 'low' | 'medium' | 'high';
  score: number;
  positiveProb: number;
  negativeProb: number;
  keywords: string[];
  needCloud: boolean;
  timestamp: number;
  error?: string;
}

interface SentimentBadgeProps {
  result: SentimentResult;
  onShowDetail?: () => void;
}

const levelConfig: Record<'low' | 'medium' | 'high', { label: string; color: string; icon: string }> = {
  low: {
    label: '正常',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: '✓',
  },
  medium: {
    label: '关注',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: '!',
  },
  high: {
    label: '高风险',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: '⚠',
  },
};

export default function SentimentBadge({ result, onShowDetail }: SentimentBadgeProps) {
  const config = levelConfig[result.level];
  const scorePercent = Math.round((result.score + 1) / 2 * 100);

  return (
    <div
      onClick={onShowDetail}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${config.color}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      <span className="opacity-60">
        {result.level === 'high' ? '需关注' : result.level === 'medium' ? `${scorePercent}%` : '积极'}
      </span>
      {result.keywords.length > 0 && (
        <span className="opacity-60 text-[10px]">
          {result.keywords.slice(0, 2).join(',')}
        </span>
      )}
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
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: '💡',
    },
    high: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '💙',
    },
  };

  const config = bannerConfig[crisisLevel];

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${config.bg} ${config.text}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {crisisLevel === 'high' ? '希望你现在感觉好一些' : '小贴士'}
          </p>
          <ul className="text-xs space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="list-disc list-inside">{s}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}