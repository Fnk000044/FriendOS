import { useState, useRef, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import { generateAIReportStream, type AIReport } from '../../services/ai/ReportAIService';
import { getDaysAgo, getToday } from '../../utils/date';

interface WeeklyReportCardProps {
  /** 生成中流式 summary 回调 */
  onSummaryStream?: (chunk: string) => void;
}

// 流式 chunk batch flush 间隔（与 useAI 一致，约一帧 16ms）
const FLUSH_INTERVAL = 16;

export default function WeeklyReportCard({ onSummaryStream }: WeeklyReportCardProps) {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingSummary, setStreamingSummary] = useState('');
  // batch flush：用 ref 累加 chunk，定时 flush 到 state，避免每 token 一次 setState
  const pendingChunkRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 流式结束淡入到最终 report，避免内容闪烁
  const [transitioning, setTransitioning] = useState(false);

  const flushBuffer = () => {
    flushTimerRef.current = null;
    if (!pendingChunkRef.current) return;
    const chunk = pendingChunkRef.current;
    pendingChunkRef.current = '';
    setStreamingSummary((prev) => prev + chunk);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    setStreamingSummary('');
    pendingChunkRef.current = '';
    setTransitioning(false);
    const start = getDaysAgo(7);
    const end = getToday();

    // 流式接收 summary 文本：batch flush 避免高频 setState 卡顿
    const aiReport = await generateAIReportStream(start, end, (chunk: string) => {
      pendingChunkRef.current += chunk;
      onSummaryStream?.(chunk);
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(flushBuffer, FLUSH_INTERVAL);
      }
    });

    // 最后一次 flush 确保所有 chunk 已写入 state
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    flushBuffer();

    // 淡入过渡：保留 streamingSummary 显示，同时设置 report，CSS 用 opacity 过渡
    setTransitioning(true);
    setReport(aiReport);
    setLoading(false);
    // 过渡完成后清空 streamingSummary（让最终 report 接管显示）
    setTimeout(() => {
      setStreamingSummary('');
      setTransitioning(false);
    }, 300);
  };

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-500', label: '改善中' },
    stable: { icon: Minus, color: 'text-text-muted', label: '稳定' },
    declining: { icon: TrendingDown, color: 'text-amber-500', label: '下降中' },
  };

  // 顶部状态条：流式生成时显示"AI 正在分析..."（非模态、不阻塞、无 spinner 旋转圈）
  const isStreaming = loading && !report;
  // 过渡期：report 已就绪但 streamingSummary 尚未清空，叠加显示淡入
  const showStreaming = isStreaming || transitioning;

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
          className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          {loading ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              分析中
            </>
          ) : report ? '重新生成' : '生成报告'}
        </button>
      </div>

      {!report && !loading && (
        <p className="text-sm text-slate-400 text-center py-8">
          点击"生成报告"生成本周心理健康分析（基于规则统计）
        </p>
      )}

      {showStreaming && streamingSummary && (
        <div className="space-y-3 transition-opacity duration-300" style={{ opacity: transitioning ? 0.4 : 1 }}>
          {/* 流式 summary 逐字显现 + 闪烁光标 */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {streamingSummary}
            {!transitioning && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-primary/60 animate-[blink_1s_infinite] align-middle" />
            )}
          </p>
        </div>
      )}

      {showStreaming && !streamingSummary && (
        <p className="text-sm text-text-muted flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          AI 正在分析你的数据...
        </p>
      )}

      {report && (
        <div className="space-y-4 fade-in-up">
          {/* Summary */}
          <p className="text-sm text-text-secondary leading-relaxed">{report.summary}</p>

          {/* Trend */}
          <div className="flex items-center gap-2">
            {(() => {
              const config = trendConfig[report.highlights.trend];
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

          {/* Insights — staggerFadeUp 依次淡入 */}
          {report.insights.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                洞察
              </p>
              <div className="space-y-1.5 stagger-animate">
                {report.insights.map((insight, i) => (
                  <div key={i} className="text-sm text-text-secondary flex items-start gap-2" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="text-primary mt-1">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions — staggerFadeUp */}
          {report.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-indigo-600 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                建议
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 stagger-animate">
                {report.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="bg-[var(--bg-hover)] rounded-lg p-2 text-xs text-text-secondary"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {report.highlights.bestDay && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <AlertTriangle className="w-3 h-3" />
              最佳状态日：{report.highlights.bestDay}
              {report.highlights.worstDay && <span className="ml-3">最低状态日：{report.highlights.worstDay}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

