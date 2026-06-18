import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { analyzeEmotionTrend, type TrendResult } from '../../services/emotion/EmotionPredictionService';

export default function EmotionPrediction() {
  const [trend, setTrend] = useState<TrendResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await analyzeEmotionTrend(7);
      setTrend(result);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>正在分析趋势...</span>
      </div>
    );
  }

  if (!trend) {
    return (
      <p className="text-sm text-slate-400">
        需要至少 7 天数据才能分析趋势
      </p>
    );
  }

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', label: '改善趋势' },
    stable: { icon: Minus, color: 'text-slate-600', bg: 'bg-slate-50', label: '保持稳定' },
    declining: { icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50', label: '需关注' },
  };

  const config = trendConfig[trend.direction];
  const TrendIcon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
      <TrendIcon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      <span className="text-xs text-slate-400 ml-auto">
        近 7 天均值 {trend.recentAvg}/5
        {trend.changePercent !== 0 && (
          <span className={trend.changePercent > 0 ? 'text-green-500' : 'text-amber-500'}>
            {' '}({trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%)
          </span>
        )}
      </span>
    </div>
  );
}
