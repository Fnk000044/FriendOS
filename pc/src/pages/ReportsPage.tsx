import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Target } from 'lucide-react';
import ReportHeader from '../components/reports/ReportHeader';
import StatCard from '../components/reports/StatCard';
import TaskChart from '../components/reports/TaskChart';
import MoodChart from '../components/reports/MoodChart';
import HabitChart from '../components/reports/HabitChart';
import HealthRadar from '../components/emotion/HealthRadar';
import EmotionTrend from '../components/emotion/EmotionTrend';
import { useLanguage } from '../i18n/useLanguage';
import { generateReport, type ReportData } from '../utils/reports';
import { generateAIReport, type AIReport } from '../services/ai/ReportAIService';
import { db } from '../db';
import type { EmotionRecord } from '../db/models';

export default function ReportsPage() {
  const { t, lang } = useLanguage();
  const [report, setReport] = useState<ReportData | null>(null);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [emotionRecords, setEmotionRecords] = useState<EmotionRecord[]>([]);
  const [healthDimensions, setHealthDimensions] = useState({
    mood: 0, stress: 0, energy: 0, social: 0, sleep: 0, selfCare: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (start: string, end: string) => {
    setLoading(true);
    const startTime = Date.now();

    const [data, ai, emotions, healthProfile] = await Promise.all([
      generateReport(start, end),
      generateAIReport(start, end),
      db.emotionRecords.where('date').between(start, end, true, true).toArray(),
      db.healthProfiles.orderBy('date').last(),
    ]);

    const elapsed = Date.now() - startTime;
    if (elapsed < 300) {
      await new Promise((r) => setTimeout(r, 300 - elapsed));
    }

    setReport(data);
    setAiReport(ai);
    setEmotionRecords(emotions);
    if (healthProfile) {
      setHealthDimensions(healthProfile.dimensions);
    }
    setLoading(false);
  };

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    handleRangeChange(today, today);
  }, []);

  const trendIcon = aiReport?.highlights.trend === 'improving'
    ? <TrendingUp className="w-4 h-4 text-green-500" />
    : aiReport?.highlights.trend === 'declining'
    ? <TrendingDown className="w-4 h-4 text-red-500" />
    : <Minus className="w-4 h-4 text-slate-400" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-muted">{t('report.title')}</p>
        <ReportHeader onRangeChange={handleRangeChange} />
      </div>

      {!report && !loading ? (
        <div className="glass-card rounded-card p-8 shadow-card text-center text-text-muted py-16">
          {t('report.select_hint')}
        </div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-8 rounded-card" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {t('report.loading')}
              </div>
            </div>
          )}
          <div className={`space-y-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label={t('report.task_rate')} value={report?.completionRate ?? '-'} suffix="%" color="#14B8A6" />
              <StatCard label={t('report.tasks_done')} value={report?.completedTasks ?? '-'} suffix={report ? `/ ${report.totalTasks}` : ''} color="#3B82F6" />
              <StatCard label={t('report.diary_days')} value={report?.diaryDays ?? '-'} color="#8B5CF6" />
              <StatCard label={t('report.mood_avg')} value={report?.avgMood ?? '-'} suffix={report?.avgMood ? '/5' : ''} color="#F59E0B" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label={t('report.habit_rate')} value={report?.habitsCompletionRate ?? '-'} suffix="%" color="#8B5CF6" />
              <StatCard label={t('report.word_count')} value={report?.totalWordCount ?? '-'} suffix={report && lang === 'zh-CN' ? '字' : ''} color="#EC4899" />
            </div>

            {/* AI Report Section */}
            {aiReport && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  AI 分析报告
                  {trendIcon}
                </h2>
                <p className="text-sm text-slate-700 mb-4 leading-relaxed">{aiReport.summary}</p>

                {aiReport.insights.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      洞察
                    </h3>
                    <ul className="space-y-1.5">
                      {aiReport.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      建议
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {aiReport.suggestions.map((suggestion, i) => (
                        <div key={i} className="rounded-lg p-2.5 text-sm text-slate-600" style={{ background: 'var(--bg-card)' }}>
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Health Radar + Emotion Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-4">心理健康画像</h2>
                <HealthRadar dimensions={healthDimensions} hasData={emotionRecords.length > 0} />
              </div>

              <div className="glass-card rounded-xl p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-4">情绪趋势</h2>
                {emotionRecords.length > 0 ? (
                  <EmotionTrend records={emotionRecords} days={30} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <p className="text-sm">暂无情绪数据</p>
                  </div>
                )}
              </div>
            </div>

            {/* Charts */}
            {report && (
              <>
                <TaskChart data={report.chartData} />
                <MoodChart data={report.chartData} />
                <HabitChart data={report.chartData} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
