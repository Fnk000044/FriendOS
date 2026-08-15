import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { Habit } from '../../db/models';
import { useLanguage } from '../../i18n/useLanguage';
import { Flame, ChevronDown } from 'lucide-react';
import HabitCalendar from './HabitCalendar';

interface HabitCardProps {
  habit: Habit;
  isLogged: boolean;
  streak: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  /** 补卡/取消任意日期打卡 */
  onToggleDate?: (date: string) => void;
}

const HabitCard = React.memo(function HabitCard({ habit, isLogged, streak, onToggle, onEdit, onDelete, onToggleDate }: HabitCardProps) {
  const { t } = useLanguage();
  const [showDelete, setShowDelete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBounce, setShowBounce] = useState(false);
  const [displayStreak, setDisplayStreak] = useState(streak);
  const [showCalendar, setShowCalendar] = useState(false);
  const animationRef = useRef<number | null>(null);

  // 打卡动画
  const handleToggle = () => {
    if (!isLogged) {
      setIsAnimating(true);
      setShowBounce(true);
      setTimeout(() => {
        onToggle();
        setIsAnimating(false);
        setTimeout(() => setShowBounce(false), 200);
      }, 300);
    } else {
      onToggle();
    }
  };

  // 连续天数滚动动画
  useEffect(() => {
    if (displayStreak === streak) return;

    const startValue = displayStreak;
    const endValue = streak;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
      setDisplayStreak(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [streak]);

  return (
    <div
      className={`glass-card p-4 glass-card-hover transition-all duration-200 relative group ${
        isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
      }`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onFocus={() => setShowDelete(true)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
        className={`absolute top-2 right-2 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          showDelete ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100'
        }`}
        aria-label={t('common.delete')}
        tabIndex={0}
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-transform duration-300 ${showBounce ? 'scale-150' : 'scale-100'}`}
            style={{ backgroundColor: habit.color }}
          />
          <h3 className="text-sm font-medium text-text-primary">{habit.name}</h3>
        </div>
        {displayStreak > 0 && (
          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
            <Flame className="w-3.5 h-3.5" />
            <span>{displayStreak}{t('habit.streak_days')}</span>
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
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          aria-pressed={isLogged}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-200 cursor-pointer ${
            isLogged
              ? 'bg-primary/10 text-primary'
              : isAnimating
                ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                : 'text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          style={isLogged || isAnimating ? undefined : { background: 'var(--bg-hover)' }}
        >
          {isLogged ? t('habit.logged') : isAnimating ? '✓' : t('habit.log')}
        </button>
      </div>

      {/* 打卡日历（可折叠） */}
      {onToggleDate && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowCalendar((v) => !v); }}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            aria-expanded={showCalendar}
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`} />
<<<<<<< HEAD
            {showCalendar ? '收起日历' : '本月记录'}
=======
            {showCalendar ? '收起月历' : '本月记录'}
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
          </button>
          {showCalendar && (
            <HabitCalendar
              habitId={habit.id}
              color={habit.color}
              onToggleDate={onToggleDate}
            />
          )}
        </div>
      )}
    </div>
  );
});


export default HabitCard;
