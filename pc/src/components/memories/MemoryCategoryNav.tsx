import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Layers } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface MemoryCategoryNavProps {
  selected: string;
  onSelect: (category: string) => void;
}

export default function MemoryCategoryNav({ selected, onSelect }: MemoryCategoryNavProps) {
  const { t } = useLanguage();
  const memories = useLiveQuery(
    () => db.memories.filter((m) => !m.archived).toArray(),
  );

  const categories = [t('memory.all')];
  if (memories) {
    const cats = [...new Set(memories.map((m) => m.category))].sort();
    categories.push(...cats);
  }

  return (
    <div className="glass-card p-3">
      <div className="flex items-center gap-2 px-2 py-2 mb-1">
        <Layers className="w-4 h-4 text-text-muted" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('memory.category_header')}</span>
      </div>
      <div className="space-y-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selected === cat
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
