import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMemories } from '../../hooks/useMemories';
import MemoryCard from './MemoryCard';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import { useState, useMemo } from 'react';
import MemoryEditor from './MemoryEditor';
import { useLanguage } from '../../i18n/useLanguage';

interface MemoryGridProps {
  categoryFilter: string;
  searchQuery: string;
}

export default function MemoryGrid({ categoryFilter, searchQuery }: MemoryGridProps) {
  const { t } = useLanguage();
  const { deleteMemory, togglePin } = useMemories();
  const [editingId, setEditingId] = useState<string | null>(null);

  const memories = useLiveQuery(
    () => db.memories
      .filter((m) => !m.archived)
      .toArray(),
  );

  const allLabel = t('memory.all');

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
          m.tags.some((t) => t.includes(q)),
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
    return <EmptyState title={t('memory.no_memories')} description={t('memory.no_memories_desc')} />;
  }

  const editingMemory = editingId ? memories?.find((m) => m.id === editingId) || null : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onClick={() => setEditingId(memory.id)}
            onTogglePin={() => togglePin(memory.id, memory.pinned)}
            onDelete={() => deleteMemory(memory.id)}
          />
        ))}
      </div>

      <MemoryEditor
        open={!!editingMemory}
        onClose={() => setEditingId(null)}
        memory={editingMemory}
      />
    </>
  );
}
