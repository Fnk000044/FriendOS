import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Target } from 'lucide-react';
import ReportHeader from '../components/reports/ReportHeader';
import StatCard from '../components/reports/StatCard';
import TaskChart from '../components/reports/TaskChart';
import MoodChart from '../components/reports/MoodChart';
import HabitChart from '../components/reports/HabitChart';
import CorrelationChart from '../components/reports/CorrelationChart';
import HealthRadar from '../components/emotion/HealthRadar';
import EmotionTrend from '../components/emotion/EmotionTrend';
import WeeklyReportCard from '../components/reports/WeeklyReportCard';
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

    const [data, ai, emotions, healthProfile] = await Promise.all([
      generateReport(start, end),
      generateAIReport(start, end),
      db.emotionRecords.where('date').between(start, end, true, true).toArray(),
      db.healthProfiles.orderBy('date').last(),
    ]);

    setReport(data);
    setAiReport(ai);
    setEmotionRecords(emotions);
    if (healthProfile) {
      setHealthDimensions(healthProfile.dimensions);
    }
    setLoading(false);
  };

  useEffect(() => {
    // 默认范围：近 7 天（与 EmotionPage 一致），避免当天无情绪记录时图表全空白
    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const start = format(sevenDaysAgo, 'yyyy-MM-dd');
    handleRangeChange(start, today);
  }, []);

  const trendIcon = aiReport?.highlights.trend === 'improving'
    ? <TrendingUp className="w-4 h-4 text-success" />
    : aiReport?.highlights.trend === 'declining'
    ? <TrendingDown className="w-4 h-4 text-danger" />
    : <Minus className="w-4 h-4 text-text-muted" />;

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
              <div className="glass-card-accent rounded-xl p-5">
                <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  {t('report.ai_report')}
                  {trendIcon}
                </h2>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">{aiReport.summary}</p>

                {aiReport.insights.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      {t('report.insights')}
                    </h3>
                    <ul className="space-y-1.5">
                      {aiReport.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {t('report.suggestions')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {aiReport.suggestions.map((suggestion, i) => (
                        <div key={i} className="rounded-lg p-2.5 text-sm text-text-secondary bg-surface-hover">
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
              <div className="glass-card rounded-xl p-5">
                <h2 className="font-semibold text-text-primary mb-4">{t('report.health_radar')}</h2>
                <HealthRadar dimensions={healthDimensions} hasData={emotionRecords.length > 0} />
              </div>

              <div className="glass-card rounded-xl p-5">
                <h2 className="font-semibold text-text-primary mb-4">{t('report.emotion_trend')}</h2>
                {emotionRecords.length > 0 ? (
                  <EmotionTrend records={emotionRecords} days={30} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-text-muted">
                    <p className="text-sm">{t('report.no_emotion_data')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Report */}
            <WeeklyReportCard />

            {/* Charts */}
            {report && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <TaskChart data={report.chartData} />
                  <MoodChart data={report.chartData} />
                  <HabitChart data={report.chartData} />
                </div>

                {/* 多维度综合分析 */}
                <div className="mt-6">
                  <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    多维度综合分析
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CorrelationChart
                      data={report.chartData}
                      correlation={report.correlation.moodVsTask}
                    />
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-text-primary mb-4">相关性总览</h3>
                      <div className="space-y-3 text-sm">
                        {[
                          { label: '心情 ↔ 任务完成率', r: report.correlation.moodVsTask },
                          { label: '心情 ↔ 习惯完成率', r: report.correlation.moodVsHabit },
                          { label: '任务 ↔ 习惯', r: report.correlation.taskVsHabit },
                        ].map(({ label, r }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-text-secondary">{label}</span>
                            <span
                              className="font-mono text-xs px-2 py-0.5 rounded"
                              style={{
                                background: 'var(--bg-hover)',
                                color: r === null ? 'var(--text-muted)' :
                                  r >= 0 ? 'var(--color-success, #22C55E)' : 'var(--color-info, #3B82F6)',
                              }}
                            >
                              {r === null ? '样本不足' : `${r >= 0 ? '+' : ''}${r.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-text-muted mt-4 leading-relaxed">
                        相关性范围 -1 到 +1。正值表示两个维度同向变化（例如心情好时任务完成率也高），
                        绝对值越大关联越强。需要至少 3 天同时具备两个维度数据才能计算。
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
