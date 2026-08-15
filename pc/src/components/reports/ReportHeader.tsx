import { useState } from 'react';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { useLanguage } from '../../i18n/useLanguage';

interface ReportHeaderProps {
  onRangeChange: (start: string, end: string) => void;
}

export default function ReportHeader({ onRangeChange }: ReportHeaderProps) {
  const { t } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [active, setActive] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const handleClick = (type: 'daily' | 'weekly' | 'monthly') => {
    setActive(type);
    const now = new Date();
    if (type === 'daily') {
      onRangeChange(today, today);
    } else if (type === 'weekly') {
      const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      onRangeChange(start, today);
    } else {
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      onRangeChange(start, today);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {([
        { value: 'daily' as const, key: 'report.daily' as const },
        { value: 'weekly' as const, key: 'report.weekly' as const },
        { value: 'monthly' as const, key: 'report.monthly' as const },
      ]).map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleClick(opt.value)}
          className={`px-4 py-2 text-sm rounded-btn font-medium transition-all ${
            active === opt.value
              ? 'bg-primary text-white'
              : 'text-text-secondary border hover:border-primary/30'
          }`}
          style={active === opt.value ? undefined : { borderColor: 'var(--glass-border)' }}
        >
          {t(opt.key)}
        </button>
      ))}
    </div>
  );
}
