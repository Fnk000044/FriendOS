import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { generateWeeklyReport, type WeeklyReport } from '../../services/ai/WeeklyReportService';

export default function WeeklyReportCard() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateWeeklyReport();
    setReport(result);
    setLoading(false);
  };

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-500', label: '改善中' },
    stable: { icon: Minus, color: 'text-text-muted', label: '稳定' },
    declining: { icon: TrendingDown, color: 'text-amber-500', label: '下降中' },
  };

  return (
    <div className="glass-card rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          本周心理健康报告
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? '生成中...' : report ? '重新生成' : '生成报告'}
        </button>
      </div>

      {!report && !loading && (
        <p className="text-sm text-slate-400 text-center py-8">
          点击"生成报告"查看本周心理健康总结
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            正在生成报告...
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* Summary */}
          <p className="text-sm text-text-secondary leading-relaxed">{report.summary}</p>

          {/* Trend */}
          <div className="flex items-center gap-2">
            {(() => {
              const config = trendConfig[report.moodTrend];
              const TrendIcon = config.icon;
              return (
                <>
                  <TrendIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-sm font-medium ${config.color}`}>
                    情绪趋势：{config.label}
                  </span>
                </>
              );
            })()}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <StatBadge label="日记" value={`${report.stats.diaryCount}篇`} />
            <StatBadge label="心情" value={`${report.stats.avgMood}/5`} />
            <StatBadge label="任务" value={`${report.stats.taskCompletion}%`} />
            <StatBadge label="打卡" value={`${report.stats.habitStreak}次`} />
          </div>

          {/* Highlights */}
          {report.highlights.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                亮点
              </p>
               {report.highlights.map((h, i) => (
                <p key={i} className="text-xs text-text-secondary ml-4">• {h}</p>
              ))}
            </div>
          )}

          {/* Concerns */}
          {report.concerns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-500 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                需关注
              </p>
              {report.concerns.map((c, i) => (
                <p key={i} className="text-xs text-text-secondary ml-4">• {c}</p>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {report.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-indigo-600 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                建议
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.suggestions.map((s, i) => (
                  <div key={i} className="bg-[var(--bg-hover)] rounded-lg p-2 text-xs text-text-secondary">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
