import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, CartesianGrid, Tooltip } from 'recharts';
import { db } from '../../db';
import { getDaysAgo } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';
import type { TranslationKey } from '../../i18n/translations';
import MethodNoteDialog from '../common/MethodNoteDialog';
import { computeForecastCalibration } from '../../services/selfevolution/SelfEvolutionService';

const METHOD_KEY: Record<string, TranslationKey> = {
  'logistic-regression': 'pred.method_logistic',
  'linear-regression': 'pred.method_linear',
  'heuristic-fallback': 'pred.method_heuristic',
};

const TREND_KEY: Record<string, TranslationKey> = {
  rising: 'pred.trend_rising',
  stable: 'pred.trend_stable',
  falling: 'pred.trend_falling',
};

/**
 * EmotionPrediction — 7 日情绪预测卡（P2-2）
 *
 * 数据源：主进程 RiskTrendPredictor（prediction:getTrend）。
 * 输入：近 30 天 dailySeries（情绪/行为/日记聚合）+ 个人基线（behaviorCalculateBaseline）。
 * 展示硬性要求（方法学诚实）：
 * - method 徽标（logistic-regression / linear-regression / heuristic-fallback）
 * - note 全文
 * - "统计预测 ≠ 医疗诊断" 免责 + 统计学习预测说明（pred.stat_note）
 * - docs/risk_methodology.md 方法说明引用
 * 禁止笼统"AI 预测"表述。
 */
export default function EmotionPrediction() {
  const { t } = useLanguage();
  const [result, setResult] = useState<RiskPredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const since = getDaysAgo(30);
        const [emotionRecords, behaviorRecords, diaries] = await Promise.all([
          db.emotionRecords.where('date').aboveOrEqual(since).toArray(),
          db.behaviorRecords.where('date').aboveOrEqual(since).toArray(),
          db.diaries.where('date').aboveOrEqual(since).toArray(),
        ]);

        if (emotionRecords.length === 0 && behaviorRecords.length === 0 && diaries.length === 0) {
          if (!cancelled) setResult(null);
          return;
        }

        // 按日期聚合 dailySeries
        const byDate = new Map<string, RiskDailyPoint>();
        const ensure = (date: string): RiskDailyPoint => {
          let p = byDate.get(date);
          if (!p) {
            p = { date };
            byDate.set(date, p);
          }
          return p;
        };

        for (const e of emotionRecords) {
          const p = ensure(e.date);
          p.sentimentScore = typeof e.sentimentScore === 'number' ? e.sentimentScore : p.sentimentScore ?? null;
        }
        for (const d of diaries) {
          const p = ensure(d.date);
          if (typeof d.mood === 'number') p.mood = d.mood;
        }
        for (const b of behaviorRecords) {
          const p = ensure(b.date);
          if (typeof b.moodRating === 'number' && p.mood == null) p.mood = b.moodRating;
          if (typeof b.tasksCompleted === 'number') p.tasksCompleted = b.tasksCompleted;
          if (typeof b.tasksTotal === 'number') p.tasksTotal = b.tasksTotal;
          if (typeof b.habitsChecked === 'number') p.habitsChecked = b.habitsChecked;
          if (typeof b.habitsTotal === 'number') p.habitsTotal = b.habitsTotal;
          if (typeof b.diaryWritten === 'boolean') p.diaryWritten = b.diaryWritten;
          if (Array.isArray(b.activeHours)) p.lateNight = b.activeHours.some((h: number) => h >= 0 && h < 5);
        }

        const dailySeries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

        let personalBaseline: RiskPredictionInput['personalBaseline'] = null;
        try {
          const bl = await window.electronAPI?.behaviorCalculateBaseline?.(behaviorRecords);
          if (bl && (bl.mood || bl.taskCompletion || bl.habitConsistency)) personalBaseline = bl;
        } catch {
          personalBaseline = null;
        }

        const forecastCalibration = await computeForecastCalibration();
        const res = await window.electronAPI?.predictionGetTrend({
          dailySeries,
          personalBaseline,
          forecastCalibration,
        });
        if (!res) throw new Error('predictionGetTrend unavailable');
        if (!cancelled) setResult(res);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? '预测失败');
          setResult(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.moodForecast7d.map((v, i) => ({ day: i + 1, mood: v }));
  }, [result]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Sparkles className="w-4 h-4 animate-pulse" aria-hidden="true" />
        <span>{t('pred.loading')}</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
        <span>{t('pred.no_data')}</span>
      </div>
    );
  }

  const trendIcon =
    result.riskTrend === 'rising' ? TrendingUp
    : result.riskTrend === 'falling' ? TrendingDown
    : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    result.riskTrend === 'rising' ? 'text-amber-600 dark:text-amber-400'
    : result.riskTrend === 'falling' ? 'text-green-600 dark:text-green-400'
    : 'text-slate-500 dark:text-slate-400';
  const methodLabel = t(METHOD_KEY[result.method] ?? 'pred.method_heuristic');

  return (
    <div className="glass-card glass-glow rounded-2xl p-5 border" style={{ borderColor: 'var(--glass-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
          {t('pred.title')}
        </h3>
        {/* method 徽标：如实标注方法，禁止笼统"AI 预测" */}
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
          title={methodLabel}
        >
          {methodLabel}
        </span>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[11px] text-text-muted mb-0.5">{t('pred.risk_upgrade')}</p>
          <p className="text-lg font-bold text-text-primary tabular-nums">
            {Math.round(result.riskUpgradeProb * 100)}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted mb-0.5">{t('pred.trend')}</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" aria-hidden="true" />
            {t(TREND_KEY[result.riskTrend] ?? 'pred.trend_stable')}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted mb-0.5">{t('pred.confidence')}</p>
          <p className="text-lg font-bold text-text-primary tabular-nums">
            {Math.round(result.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* 7 日情绪预测图（含坐标轴/网格线，修复"只有直线无坐标"问题） */}
      {chartData.length >= 2 && (
        <div className="h-36 mb-3">
          <p className="text-[11px] text-text-muted mb-1">{t('pred.forecast')} (7d) · {t('pred.y_axis')}</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 2, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--glass-border)' }} />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--glass-border)' }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'rgba(30,41,59,0.9)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                labelFormatter={(l) => `Day ${l}`}
                formatter={(v: number) => [String(v), 'mood']}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 免责 + 方法说明（摘要 + 弹窗全文，用户拍板方案） */}
      <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-[11px] text-text-muted leading-relaxed">
          ⚠️ {t('pred.stat_note')}
        </p>
        <p className="text-[11px] text-text-muted">{t('pred.disclaimer')}</p>
        <MethodNoteDialog kind="prediction" extraNote={result.note} />
      </div>
    </div>
  );
}
