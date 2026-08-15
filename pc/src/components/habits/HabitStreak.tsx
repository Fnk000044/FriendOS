import { useLanguage } from '../../i18n/useLanguage';
import { Flame } from 'lucide-react';

interface HabitStreakProps {
  streak: number;
  unit?: string;
}

export default function HabitStreak({ streak }: HabitStreakProps) {
  const { t } = useLanguage();
  if (streak === 0) return null;

  const flameCount = streak >= 30 ? 3 : streak >= 7 ? 2 : 1;

  return (
    <div className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500 flex">
        {Array.from({ length: flameCount }).map((_, i) => (
          <Flame key={i} className="w-3.5 h-3.5" />
        ))}
      </span>
      <span className="font-bold text-amber-600">{streak}</span>
      <span className="text-text-muted text-xs">{t('habit.streak_days')}</span>
    </div>
  );
}
