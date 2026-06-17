import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import Button from '../common/Button';

interface EmptyStateProps {
  onStart?: (text: string) => void;
}

export default function EmptyState({ onStart }: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        {t('assistant.welcome_title')}
      </h2>
      <p className="text-sm text-text-muted max-w-md mb-8 leading-relaxed">
        {t('assistant.welcome_desc')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
        <SuggestionCard
          text="分析我的计划"
          onClick={() => onStart?.('分析我的计划')}
        />
        <SuggestionCard
          text="看看我的状态"
          onClick={() => onStart?.('看看我的状态')}
        />
        <SuggestionCard
          text="你能做什么"
          onClick={() => onStart?.('你能做什么')}
        />
      </div>
    </div>
  );
}

function SuggestionCard({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 rounded-xl border text-sm text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
      style={{ borderColor: 'var(--glass-border)' }}
    >
      {text}
    </button>
  );
}
