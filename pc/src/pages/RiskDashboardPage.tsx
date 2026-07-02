import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';
import { Shield, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Brain, MessageSquare, BookOpen, ClipboardList, RefreshCw } from 'lucide-react';
import { db } from '../db';
import { getDaysAgo, getToday, formatLocalDate } from '../utils/date';
import { useLanguage } from '../i18n/useLanguage';
import AnimatedNumber from '../components/common/AnimatedNumber';
import type { RiskLevel } from '../db/models';

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
  summary: string;
  timestamp: number;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  medium_low: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  medium: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export default function RiskDashboardPage() {
  const { t } = useLanguage();
  const [selectedDays, setSelectedDays] = useState(7);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);

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
  useEffect(() => {
    const calculateRisk = async () => {
      if (!emotionRecords || !behaviorRecords || !assessments || !diaries) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 准备行为数据
        const behaviorData = {
          consecutiveNoDiary: calculateConsecutiveNoDiary(diaries),
          consecutiveLowMood: calculateConsecutiveLowMood(diaries),
          taskCompletionDrop: calculateTaskCompletionDrop(behaviorRecords),
          habitBreakDays: calculateHabitBreakDays(behaviorRecords),
          lateNightRatio: calculateLateNightRatio(behaviorRecords),
        };

        // 调用风险评分引擎
        const result = await window.electronAPI?.riskCalculate?.({
          emotionRecords: emotionRecords.slice(0, 30),
          behaviorData,
          assessments,
          conversationSummaries: conversationSummaries?.slice(0, 10) || [],
          diaries: diaries.slice(0, 14),
        });

        if (!result) {
          throw new Error('riskCalculate unavailable');
        }

        setRiskResult(result);

        // 计算趋势数据
        const trend = calculateTrendData(emotionRecords, behaviorRecords, assessments, diaries, selectedDays);
        setTrendData(trend);
      } catch (err) {
        console.error('Risk calculation failed:', err);
        setError(t('error.title'));
      } finally {
        setIsLoading(false);
      }
    };

    calculateRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotionRecords, behaviorRecords, assessments, conversationSummaries, diaries, selectedDays]);

  // 计算连续无日记天数
  function calculateConsecutiveNoDiary(diaries: any[]): number {
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      const hasDiary = diaries.some(d => d.date === dateStr);
      if (!hasDiary) count++;
      else break;
    }
    return count;
  }

  // 计算连续低心情天数
  function calculateConsecutiveLowMood(diaries: any[]): number {
    const sorted = [...diaries].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    for (const diary of sorted) {
      if (diary.mood && diary.mood <= 2) count++;
      else break;
    }
    return count;
  }

  // 计算任务完成率是否下降
  function calculateTaskCompletionDrop(behaviorRecords: any[]): boolean {
    if (behaviorRecords.length < 7) return false;
    const recent = behaviorRecords.slice(-3);
    const earlier = behaviorRecords.slice(-7, -3);
    const recentRate = recent.reduce((sum, r) => sum + (r.tasksCompleted / Math.max(r.tasksTotal, 1)), 0) / recent.length;
    const earlierRate = earlier.reduce((sum, r) => sum + (r.tasksCompleted / Math.max(r.tasksTotal, 1)), 0) / earlier.length;
    return earlierRate > 0.5 && recentRate < earlierRate * 0.6;
  }

  // 计算习惯中断天数
  function calculateHabitBreakDays(behaviorRecords: any[]): number {
    const sorted = [...behaviorRecords].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    for (const record of sorted) {
      if (record.habitsTotal > 0 && record.habitsChecked === 0) count++;
      else break;
    }
    return count;
  }

  // 计算深夜活跃比例
  function calculateLateNightRatio(behaviorRecords: any[]): number {
    if (behaviorRecords.length === 0) return 0;
    const lateNightCount = behaviorRecords.filter(r => {
      if (!r.activeHours || r.activeHours.length === 0) return false;
      return r.activeHours.some((h: number) => h >= 0 && h < 5);
    }).length;
    return lateNightCount / behaviorRecords.length;
  }

  // 计算趋势数据
  function calculateTrendData(emotions: any[], behaviors: any[], assessments: any[], diaries: any[], days: number): { date: string; score: number }[] {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      const shortDate = dateStr.slice(5);

      // 简化计算：基于当天的情绪和行为数据
      const dayEmotions = emotions.filter(e => e.date === dateStr);
      const dayBehavior = behaviors.find(b => b.date === dateStr);
      const dayDiary = diaries.find(d => d.date === dateStr);

      let score = 50; // 默认中等风险

      if (dayEmotions.length > 0) {
        const avgSentiment = dayEmotions.reduce((sum, e) => sum + e.sentimentScore, 0) / dayEmotions.length;
        score = Math.round((1 - avgSentiment) * 50);
      } else if (dayDiary?.mood) {
        score = Math.round((5 - dayDiary.mood) * 20);
      }

      void dayBehavior;
      void assessments;

      result.push({ date: shortDate, score: Math.min(100, Math.max(0, score)) });
    }

    return result;
  }

  // 雷达图数据
  const radarData = useMemo(() => {
    if (!riskResult) return [];
    return [
      { dimension: '情绪', value: 100 - riskResult.breakdown.emotion.score, fullMark: 100 },
      { dimension: '行为', value: 100 - riskResult.breakdown.behavior.score, fullMark: 100 },
      { dimension: '评估', value: 100 - riskResult.breakdown.assessment.score, fullMark: 100 },
      { dimension: '聊天', value: 100 - riskResult.breakdown.chat.score, fullMark: 100 },
      { dimension: '日记', value: 100 - riskResult.breakdown.diary.score, fullMark: 100 },
    ];
  }, [riskResult]);

  // 信号源图标
  const signalIcons: Record<string, React.ReactNode> = {
    emotion: <Activity className="w-4 h-4" />,
    behavior: <Brain className="w-4 h-4" />,
    assessment: <ClipboardList className="w-4 h-4" />,
    chat: <MessageSquare className="w-4 h-4" />,
    diary: <BookOpen className="w-4 h-4" />,
  };

  const signalLabels: Record<string, string> = {
    emotion: '情绪分析',
    behavior: '行为模式',
    assessment: '评估量表',
    chat: 'AI聊天',
    diary: '日记情绪',
  };

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

  // 风险计算失败时显示 inline error（带重试按钮），而非静默半空页面
  if (error && !riskResult) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="glass-card rounded-2xl p-8 text-center" role="alert">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">{t('error.title')}</p>
          <p className="text-xs text-text-muted mb-4">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              // 触发 effect 重新计算：通过 state 变更
              setSelectedDays(d => (d === 7 ? 8 : 7));
              setTimeout(() => setSelectedDays(7), 0);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t('error.retry')}
          </button>
        </div>
      </div>
    );
  }

  // tooltip 内容样式：使用 CSS 变量以适配深色模式
  const tooltipContentStyle = {
    backgroundColor: 'var(--bg-card-solid, #fff)',
    border: '1px solid var(--glass-border, #E2E8F0)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--text-primary, #0F172A)',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" role="main" aria-label="风险评估仪表盘">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
            风险评估仪表盘
          </h1>
          <p className="text-sm text-text-muted mt-1">综合多维度数据分析，无感识别心理健康风险</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="时间范围选择">
          {[7, 14, 30].map(days => {
            const active = selectedDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setSelectedDays(days)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                }`}
              >
                {days}天
              </button>
            );
          })}
        </div>
      </div>

      {/* 风险评分卡片 */}
      {riskResult && (
        <div className={`rounded-2xl p-6 border ${RISK_COLORS[riskResult.riskLevel].bg} ${RISK_COLORS[riskResult.riskLevel].border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">综合风险指数</p>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber
                  value={riskResult.totalScore}
                  duration={800}
                  className={`text-5xl font-bold ${RISK_COLORS[riskResult.riskLevel].text}`}
                />
                <span className="text-lg text-text-muted">/100</span>
              </div>
              <p className={`text-sm font-medium mt-2 ${RISK_COLORS[riskResult.riskLevel].text}`}>
                {riskResult.riskLevelInfo.label}风险
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted mb-2">风险等级</p>
              <div className="flex gap-1" role="img" aria-label={`风险等级：${riskResult.riskLevelInfo.label}`}>
                {(['low', 'medium_low', 'medium', 'high', 'critical'] as RiskLevel[]).map(level => (
                  <div
                    key={level}
                    className={`w-8 h-2 rounded-full ${
                      level === riskResult.riskLevel ? RISK_COLORS[level].bg.replace('50', '400') : 'bg-surface-hover'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-text-secondary mt-4 p-3 bg-white/50 dark:bg-white/5 rounded-lg">
            {riskResult.summary}
          </p>
        </div>
      )}

      {/* 个人基线对比 */}
      {behaviorRecords && behaviorRecords.length >= 7 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
            与个人基线对比
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
                { label: '心情评分', baseline: baselineMood.toFixed(1), recent: recentMood.toFixed(1), unit: '/5', diff: recentMood - baselineMood },
                { label: '任务完成率', baseline: Math.round(baselineTaskRate * 100) + '%', recent: Math.round(recentTaskRate * 100) + '%', unit: '', diff: recentTaskRate - baselineTaskRate },
                { label: '习惯完成率', baseline: Math.round(baselineHabitRate * 100) + '%', recent: Math.round(recentHabitRate * 100) + '%', unit: '', diff: recentHabitRate - baselineHabitRate },
                { label: '日记频率', baseline: Math.round(baselineDiaryRate * 100) + '%', recent: Math.round(recentDiaryRate * 100) + '%', unit: '', diff: recentDiaryRate - baselineDiaryRate },
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
                        基线 {item.baseline}{item.unit}
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
        <div className="glass-card rounded-2xl p-6" role="figure" aria-label="健康维度雷达图">
          <h3 className="text-lg font-semibold text-text-primary mb-4">健康维度分析</h3>
          {radarData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="var(--glass-border, #E2E8F0)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 12, fill: 'var(--text-muted, #64748B)' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'var(--text-muted, #94A3B8)' }}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: number) => [`${value}`, '健康指数']}
                  />
                  <Radar
                    name="健康指数"
                    dataKey="value"
                    stroke="#14B8A6"
                    strokeWidth={2}
                    fill="#14B8A6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-muted">
              <p>暂无数据</p>
            </div>
          )}
        </div>

        {/* 趋势图 */}
        <div className="glass-card rounded-2xl p-6" role="figure" aria-label="风险趋势折线图">
          <h3 className="text-lg font-semibold text-text-primary mb-4">风险趋势</h3>
          {trendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, #E2E8F0)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: number) => [`${value}`, '风险指数']}
                  />
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="url(#riskGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-muted">
              <p>暂无趋势数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 信号源状态 */}
      {riskResult && (
        <div className="glass-card rounded-2xl p-6" role="region" aria-label="信号源分析">
          <h3 className="text-lg font-semibold text-text-primary mb-4">信号源分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4" role="list">
            {Object.entries(riskResult.breakdown).map(([key, data]) => (
              <div
                key={key}
                role="listitem"
                className="p-4 rounded-xl bg-surface-hover/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary" aria-hidden="true">{signalIcons[key]}</span>
                  <span className="text-sm font-medium text-text-secondary">{signalLabels[key]}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${
                    data.score >= 60 ? 'text-red-500' :
                    data.score >= 40 ? 'text-orange-500' :
                    data.score >= 20 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {data.score}
                  </span>
                  <span className="text-xs text-text-muted">/100</span>
                </div>
                <div className="mt-2 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      data.score >= 60 ? 'bg-red-500' :
                      data.score >= 40 ? 'bg-orange-500' :
                      data.score >= 20 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">权重 {Math.round(data.weight * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 风险因素列表 */}
      {riskResult && riskResult.factors.length > 0 && (
        <div className="glass-card rounded-2xl p-6" role="region" aria-label="风险因素列表">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
            风险因素
          </h3>
          <div className="space-y-3" role="list">
            {riskResult.factors.map((factor, index) => (
              <div
                key={index}
                role="listitem"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50"
              >
                <div className={`w-2 h-2 rounded-full ${
                  factor.weight >= 30 ? 'bg-red-500' :
                  factor.weight >= 20 ? 'bg-orange-500' :
                  factor.weight >= 10 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <span className="text-sm text-text-secondary flex-1">{factor.description}</span>
                <span className="text-xs text-text-muted">权重 {factor.weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
