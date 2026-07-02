import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import DiaryEntryCard from './DiaryEntryCard';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import { useLanguage } from '../../i18n/useLanguage';

const PAGE_SIZE = 20;

export default function DiaryList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const entries = useLiveQuery(
    () => db.diaries.orderBy('date').reverse().limit(page * PAGE_SIZE).toArray(),
    [page]
  );

  const hasMore = entries ? entries.length >= page * PAGE_SIZE : false;

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setPage(p => p + 1);
    // useLiveQuery 是响应式的，下一帧数据到达后清除 loading 态
    // 但实际可能在 setPage 后立即同步更新，用微任务兜底
    Promise.resolve().then(() => setLoadingMore(false));
  }, []);

  if (!entries) return <LoadingSpinner text={t('diary.loading')} />;

  if (entries.length === 0) {
    return (
      <EmptyState
        title={t('diary.no_entries')}
        description={t('diary.no_entries_desc')}
        action={
          <button
            type="button"
            onClick={() => navigate('/diary/new')}
            className="px-4 py-2 bg-primary text-white text-sm rounded-btn hover:bg-primary-dark transition-colors cursor-pointer"
          >
            {t('diary.write_first')}
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-3 stagger-animate">
      {entries.map((entry) => (
        <DiaryEntryCard
          key={entry.id}
          entry={entry}
          onClick={() => navigate(`/diary/${entry.id}`)}
        />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          aria-label={t('common.load_more')}
          className="w-full py-3 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingMore ? t('common.loading') : t('common.load_more')}
        </button>
      )}
    </div>
  );
}
