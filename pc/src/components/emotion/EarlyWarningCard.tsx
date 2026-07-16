import { useMemo, useState } from 'react';
import { Shield, AlertTriangle, RefreshCw, Activity, Clock, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';
import { useEarlyWarning } from '../../hooks/useEarlyWarning';
import { logFeedback } from '../../services/feedback/FeedbackService';
import type { EarlyWarningResult } from '../../services/emotion/EarlyWarningService';

const LEVEL_CONFIG: Record<EarlyWarningResult['level'], {
  bg: string; border: string; text: string; icon: typeof Shield; bar: string; pulse: boolean;
}> = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    icon: Shield,
    bar: 'bg-green-500',
    pulse: false,
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: Activity,
    bar: 'bg-yellow-500',
    pulse: false,
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-600 dark:text-orange-400',
    icon: AlertTriangle,
    bar: 'bg-orange-500',
    pulse: false,
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-600 dark:text-red-400',
    icon: AlertTriangle,
    bar: 'bg-red-500',
    pulse: true,
  },
};

/**
 * 早期风险预警卡片
 *
 * 展示基于近 15 天滑动窗口的多维度趋势预测：
 * - 四色预警等级条
 * - 距临界点天数倒计时
 * - 预警信号列表
 * - 异常分数（0-100）
 * - 趋势小图（最近窗口 moodTrend 折线）
 */
export default function EarlyWarningCard() {
  const { t } = useLanguage();
  const { result, loading, error, refresh } = useEarlyWarning();
  const [feedbackGiven, setFeedbackGiven] = useState<null | 'accurate' | 'inaccurate'>(null);

  const handleFeedback = (accurate: 'accurate' | 'inaccurate') => {
    setFeedbackGiven(accurate);
    logFeedback({
      type: 'early_warning',
      predicted: result ? `level=${result.level}, anomaly=${Math.round(result.anomalyScore)}, signals=${result.signals.length}` : '',
      accurate,
      refId: result ? String(result.generatedAt || Date.now()) : '',
    });
  };

  const trendChartData = useMemo(() => {
    if (!result?.trendSeries?.length) return [];
    return result.trendSeries.map((f, i) => ({
      idx: i + 1,
      moodTrend: Math.round(f.moodTrend * 1000) / 1000,
      dipDays: f.moodDipDays,
    }));
  }, [result]);

  if (loading && !result) {
    return (
      <div className={`glass-card glass-glow p-5 border animate-pulse ${LEVEL_CONFIG.green.border}`}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-400">{t('risk.refreshing')}...</span>
        </div>
        <div className="h-2 rounded bg-slate-200 dark:bg-slate-700 w-full mb-2" />
        <div className="h-2 rounded bg-slate-200 dark:bg-slate-700 w-2/3" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`glass-card glass-glow p-5 border ${LEVEL_CONFIG.orange.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${LEVEL_CONFIG.orange.text}`} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('risk.partial_data')}
            </span>
          </div>
          <button
            onClick={refresh}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={t('risk.refresh')}
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    );
  }

  const cfg = LEVEL_CONFIG[result.level];
  const LevelIcon = cfg.icon;

  return (
    <div className={`glass-card glass-glow p-5 border ${cfg.border} ${cfg.bg}`}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <LevelIcon className={`w-5 h-5 ${cfg.text} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('risk.early_warning')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('risk.early_warning_subtitle')}</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-white/40 dark:hover:bg-slate-700/40 transition-colors disabled:opacity-50"
          aria-label={t('risk.refresh')}
          title={t('risk.refresh')}
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 四色等级条 */}
      <div className="flex gap-1.5 mb-4">
        {(['green', 'yellow', 'orange', 'red'] as const).map(l => {
          const active = ['green', 'yellow', 'orange', 'red'].indexOf(result.level) >=
            ['green', 'yellow', 'orange', 'red'].indexOf(l);
          return (
            <div
              key={l}
              className={`h-2 flex-1 rounded-full transition-all ${
                active ? LEVEL_CONFIG[l].bar : 'bg-slate-200 dark:bg-slate-700'
              } ${active && l === 'red' ? 'animate-pulse' : ''}`}
            />
          );
        })}
      </div>

      {/* 当前等级 + 异常分 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-bold ${cfg.text}`}>
            {t(`risk.warning_${result.level}`)}
          </span>
          {result.hasWarning && result.daysToCritical != null && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              {t('risk.days_to_critical')}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {result.daysToCritical} {t('risk.days_suffix')}
              </span>
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">{t('risk.anomaly_score')}</span>
          <span className="ml-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {Math.round(result.anomalyScore)}/100
          </span>
        </div>
      </div>

      {/* 信号列表 或 状态良好 */}
      {result.hasWarning && result.signals.length > 0 ? (
        <ul className="space-y-1.5 mb-3">
          {result.signals.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <ChevronRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.text}`} />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {t('risk.no_warning_desc')}
        </p>
      )}

      {/* 趋势小图 */}
      {trendChartData.length >= 2 && (
        <div className="h-12 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip
                contentStyle={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'rgba(30,41,59,0.9)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                labelFormatter={l => `Window ${l}`}
                formatter={(v: number) => [String(v), 'moodTrend']}
              />
              <Line
                type="monotone"
                dataKey="moodTrend"
                stroke="currentColor"
                className={cfg.text}
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 反馈接线：预测准不准，用于在线评估准确率 */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-xs text-slate-400">这个预测准确吗？</span>
        <button
          type="button"
          onClick={() => handleFeedback('accurate')}
          disabled={feedbackGiven !== null}
          className={`p-1 rounded transition-colors disabled:opacity-50 ${
            feedbackGiven === 'accurate' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 hover:text-green-500 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-label="准确"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleFeedback('inaccurate')}
          disabled={feedbackGiven !== null}
          className={`p-1 rounded transition-colors disabled:opacity-50 ${
            feedbackGiven === 'inaccurate' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-label="不准确"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
        {feedbackGiven && (
          <span className="text-xs text-slate-400">已记录，谢谢反馈</span>
        )}
      </div>
    </div>
  );
}
