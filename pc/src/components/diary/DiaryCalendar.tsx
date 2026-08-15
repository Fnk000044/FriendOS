import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths,
  addYears, subYears,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface DiaryCalendarProps {
  entryDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const weekDaysZh = ['日', '一', '二', '三', '四', '五', '六'];
const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNamesZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type CalendarView = 'month' | 'year' | 'decade';

export default function DiaryCalendar({ entryDates, selectedDate, onSelectDate }: DiaryCalendarProps) {
  const { lang } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const weekDays = lang === 'zh-CN' ? weekDaysZh : weekDaysEn;
  const monthNames = lang === 'zh-CN' ? monthNamesZh : monthNamesEn;
  const monthFormat = lang === 'zh-CN' ? 'yyyy年M月' : 'MMMM yyyy';

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const hasEntry = (d: Date) => entryDates.some((ed) => isSameDay(parseISO(ed), d));

  const currentYear = currentMonth.getFullYear();
  const decadeStart = Math.floor(currentYear / 10) * 10 - 1;
  const decadeYears = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  const handleYearClick = () => setView('decade');
  const handleMonthAreaClick = () => setView('year');

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setView('month');
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(monthIndex);
    setCurrentMonth(newDate);
    setView('month');
  };

  const handlePrev = () => {
    if (view === 'month') setCurrentMonth(subMonths(currentMonth, 1));
    else if (view === 'year') setCurrentMonth(subYears(currentMonth, 1));
    else setCurrentMonth(subYears(currentMonth, 10));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentMonth(addMonths(currentMonth, 1));
    else if (view === 'year') setCurrentMonth(addYears(currentMonth, 1));
    else setCurrentMonth(addYears(currentMonth, 10));
  };

  const navigateLabel = useMemo(() => {
    if (view === 'decade') return `${decadeYears[0]} - ${decadeYears[decadeYears.length - 1]}`;
    if (view === 'year') return `${currentYear}年`;
    return format(currentMonth, monthFormat);
  }, [view, currentMonth, monthFormat, decadeYears]);

  return (
    <div className="glass-card p-5">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="p-1 rounded-lg text-text-muted hover:bg-surface-hover"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {view === 'month' ? (
          <>
            <button onClick={handleYearClick} className="text-sm font-medium text-text-primary hover:text-primary transition-colors px-2 py-0.5 rounded hover:bg-surface-hover">
              {format(currentMonth, 'yyyy年')}
            </button>
            <button onClick={handleMonthAreaClick} className="text-sm font-medium text-text-primary hover:text-primary transition-colors px-2 py-0.5 rounded hover:bg-surface-hover">
              {format(currentMonth, 'M月')}
            </button>
          </>
        ) : (
          <span className="text-sm font-medium text-text-primary">{navigateLabel}</span>
        )}

        <button
          onClick={handleNext}
          className="p-1 rounded-lg text-text-muted hover:bg-surface-hover"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Month view (default) */}
      {view === 'month' && (
        <>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs text-text-muted py-1 font-medium">{d}</div>
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = dateStr === selectedDate;
              const isToday = isSameDay(day, new Date());
              const written = hasEntry(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className={`
                    relative py-2 text-xs rounded-lg transition-all
                    ${isCurrentMonth ? 'text-text-primary' : 'text-text-muted/30'}
                    ${isSelected ? 'bg-primary text-white' : 'hover:bg-surface-hover'}
                    ${isToday && !isSelected ? 'ring-1 ring-primary/30' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {written && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Year view (month picker) */}
      {view === 'year' && (
        <div className="grid grid-cols-4 gap-2">
          {monthNames.map((name, idx) => (
            <button
              key={name}
              onClick={() => handleMonthSelect(idx)}
              className="py-2 text-sm text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Decade view (year picker) */}
      {view === 'decade' && (
        <div className="grid grid-cols-4 gap-2">
          {decadeYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className={`py-2 text-sm rounded-lg transition-colors ${
                year === currentYear
                  ? 'bg-primary text-white'
                  : 'text-text-primary hover:bg-surface-hover'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}