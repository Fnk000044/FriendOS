import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmotionRecord } from '../../db/models';
import { formatLocalDate } from '../../utils/date';

interface EmotionHeatmapProps {
  records: EmotionRecord[];
  weeks?: number;
  onDateClick?: (date: string) => void; // 点击日期回调
}

export default function EmotionHeatmap({ records, weeks = 12, onDateClick }: EmotionHeatmapProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateClick = (date: string, hasData: boolean) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    } else if (hasData) {
      // 默认行为：导航到日记页面
      navigate(`/diary?date=${date}`);
    }
  };

  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Create a map of date -> average sentiment
    const dateMap = new Map<string, { avg: number; count: number }>();

    for (const record of records) {
      if (record.date < formatLocalDate(startDate)) continue;

      if (!dateMap.has(record.date)) {
        dateMap.set(record.date, { avg: 0, count: 0 });
      }

      const entry = dateMap.get(record.date)!;
      entry.avg = (entry.avg * entry.count + record.sentimentScore) / (entry.count + 1);
      entry.count++;
    }

    // Generate grid data (7 days x N weeks)
    const grid: Array<Array<{ date: string; score: number | null; level: number }>> = [];

    // Start from the beginning of the week
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());

    while (currentDate <= today) {
      const weekIndex = grid.length;
      if (weekIndex === 0 || currentDate.getDay() === 0) {
        grid.push([]);
      }

      const dateStr = formatLocalDate(currentDate);
      const entry = dateMap.get(dateStr);

      let level = 0; // 0: no data, 1-4: sentiment levels
      if (entry) {
        const normalized = (entry.avg + 1) / 2; // Convert -1~1 to 0~1
        if (normalized < 0.25) level = 1;
        else if (normalized < 0.5) level = 2;
        else if (normalized < 0.75) level = 3;
        else level = 4;
      }

      grid[grid.length - 1].push({
        date: dateStr,
        score: entry ? entry.avg : null,
        level,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return grid;
  }, [records, weeks]);

  const levelColors = [
    'bg-slate-100', // 0: no data
    'bg-red-200',   // 1: very negative
    'bg-orange-200', // 2: negative
    'bg-green-200',  // 3: positive
    'bg-green-400',  // 4: very positive
  ];

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>情绪热力图</span>
        <span className="text-slate-300">|</span>
        <span>近{weeks}周</span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-[10px] text-slate-400">
                {i % 2 === 0 ? label : ''}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {heatmapData.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-0.5">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  onClick={() => handleDateClick(day.date, day.score !== null)}
                  className={`w-4 h-4 rounded-sm ${levelColors[day.level]} transition-all cursor-pointer
                    ${selectedDate === day.date ? 'ring-2 ring-blue-500 scale-125' : 'hover:ring-1 hover:ring-slate-300 hover:scale-110'}`}
                  title={`${day.date}: ${day.score !== null ? `${Math.round((day.score + 1) / 2 * 100)}%` : '无数据'} (点击查看)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
        <span>低</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>高</span>
      </div>
    </div>
  );
}
