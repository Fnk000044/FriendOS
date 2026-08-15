import { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Shield, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { db } from '../db';
import { getDaysAgo } from '../utils/date';
import { useLanguage } from '../i18n/useLanguage';
import {
  calculateConsecutiveNoDiary,
  calculateConsecutiveLowMood,
  calculateTaskCompletionDrop,
  calculateHabitBreakDays,
  calculateLateNightRatio,
  calculateTrendData,
} from '../utils/riskCalculations';
import EmptyState from '../components/common/EmptyState';
import RiskRadar from '../components/emotion/RiskRadar';
import EarlyWarningCard from '../components/emotion/EarlyWarningCard';
import RiskScoreCard from '../components/risk/RiskScoreCard';
import RiskTrendChart from '../components/risk/RiskTrendChart';
import RiskTimelineChart from '../components/risk/RiskTimelineChart';
import RiskSignalSources from '../components/risk/RiskSignalSources';
import type { RiskLevel } from '../db/models';
import type { HasDataMap } from '../utils/evidenceChain';
import { computeRiskPersonalization } from '../services/selfevolution/SelfEvolutionService';

interface RiskBreakdown {
  emotion: { score: number; weight: number };
  behavior: { score: number; weight: number };
  assessment: { score: number; weight: number };
  chat: { score: number; weight: number };
  diary: { score: number; weight: number };
}

interface RiskFactor {
  type: string;
  weight: number;
  description: string;
}

interface RiskResult {
  totalScore: number;
  riskLevel: RiskLevel;
  riskLevelInfo: { min: number; max: number; label: string; color: string };
  breakdown: RiskBreakdown;
  factors: RiskFactor[];
  diagnostics?: {
    exclusionsHit: unknown[];
    escalation: { escalated: boolean; reasons: string[]; crisisFactorCount: number };
  };
  summary: string;
  timestamp: number;
}

export default function RiskDashboardPage() {
  const { t } = useLanguage();
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30>(7);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; score: number; color?: string }[]>([]);
  // 重试计数器：递增以触发 risk 计算 effect 重新执行
  const [retryCount, setRetryCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const THIRTY_DAYS_AGO = getDaysAgo(30);
  // 获取情绪记录
  const emotionRecords = useLiveQuery(async () => {
    return db.emotionRecords
      .where('date')
      .aboveOrEqual(THIRTY_DAYS_AGO)
      .reverse()
      .sortBy('date');
  }, []);

  // 获取行为记录
  const behaviorRecords = useLiveQuery(async () => {
    return db.behaviorRecords
      .where('date')
      .aboveOrEqual(THIRTY_DAYS_AGO)
      .sortBy('date');
  }, []);

  // 获取评估结果
  const assessments = useLiveQuery(async () => {
    return db.assessments.toArray();
  }, []);

  // 获取聊天摘要
  const conversationSummaries = useLiveQuery(async () => {
    return db.conversationSummaries
      .where('date')
      .aboveOrEqual(THIRTY_DAYS_AGO)
      .reverse()
      .sortBy('date');
  }, []);

  // 获取日记
  const diaries = useLiveQuery(async () => {
    return db.diaries
      .where('date')
      .aboveOrEqual(THIRTY_DAYS_AGO)
      .reverse()
      .sortBy('date');
  }, []);

  // 计算风险评分
  // 修复审计 P1-3：五张 LiveQuery 任一变化都会重跑全套 IPC，且旧请求无取消保护，
  // 慢请求可能覆盖新结果。这里加递增序号守卫——只有最新一次请求才能写入 state。
  const calcSeqRef = useRef(0);
  useEffect(() => {
    const seq = ++calcSeqRef.current;
    const isStale = () => seq !== calcSeqRef.current;

    const calculateRisk = async () => {
      if (!emotionRecords || !behaviorRecords || !assessments || !diaries) {
        // 数据未就绪时也要释放 loading，避免整页骨架屏卡死
        setIsLoading(false);
        return;
      }

      // selectedDays 变化但已有 riskResult 时，不重置 loading（避免切换闪烁）
      const isOnlyDaysChange = !!riskResult;
      if (!isOnlyDaysChange) {
        setIsLoading(true);
      }
      setError(null);
      setTimedOut(false);

      // 15 秒超时保护：超时后仍尝试渲染已有信号，而非整页 EmptyState
      const timeoutId = setTimeout(() => {
        if (isStale()) return;
        setTimedOut(true);
        setIsLoading(false);
        // 超时不设 error，让页面显示部分数据 + "部分信号源加载中"提示
      }, 15000);

      try {
        // 准备行为数据：通过后端 BehaviorAnalyzer.analyzeBehaviorTrends 计算，
        // 避免前端重复实现（与 04-情绪与风险引擎.md 已知问题#2 对齐）
        // 仅在 IPC 不可用时回退到本地实现
        const sortedBehaviorRecords = [...behaviorRecords].sort((a, b) => a.date.localeCompare(b.date));
        let behaviorData;
        try {
          const trends = await window.electronAPI?.behaviorAnalyzeTrends?.(sortedBehaviorRecords);
          if (trends && typeof trends.consecutiveNoDiary === 'number') {
            behaviorData = {
              consecutiveNoDiary: trends.consecutiveNoDiary,
              consecutiveLowMood: trends.consecutiveLowMood,
              taskCompletionDrop: trends.taskCompletionDrop,
              habitBreakDays: trends.habitBreakDays,
              lateNightRatio: trends.lateNightRatio,
            };
          }
        } catch (e) {
          console.warn('behaviorAnalyzeTrends IPC failed, fallback to local', e);
        }
        if (isStale()) return;
        if (!behaviorData) {
          behaviorData = {
            consecutiveNoDiary: calculateConsecutiveNoDiary(diaries),
            consecutiveLowMood: calculateConsecutiveLowMood(diaries),
            taskCompletionDrop: calculateTaskCompletionDrop(behaviorRecords),
            habitBreakDays: calculateHabitBreakDays(behaviorRecords),
            lateNightRatio: calculateLateNightRatio(behaviorRecords),
          };
        }

        // 调用风险评分引擎（透传本地个性化校准层，危机判定基于基线分数不受影响）
        const personalization = await computeRiskPersonalization();
        if (isStale()) return;
        const result = await window.electronAPI?.riskCalculate?.({
          emotionRecords: emotionRecords.slice(0, 30),
          behaviorData,
          assessments,
          conversationSummaries: conversationSummaries?.slice(0, 10) || [],
          diaries: diaries.slice(0, 14),
          personalization,
        });

        if (isStale()) return;
        if (!result) {
          throw new Error('riskCalculate unavailable');
        }

        setRiskResult(result);

        // 计算趋势数据
        const trend = calculateTrendData(emotionRecords, behaviorRecords, assessments, diaries, selectedDays);
        setTrendData(trend);
      } catch (err) {
        console.error('Risk calculation failed:', err);
        // 不直接 setError 导致整页 EmptyState，改为提示部分加载
        if (!isStale()) setTimedOut(true);
      } finally {
        clearTimeout(timeoutId);
        // selectedDays 单独变化时不强制改 loading 状态（开头已按需跳过）
        if (!isOnlyDaysChange && !isStale()) {
          setIsLoading(false);
        }
      }
    };

    calculateRisk();
  }, [emotionRecords, behaviorRecords, assessments, conversationSummaries, diaries, selectedDays, retryCount]);

  // 雷达图数据
  const radarData = useMemo(() => {
    if (!riskResult) return [];
    return [
      { dimension: t('risk.dim_emotion'), value: 100 - riskResult.breakdown.emotion.score, fullMark: 100 },
      { dimension: t('risk.dim_behavior'), value: 100 - riskResult.breakdown.behavior.score, fullMark: 100 },
      { dimension: t('risk.dim_assessment'), value: 100 - riskResult.breakdown.assessment.score, fullMark: 100 },
      { dimension: t('risk.dim_chat'), value: 100 - riskResult.breakdown.chat.score, fullMark: 100 },
      { dimension: t('risk.dim_diary'), value: 100 - riskResult.breakdown.diary.score, fullMark: 100 },
    ];
  }, [riskResult, t]);

  // 证据链 hasData：各信号源是否有数据（决定 no_data 判定）
  const hasData: HasDataMap = useMemo(
    () => ({
      emotion: (emotionRecords?.length ?? 0) > 0,
      behavior: (behaviorRecords?.length ?? 0) > 0,
      assessment: (assessments?.length ?? 0) > 0,
      chat: (conversationSummaries?.length ?? 0) > 0,
      diary: (diaries?.length ?? 0) > 0,
    }),
    [emotionRecords, behaviorRecords, assessments, conversationSummaries, diaries]
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-hover rounded w-48 mb-2" />
          <div className="h-4 bg-surface-hover rounded w-64" />
        </div>
        <div className="animate-pulse glass-card rounded-2xl p-6">
          <div className="h-4 bg-surface-hover rounded w-24 mb-4" />
          <div className="h-12 bg-surface-hover rounded w-32 mb-2" />
          <div className="h-4 bg-surface-hover rounded w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse glass-card rounded-2xl p-6">
            <div className="h-4 bg-surface-hover rounded w-32 mb-4" />
            <div className="h-64 bg-surface-hover rounded" />
          </div>
          <div className="animate-pulse glass-card rounded-2xl p-6">
            <div className="h-4 bg-surface-hover rounded w-32 mb-4" />
            <div className="h-64 bg-surface-hover rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 风险计算彻底失败（非超时）时显示 inline error（带重试按钮）
  if (error && !riskResult && !timedOut) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title={t('error.title')}
          description={error || t('error.title')}
          action={
            <button
              type="button"
              onClick={() => {
                setError(null);
                setTimedOut(false);
                setIsLoading(true);
                setRetryCount(c => c + 1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              {t('error.retry')}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" role="main" aria-label={t('risk.dashboard_title')}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
            {t('risk.dashboard_title')}
          </h1>
          <p className="text-sm text-text-muted mt-1">{t('risk.dashboard_subtitle')}</p>
        </div>
        <div
          className="relative flex gap-1 p-1 rounded-[12px] bg-surface-hover/60 backdrop-blur-sm"
          role="group"
          aria-label={t('risk.days_suffix')}
        >
          {/* 滑动指示器：用 left/width 百分比 + transition 实现纯 CSS 滑动效果。
              gap+padding 使每个按钮等分宽度，指示器位置 = active 索引 * (100% / N) */}
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-[10px] bg-primary shadow-sm pointer-events-none transition-all"
            style={{
              left: `calc(${[7, 14, 30].indexOf(selectedDays) * 100 / 3}% + 4px)`,
              width: 'calc(100% / 3 - 8px)',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDuration: 'var(--transition-smooth, 300ms)',
              transitionProperty: 'left',
            }}
          />
          {([7, 14, 30] as const).map(days => {
            const active = selectedDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setSelectedDays(days)}
                aria-pressed={active}
                className={`relative z-10 flex-1 px-4 py-2 rounded-[10px] text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  active
                    ? 'text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {days}{t('risk.days_suffix')}
              </button>
            );
          })}
        </div>
      </div>

      {/* 超时但仍有部分数据时的提示条（非阻塞） */}
      {timedOut && !riskResult && (
        <div className="rounded-xl p-3 border flex items-center gap-2 text-sm" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
          <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span>{t('risk.partial_loading_hint')}</span>
          <button
            type="button"
            onClick={() => { setTimedOut(false); setIsLoading(true); setRetryCount(c => c + 1); }}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            {t('error.retry')}
          </button>
        </div>
      )}

      {/* 早期预警卡片 —— 基于近 15 天滑动窗口的趋势预测（含证据链下钻） */}
      <EarlyWarningCard riskResult={riskResult} hasData={hasData} />

      {/* 风险评分卡片 —— 强化视觉：大色块背景 + 5 格等级条 + 行动指引 + 证据链 */}
      {riskResult && <RiskScoreCard riskResult={riskResult} hasData={hasData} />}

      {/* 注：7 日情绪预测已移至情绪分析页（EmotionPage），此处去重，避免重复展示（PRD v3 P0-6） */}

      {/* 风险时间线 —— 30 天风险分折线 + 个人基线带 + 事件锚点 */}
      <RiskTimelineChart days={selectedDays} />

      {/* 个人基线对比 */}
      {behaviorRecords && behaviorRecords.length >= 7 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
            {t('risk.baseline_compare')}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              const sorted = [...behaviorRecords].sort((a, b) => a.date.localeCompare(b.date));
              const baseline = sorted.slice(0, Math.floor(sorted.length / 2));
              const recent = sorted.slice(-7);

              const baselineMood = baseline.reduce((s, r) => s + (r.moodRating || 0), 0) / Math.max(baseline.filter(r => r.moodRating).length, 1);
              const recentMood = recent.reduce((s, r) => s + (r.moodRating || 0), 0) / Math.max(recent.filter(r => r.moodRating).length, 1);

              const baselineTaskRate = baseline.reduce((s, r) => s + (r.tasksCompleted / Math.max(r.tasksTotal, 1)), 0) / baseline.length;
              const recentTaskRate = recent.reduce((s, r) => s + (r.tasksCompleted / Math.max(r.tasksTotal, 1)), 0) / recent.length;

              const baselineHabitRate = baseline.reduce((s, r) => s + (r.habitsChecked / Math.max(r.habitsTotal, 1)), 0) / baseline.length;
              const recentHabitRate = recent.reduce((s, r) => s + (r.habitsChecked / Math.max(r.habitsTotal, 1)), 0) / recent.length;

              const baselineDiaryRate = baseline.filter(r => r.diaryWritten).length / baseline.length;
              const recentDiaryRate = recent.filter(r => r.diaryWritten).length / recent.length;

              const items = [
                { label: t('risk.mood_score'), baseline: baselineMood.toFixed(1), recent: recentMood.toFixed(1), unit: '/5', diff: recentMood - baselineMood },
                { label: t('risk.task_rate'), baseline: Math.round(baselineTaskRate * 100) + '%', recent: Math.round(recentTaskRate * 100) + '%', unit: '', diff: recentTaskRate - baselineTaskRate },
                { label: t('risk.habit_rate'), baseline: Math.round(baselineHabitRate * 100) + '%', recent: Math.round(recentHabitRate * 100) + '%', unit: '', diff: recentHabitRate - baselineHabitRate },
                { label: t('risk.diary_freq'), baseline: Math.round(baselineDiaryRate * 100) + '%', recent: Math.round(recentDiaryRate * 100) + '%', unit: '', diff: recentDiaryRate - baselineDiaryRate },
              ];

              return items.map((item, i) => {
                const isDown = item.diff < -0.1;
                const isUp = item.diff > 0.1;
                return (
                  <div key={i} className="p-3 rounded-lg bg-surface-hover/50">
                    <p className="text-xs text-text-muted mb-1">{item.label}</p>
                    <p className="text-lg font-semibold text-text-primary">{item.recent}{item.unit}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {isDown ? (
                        <TrendingDown className="w-3 h-3 text-amber-500" aria-hidden="true" />
                      ) : isUp ? (
                        <TrendingUp className="w-3 h-3 text-green-500" aria-hidden="true" />
                      ) : (
                        <Minus className="w-3 h-3 text-text-muted" aria-hidden="true" />
                      )}
                      <span className={`text-xs ${isDown ? 'text-amber-500' : isUp ? 'text-green-500' : 'text-text-muted'}`}>
                        {t('risk.baseline_prefix')} {item.baseline}{item.unit}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 雷达图 */}
        <div className="glass-card rounded-2xl p-6" role="figure" aria-label={t('risk.health_dim')}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">{t('risk.health_dim')}</h3>
          <RiskRadar data={radarData} hasData={radarData.length > 0} />
        </div>

        {/* 趋势图 */}
        <RiskTrendChart data={trendData} />
      </div>

      {/* 信号源 + 风险因素列表 */}
      {riskResult && (
        <RiskSignalSources breakdown={riskResult.breakdown} factors={riskResult.factors} />
      )}
    </div>
  );
}
