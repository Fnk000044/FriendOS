import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, Area, AreaChart, Scatter, ScatterChart,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceArea, ComposedChart,
} from 'recharts';
import { db } from '../../db';
import { getDaysAgo, getToday } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * 风险时间线（RiskDashboardPage 用）
 * - 30 天风险分折线（healthProfiles 派生）
 * - 个人基线带（±1 标准差半透明区域）
 * - 事件锚点（日记/量表/危机/对话危机）Scatter 叠加
 * - 7/14/30 天切换
 */

interface TimelinePoint {
  date: string;
  score: number;           // 风险分 0-100（100 - emotionalHealthIndex）
  baseline: number;        // 基线均值
  baselineUpper: number;   // 基线+1σ
  baselineLower: number;   // 基线-1σ
  events: TimelineEvent[];
}

interface TimelineEvent {
  date: string;
  type: 'diary' | 'assessment' | 'crisis' | 'chat_crisis';
  label: string;
  y: number;  // 在图上的 y 位置（score）
}

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  diary: '#3b82f6',
  assessment: '#8b5cf6',
  crisis: '#ef4444',
  chat_crisis: '#f97316',
};

const EVENT_LABELS: Record<TimelineEvent['type'], string> = {
  diary: '日记',
  assessment: '量表',
  crisis: '危机',
  chat_crisis: '对话危机',
};

const tooltipContentStyle = {
  backgroundColor: 'var(--bg-card-solid, #fff)',
  border: '1px solid var(--glass-border, #E2E8F0)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary, #0F172A)',
};

interface Props {
  days?: 7 | 14 | 30;
}

export default function RiskTimelineChart({ days = 30 }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const since = getDaysAgo(days);
        const [healthProfiles, diaries, assessments, crisisLogs, emotionRecords] = await Promise.all([
          db.healthProfiles.where('date').aboveOrEqual(since).toArray(),
          db.diaries.where('date').aboveOrEqual(since).toArray(),
          db.assessments.where('date').aboveOrEqual(since).toArray(),
          db.crisisLogs.where('date').aboveOrEqual(since).toArray(),
          db.emotionRecords.where('date').aboveOrEqual(since).toArray(),
        ]);

        // 按日期聚合 healthProfile → 风险分
        const profileByDate = new Map<string, number>();
        for (const hp of healthProfiles) {
          profileByDate.set(hp.date, 100 - hp.emotionalHealthIndex);
        }

        // 基线：全部样本的均值+标准差
        const allScores = Array.from(profileByDate.values());
        const mean = allScores.length > 0 ? allScores.reduce((s, v) => s + v, 0) / allScores.length : 30;
        const variance = allScores.length > 1
          ? allScores.reduce((s, v) => s + (v - mean) ** 2, 0) / allScores.length
          : 100;
        const std = Math.sqrt(variance);

        // 构造时间线点
        const points: TimelinePoint[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = getDaysAgo(i);
          const score = profileByDate.get(d);
          points.push({
            date: d,
            score: score ?? null as any,
            baseline: Math.round(mean),
            baselineUpper: Math.round(mean + std),
            baselineLower: Math.max(0, Math.round(mean - std)),
            events: [],
          });
        }

        // 事件锚点
        const evts: TimelineEvent[] = [];
        for (const d of diaries) {
          evts.push({ date: d.date, type: 'diary', label: d.title || '日记', y: profileByDate.get(d.date) ?? 30 });
        }
        for (const a of assessments) {
          evts.push({ date: a.date, type: 'assessment', label: `${a.type} ${a.totalScore}分`, y: profileByDate.get(a.date) ?? 30 });
        }
        for (const c of crisisLogs) {
          evts.push({ date: c.date, type: 'crisis', label: '危机触发', y: 90 });
        }
        const chatCrises = emotionRecords.filter(e => e.source === 'chat' && e.riskLevel === 'critical');
        for (const e of chatCrises) {
          evts.push({ date: e.date, type: 'chat_crisis', label: '对话危机', y: 85 });
        }

        setData(points);
        setEvents(evts);
      } catch (e) {
        console.error('[RiskTimelineChart] load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  const hasData = data.some(p => p.score != null);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-4 w-32 rounded bg-[var(--bg-hover)] animate-pulse mb-4" />
        <div className="h-64 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">风险时间线</h3>
        <p className="text-sm text-text-muted py-12 text-center">暂无足够数据生成时间线，坚持记录日记和量表，这里会显示风险变化趋势。</p>
      </div>
    );
  }

  // 图例
  const legendItems = Object.entries(EVENT_LABELS) as [TimelineEvent['type'], string][];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">风险时间线</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, #E2E8F0)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--text-muted, #94A3B8)' }}
              tickLine={false}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipContentStyle}
              formatter={(value: number, name: string) => {
                if (name === '风险分') return [`${value}`, '风险分'];
                if (name === '基线带') return null;
                return [value, name];
              }}
              labelFormatter={(label: string) => label}
            />

            {/* 个人基线带（半透明区域） */}
            <ReferenceArea y1={0} y2={100} fill="transparent" />
            <Area
              type="monotone"
              dataKey="baselineLower"
              stackId="baseline"
              stroke="none"
              fill="transparent"
            />
            <Area
              type="monotone"
              dataKey="baselineUpper"
              stackId="baseline"
              stroke="none"
              fill="#10b981"
              fillOpacity={0.08}
            />

            {/* 风险分折线 */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 2, fill: '#ef4444' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            {/* 基线均值参考线 */}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* 事件锚点叠加 */}
            <Scatter
              data={events}
              dataKey="y"
              fill="#888"
              shape={(props: any) => {
                const { payload, cx, cy } = props;
                if (cx == null || cy == null) return <g />;
                const color = EVENT_COLORS[payload.type as TimelineEvent['type']] || '#888';
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={5} fill={color} opacity={0.8} stroke="#fff" strokeWidth={1.5} />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {legendItems.map(([type, label]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: EVENT_COLORS[type] }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-4 h-0.5 bg-red-500" />
          风险分
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-4 h-0.5 bg-green-500" style={{ borderTop: '2px dashed #10b981' }} />
          个人基线
        </span>
      </div>
    </div>
  );
}
