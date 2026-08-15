import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, Brain, Calendar, Sparkles } from 'lucide-react';
import { db } from '../db';
import { getDaysAgo, getToday } from '../utils/date';
import EmotionTrend from '../components/emotion/EmotionTrend';
import EmotionHeatmap from '../components/emotion/EmotionHeatmap';
import MoodHeatmap from '../components/emotion/MoodHeatmap';
import HealthRadar from '../components/emotion/HealthRadar';
import EmotionPrediction from '../components/emotion/EmotionPrediction';
import { generateHealthProfile } from '../services/emotion/HealthProfileService';
import EmptyState from '../components/common/EmptyState';
import { Skeleton, StatCardSkeleton, CardSkeleton } from '../components/common/Skeleton';
import type { HealthProfile } from '../db/models';

export default function EmotionPage() {
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState(7);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  // P2-9：画像生成期间显示骨架屏，避免雷达图闪现全 0 值
  const [profileLoading, setProfileLoading] = useState(true);
  const thirtyDaysAgo = useMemo(() => getDaysAgo(30), []);

  // Get emotion records (shared date constant)
  const emotionRecords = useLiveQuery(async () => {
    return db.emotionRecords
      .where('date')
      .aboveOrEqual(thirtyDaysAgo)
      .reverse()
      .sortBy('date');
  }, []);

  // Get behavior records (shared date constant)
  const behaviorRecords = useLiveQuery(async () => {
    return db.behaviorRecords
      .where('date')
      .aboveOrEqual(thirtyDaysAgo)
      .sortBy('date');
  }, []);

  // Get latest health profile, generate if missing or outdated
  // 优化：只在数据变化时才重新生成，避免每次挂载都写DB
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const today = getToday();
        const profile = await db.healthProfiles.orderBy('date').last();

        if (profile && profile.date === today) {
          // 今天的profile已存在，直接使用
          setHealthProfile(profile);
        } else if (profile) {
          // profile存在但不是今天的，检查是否需要更新
          const lastUpdate = new Date(profile.createdAt).getTime();
          const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);

          if (hoursSinceUpdate < 4) {
            // 4小时内已更新，暂时使用旧的
            setHealthProfile(profile);
          } else {
            // 超过4小时，重新生成
            const generated = await generateHealthProfile();
            setHealthProfile(generated);
          }
        } else {
          // No profile yet - generate one from available data
          const generated = await generateHealthProfile();
          setHealthProfile(generated);
        }
      } catch (err) {
        // 生成失败：保留现有数据（可能为 null），不让雷达卡在加载态
        console.warn('[EmotionPage] loadProfile failed:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Memoized computations to avoid recalculating on every render
  const hasData = (emotionRecords && emotionRecords.length > 0) || (behaviorRecords && behaviorRecords.length > 0);

  const defaultDimensions = useMemo(() => ({
    mood: 0, stress: 0, energy: 0, social: 0, sleep: 0, selfCare: 0,
  }), []);

  const dimensions = healthProfile?.dimensions || defaultDimensions;

  const stats = useMemo(() => {
    const allDates = new Set([
      ...(emotionRecords?.map(r => r.date) || []),
      ...(behaviorRecords?.map(r => r.date) || []),
    ]);
    return {
      totalRecords: emotionRecords?.length || 0,
      highRiskCount: emotionRecords?.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length || 0,
      averageSentiment: emotionRecords && emotionRecords.length > 0
        ? Math.round((emotionRecords.reduce((acc, r) => acc + r.sentimentScore, 0) / emotionRecords.length + 1) / 2 * 100)
        : 0,
      activeDays: allDates.size,
    };
  }, [emotionRecords, behaviorRecords]);

  // 数据加载中（首次未返回结果）时显示骨架屏，避免渲染空数据闪动
  const isLoading = emotionRecords === undefined || behaviorRecords === undefined;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <Skeleton className="h-5 w-28 rounded" />
        </div>
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">情绪分析</h1>
          <p className="text-sm text-text-muted mt-1">温柔留意你的心理健康状态</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Activity className="w-4 h-4" />
          <span>实时监测中</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">活跃天数</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{hasData ? stats.activeDays : '-'}</p>
          <p className="text-xs text-text-muted">近30天</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">情绪指数</span>
          </div>
          <p className={`text-2xl font-bold ${
            !hasData ? 'text-text-muted' :
            stats.averageSentiment >= 60 ? 'text-green-600' :
            stats.averageSentiment >= 40 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {hasData ? stats.averageSentiment : '-'}
          </p>
          <p className="text-xs text-text-muted">/100</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Brain className="w-4 h-4" />
            <span className="text-xs">分析记录</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats.totalRecords}</p>
          <p className="text-xs text-text-muted">条</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs">高风险</span>
          </div>
          <p className={`text-2xl font-bold ${
            !hasData ? 'text-text-muted' :
            stats.highRiskCount > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {stats.highRiskCount}
          </p>
          <p className="text-xs text-text-muted">次</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Trend */}
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary">情绪趋势</h2>
            <div className="flex gap-1">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                    selectedDays === days
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-surface-hover'
                  }`}
                >
                  {days}天
                </button>
              ))}
            </div>
          </div>
          {emotionRecords && emotionRecords.length > 0 ? (
            <EmotionTrend records={emotionRecords || []} days={selectedDays} />
          ) : (
            <EmptyState
              icon={<Activity className="w-12 h-12" />}
              title="暂无情绪数据"
              description="系统会通过日记、聊天等自动分析你的情绪状态"
              action={
                <button onClick={() => navigate('/diary/new')} className="text-sm text-primary hover:underline cursor-pointer">
                  开始写第一篇日记吧 →
                </button>
              }
            />
          )}
        </div>

        {/* Health Radar */}
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-text-primary mb-4">心理健康画像</h2>
          {profileLoading ? <CardSkeleton lines={5} /> : <HealthRadar dimensions={dimensions} hasData={hasData} />}
        </div>
      </div>

      {/* Prediction */}
      <div className="glass-card rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          情绪趋势预测
        </h2>
        <EmotionPrediction />
      </div>

      {/* Heatmap */}
      <div className="glass-card rounded-xl p-5 shadow-sm">
        <EmotionHeatmap records={emotionRecords || []} weeks={12} />
      </div>

      {/* 心情热力图（日记 mood + 情感分，GitHub 风格） */}
      <MoodHeatmap />

      {/* Insights */}
      {healthProfile && healthProfile.insights.length > 0 && (
        <div className="glass-card-accent rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI 洞察
          </h2>
          <ul className="space-y-2">
            {healthProfile.insights.map((insight, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {healthProfile && healthProfile.suggestions.length > 0 && (
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-text-primary mb-3">建议</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {healthProfile.suggestions.map((suggestion, i) => (
              <div key={i} className="bg-surface-hover rounded-lg p-3 text-sm text-text-secondary">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
