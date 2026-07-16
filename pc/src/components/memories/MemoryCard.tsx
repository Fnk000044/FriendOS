import React from 'react';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import type { Memory } from '../../db/models';
import { useLanguage } from '../../i18n/useLanguage';

interface MemoryCardProps {
  memory: Memory;
  onClick: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

const typeKeyMap: Record<Memory['type'], 'memory.diary_extract' | 'memory.manual' | 'memory.idea' | 'memory.insight' | 'memory.bookmark' | 'memory.other'> = {
  diary_extract: 'memory.diary_extract', manual: 'memory.manual', idea: 'memory.idea', insight: 'memory.insight', bookmark: 'memory.bookmark', other: 'memory.other',
};

export default React.memo(function MemoryCard({ memory, onClick, onTogglePin, onDelete }: MemoryCardProps) {
  const { t } = useLanguage();
  const preview = memory.content.replace(/[#*`\[\]]/g, '').slice(0, 150);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="glass-card p-4 glass-card-hover cursor-pointer transition-all duration-200 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {t(typeKeyMap[memory.type])}
          </span>
          {memory.pinned && <Pin className="w-3 h-3 text-amber-500" />}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            aria-label={memory.pinned ? t('memory.edit') : t('memory.bookmark')}
            className="p-1 rounded text-text-muted hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {memory.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label={t('common.delete')}
            className="p-1 rounded text-text-muted hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-medium text-text-primary mb-1">{memory.title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{preview}</p>

      <div className="flex items-center gap-2 mt-3">
        {memory.tags.length > 0 && memory.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 text-text-muted rounded-full" style={{ background: 'var(--bg-hover)' }}>
            #{t}
          </span>
        ))}
        <span className="text-[10px] text-text-muted ml-auto">{memory.category}</span>
      </div>
    </div>
  );
});
