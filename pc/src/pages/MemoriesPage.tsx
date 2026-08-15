import { useState } from 'react';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { Plus, Brain, Inbox, BookOpen, MessageCircle } from 'lucide-react';
=======
import { Plus, Brain, Inbox } from 'lucide-react';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import MemoryCategoryNav from '../components/memories/MemoryCategoryNav';
import MemoryGrid from '../components/memories/MemoryGrid';
import MemorySearch from '../components/memories/MemorySearch';
import MemoryEditor from '../components/memories/MemoryEditor';
import MemoryCandidatesPanel from '../components/memories/MemoryCandidatesPanel';
import Button from '../components/common/Button';
<<<<<<< HEAD
import EmptyState from '../components/common/EmptyState';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useLanguage } from '../i18n/useLanguage';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

type ViewTab = 'memories' | 'candidates';

export default function MemoriesPage() {
  const { t } = useLanguage();
<<<<<<< HEAD
  const navigate = useNavigate();
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  const [viewTab, setViewTab] = useState<ViewTab>('memories');
  const [category, setCategory] = useState(t('memory.all'));
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const pendingCount = useLiveQuery(
    () => db.memoryCandidates
      .where('status')
      .equals('pending' as const)
      .count(),
  );

<<<<<<< HEAD
  const memoryCount = useLiveQuery(() => db.memories.count());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted">{t('memory.title')}</p>
          {/* 板块定位说明：自动收录对话/日记/任务要点（PRD v3 P1-15） */}
          <p className="text-xs text-text-muted mt-1">{t('memory.description')}</p>
        </div>
=======
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-muted">{t('memory.title')}</p>
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
        {viewTab === 'memories' && (
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4" />
            {t('memory.create')}
          </Button>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-hover)' }}>
        <button
          onClick={() => setViewTab('memories')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
            viewTab === 'memories'
              ? 'text-text-primary shadow-sm font-medium'
              : 'text-text-muted hover:text-text-primary'
          }`}
          style={viewTab === 'memories' ? { background: 'var(--bg-card-solid)' } : undefined}
        >
          <Brain className="w-4 h-4" />
          {t('memory.all_memories')}
        </button>
        <button
          onClick={() => setViewTab('candidates')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
            viewTab === 'candidates'
              ? 'text-text-primary shadow-sm font-medium'
              : 'text-text-muted hover:text-text-primary'
          }`}
          style={viewTab === 'candidates' ? { background: 'var(--bg-card-solid)' } : undefined}
        >
          <Inbox className="w-4 h-4" />
          {t('memory.candidates')}
          {pendingCount !== undefined && pendingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {viewTab === 'memories' ? (
        <>
          <MemorySearch value={search} onChange={setSearch} />
<<<<<<< HEAD
          {memoryCount === 0 ? (
            <EmptyState
              title={t('memory.no_memories')}
              description={t('memory.no_memories_desc')}
              icon={<Brain className="w-12 h-12" />}
              action={
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/diary')}>
                    <BookOpen className="w-4 h-4" />
                    {t('memory.go_diary')}
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/chat')}>
                    <MessageCircle className="w-4 h-4" />
                    {t('memory.go_chat')}
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
              <MemoryCategoryNav selected={category} onSelect={setCategory} />
              <MemoryGrid categoryFilter={category} searchQuery={search} />
            </div>
          )}
=======
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
            <MemoryCategoryNav selected={category} onSelect={setCategory} />
            <MemoryGrid categoryFilter={category} searchQuery={search} />
          </div>
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
          <MemoryEditor open={showEditor} onClose={() => setShowEditor(false)} />
        </>
      ) : (
        <MemoryCandidatesPanel />
      )}
    </div>
  );
}
