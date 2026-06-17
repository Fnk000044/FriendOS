import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { predictEmotionTrend, detectTrendDirection, type PredictionPoint } from '../../services/emotion/EmotionPredictionService';

interface EmotionPredictionProps {
  recentAvgMood: number;
}

export default function EmotionPrediction({ recentAvgMood }: EmotionPredictionProps) {
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await predictEmotionTrend(7);
      setPredictions(result);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>正在预测...</span>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        需要至少 7 天数据才能预测趋势
      </p>
    );
  }

  const trend = detectTrendDirection(predictions, recentAvgMood);
  const predAvg = predictions.reduce((s, p) => s + p.predicted, 0) / predictions.length;

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', label: '改善趋势' },
    stable: { icon: Minus, color: 'text-slate-600', bg: 'bg-slate-50', label: '保持稳定' },
    declining: { icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50', label: '需关注' },
  };

  const config = trendConfig[trend];
  const TrendIcon = config.icon;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
        <TrendIcon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-slate-400 ml-auto">
          预测均值 {predAvg.toFixed(1)}/5
        </span>
      </div>

      {/* 预测条形图 */}
      <div className="flex items-end gap-1 h-20">
        {predictions.map((p, i) => {
          const height = ((p.predicted - 1) / 4) * 100;
          const dateStr = p.date.slice(5); // MM-DD
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400">{p.predicted}</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-indigo-400 to-indigo-300 transition-all"
                style={{ height: `${height}%`, opacity: 0.4 + p.confidence * 0.6 }}
              />
              <span className="text-[9px] text-slate-400">{dateStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
