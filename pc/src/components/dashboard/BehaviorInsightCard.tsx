import { useEffect, useState } from 'react';
import { Lightbulb, AlertTriangle, TrendingDown, Moon, Heart } from 'lucide-react';
import { useDailyCheck } from '../../hooks/useDailyCheck';
import type { BehaviorInsight } from '../../services/emotion/DailyCheckScheduler';

const ICON_MAP: Record<BehaviorInsight['type'], typeof Lightbulb> = {
  diary_skip: TrendingDown,
  late_night: Moon,
  task_decline: AlertTriangle,
  mood_below_baseline: Heart,
  habit_break: AlertTriangle,
  positive: Lightbulb,
};

const SEVERITY_COLOR: Record<BehaviorInsight['severity'], string> = {
  info: 'var(--color-primary)',
  warn: '#f59e0b',
  danger: '#ef4444',
};

/**
 * Dashboard 行为洞察卡片
 * 自然语言洞察，无异常时给正面反馈
 */
export default function BehaviorInsightCard() {
  const { result, loading } = useDailyCheck();
  const [insights, setInsights] = useState<BehaviorInsight[]>([]);

  useEffect(() => {
    if (result?.insights) {
      setInsights(result.insights);
    }
  }, [result]);

  if (loading && insights.length === 0) {
    return (
      <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
        <div className="h-4 w-24 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>
    );
  }

  if (insights.length === 0) return null;

  const hasWarn = insights.some(i => i.severity === 'warn' || i.severity === 'danger');

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        borderColor: hasWarn ? 'rgba(245,158,11,0.3)' : 'var(--glass-border)',
        background: 'var(--bg-card)',
      }}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" style={{ color: hasWarn ? '#f59e0b' : 'var(--color-primary)' }} aria-hidden="true" />
        行为洞察
      </h3>
      <ul className="space-y-2">
        {insights.map((insight, i) => {
          const Icon = ICON_MAP[insight.type] || Lightbulb;
          return (
            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <Icon
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: SEVERITY_COLOR[insight.severity] }}
                aria-hidden="true"
              />
              <span>{insight.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
