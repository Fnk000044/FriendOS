import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMemories } from '../../hooks/useMemories';
import MemoryCard from './MemoryCard';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
<<<<<<< HEAD
import { useState, useMemo, useEffect } from 'react';
=======
import { useState, useMemo } from 'react';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import MemoryEditor from './MemoryEditor';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface MemoryGridProps {
  categoryFilter: string;
  searchQuery: string;
}

export default function MemoryGrid({ categoryFilter, searchQuery }: MemoryGridProps) {
  const { t } = useLanguage();
  const { deleteMemory, togglePin } = useMemories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
<<<<<<< HEAD
  // P2-11：分页渲染，避免全表加载 + 全量渲染卡顿；筛选变化时重置
  const [limit, setLimit] = useState(60);
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  const memories = useLiveQuery(
    () => db.memories
      .filter((m) => !m.archived)
      .toArray(),
  );

  const allLabel = t('memory.all');

<<<<<<< HEAD
  // 筛选条件变化时重置分页
  useEffect(() => {
    setLimit(60);
  }, [categoryFilter, searchQuery]);

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  const filtered = useMemo(() => {
    if (!memories) return null;
    let result = memories;

    if (categoryFilter !== allLabel) {
      result = result.filter((m) => m.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags.some((tag) => tag.includes(q)),
      );
    }

    result = [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [memories, categoryFilter, searchQuery, allLabel]);

  if (!filtered) return <LoadingSpinner text={t('memory.loading')} />;

  if (filtered.length === 0) {
    return (
      <>
        <EmptyState
          title={t('memory.no_memories')}
          description={t('memory.no_memories_desc')}
          action={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t('memory.create')}
            </button>
          }
        />
        <MemoryEditor
          open={creating}
          onClose={() => setCreating(false)}
          memory={null}
        />
      </>
    );
  }

  const editingMemory = editingId ? memories?.find((m) => m.id === editingId) || null : null;
<<<<<<< HEAD
  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-animate">
<<<<<<< HEAD
        {visible.map((memory) => (
=======
        {filtered.map((memory) => (
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
          <MemoryCard
            key={memory.id}
            memory={memory}
            onClick={() => setEditingId(memory.id)}
            onTogglePin={() => togglePin(memory.id, memory.pinned)}
            onDelete={() => deleteMemory(memory.id)}
          />
        ))}
      </div>

<<<<<<< HEAD
      {hasMore && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={() => setLimit((l) => l + 60)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary border hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            {t('common.load_more')}（{filtered.length - limit}）
          </button>
        </div>
      )}

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
      <MemoryEditor
        open={!!editingMemory}
        onClose={() => setEditingId(null)}
        memory={editingMemory}
      />
    </>
  );
}
