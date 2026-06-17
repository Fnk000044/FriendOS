import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Habit } from '../../db/models';
import { useLanguage } from '../../i18n/useLanguage';

interface HabitCardProps {
  habit: Habit;
  isLogged: boolean;
  streak: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const HabitCard = React.memo(function HabitCard({ habit, isLogged, streak, onToggle, onEdit, onDelete }: HabitCardProps) {
  const { t } = useLanguage();
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="glass-card p-4 glass-card-hover transition-all duration-200 relative group"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          title={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <h3 className="text-sm font-medium text-text-primary">{habit.name}</h3>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
            <span>🔥</span>
            <span>{streak}{t('habit.streak_days')}</span>
          </div>
        )}
      </div>

      {habit.description && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2">{habit.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {t('habit.daily')}{habit.targetCount > 1 ? ` ${habit.targetCount}${t('habit.times')}` : ''}
          {habit.unit ? ` ${habit.unit}` : ''}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
            isLogged
              ? 'bg-primary/10 text-primary'
              : 'text-text-muted hover:bg-slate-200'
          }`}
          style={isLogged ? undefined : { background: 'var(--bg-hover)' }}
        >
          {isLogged ? t('habit.logged') : t('habit.log')}
        </button>
      </div>
    </div>
  );
});


export default HabitCard;
