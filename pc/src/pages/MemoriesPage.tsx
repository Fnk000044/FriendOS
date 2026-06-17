import { useState } from 'react';
import { Plus, Brain, Inbox } from 'lucide-react';
import MemoryCategoryNav from '../components/memories/MemoryCategoryNav';
import MemoryGrid from '../components/memories/MemoryGrid';
import MemorySearch from '../components/memories/MemorySearch';
import MemoryEditor from '../components/memories/MemoryEditor';
import MemoryCandidatesPanel from '../components/memories/MemoryCandidatesPanel';
import Button from '../components/common/Button';
import { useLanguage } from '../i18n/useLanguage';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

type ViewTab = 'memories' | 'candidates';

export default function MemoriesPage() {
  const { t } = useLanguage();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-muted">{t('memory.title')}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
            <MemoryCategoryNav selected={category} onSelect={setCategory} />
            <MemoryGrid categoryFilter={category} searchQuery={search} />
          </div>
          <MemoryEditor open={showEditor} onClose={() => setShowEditor(false)} />
        </>
      ) : (
        <MemoryCandidatesPanel />
      )}
    </div>
  );
}
