import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, Brain, Calendar } from 'lucide-react';
import { db } from '../db';
import { getDaysAgo, getToday } from '../utils/date';
import EmotionTrend from '../components/emotion/EmotionTrend';
import EmotionHeatmap from '../components/emotion/EmotionHeatmap';
import HealthRadar from '../components/emotion/HealthRadar';
import { generateHealthProfile } from '../services/emotion/HealthProfileService';
import type { HealthProfile } from '../db/models';

const THIRTY_DAYS_AGO = getDaysAgo(30);

export default function EmotionPage() {
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState(7);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);

  // Get emotion records (shared date constant)
  const emotionRecords = useLiveQuery(async () => {
    return db.emotionRecords
      .where('date')
      .aboveOrEqual(THIRTY_DAYS_AGO)
      .reverse()
      .sortBy('date');
  }, []);

  // Get behavior records (shared date constant)
  const behaviorRecords = useLiveQuery(async () => {
    return db.behaviorRecords
      .where('date')
      .aboveOrEqual(THIRTY_DAYS_AGO)
      .sortBy('date');
  }, []);

  // Get latest health profile, generate if missing or outdated
  // 优化：只在数据变化时才重新生成，避免每次挂载都写DB
  useEffect(() => {
    const loadProfile = async () => {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">情绪分析</h1>
          <p className="text-sm text-slate-500 mt-1">无感识别你的心理健康状态</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Activity className="w-4 h-4" />
          <span>实时监测中</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">活跃天数</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{hasData ? stats.activeDays : '-'}</p>
          <p className="text-xs text-slate-400">近30天</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">情绪指数</span>
          </div>
          <p className={`text-2xl font-bold ${
            !hasData ? 'text-slate-400' :
            stats.averageSentiment >= 60 ? 'text-green-600' :
            stats.averageSentiment >= 40 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {hasData ? stats.averageSentiment : '-'}
          </p>
          <p className="text-xs text-slate-400">/100</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Brain className="w-4 h-4" />
            <span className="text-xs">分析记录</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalRecords}</p>
          <p className="text-xs text-slate-400">条</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs">高风险</span>
          </div>
          <p className={`text-2xl font-bold ${
            !hasData ? 'text-slate-400' :
            stats.highRiskCount > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {stats.highRiskCount}
          </p>
          <p className="text-xs text-slate-400">次</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Trend */}
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">情绪趋势</h2>
            <div className="flex gap-1">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
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
            <div className="h-48 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p className="text-sm font-medium">暂无情绪数据</p>
                <p className="text-xs mt-1">系统会通过日记、聊天等自动分析你的情绪状态</p>
                <button onClick={() => navigate('/diary/new')} className="text-xs mt-1 text-indigo-500 hover:underline cursor-pointer">开始写第一篇日记吧 →</button>
              </div>
            </div>
          )}
        </div>

        {/* Health Radar */}
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">心理健康画像</h2>
          <HealthRadar dimensions={dimensions} hasData={hasData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-card rounded-xl p-5 shadow-sm">
        <EmotionHeatmap records={emotionRecords || []} weeks={12} />
      </div>

      {/* Insights */}
      {healthProfile && healthProfile.insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            AI 洞察
          </h2>
          <ul className="space-y-2">
            {healthProfile.insights.map((insight, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-indigo-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {healthProfile && healthProfile.suggestions.length > 0 && (
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">建议</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {healthProfile.suggestions.map((suggestion, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
