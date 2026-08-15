import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { db } from '../db';
import DiaryCalendar from '../components/diary/DiaryCalendar';
import DiaryList from '../components/diary/DiaryList';
import Button from '../components/common/Button';
import { useLanguage } from '../i18n/useLanguage';
import { getToday } from '../utils/date';

export default function DiaryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const entryDates = useLiveQuery(
    () => db.diaries.orderBy('date').reverse().toArray(entries => entries.map(e => e.date)),
  ) || [];

  const handleSelectDate = useCallback(async (date: string) => {
    // 查找该日期的日记是否存在
    const entry = await db.diaries.where('date').equals(date).first();
    if (entry) {
      navigate(`/diary/${entry.id}`);
    } else {
      navigate(`/diary/new?date=${date}`);
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-muted">{t('diary.title')}</p>
        <Button onClick={() => navigate('/diary/new')}>
          <Plus className="w-4 h-4" />
          {t('diary.write')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <DiaryCalendar
          entryDates={entryDates}
          selectedDate={getToday()}
          onSelectDate={handleSelectDate}
        />
        <DiaryList />
      </div>
    </div>
  );
}
