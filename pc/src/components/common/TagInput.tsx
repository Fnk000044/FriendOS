import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const { t } = useLanguage();
  const ph = placeholder ?? t('common.tag_placeholder');
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-btn border focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all min-h-[38px]"
      style={{ borderColor: 'var(--border-input)' }}
      role="group"
      aria-label={t('common.tag_input')}
    >
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
          {tag}
          <button onClick={() => removeTag(tag)} className="hover:text-primary-dark" aria-label={t('common.remove_tag', { name: tag })}>
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? ph : ''}
        aria-label={t('common.add_tag')}
        className="flex-1 min-w-[80px] outline-none text-sm bg-transparent placeholder:text-text-muted"
      />
    </div>
  );
}
