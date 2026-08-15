import React, { memo } from 'react';
import { format, parseISO } from 'date-fns';
import type { DiaryEntry } from '../../db/models';
import MoodSelector from './MoodSelector';
<<<<<<< HEAD
import WeatherGlyph from './WeatherGlyph';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useLanguage } from '../../i18n/useLanguage';

interface DiaryEntryCardProps {
  entry: DiaryEntry;
  onClick: () => void;
}

const DiaryEntryCard = memo(function DiaryEntryCard({ entry, onClick }: DiaryEntryCardProps) {
  const { lang } = useLanguage();
  const preview = entry.content.replace(/[#*`\[\]]/g, '').slice(0, 120);
  const date = parseISO(entry.date);
  const titleFormat = lang === 'zh-CN' ? 'M月d日 EEEE' : 'EEEE, MMM d';
  const dateFormat = lang === 'zh-CN' ? 'yyyy年M月d日' : 'MMMM d, yyyy';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`查看日记: ${entry.title || format(date, titleFormat)}`}
      className="glass-card p-5 glass-card-hover cursor-pointer transition-all duration-200 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">{entry.title || format(date, titleFormat)}</p>
<<<<<<< HEAD
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            {format(date, dateFormat)}
            {/* 天气展示（预设或自定义） */}
            {entry.weather && (
              <span className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-px rounded-full"
                style={{ background: 'var(--bg-hover)' }}
              >
                <WeatherGlyph weather={entry.weather} />
                {entry.weather}
              </span>
            )}
          </p>
=======
          <p className="text-xs text-text-muted">{format(date, dateFormat)}</p>
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
        </div>
        <MoodSelector value={entry.mood} size="sm" />
      </div>

      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{preview}</p>

      {entry.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {entry.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 text-text-muted rounded-full" style={{ background: 'var(--bg-hover)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export default DiaryEntryCard;
