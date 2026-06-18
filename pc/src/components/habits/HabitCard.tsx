import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { Habit } from '../../db/models';
import { useLanguage } from '../../i18n/useLanguage';
import { Flame } from 'lucide-react';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBounce, setShowBounce] = useState(false);
  const [displayStreak, setDisplayStreak] = useState(streak);
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
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-200 cursor-pointer ${
            isLogged
              ? 'bg-primary/10 text-primary'
              : isAnimating
                ? 'bg-green-100 text-green-600'
                : 'text-text-muted hover:bg-slate-200'
          }`}
          style={isLogged || isAnimating ? undefined : { background: 'var(--bg-hover)' }}
        >
          {isLogged ? t('habit.logged') : isAnimating ? '✓' : t('habit.log')}
        </button>
      </div>
    </div>
  );
});


export default HabitCard;
