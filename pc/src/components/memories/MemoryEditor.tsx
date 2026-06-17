import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import TagInput from '../common/TagInput';
import { useMemories } from '../../hooks/useMemories';
import { useLanguage } from '../../i18n/useLanguage';
import type { Memory } from '../../db/models';

interface MemoryEditorProps {
  open: boolean;
  onClose: () => void;
  memory?: Memory | null;
}

const typeOptions: { value: Memory['type']; key: 'memory.manual' | 'memory.idea' | 'memory.insight' | 'memory.diary_extract' | 'memory.bookmark' | 'memory.other' }[] = [
  { value: 'manual', key: 'memory.manual' },
  { value: 'idea', key: 'memory.idea' },
  { value: 'insight', key: 'memory.insight' },
  { value: 'diary_extract', key: 'memory.diary_extract' },
  { value: 'bookmark', key: 'memory.bookmark' },
  { value: 'other', key: 'memory.other' },
];

export default function MemoryEditor({ open, onClose, memory }: MemoryEditorProps) {
  const { t } = useLanguage();
  const { createMemory, updateMemory } = useMemories();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Memory['type']>('manual');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState(t('memory.default_category'));
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title);
      setContent(memory.content);
      setType(memory.type);
      setSource(memory.source || '');
      setCategory(memory.category);
      setTags(memory.tags);
    } else {
      setTitle('');
      setContent('');
      setType('manual');
      setSource('');
      setCategory(t('memory.default_category'));
      setTags([]);
    }
  }, [memory, open, t]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    if (memory) {
      await updateMemory(memory.id, { title: title.trim(), content, type, source, category, tags });
    } else {
      await createMemory({ title: title.trim(), content, type, source, category, tags });
    }
    onClose();
  };

  const isEditing = !!memory;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('memory.edit') : t('memory.create')}>
      <div className="space-y-4">
        <Input label={t('memory.title_label')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('memory.title_placeholder')} />
        <Textarea label={t('memory.content_label')} value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder={t('memory.content_placeholder')} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">{t('memory.type_label')}</label>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-text-muted'
                  }`}
                  style={type === opt.value ? undefined : { borderColor: 'var(--glass-border)' }}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>
          <Input label={t('memory.category_label')} value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('memory.default_category')} />
        </div>

        <Input label={t('memory.source_label')} value={source} onChange={(e) => setSource(e.target.value)} placeholder={t('memory.source_placeholder')} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">{t('memory.tags_label')}</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>{t('memory.cancel')}</Button>
          <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
            {isEditing ? t('memory.update') : t('memory.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
